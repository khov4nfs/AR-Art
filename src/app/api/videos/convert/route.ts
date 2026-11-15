import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { open, mkdir, readFile, readdir, rm, stat, statfs, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { NextResponse } from "next/server";

import {
  AR_VIDEO_CHUNK_SIZE,
  AR_VIDEO_MAX_SOURCE_SIZE,
  conversionChunkCount,
} from "@/features/artwork/domain/original-video";
import { ARTWORK_UPLOAD_MAX_FILE_SIZE } from "@/features/artwork/domain/artwork-create-form-schema";
import { getRequestUser } from "@/features/auth/infrastructure/supabase/request-user";

export const runtime = "nodejs";

const run = promisify(execFile);
const root = path.join(tmpdir(), "ar-art-video-conversions");
const sessionLifetimeMs = 30 * 60 * 1000;
const ffmpeg = process.env.AR_ART_FFMPEG_PATH || "ffmpeg";
const ffprobe = process.env.AR_ART_FFPROBE_PATH || "ffprobe";

type Session = { owner: string; bytes: number; created: number };

class ConversionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function fail(message: string, status = 400): never {
  throw new ConversionError(message, status);
}

function conversionDirectory(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    fail("Invalid conversion session.");
  }
  return path.join(root, id);
}

async function getSession(id: string, userId: string) {
  const directory = conversionDirectory(id);
  let info: Session;
  try {
    info = JSON.parse(await readFile(path.join(directory, "session.json"), "utf8")) as Session;
  } catch {
    return fail("Video conversion session expired or missing.", 404);
  }
  if (info.owner !== userId) fail("Video conversion session is not yours.", 403);
  if (Date.now() - info.created > sessionLifetimeMs) {
    await rm(directory, { recursive: true, force: true });
    fail("Video conversion session expired. Try saving again.", 410);
  }
  return { directory, info };
}

async function cleanupExpiredSessions() {
  await mkdir(root, { recursive: true, mode: 0o700 });
  const encodingLock = path.join(root, ".encoding.lock");
  const lockStats = await stat(encodingLock).catch(() => null);
  if (lockStats && Date.now() - lockStats.mtimeMs > 2 * 60 * 1000) {
    await rm(encodingLock, { force: true });
  }
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(root, entry.name);
    try {
      const meta = JSON.parse(await readFile(path.join(directory, "session.json"), "utf8")) as Session;
      if (Date.now() - meta.created > sessionLifetimeMs) {
        await rm(directory, { recursive: true, force: true });
      }
    } catch {
      const stats = await stat(directory).catch(() => null);
      if (stats && Date.now() - stats.mtimeMs > sessionLifetimeMs) {
        await rm(directory, { recursive: true, force: true });
      }
    }
  }
}

async function sessionLock(directory: string) {
  try {
    return await open(path.join(directory, ".lock"), "wx", 0o600);
  } catch {
    return fail("A conversion operation is already running for this video.", 409);
  }
}

async function readChunk(request: Request, expectedLength: number) {
  if (!request.body) fail("No video data received.");
  const length = request.headers.get("content-length");
  if (length && Number(length) > expectedLength) fail("Video chunk exceeds its allowed size.", 413);
  const reader = request.body!.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > expectedLength) {
      await reader.cancel().catch(() => {});
      fail("Video chunk exceeds its allowed size.", 413);
    }
    parts.push(value);
  }
  if (total !== expectedLength) fail("Incomplete video chunk. Try saving again.");
  return Buffer.concat(parts, total);
}

