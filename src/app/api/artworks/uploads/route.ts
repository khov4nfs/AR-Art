import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getRequestUser } from "@/features/auth/infrastructure/local/request-user";
import { LocalArtworkRepository } from "@/features/artwork/infrastructure/local/local-artwork-repository";
import { arMediaDiskPath, isArtworkUploadPath, verifyArUploadToken } from "@/features/artwork/infrastructure/local/local-artwork-storage";
import { arMediaMimeType, matchesArMediaHeader } from "@/features/artwork/infrastructure/local/ar-media-path";
import { ARTWORK_UPLOAD_MAX_FILE_SIZE } from "@/features/artwork/domain/artwork-create-form-schema";
import { clientIp, rateLimit } from "@/lib/server/security";

export const runtime = "nodejs";

async function readLimited(request: Request): Promise<Buffer | null> {
  if (!request.body) return null;
  const claimed = Number(request.headers.get("content-length") ?? 0);
  if (claimed > ARTWORK_UPLOAD_MAX_FILE_SIZE) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > ARTWORK_UPLOAD_MAX_FILE_SIZE) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  return length > 0 ? Buffer.concat(chunks, length) : null;
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Sign in to EVERIE." }, { status: 401 });
    const retryAfter = rateLimit("ar-upload:" + user.id + ":" + clientIp(request.headers), 120, 60 * 60 * 1000);
    if (retryAfter) return NextResponse.json({ error: "Upload limit exceeded." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });

    const mediaPath = request.headers.get("x-everie-ar-path") ?? "";
    const token = request.headers.get("x-everie-ar-upload-token") ?? "";
    if (!verifyArUploadToken(mediaPath, token)) return NextResponse.json({ error: "Invalid or expired upload authorization." }, { status: 403 });

    const artworkId = mediaPath.split("/")[0];
    const artwork = await new LocalArtworkRepository().findById(artworkId);
    if (!artwork || artwork.ownerId !== user.id || artwork.status !== "draft" || !isArtworkUploadPath(artwork, mediaPath)) {
      return NextResponse.json({ error: "Artwork upload is not authorized." }, { status: 403 });
    }

    const mime = arMediaMimeType(mediaPath);
    if (!mime || request.headers.get("content-type")?.split(";")[0] !== mime) {
      return NextResponse.json({ error: "Upload content type does not match its file." }, { status: 415 });
    }

    const bytes = await readLimited(request);
    if (!bytes) return NextResponse.json({ error: "Upload must be smaller than 6 MB." }, { status: 413 });
    if (!matchesArMediaHeader(mediaPath, bytes)) return NextResponse.json({ error: "Invalid media file header." }, { status: 415 });

    const destination = arMediaDiskPath(mediaPath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    // Exclusive creation prevents a stale/replayed request from replacing assets.
    try {
      await fs.writeFile(destination, bytes, { flag: "wx", mode: 0o644 });
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === "EEXIST")
        return NextResponse.json({ error: "This file was already uploaded." }, { status: 409 });
      throw cause;
    }
    return NextResponse.json({ uploaded: true, path: mediaPath }, { status: 201 });
  } catch (cause) {
    console.error("AR upload failed:", cause);
    return NextResponse.json({ error: "AR upload failed." }, { status: 500 });
  }
}
