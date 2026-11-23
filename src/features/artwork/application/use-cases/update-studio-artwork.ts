import type { ArtworkRepository } from "@/features/artwork/application/ports/artwork-repository";
import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";
import { EVERIE_MVP_MAX_PRODUCTS, type PublishedArtwork, type UpdateArtworkInput } from "@/features/artwork/domain/artwork";

export class UpdateStudioArtwork {
  constructor(
    private readonly repository: ArtworkRepository,
    private readonly storage: ArtworkStorage,
  ) {}

  async execute(
    id: string,
    ownerId: string,
    input: UpdateArtworkInput,
    canManageAll = false,
  ): Promise<PublishedArtwork | null> {
    const existing = await this.repository.findById(id);
    if (!existing || (!canManageAll && existing.ownerId !== ownerId)) return null;

    if (existing.status === "draft" && input.status === "published") {
      const publishedCount = await this.repository.countPublished();
      if (publishedCount >= EVERIE_MVP_MAX_PRODUCTS) {
        throw new Error(
          `Everie MVP supports up to ${EVERIE_MVP_MAX_PRODUCTS} published products.`,
        );
      }
      await this.storage.assertAssetsExist(existing);
    }

    const artwork = await this.repository.updateForOwner(id, existing.ownerId, input);
    if (!artwork) return null;

    return {
      ...artwork,
      ...this.storage.getPublicUrls(artwork),
    };
  }
}
