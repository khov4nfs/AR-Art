// Keep aligned with the 6 MB Supabase signed-upload limit.
const AR_VIDEO_READY_MAX_SIZE = 6 * 1024 * 1024;

/** Cloudflare-friendly chunks; the original MOV is never uploaded to Supabase. */
export const AR_VIDEO_CHUNK_SIZE = 8 * 1024 * 1024;
export const AR_VIDEO_MAX_SOURCE_SIZE = 240 * 1024 * 1024;

const extensions = new Set(["mov", "mp4", "webm"]);

/** MP4 packed AR video: the left half contains RGB, right half contains alpha. */
export function isPackedAlphaVideoName(name: string) {
  return /\.alpha\.mp4$/i.test(name);
}

/** Prefer a settled frame with the complete artwork instead of the opening animation. */
export function trackingSampleTime(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.max(0, Math.min(duration * 0.7, duration - 0.05));
}

export function validateOriginalVideo(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!extensions.has(extension)) {
    return "Choose a MOV, MP4, or WebM video.";
  }
  if (!file.size) return "The selected video is empty.";
  if (file.size > AR_VIDEO_MAX_SOURCE_SIZE) {
    return "Original videos must be 240 MB or smaller.";
  }
  return null;
}

export function videoNeedsConversion(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "mov" || extension === "webm" ||
    file.size > AR_VIDEO_READY_MAX_SIZE ||
    file.type !== "video/mp4";
}

export function conversionChunkCount(size: number) {
  return Math.ceil(size / AR_VIDEO_CHUNK_SIZE);
}