export type ArExperienceStatus =
  | "idle"
  | "starting"
  | "scanning"
  | "found"
  | "error";

export type ArLayerAnimationType = "none" | "float" | "pulse" | "rotate" | "orbit";
export type ArLayerBlendMode = "normal" | "additive";

export interface ArLayerTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface ArLayerAnimation {
  type: ArLayerAnimationType;
  speed?: number;
  amplitude?: number;
}

interface ArSceneLayerBase {
  id: string;
  transform: ArLayerTransform;
  animation?: ArLayerAnimation;
  blendMode?: ArLayerBlendMode;
}

export type ArSceneLayer =
  | (ArSceneLayerBase & {
      type: "image";
      url: string;
      aspectRatio: number;
    })
  | (ArSceneLayerBase & {
      type: "video";
      url: string;
      aspectRatio: number;
      transparent?: boolean;
    })
  | (ArSceneLayerBase & {
      type: "model";
      url: string;
    })
  | (ArSceneLayerBase & {
      type: "primitive";
      shape: "box" | "ring" | "torus";
      color?: string;
    })
  | (ArSceneLayerBase & {
      type: "particles";
      color?: string;
      count?: number;
    });

export type ArOverlay =
  | {
      kind: "motion-extract";
      videoUrl: string;
      targetImageUrl: string;
      targetAspectRatio: number;
      thresholdLow: number;
      thresholdHigh: number;
    }
  | {
      kind: "transparent-video";
      videoUrl: string;
      targetImageUrl: string;
      targetAspectRatio: number;
      fallbackThresholdLow: number;
      fallbackThresholdHigh: number;
    }
  | {
      kind: "spatial-scene";
      targetAspectRatio: number;
      layers: ArSceneLayer[];
    }
  | { kind: "procedural" };

export interface SingleArExperienceConfig {
  targetUrl: string;
  targetIndex: number;
  overlay: ArOverlay;
}

export interface MultiArExperienceConfig {
  targetUrl: string;
  targets: Array<{ index: number; overlay: ArOverlay }>;
}

export type ArExperienceConfig = SingleArExperienceConfig | MultiArExperienceConfig;

export interface ArExperienceCallbacks {
  onScanning(): void;
  onTargetFound(targetIndex: number): void;
  onTargetLost(targetIndex: number): void;
  onError(error: Error): void;
}