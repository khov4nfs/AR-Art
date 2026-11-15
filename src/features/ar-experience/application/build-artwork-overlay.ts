import type { ArOverlay, ArSceneLayer } from "@/features/ar-experience/domain/ar-experience";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";

const DEFAULT_THRESHOLD_LOW = 0.08;
const DEFAULT_THRESHOLD_HIGH = 0.18;

export function buildArtworkOverlay(artwork: PublishedArtwork): ArOverlay {
  const targetAspectRatio =
    artwork.arConfig.targetAspectRatio ?? artwork.overlayAspectRatio ?? 1;

  if (artwork.arMode === "spatial_layers") {
    const layers = (artwork.arConfig.layers ?? [])
      .map((layer): ArSceneLayer | null => {
        const base = {
          id: layer.id,
          transform: layer.transform,
          animation: layer.animation,
          blendMode: layer.blendMode,
        };

        if (layer.type === "primitive") {
          return {
            ...base,
            type: "primitive",
            shape: layer.shape ?? "ring",
            color: layer.color,
          };
        }

        if (layer.type === "particles") {
          return {
            ...base,
            type: "particles",
            color: layer.color,
            count: layer.count,
          };
        }

        if (!layer.assetPath) return null;
        const url = artwork.arAssetUrls[layer.assetPath];
        if (!url) return null;

        if (layer.type === "model") {
          return { ...base, type: "model", url };
        }

        if (layer.type === "video") {
          return {
            ...base,
            type: "video",
            url,
            aspectRatio: layer.aspectRatio ?? 1,
            transparent: true,
            alphaPacking: layer.alphaPacking,
          };
        }

        return {
          ...base,
          type: "image",
          url,
          aspectRatio: layer.aspectRatio ?? 1,
        };
      })
      .filter((layer): layer is ArSceneLayer => Boolean(layer));

    return {
      kind: "spatial-scene",
      targetAspectRatio,
      layers,
    };
  }

  if (!artwork.overlayUrl) return { kind: "procedural" };

  if (artwork.arMode === "transparent_motion") {
    return {
      kind: "transparent-video",
      videoUrl: artwork.overlayUrl,
      targetImageUrl: artwork.targetImageUrl,
      targetAspectRatio,
      fallbackThresholdLow: artwork.arConfig.thresholdLow ?? DEFAULT_THRESHOLD_LOW,
      fallbackThresholdHigh: artwork.arConfig.thresholdHigh ?? DEFAULT_THRESHOLD_HIGH,
    };
  }

  return {
    kind: "motion-extract",
    videoUrl: artwork.overlayUrl,
    targetImageUrl: artwork.targetImageUrl,
    targetAspectRatio,
    thresholdLow: artwork.arConfig.thresholdLow ?? DEFAULT_THRESHOLD_LOW,
    thresholdHigh: artwork.arConfig.thresholdHigh ?? DEFAULT_THRESHOLD_HIGH,
  };
}