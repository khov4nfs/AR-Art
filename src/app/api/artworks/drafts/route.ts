import { NextResponse } from "next/server";

import {
  EVERIE_MAX_SPATIAL_LAYERS,
  EVERIE_MAX_SPATIAL_MODELS,
  EVERIE_MAX_SPATIAL_VIDEOS,
  type ArtworkArAssetType,
  type ArtworkArMode,
} from "@/features/artwork/domain/artwork";
import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";
import { getRequestUser } from "@/features/auth/infrastructure/supabase/request-user";

const imageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const videoExtensions = new Set(["mp4", "webm"]);
const spatialExtensions = new Set([...imageExtensions, ...videoExtensions, "glb"]);
const arModes = new Set<ArtworkArMode>([
  "motion_extract",
  "transparent_motion",
  "spatial_layers",
]);
const animations = new Set(["none", "float", "pulse", "rotate", "orbit"]);
const blendModes = new Set(["normal", "additive"]);

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function finite(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function assetTypeFor(extension: string): ArtworkArAssetType | null {
  if (imageExtensions.has(extension)) return "image";
  if (videoExtensions.has(extension)) return "video";
  if (extension === "glb") return "model";
  return null;
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const title = clean(body.title, 120);
    const artistName = clean(body.artistName, 120);
    const description = clean(body.description, 1200);
    const targetImageExtension = clean(body.targetImageExtension, 8).toLowerCase();
    const targetAspectRatio = finite(body.targetAspectRatio, 0.2, 5);
    const arMode = clean(body.arMode, 32) as ArtworkArMode;
    const creationFlow = clean(body.creationFlow, 32);
    const overlayExtension = clean(body.overlayExtension, 8).toLowerCase();
    const overlayAspectRatio = finite(body.overlayAspectRatio, 0.2, 5);

    if (!title || !artistName) {
      return NextResponse.json(
        { error: "Artwork title and artist name are required." },
        { status: 400 },
      );
    }

    if (!imageExtensions.has(targetImageExtension) || targetAspectRatio === null) {
      return NextResponse.json({ error: "Invalid tracking artwork." }, { status: 400 });
    }

    if (!arModes.has(arMode)) {
      return NextResponse.json({ error: "Unsupported AR experience type." }, { status: 400 });
    }
    if (creationFlow && creationFlow !== "image-video") {
      return NextResponse.json({ error: "Unsupported artwork upload workflow." }, { status: 400 });
    }
    if (creationFlow === "image-video" && arMode !== "spatial_layers") {
      return NextResponse.json({ error: "Image + video publishing requires image tracking." }, { status: 400 });
    }

    if (arMode !== "spatial_layers") {
      if (!videoExtensions.has(overlayExtension) || overlayAspectRatio === null) {
        return NextResponse.json({ error: "Invalid AR motion video." }, { status: 400 });
      }

      const ratioDelta = Math.abs(overlayAspectRatio - targetAspectRatio) / targetAspectRatio;
      if (ratioDelta > 0.08) {
        return NextResponse.json(
          { error: "AR motion proportions must closely match the artwork." },
          { status: 400 },
        );
      }
    }

    const rawLayers = Array.isArray(body.spatialLayers) ? body.spatialLayers : [];
    if (rawLayers.length > EVERIE_MAX_SPATIAL_LAYERS) {
      return NextResponse.json(
        { error: `Layered AR supports up to ${EVERIE_MAX_SPATIAL_LAYERS} layers.` },
        { status: 400 },
      );
    }

    const spatialLayers = rawLayers.map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        throw new Error(`Layer ${index + 1} is invalid.`);
      }
      const layer = raw as Record<string, unknown>;
      const extension = clean(layer.extension, 8).toLowerCase();
      const assetType = assetTypeFor(extension);
      const alphaPacking = layer.alphaPacking === "side-by-side" ? "side-by-side" as const : undefined;
      const fitToTarget = layer.fitToTarget === true;
      if (!spatialExtensions.has(extension) || !assetType ||
          (layer.alphaPacking !== undefined && (alphaPacking === undefined || extension !== "mp4")) ||
          (layer.fitToTarget !== undefined && (layer.fitToTarget !== true || assetType !== "video"))) {
        throw new Error(`Layer ${index + 1} has an unsupported format.`);
      }

      const x = finite(layer.x, -1.5, 1.5);
      const y = finite(layer.y, -1.5, 1.5);
      const depth = finite(layer.depth, 0, 1);
      const scale = finite(layer.scale, 0.05, 3);
      const animation = clean(layer.animation, 16);
      const blendMode = clean(layer.blendMode, 16);
      if (
        x === null ||
        y === null ||
        depth === null ||
        scale === null ||
        !animations.has(animation) ||
        !blendModes.has(blendMode)
      ) {
        throw new Error(`Layer ${index + 1} has invalid placement or motion settings.`);
      }

      const aspectRatio =
        assetType === "model" ? undefined : finite(layer.aspectRatio, 0.05, 20) ?? undefined;
      if (assetType !== "model" && aspectRatio === undefined) {
        throw new Error(`Layer ${index + 1} is missing its proportions.`);
      }

      return {
        extension: extension as "jpg" | "jpeg" | "png" | "webp" | "mp4" | "webm" | "glb",
        mimeType: clean(layer.mimeType, 80) || "application/octet-stream",
        assetType,
        alphaPacking,
        fitToTarget,
        aspectRatio,
        transform: {
          position: { x, y, z: depth },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: scale, y: scale, z: scale },
        },
        animation: {
          type: animation as "none" | "float" | "pulse" | "rotate" | "orbit",
          speed: 1,
          amplitude: animation === "float" || animation === "orbit" ? 0.035 : 0.08,
        },
        blendMode: blendMode as "normal" | "additive",
      };
    });

    if (arMode === "spatial_layers") {
      if (spatialLayers.length === 0) {
        return NextResponse.json({ error: "Add at least one AR layer." }, { status: 400 });
      }
      if (creationFlow === "image-video" &&
          (spatialLayers.length !== 1 || spatialLayers[0]?.assetType !== "video" || !spatialLayers[0]?.fitToTarget)) {
        return NextResponse.json(
          { error: "Publish requires one artwork image and one aligned animation video." },
          { status: 400 },
        );
      }
      const videoCount = spatialLayers.filter((layer) => layer.assetType === "video").length;
      const modelCount = spatialLayers.filter((layer) => layer.assetType === "model").length;
      if (videoCount > EVERIE_MAX_SPATIAL_VIDEOS || modelCount > EVERIE_MAX_SPATIAL_MODELS) {
        return NextResponse.json(
          { error: "Layered AR exceeds the mobile video or 3D model limit." },
          { status: 400 },
        );
      }
    }

    const { createUploadSession } = createArtworkServices();
    const session = await createUploadSession.execute({
      ownerId: user.id,
      title,
      artistName,
      description,
      targetImageExtension: targetImageExtension as "jpg" | "jpeg" | "png" | "webp",
      targetAspectRatio,
      arMode,
      ...(arMode !== "spatial_layers"
        ? {
            overlayExtension: overlayExtension as "mp4" | "webm",
            overlayAspectRatio: overlayAspectRatio!,
          }
        : {}),
      spatialLayers: arMode === "spatial_layers" ? spatialLayers : [],
    });

    return NextResponse.json(session, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to create artwork.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}