async function convert(directory: string, byteCount: number) {
  const source = path.join(directory, "source.video");
  const output = path.join(directory, "converted.webm");
  if ((await stat(source)).size !== byteCount) fail("Original video upload is incomplete.", 409);

  let probe: {
    streams?: Array<{ width?: number; height?: number; duration?: string }>;
    format?: { duration?: string };
  };
  try {
    const result = await run(
      ffprobe,
      ["-v", "error", "-select_streams", "v:0", "-show_entries",
        "stream=width,height,duration:format=duration", "-of", "json", source],
      { timeout: 12000, maxBuffer: 256 * 1024 },
    );
    probe = JSON.parse(result.stdout) as typeof probe;
  } catch {
    return fail("Cannot read this MOV/MP4/WebM video.", 422);
  }
  const video = probe.streams?.[0];
  const width = video?.width ?? 0;
  const height = video?.height ?? 0;
  const duration = Number(probe.format?.duration ?? video?.duration);
  if (!width || !height || width * height > 6_000_000 || width > 3840 || height > 3840) {
    fail("Video resolution is too high for automatic AR conversion.", 422);
  }
  if (!Number.isFinite(duration) || duration <= 0 || duration > 60) {
    fail("Automatic AR conversion supports videos up to 60 seconds.", 422);
  }

  const started = Date.now();
  for (const crf of [33, 42, 48]) {
    const remaining = 82_000 - (Date.now() - started);
    if (remaining < 5_000) fail("Video conversion timed out. Try a shorter video.", 422);
    try {
      await run(ffmpeg, [
        "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
        "-i", source, "-map", "0:v:0", "-an",
        "-vf", "scale=w='min(iw,1080)':h='min(ih,1920)':force_original_aspect_ratio=decrease:force_divisible_by=2",
        "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(crf),
        "-deadline", "realtime", "-cpu-used", "5", "-threads", "2",
        "-pix_fmt", "yuva420p", "-auto-alt-ref", "0",
        "-f", "webm", output,
      ], { timeout: remaining, maxBuffer: 256 * 1024, killSignal: "SIGKILL" });
    } catch {
      return fail("The server could not convert this video. Check the original file.", 422);
    }
    const size = (await stat(output)).size;
    if (size > 0 && size <= ARTWORK_UPLOAD_MAX_FILE_SIZE) return readFile(output);
  }
  return fail("Converted video is still over 6 MB. Try a shorter video.", 422);
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Please sign in to upload videos." }, { status: 401 });

    const url = new URL(request.url);
    const stage = url.searchParams.get("stage");
    const id = url.searchParams.get("id") ?? "";

    if (stage === "init") {
      const input = (await request.json()) as { size?: unknown };
      const bytes = Number(input.size);
      if (!Number.isSafeInteger(bytes) || bytes <= 0 || bytes > AR_VIDEO_MAX_SOURCE_SIZE) {
        fail("Original video must be between 1 byte and 240 MB.", 413);
      }
      await cleanupExpiredSessions();
      const active = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());
      if (active.length >= 1) fail("Video converter is busy. Please try again shortly.", 429);
      const disk = await statfs(root);
      if (disk.bavail * disk.bsize < bytes + 250 * 1024 * 1024) {
        fail("Video conversion is temporarily unavailable due to server storage.", 507);
      }
      const sessionId = randomUUID();
      const directory = conversionDirectory(sessionId);
      await mkdir(directory, { mode: 0o700 });
      await writeFile(path.join(directory, "session.json"), JSON.stringify({
        owner: user.id, bytes, created: Date.now(),
      } satisfies Session), { flag: "wx", mode: 0o600 });
      await writeFile(path.join(directory, "source.video"), "", { flag: "wx", mode: 0o600 });
      return NextResponse.json({
        id: sessionId,
        chunkSize: AR_VIDEO_CHUNK_SIZE,
        chunks: conversionChunkCount(bytes),
      }, { headers: { "cache-control": "no-store" } });
    }

    const { directory, info } = await getSession(id, user.id);
    if (stage === "cancel") {
      await rm(directory, { recursive: true, force: true });
      return NextResponse.json({ ok: true });
    }

    const lock = await sessionLock(directory);
    try {
      if (stage === "chunk") {
        const index = Number(url.searchParams.get("index"));
        const total = conversionChunkCount(info.bytes);
        if (!Number.isSafeInteger(index) || index < 0 || index >= total) {
          fail("Invalid video chunk number.");
        }
        const offset = index * AR_VIDEO_CHUNK_SIZE;
        const expectedLength = Math.min(AR_VIDEO_CHUNK_SIZE, info.bytes - offset);
        const data = await readChunk(request, expectedLength);
        const source = await open(path.join(directory, "source.video"), "r+");
        try {
          const current = (await source.stat()).size;
          if (current !== offset) fail("Video chunks are out of order. Try saving again.", 409);
          let written = 0;
          while (written < data.length) {
            const result = await source.write(data, written, data.length - written, offset + written);
            if (!result.bytesWritten) fail("Unable to save this video chunk.", 500);
            written += result.bytesWritten;
          }
        } finally {
          await source.close();
        }
        return NextResponse.json({ received: index + 1 });
      }

      if (stage === "finish") {
        const globalLockPath = path.join(root, ".encoding.lock");
        let globalLock;
        try {
          globalLock = await open(globalLockPath, "wx", 0o600);
        } catch {
          fail("Another video is being converted. Please try again shortly.", 429);
        }
        try {
          const result = await convert(directory, info.bytes);
          const body = result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer;
          await rm(directory, { recursive: true, force: true });
          return new Response(body, {
            status: 200,
            headers: {
              "content-type": "video/webm",
              "content-length": String(result.byteLength),
              "cache-control": "no-store",
            },
          });
        } finally {
          await globalLock.close();
          await rm(globalLockPath, { force: true });
        }
      }
      return fail("Unsupported video conversion operation.");
    } finally {
      await lock.close();
      await rm(path.join(directory, ".lock"), { force: true });
    }
  } catch (error) {
    if (error instanceof ConversionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Video conversion failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Video converter is temporarily unavailable." }, { status: 500 });
  }
}