#!/usr/bin/env node
import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, chmodSync, symlinkSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = process.cwd();
const binDir = join(root, "bin");

async function isBinaryWorking(binPath) {
  try {
    await run(binPath, ["-version"], { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

function findSystemBinary(name) {
  const exe = process.platform === "win32" ? `${name}.exe` : name;
  const candidates = [
    process.env[name === "ffmpeg" ? "AR_ART_FFMPEG_PATH" : "AR_ART_FFPROBE_PATH"],
    join(binDir, exe),
    `/srv/apps/ar-art-tools/${name}`,
    `/usr/local/bin/${name}`,
    `/usr/bin/${name}`,
    name,
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ["-version"], { stdio: "ignore", timeout: 3000 });
      return candidate;
    } catch {
      // Continue search
    }
  }
  return null;
}

async function ensureMindArPatch() {
  const patchScript = join(root, "scripts", "patch-mindar-three.mjs");
  if (existsSync(patchScript) && existsSync(join(root, "node_modules", "mind-ar"))) {
    try {
      console.log("[postinstall] Adapting MindAR color-space API for Three.js...");
      await import("./patch-mindar-three.mjs");
    } catch (err) {
      console.warn("[postinstall] Note: MindAR patch check:", err.message);
    }
  }
}

async function ensureFfmpegTools() {
  mkdirSync(binDir, { recursive: true });
  const exeFfmpeg = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const exeFfprobe = process.platform === "win32" ? "ffprobe.exe" : "ffprobe";

  const localFfmpeg = join(binDir, exeFfmpeg);
  const localFfprobe = join(binDir, exeFfprobe);

  const ffmpegWorking = await isBinaryWorking(localFfmpeg);
  const ffprobeWorking = await isBinaryWorking(localFfprobe);

  if (ffmpegWorking && ffprobeWorking) {
    console.log("[postinstall] ffmpeg and ffprobe are ready in ./bin");
    return;
  }

  // Check system PATH or known server paths
  const sysFfmpeg = findSystemBinary("ffmpeg");
  const sysFfprobe = findSystemBinary("ffprobe");

  if (sysFfmpeg && sysFfprobe) {
    console.log(`[postinstall] Detected accessible ffmpeg (${sysFfmpeg}) and ffprobe (${sysFfprobe}).`);
    try {
      if (!ffmpegWorking && sysFfmpeg !== localFfmpeg) {
        if (existsSync(localFfmpeg)) unlinkSync(localFfmpeg);
        symlinkSync(sysFfmpeg, localFfmpeg);
      }
      if (!ffprobeWorking && sysFfprobe !== localFfprobe) {
        if (existsSync(localFfprobe)) unlinkSync(localFfprobe);
        symlinkSync(sysFfprobe, localFfprobe);
      }
      console.log("[postinstall] Linked system ffmpeg and ffprobe into ./bin");
      return;
    } catch (err) {
      console.warn("[postinstall] Could not symlink system binaries:", err.message);
    }
  }

  // If not found or link failed, download static binaries
  console.log("[postinstall] Downloading static ffmpeg and ffprobe binaries into ./bin...");
  try {
    execFileSync("npx", ["--yes", "ffbinaries", "ffmpeg", "ffprobe", `--output=${binDir}`], {
      stdio: "inherit",
      timeout: 120000,
    });
    chmodSync(localFfmpeg, 0o755);
    chmodSync(localFfprobe, 0o755);
    console.log("[postinstall] Successfully installed ffmpeg and ffprobe into ./bin");
  } catch (err) {
    console.warn("[postinstall] Warning: Automated ffmpeg download failed:", err.message);
    console.warn("[postinstall] You can install ffmpeg using your package manager or set AR_ART_FFMPEG_PATH.");
  }
}

async function main() {
  await ensureMindArPatch();
  await ensureFfmpegTools();
}

main().catch((err) => {
  console.warn("[postinstall] Non-fatal postinstall notice:", err);
});
