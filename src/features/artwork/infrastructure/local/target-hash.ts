import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import { arMediaDiskPath } from "./local-artwork-storage";

export function computeSha256(buffer: Uint8Array | Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function computeFileSha256(filePath: string): Promise<string | null> {
  try {
    const data = await fs.readFile(filePath);
    return computeSha256(data);
  } catch {
    return null;
  }
}

export async function computeArMediaSha256(mediaPath: string): Promise<string | null> {
  try {
    const diskPath = arMediaDiskPath(mediaPath);
    return await computeFileSha256(diskPath);
  } catch {
    return null;
  }
}
