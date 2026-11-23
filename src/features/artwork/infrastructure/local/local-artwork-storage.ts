import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";
import type { Artwork } from "@/features/artwork/domain/artwork";
import { sessionSecret } from "@/lib/server/security";
import { arPublicMediaUrl, validArMediaPath } from "./ar-media-path";

const MAX_TOKEN_AGE = 20 * 60;
const MEDIA_ROOT = path.join(process.cwd(), "public", "uploads", "ar");

export function arMediaDiskPath(mediaPath: string): string {
  if (!validArMediaPath(mediaPath)) throw new Error("Invalid AR upload path.");
  return path.join(MEDIA_ROOT, ...mediaPath.split("/"));
}

function hmac(mediaPath: string, expires: number) {
  return crypto.createHmac("sha256", sessionSecret()).update("everie-ar-upload:" + mediaPath + ":" + expires).digest("hex");
}

export function verifyArUploadToken(mediaPath: string, token: string): boolean {
  if (!validArMediaPath(mediaPath) || !/^\d{10}\.[a-f0-9]{64}$/.test(token)) return false;
  const [date, mac] = token.split(".");
  const expiry = Number(date);
  const now = Math.floor(Date.now() / 1000);
  if (expiry < now || expiry > now + MAX_TOKEN_AGE) return false;
  const expected = hmac(mediaPath, expiry);
  return crypto.timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(expected, "hex"));
}

function artworkPaths(artwork: Artwork): string[] {
  return [
    artwork.targetImagePath,
    artwork.targetFilePath,
    ...(artwork.overlayPath ? [artwork.overlayPath] : []),
    ...(artwork.arConfig.layers ?? []).map(layer => layer.assetPath).filter((p): p is string => Boolean(p)),
  ];
}

export function isArtworkUploadPath(artwork: Artwork, mediaPath: string): boolean {
  return validArMediaPath(mediaPath) && artworkPaths(artwork).includes(mediaPath);
}

export class LocalArtworkStorage implements ArtworkStorage {
  async createSignedUpload(mediaPath: string) {
    if (!validArMediaPath(mediaPath)) throw new Error("Invalid AR media path.");
    const expires = Math.floor(Date.now() / 1000) + MAX_TOKEN_AGE;
    return { path: mediaPath, token: String(expires) + "." + hmac(mediaPath, expires) };
  }
  async assertAssetsExist(artwork: Artwork) {
    for (const mediaPath of artworkPaths(artwork)) {
      const stats = await fs.stat(arMediaDiskPath(mediaPath)).catch(() => null);
      if (!stats?.isFile() || stats.size === 0) {
        throw new Error("One or more artwork files did not finish uploading.");
      }
    }
  }
  async removeAssets(artwork: Artwork) {
    for (const mediaPath of artworkPaths(artwork)) await fs.rm(arMediaDiskPath(mediaPath), { force: true });
  }
  getPublicUrls(artwork: Artwork) {
    return {
      targetImageUrl: arPublicMediaUrl(artwork.targetImagePath),
      targetFileUrl: arPublicMediaUrl(artwork.targetFilePath),
      overlayUrl: artwork.overlayPath ? arPublicMediaUrl(artwork.overlayPath) : null,
      arAssetUrls: Object.fromEntries(artworkPaths(artwork)
        .filter(x => x !== artwork.targetImagePath && x !== artwork.targetFilePath && x !== artwork.overlayPath)
        .map(mediaPath => [mediaPath, arPublicMediaUrl(mediaPath)])),
    };
  }
}
