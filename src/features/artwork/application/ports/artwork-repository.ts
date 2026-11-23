import type {
  Artwork,
  ArtworkArAssetInput,
  CreateArtworkDraftInput,
  UpdateArtworkInput,
} from "@/features/artwork/domain/artwork";

export interface ArtworkRepository {
  createDraft(input: CreateArtworkDraftInput): Promise<Artwork>;
  createArAssets(inputs: ArtworkArAssetInput[]): Promise<void>;
  findById(id: string): Promise<Artwork | null>;
  findPublishedBySlug(slug: string): Promise<Artwork | null>;
  listPublished(): Promise<Artwork[]>;
  listForOwner(ownerId: string): Promise<Artwork[]>;
  listAll(): Promise<Artwork[]>;
  updateForOwner(id: string, ownerId: string | null, input: UpdateArtworkInput): Promise<Artwork | null>;
  deleteForOwner(id: string, ownerId: string | null): Promise<Artwork | null>;
  countPublished(): Promise<number>;
  markPublished(id: string): Promise<Artwork>;
}
