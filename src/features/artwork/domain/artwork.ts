export const EVERIE_MVP_MAX_PRODUCTS = 10;
export const EVERIE_MAX_SPATIAL_LAYERS = 12;
export const EVERIE_MAX_SPATIAL_VIDEOS = 2;
export const EVERIE_MAX_SPATIAL_MODELS = 1;

export type ArtworkStatus = "draft" | "published";
export type ArtworkArMode = "motion_extract" | "transparent_motion" | "spatial_layers";
export type ArtworkArAssetType = "image" | "video" | "model";
export type ArtworkArLayerAnimation = "none" | "float" | "pulse" | "rotate" | "orbit";
export type ArtworkArLayerBlendMode = "normal" | "additive";

export interface ArtworkArLayerTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface ArtworkSpatialLayerConfig {
  id: string;
  type: ArtworkArAssetType | "primitive" | "particles";
  assetPath?: string;
  mimeType?: string;
  aspectRatio?: number;
  alphaPacking?: "side-by-side";
  fitToTarget?: boolean;
  transform: ArtworkArLayerTransform;
  animation?: {
    type: ArtworkArLayerAnimation;
    speed?: number;
    amplitude?: number;
  };
  blendMode?: ArtworkArLayerBlendMode;
  shape?: "box" | "ring" | "torus";
  color?: string;
  count?: number;
}

export interface ArtworkArConfig {
  targetAspectRatio?: number;
  thresholdLow?: number;
  thresholdHigh?: number;
  layers?: ArtworkSpatialLayerConfig[];
}

export interface Artwork {
  id: string;
  ownerId: string | null;
  slug: string;
  title: string;
  artistName: string;
  description: string;
  status: ArtworkStatus;
  targetImagePath: string;
  targetFilePath: string;
  targetImageHash?: string | null;
  overlayPath: string | null;
  overlayType: "video" | null;
  overlayAspectRatio: number | null;
  arMode: ArtworkArMode;
  arConfig: ArtworkArConfig;
  createdAt: string;
  publishedAt: string | null;
}

export interface ArtworkAssetUrls {
  targetImageUrl: string;
  targetFileUrl: string;
  overlayUrl: string | null;
  arAssetUrls: Record<string, string>;
}

export interface PublishedArtwork extends Artwork, ArtworkAssetUrls {}

export interface CreateArtworkDraftInput {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  artistName: string;
  description: string;
  targetImagePath: string;
  targetFilePath: string;
  targetImageHash?: string | null;
  overlayPath: string | null;
  overlayAspectRatio: number | null;
  arMode: ArtworkArMode;
  arConfig: ArtworkArConfig;
}

export interface ArtworkArAssetInput {
  id: string;
  artworkId: string;
  assetType: ArtworkArAssetType;
  storagePath: string;
  mimeType: string;
  metadata: Record<string, unknown>;
}

export interface UpdateArtworkInput {
  title: string;
  artistName: string;
  description: string;
  status: ArtworkStatus;
}

export interface SignedUploadSlot {
  path: string;
  token: string;
}

export interface SpatialLayerUploadSlot {
  id: string;
  slot: SignedUploadSlot;
}

export interface ArtworkUploadSession {
  artworkId: string;
  slug: string;
  bucket: string;
  uploads: {
    targetImage: SignedUploadSlot;
    targetMind: SignedUploadSlot;
    overlay?: SignedUploadSlot;
    spatialLayers: SpatialLayerUploadSlot[];
  };
}