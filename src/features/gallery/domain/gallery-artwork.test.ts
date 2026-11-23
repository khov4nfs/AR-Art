import assert from "node:assert/strict";
import test from "node:test";

import { newestGalleryArtworks, showNewestGallerySection, sortGalleryArtworks, type GalleryArtwork } from "./gallery-artwork.ts";

const artworks: GalleryArtwork[] = [
  { id: "a", slug: "older", title: "Older", artistName: "A", description: "", imageUrl: "", publishedAt: "2026-01-01T12:00:00.000Z", viewCount: 120 },
  { id: "b", slug: "fresh", title: "Fresh", artistName: "B", description: "", imageUrl: "", publishedAt: "2026-11-01T12:00:00.000Z", viewCount: 0 },
  { id: "c", slug: "recent", title: "Recent", artistName: "C", description: "", imageUrl: "", publishedAt: "2026-10-01T12:00:00.000Z", viewCount: 120 },
];

test("newest shelf uses publish date, newest first", () => {
  assert.deepEqual(newestGalleryArtworks(artworks, 2).map((item) => item.slug), ["fresh", "recent"]);
});

test("most viewed sorts by real views, breaking ties with latest publish time", () => {
  assert.deepEqual(sortGalleryArtworks(artworks, "views").map((item) => item.slug), ["recent", "older", "fresh"]);
});

test("filter changes do not mutate the original collection", () => {
  const result = sortGalleryArtworks(artworks, "newest");
  assert.deepEqual(result.map((item) => item.slug), ["fresh", "recent", "older"]);
  assert.equal(artworks[0].slug, "older");
});

test("newest shelf only appears in the default all-works mode", () => {
  assert.equal(showNewestGallerySection("all"), true);
  assert.equal(showNewestGallerySection("newest"), false);
  assert.equal(showNewestGallerySection("views"), false);
});

test("empty gallery is safely handled", () => {
  assert.deepEqual(newestGalleryArtworks([]), []);
  assert.deepEqual(sortGalleryArtworks([], "views"), []);
});
