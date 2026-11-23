import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtworkRepository } from "../ports/artwork-repository.ts";
import type { ArtworkStorage } from "../ports/artwork-storage.ts";
import type { Artwork } from "../../domain/artwork.ts";
import { ListStudioArtworks } from "./list-studio-artworks.ts";

const artworks = [
  { id: "owner-1-work", ownerId: "owner-1" },
  { id: "owner-2-work", ownerId: "owner-2" },
  { id: "legacy-unowned", ownerId: null },
] as Artwork[];

const repository = {
  listForOwner: async (ownerId: string) => artworks.filter((item) => item.ownerId === ownerId),
  listAll: async () => artworks,
} as ArtworkRepository;

const storage = {
  getPublicUrls: () => ({
    targetImageUrl: "/uploads/ar/target.png",
    targetFileUrl: "/uploads/ar/target.mind",
    overlayUrl: null,
    arAssetUrls: {},
  }),
} as ArtworkStorage;

test("creator sees only their own AR products", async () => {
  const result = await new ListStudioArtworks(repository, storage).execute("owner-1");
  assert.deepEqual(result.map((item) => item.id), ["owner-1-work"]);
});

test("EVERIE admin sees AR products from all creators and unowned legacy works", async () => {
  const result = await new ListStudioArtworks(repository, storage).execute("staff", true);
  assert.deepEqual(result.map((item) => item.id),
    ["owner-1-work", "owner-2-work", "legacy-unowned"]);
});
