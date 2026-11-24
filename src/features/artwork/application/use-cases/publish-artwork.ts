import type { ArtworkRepository } from "../ports/artwork-repository";
import type { ArtworkStorage } from "../ports/artwork-storage";
import type { PublishedArtwork } from "../../domain/artwork";

export const EVERIE_MVP_MAX_PRODUCTS = 10;

export class PublishArtwork {
  constructor(
    private readonly repository: ArtworkRepository,
    private readonly storage: ArtworkStorage,
    private readonly maxProducts: number = EVERIE_MVP_MAX_PRODUCTS,
  ) {}

  async execute(id: string, ownerId: string): Promise<PublishedArtwork> {
    const artwork = await this.repository.findById(id);
    if (!artwork) throw new Error("Artwork draft was not found.");
    if (artwork.ownerId !== ownerId) {
      throw new Error("You do not have permission to publish this artwork.");
    }

    if (artwork.status !== "published") {
      const publishedCount = await this.repository.countPublished();
      if (publishedCount >= this.maxProducts) {
        throw new Error(
          `The current Everie MVP supports up to ${this.maxProducts} published products.`,
        );
      }
    }

    await this.storage.assertAssetsExist(artwork);

    // Verify target image is unique across other published or existing artworks
    const duplicate = await this.repository.findDuplicateTargetForArtwork(artwork);
    if (duplicate) {
      throw new Error(
        "This target image is already used by another AR artwork. Each AR product requires a unique scan image.",
      );
    }

    const published =
      artwork.status === "published"
        ? artwork
        : await this.repository.markPublished(id);

    return {
      ...published,
      ...this.storage.getPublicUrls(published),
    };
  }
}
