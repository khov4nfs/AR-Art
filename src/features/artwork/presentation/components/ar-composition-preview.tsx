"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import type { ArOverlay, ArSceneLayer } from "@/features/ar-experience/domain/ar-experience";
import { ThreeArOverlayScene } from "@/features/ar-experience/infrastructure/three/three-ar-overlay-scene";
import type { ArtworkArMode } from "@/features/artwork/domain/artwork";
import type { ArtworkCreateFormValues } from "@/features/artwork/domain/artwork-create-form-schema";
import { readImageAspectRatio } from "@/features/artwork/presentation/lib/read-image-aspect-ratio";
import { isPackedAlphaVideoName } from "@/features/artwork/domain/original-video";
import { readVideoAspectRatio } from "@/features/artwork/presentation/lib/read-video-aspect-ratio";

interface ArCompositionPreviewProps {
  targetImage?: File;
  arMode: ArtworkArMode;
  overlayVideo?: File;
  spatialLayers: ArtworkCreateFormValues["spatialLayers"];
}

function isVideo(file: File) {
  return file.type.startsWith("video/");
}

function isModel(file: File) {
  return file.type === "model/gltf-binary" || file.name.toLowerCase().endsWith(".glb");
}

async function layerAspectRatio(file: File) {
  if (isVideo(file)) return readVideoAspectRatio(file);
  if (!isModel(file)) return readImageAspectRatio(file);
  return undefined;
}

export function ArCompositionPreview({
  targetImage,
  arMode,
  overlayVideo,
  spatialLayers,
}: ArCompositionPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !targetImage) return;
    const previewContainer = container;
    const previewTarget = targetImage;

    let cancelled = false;
    let frameId = 0;
    const objectUrls: string[] = [];
    const previewResources: Array<{ dispose(): void }> = [];
    let overlayScene: ThreeArOverlayScene | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const objectUrl = (file: File) => {
      const url = URL.createObjectURL(file);
      objectUrls.push(url);
      return url;
    };

    async function buildOverlay(
      targetUrl: string,
      targetAspectRatio: number,
    ): Promise<ArOverlay | null> {
      if (arMode === "motion_extract") {
        if (!overlayVideo) return null;
        return {
          kind: "motion-extract",
          videoUrl: objectUrl(overlayVideo),
          targetImageUrl: targetUrl,
          targetAspectRatio,
          thresholdLow: 0.08,
          thresholdHigh: 0.18,
        };
      }

      if (arMode === "transparent_motion") {
        if (!overlayVideo) return null;
        return {
          kind: "transparent-video",
          videoUrl: objectUrl(overlayVideo),
          targetImageUrl: targetUrl,
          targetAspectRatio,
          fallbackThresholdLow: 0.08,
          fallbackThresholdHigh: 0.18,
        };
      }

      const layers = await Promise.all(
        spatialLayers.slice(0, 12).map(async (layer): Promise<ArSceneLayer> => {
          const url = objectUrl(layer.file);
          const base = {
            id: `${layer.file.name}-${layer.file.lastModified}`,
            transform: {
              position: { x: layer.x, y: layer.y, z: layer.depth },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: layer.scale, y: layer.scale, z: layer.scale },
            },
            animation: {
              type: layer.animation,
              speed: 1,
              amplitude: layer.animation === "float" || layer.animation === "orbit" ? 0.035 : 0.08,
            },
            blendMode: layer.blendMode,
          } as const;

          if (isModel(layer.file)) return { ...base, type: "model", url };
          const aspectRatio = (await layerAspectRatio(layer.file)) ?? 1;
          if (isVideo(layer.file)) {
            return { ...base, type: "video", url, aspectRatio, transparent: true, fitToTarget: true, alphaPacking: isPackedAlphaVideoName(layer.file.name) ? "side-by-side" : undefined };
          }
          return { ...base, type: "image", url, aspectRatio };
        }),
      );

      if (!layers.length) return null;
      return { kind: "spatial-scene", targetAspectRatio, layers };
    }

    async function startPreview() {
      setPreviewError(false);
      try {
        const targetUrl = objectUrl(previewTarget);
        const targetAspectRatio = await readImageAspectRatio(previewTarget);
        const overlay = await buildOverlay(targetUrl, targetAspectRatio);
        if (cancelled) return;

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x050507, 1);
        renderer.domElement.className = "absolute inset-0 h-full w-full";
        previewContainer.replaceChildren(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 20);
        camera.lookAt(0, 0, 0);

        const targetTexture = await new THREE.TextureLoader().loadAsync(targetUrl);
        if (cancelled) {
          targetTexture.dispose();
          return;
        }
        targetTexture.colorSpace = THREE.SRGBColorSpace;
        previewResources.push(targetTexture);
        const targetGeometry = new THREE.PlaneGeometry(1, 1 / targetAspectRatio);
        const targetMaterial = new THREE.MeshBasicMaterial({ map: targetTexture });
        previewResources.push(targetGeometry, targetMaterial);
        const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
        targetMesh.position.z = -0.025;
        scene.add(targetMesh);

        overlayScene = new ThreeArOverlayScene();
        if (overlay) {
          const object = await overlayScene.create(overlay);
          if (cancelled) return;
          scene.add(object);
          overlayScene.setTargetVisible(true);
        }

        const resize = () => {
          if (!renderer || !previewContainer.isConnected) return;
          const width = Math.max(previewContainer.clientWidth, 1);
          const height = Math.max(previewContainer.clientHeight, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          const targetHeight = 1 / Math.max(targetAspectRatio, 0.1);
          const verticalFov = THREE.MathUtils.degToRad(camera.fov);
          const distanceForHeight = (targetHeight * 0.58) / Math.tan(verticalFov / 2);
          const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
          const distanceForWidth = 0.58 / Math.tan(horizontalFov / 2);
          camera.position.set(0, 0, Math.max(distanceForHeight, distanceForWidth, 1.1));
          camera.updateProjectionMatrix();
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(previewContainer);
        resize();

        const clock = new THREE.Clock();
        const render = () => {
          if (cancelled || !renderer) return;
          overlayScene?.update(clock.getElapsedTime());
          renderer.render(scene, camera);
          frameId = window.requestAnimationFrame(render);
        };
        render();
      } catch {
        if (!cancelled) setPreviewError(true);
      }
    }

    void startPreview();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      overlayScene?.dispose();
      for (const resource of previewResources) resource.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      for (const url of objectUrls) URL.revokeObjectURL(url);
    };
  }, [arMode, overlayVideo, spatialLayers, targetImage]);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#050507]">
      {previewError ? (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-xs leading-5 text-white/35">
          This asset cannot be previewed here. You can still save it and test it in AR.
        </div>
      ) : null}
    </div>
  );
}
