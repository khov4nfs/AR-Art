export const AR_MEDIA_ID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const FILE_PATTERN = /^(target\.(jpg|jpeg|png|webp|mind)|overlay\.(mp4|webm)|layers\/[0-9]{2}-[a-f0-9]{8}\.(jpg|jpeg|png|webp|mp4|webm|glb))$/i;

export function validArMediaPath(value: string): boolean {
  if (typeof value !== "string" || value.length > 160 || value.includes("\\") ||
      value.includes("%") || value.includes("..") || value.includes("\0")) return false;
  const separator = value.indexOf("/");
  return separator > 0 && AR_MEDIA_ID_PATTERN.test(value.slice(0, separator)) &&
    FILE_PATTERN.test(value.slice(separator + 1));
}

export function arPublicMediaUrl(value: string): string {
  if (!validArMediaPath(value)) throw new Error("Unsafe AR media path.");
  return "/uploads/ar/" + value.split("/").map(encodeURIComponent).join("/");
}

export function arMediaMimeType(path: string): string | null {
  if (!validArMediaPath(path)) return null;
  const suffix = path.slice(path.lastIndexOf(".")).toLowerCase();
  return ({
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".png": "image/png", ".webp": "image/webp",
    ".mp4": "video/mp4", ".webm": "video/webm",
    ".glb": "model/gltf-binary", ".mind": "application/octet-stream",
  } as Record<string, string>)[suffix] ?? null;
}

export function matchesArMediaHeader(path: string, bytes: Buffer): boolean {
  if (!validArMediaPath(path) || !bytes.length) return false;
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  switch (ext) {
    case ".jpg": case ".jpeg": return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case ".png": return bytes.length > 8 && bytes.toString("hex", 0, 8) === "89504e470d0a1a0a";
    case ".webp": return bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    case ".mp4": return bytes.length > 12 && bytes.toString("ascii", 4, 8) === "ftyp";
    case ".webm": return bytes.length > 4 && bytes.toString("hex", 0, 4) === "1a45dfa3";
    case ".glb": return bytes.length > 12 && bytes.toString("ascii", 0, 4) === "glTF" && bytes.readUInt32LE(4) === 2;
    case ".mind": return bytes.length > 16;
    default: return false;
  }
}
