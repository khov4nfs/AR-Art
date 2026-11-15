import type { ArtworkRepository } from "@/features/artwork/application/ports/artwork-repository";
import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";
import type {
  ArtworkArAssetType,
  ArtworkArLayerAnimation,
  ArtworkArLayerBlendMode,
  ArtworkArMode,
  ArtworkUploadSession,
} from "@/features/artwork/domain/artwork";

export interface SpatialUploadInput {
  extension: "jpg" | "jpeg" | "png" | "webp" | "mp4" | "webm" | "glb";
  mimeType: string;
  assetType: ArtworkArAssetType;
  alphaPacking?: "side-by-side";
  aspectRatio?: number;
  transform: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  animation: {
    type: ArtworkArLayerAnimation;
    speed?: number;
    amplitude?: number;
  };
  blendMode: ArtworkArLayerBlendMode;
}

export interface CreateUploadSessionInput {
  ownerId: string;
  title: string;
  artistName: string;
  description: string;
  targetImageExtension: "jpg" | "jpeg" | "png" | "webp";
  targetAspectRatio: number;
  arMode: ArtworkArMode;
  overlayExtension?: "mp4" | "webm";
  overlayAspectRatio?: number;
  spatialLayers: SpatialUploadInput[];
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export class CreateArtworkUploadSession {
  constructor(
    private readonly repository: ArtworkRepository,
    private readonly storage: ArtworkStorage,
    private readonly bucket: string,
  ) {}

  async execute(input: CreateUploadSessionInput): Promise<ArtworkUploadSession> {
    const id = crypto.randomUUID();
    const suffix = id.slice(0, 8);
    const baseSlug = slugify(input.title) || "artwork";
    const slug = `${baseSlug}-${suffix}`;

    const targetImagePath = `${id}/target.${input.targetImageExtension}`;
    const targetFilePath = `${id}/target.mind`;
    const overlayPath = input.overlayExtension
      ? `${id}/overlay.${input.overlayExtension}`
      : null;

    const spatialLayers = input.spatialLayers.map((layer, index) => {
      const layerId = crypto.randomUUID();
      const assetPath = `${id}/layers/${String(index + 1).padStart(2, "0")}-${layerId.slice(0, 8)}.${layer.extension}`;
      return { layerId, assetPath, input: layer };
    });

    const arConfig = {
      targetAspectRatio: input.targetAspectRatio,
      ...(input.arMode === "motion_extract"
        ? { thresholdLow: 0.08, thresholdHigh: 0.18 }
        : input.arMode === "transparent_motion"
          ? { thresholdLow: 0.08, thresholdHigh: 0.18 }
          : {}),
      ...(input.arMode === "spatial_layers"
        ? {
            layers: spatialLayers.map(({ layerId, assetPath, input: layer }) => ({
              id: layerId,
              type: layer.assetType,
              assetPath,
              mimeType: layer.mimeType,
              aspectRatio: layer.aspectRatio,
              alphaPacking: layer.alphaPacking,
              transform: layer.transform,
              animation: layer.animation,
              blendMode: layer.blendMode,
            })),
          }
        : {}),
    };

    await this.repository.createDraft({
      id,
      ownerId: input.ownerId,
      slug,
      title: input.title,
      artistName: input.artistName,
      description: input.description,
      targetImagePath,
      targetFilePath,
      overlayPath,
      overlayAspectRatio: input.overlayAspectRatio ?? null,
      arMode: input.arMode,
      arConfig,
    });

    if (spatialLayers.length > 0) {
      await this.repository.createArAssets(
        spatialLayers.map(({ layerId, assetPath, input: layer }) => ({
          id: layerId,
          artworkId: id,
          assetType: layer.assetType,
          storagePath: assetPath,
          mimeType: layer.mimeType,
          metadata: {
            aspectRatio: layer.aspectRatio ?? null,
            alphaPacking: layer.alphaPacking ?? null,
            transform: layer.transform,
            animation: layer.animation,
            blendMode: layer.blendMode,
          },
        })),
      );
    }

    const [targetImage, targetMind, overlay, ...layerSlots] = await Promise.all([
      this.storage.createSignedUpload(targetImagePath),
      this.storage.createSignedUpload(targetFilePath),
      overlayPath ? this.storage.createSignedUpload(overlayPath) : Promise.resolve(null),
      ...spatialLayers.map((layer) => this.storage.createSignedUpload(layer.assetPath)),
    ]);

    return {
      artworkId: id,
      slug,
      bucket: this.bucket,
      uploads: {
        targetImage,
        targetMind,
        ...(overlay ? { overlay } : {}),
        spatialLayers: layerSlots.map((slot, index) => ({
          id: spatialLayers[index]!.layerId,
          slot: slot!,
        })),
      },
    };
  }
}