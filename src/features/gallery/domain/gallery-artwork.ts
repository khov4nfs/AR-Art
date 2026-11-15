export type GallerySort = "all" | "newest" | "views";

export type GalleryArtwork = {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  description: string;
  imageUrl: string;
  publishedAt: string;
  viewCount: number;
};

function publishedTime(artwork: GalleryArtwork) {
  const timestamp = Date.parse(artwork.publishedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function sortGalleryArtworks(
  artworks: readonly GalleryArtwork[],
  sort: Exclude<GallerySort, "all">,
): GalleryArtwork[] {
  return [...artworks].sort((left, right) => {
    if (sort === "views") {
      const views = right.viewCount - left.viewCount;
      if (views !== 0) return views;
    }
    return publishedTime(right) - publishedTime(left) || left.slug.localeCompare(right.slug);
  });
}

export function newestGalleryArtworks(artworks: readonly GalleryArtwork[], limit = 4) {
  return sortGalleryArtworks(artworks, "newest").slice(0, limit);
}

export function showNewestGallerySection(sort: GallerySort) {
  return sort === "all";
}
