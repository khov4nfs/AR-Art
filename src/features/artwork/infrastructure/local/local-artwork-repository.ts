import type { ArtworkRepository } from "@/features/artwork/application/ports/artwork-repository";
import type { Artwork, CreateArtworkDraftInput, UpdateArtworkInput } from "@/features/artwork/domain/artwork";
import { readArData, updateArData, type StoredArtwork } from "./ar-data";

export class LocalArtworkRepository implements ArtworkRepository {
  async createDraft(input: CreateArtworkDraftInput): Promise<Artwork> {
    const now = new Date().toISOString();
    const artwork: StoredArtwork = {
      id: input.id, ownerId: input.ownerId, slug: input.slug,
      title: input.title, artistName: input.artistName,
      description: input.description, status: "draft",
      targetImagePath: input.targetImagePath, targetFilePath: input.targetFilePath,
      overlayPath: input.overlayPath, overlayType: input.overlayPath ? "video" : null,
      overlayAspectRatio: input.overlayAspectRatio, arMode: input.arMode, arConfig: input.arConfig,
      createdAt: now, publishedAt: null, viewCount: 0,
    };
    return updateArData(data => {
      if (data.artworks.some(x => x.id === input.id || x.slug === input.slug))
        throw new Error("Artwork ID or slug already exists.");
      data.artworks.push(artwork);
      return artwork;
    });
  }

  async createArAssets(): Promise<void> {
    // Layer metadata is embedded in artwork.arConfig.layers.
  }
  async findById(id: string): Promise<Artwork | null> {
    return (await readArData()).artworks.find(x => x.id === id) ?? null;
  }
  async findPublishedBySlug(slug: string): Promise<Artwork | null> {
    return (await readArData()).artworks.find(x => x.slug === slug && x.status === "published") ?? null;
  }
  async listPublished(): Promise<Artwork[]> {
    return (await readArData()).artworks.filter(x => x.status === "published")
      .sort((a, b) => (a.publishedAt ?? a.createdAt).localeCompare(b.publishedAt ?? b.createdAt));
  }
  async listAll(): Promise<Artwork[]> {
    return (await readArData()).artworks.slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async listForOwner(ownerId: string): Promise<Artwork[]> {
    return (await readArData()).artworks.filter(x => x.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async updateForOwner(id: string, ownerId: string | null, input: UpdateArtworkInput): Promise<Artwork | null> {
    return updateArData(data => {
      const current = data.artworks.find(x => x.id === id && x.ownerId === ownerId);
      if (!current) return null;
      current.title = input.title.trim(); current.artistName = input.artistName.trim();
      current.description = input.description.trim();
      current.publishedAt = input.status === "published" ? (current.publishedAt ?? new Date().toISOString()) : null;
      current.status = input.status;
      return structuredClone(current);
    });
  }
  async deleteForOwner(id: string, ownerId: string | null): Promise<Artwork | null> {
    return updateArData(data => {
      const index = data.artworks.findIndex(x => x.id === id && x.ownerId === ownerId);
      if (index < 0) return null;
      const removed = data.artworks.splice(index, 1)[0];
      for (const userId of Object.keys(data.collections)) {
        data.collections[userId] = data.collections[userId].filter(x => x !== id);
      }
      return removed;
    });
  }
  async countPublished(): Promise<number> {
    return (await readArData()).artworks.filter(x => x.status === "published").length;
  }
  async markPublished(id: string): Promise<Artwork> {
    return updateArData(data => {
      const current = data.artworks.find(x => x.id === id);
      if (!current) throw new Error("Artwork draft not found.");
      if (current.status !== "published") {
        current.status = "published"; current.publishedAt = new Date().toISOString();
      }
      return structuredClone(current);
    });
  }
}
