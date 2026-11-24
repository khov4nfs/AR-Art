import assert from "node:assert/strict";
import test from "node:test";
import { CreateArtworkUploadSession } from "./create-artwork-upload-session.ts";
import { PublishArtwork } from "./publish-artwork.ts";
import type { ArtworkRepository } from "../ports/artwork-repository.ts";
import type { ArtworkStorage } from "../ports/artwork-storage.ts";
import type { Artwork, CreateArtworkDraftInput } from "../../domain/artwork.ts";

function createMockRepository(initialArtworks: Artwork[] = []): ArtworkRepository {
  const artworks = [...initialArtworks];
  return {
    async createDraft(input: CreateArtworkDraftInput): Promise<Artwork> {
      const artwork: Artwork = {
        ...input,
        status: "draft",
        overlayType: input.overlayPath ? "video" : null,
        createdAt: new Date().toISOString(),
        publishedAt: null,
      };
      artworks.push(artwork);
      return artwork;
    },
    async createArAssets(): Promise<void> {},
    async findById(id: string): Promise<Artwork | null> {
      return artworks.find((a) => a.id === id) ?? null;
    },
    async findPublishedBySlug(slug: string): Promise<Artwork | null> {
      return artworks.find((a) => a.slug === slug && a.status === "published") ?? null;
    },
    async findDuplicateTargetImage(targetHash: string, excludeId?: string): Promise<Artwork | null> {
      return artworks.find((a) => (!excludeId || a.id !== excludeId) && a.targetImageHash === targetHash) ?? null;
    },
    async findDuplicateTargetForArtwork(artwork: Artwork): Promise<Artwork | null> {
      const hash = artwork.targetImageHash;
      if (!hash) return null;
      return artworks.find((a) => a.id !== artwork.id && a.targetImageHash === hash) ?? null;
    },
    async listPublished(): Promise<Artwork[]> {
      return artworks.filter((a) => a.status === "published");
    },
    async listForOwner(ownerId: string): Promise<Artwork[]> {
      return artworks.filter((a) => a.ownerId === ownerId);
    },
    async listAll(): Promise<Artwork[]> {
      return [...artworks];
    },
    async updateForOwner(): Promise<Artwork | null> {
      return null;
    },
    async deleteForOwner(id: string): Promise<Artwork | null> {
      const idx = artworks.findIndex((a) => a.id === id);
      if (idx < 0) return null;
      return artworks.splice(idx, 1)[0] ?? null;
    },
    async countPublished(): Promise<number> {
      return artworks.filter((a) => a.status === "published").length;
    },
    async markPublished(id: string): Promise<Artwork> {
      const existing = artworks.find((a) => a.id === id);
      if (!existing) throw new Error("Artwork draft not found.");
      existing.status = "published";
      existing.publishedAt = new Date().toISOString();
      return existing;
    },
  };
}

function createMockStorage(): ArtworkStorage {
  return {
    async createSignedUpload(path: string) {
      return { path, token: "mock-token" };
    },
    async assertAssetsExist() {},
    async removeAssets() {},
    getPublicUrls(artwork: Artwork) {
      return {
        targetImageUrl: "https://test/" + artwork.targetImagePath,
        targetFileUrl: "https://test/" + artwork.targetFilePath,
        overlayUrl: null,
        arAssetUrls: {},
      };
    },
  };
}

test("rejects creating upload session when target image hash already exists", async () => {
  const existingArtwork: Artwork = {
    id: "existing-1",
    ownerId: "owner-1",
    slug: "existing-1",
    title: "Existing",
    artistName: "Artist",
    description: "",
    status: "published",
    targetImagePath: "existing-1/target.png",
    targetFilePath: "existing-1/target.mind",
    targetImageHash: "abc123hash",
    overlayPath: null,
    overlayType: null,
    overlayAspectRatio: null,
    arMode: "spatial_layers",
    arConfig: {},
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  const repository = createMockRepository([existingArtwork]);
  const storage = createMockStorage();
  const useCase = new CreateArtworkUploadSession(repository, storage, "test-bucket");

  await assert.rejects(
    async () => {
      await useCase.execute({
        ownerId: "owner-2",
        title: "New Artwork",
        artistName: "Artist 2",
        description: "",
        targetImageExtension: "png",
        targetAspectRatio: 1,
        targetImageHash: "abc123hash",
        arMode: "spatial_layers",
        spatialLayers: [],
      });
    },
    /Each AR product requires a unique scan image/i,
  );
});

test("allows creating upload session when target image hash is unique", async () => {
  const repository = createMockRepository([]);
  const storage = createMockStorage();
  const useCase = new CreateArtworkUploadSession(repository, storage, "test-bucket");

  const session = await useCase.execute({
    ownerId: "owner-1",
    title: "Unique Artwork",
    artistName: "Artist",
    description: "",
    targetImageExtension: "png",
    targetAspectRatio: 1,
    targetImageHash: "unique123hash",
    arMode: "spatial_layers",
    spatialLayers: [],
  });

  assert.ok(session.artworkId);
  const created = await repository.findById(session.artworkId);
  assert.equal(created?.targetImageHash, "unique123hash");
});

test("rejects publishing when target image hash collides with another artwork", async () => {
  const artwork1: Artwork = {
    id: "art-1",
    ownerId: "owner-1",
    slug: "art-1",
    title: "Artwork 1",
    artistName: "Artist",
    description: "",
    status: "published",
    targetImagePath: "art-1/target.png",
    targetFilePath: "art-1/target.mind",
    targetImageHash: "duplicate-hash",
    overlayPath: null,
    overlayType: null,
    overlayAspectRatio: null,
    arMode: "spatial_layers",
    arConfig: {},
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  const artwork2Draft: Artwork = {
    id: "art-2",
    ownerId: "owner-1",
    slug: "art-2",
    title: "Artwork 2",
    artistName: "Artist",
    description: "",
    status: "draft",
    targetImagePath: "art-2/target.png",
    targetFilePath: "art-2/target.mind",
    targetImageHash: "duplicate-hash",
    overlayPath: null,
    overlayType: null,
    overlayAspectRatio: null,
    arMode: "spatial_layers",
    arConfig: {},
    createdAt: new Date().toISOString(),
    publishedAt: null,
  };

  const repository = createMockRepository([artwork1, artwork2Draft]);
  const storage = createMockStorage();
  const publishUseCase = new PublishArtwork(repository, storage);

  await assert.rejects(
    async () => {
      await publishUseCase.execute("art-2", "owner-1");
    },
    /Each AR product requires a unique scan image/i,
  );
});
