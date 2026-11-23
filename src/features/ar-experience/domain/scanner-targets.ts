import type { PublishedArtwork } from "@/features/artwork/domain/artwork";

/** Keep phone tracking bounded and avoid competing identical image targets. */
export const UNIVERSAL_SCANNER_MAX_TARGETS = 6;

export function selectScannerArtworks<T extends Pick<
  PublishedArtwork,
  "id" | "status" | "targetImagePath" | "targetImageUrl" | "targetFileUrl"
>>(artworks: readonly T[], limit = UNIVERSAL_SCANNER_MAX_TARGETS): T[] {
  const unique = new Set<string>();
  return artworks.filter((artwork) => {
    if (unique.size >= limit || artwork.status !== "published") return false;
    if (!artwork.targetImagePath || !artwork.targetImageUrl || !artwork.targetFileUrl) return false;
    if (unique.has(artwork.targetImagePath)) return false;
    unique.add(artwork.targetImagePath);
    return true;
  });
}
