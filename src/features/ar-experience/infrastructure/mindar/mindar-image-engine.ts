import * as THREE from "three";

import type { ArEngine } from "@/features/ar-experience/application/ports/ar-engine";
import type {
  ArExperienceCallbacks,
  ArExperienceConfig,
} from "@/features/ar-experience/domain/ar-experience";
import { ThreeArOverlayScene } from "@/features/ar-experience/infrastructure/three/three-ar-overlay-scene";

type MindArAnchor = {
  group: THREE.Group;
  onTargetFound?: () => void;
  onTargetLost?: () => void;
};

type MindArRuntime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  video?: HTMLVideoElement;
  cssRenderer?: { domElement: HTMLElement };
  addAnchor(index: number): MindArAnchor;
  start(): Promise<void>;
  stop(): Promise<void> | void;
  resize(): void;
};

type MindArConstructor = new (options: {
  container: HTMLElement;
  imageTargetSrc: string;
  uiLoading?: "yes" | "no";
  uiScanning?: "yes" | "no";
  uiError?: "yes" | "no";
  filterMinCF?: number;
  filterBeta?: number;
  warmupTolerance?: number;
  missTolerance?: number;
  maxTrack?: number;
}) => MindArRuntime;

type MindArModule = { MindARThree: MindArConstructor };

let mindArModule: MindArModule | null = null;
let mindArModulePromise: Promise<MindArModule> | null = null;

function loadMindArRuntime() {
  if (mindArModule) return Promise.resolve(mindArModule);

  if (!mindArModulePromise) {
    mindArModulePromise = (
      import("mind-ar/dist/mindar-image-three.prod.js") as unknown as Promise<MindArModule>
    )
      .then((module) => {
        mindArModule = module;
        return module;
      })
      .catch((cause) => {
        mindArModulePromise = null;
        throw cause;
      });
  }

  return mindArModulePromise;
}

export function preloadMindArRuntime() {
  return loadMindArRuntime().then(() => undefined);
}

function getPreloadedMindArRuntime() {
  if (!mindArModule) {
    throw new Error("AR engine is still loading. Wait a moment and try again.");
  }

  return mindArModule;
}

export class MindArImageEngine implements ArEngine {
  private runtime: MindArRuntime | null = null;
  private overlayScenes = new Map<number, ThreeArOverlayScene>();
  private visibleTargets = new Set<number>();
  private started = false;
  private cleanupViewportSync: (() => void) | null = null;

  async start(
    container: HTMLElement,
    config: ArExperienceConfig,
    callbacks: ArExperienceCallbacks,
  ) {
    if (this.runtime) await this.stop();

    try {
      const mindArModule = getPreloadedMindArRuntime();
      const targets = "targets" in config
        ? config.targets
        : [{ index: config.targetIndex, overlay: config.overlay }];
      if (!targets.length) throw new Error("No artwork targets are ready.");

      const runtime = new mindArModule.MindARThree({
        container,
        imageTargetSrc: config.targetUrl,
        maxTrack: 1,
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no",
      });
      this.runtime = runtime;
      const { renderer, scene, camera } = runtime;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const anchors = new Map<number, MindArAnchor>();
      const ensureOverlay = (target: typeof targets[number]) => {
        if (this.runtime !== runtime || this.overlayScenes.has(target.index)) return;
        const anchor = anchors.get(target.index);
        if (!anchor) return;

        const overlayScene = new ThreeArOverlayScene();
        this.overlayScenes.set(target.index, overlayScene);
        overlayScene.setTargetVisible(this.visibleTargets.has(target.index));
        void overlayScene.create(target.overlay).then((overlay) => {
          if (this.runtime !== runtime || this.overlayScenes.get(target.index) !== overlayScene) {
            overlayScene.dispose();
            return;
          }
          anchor.group.add(overlay);
        }).catch((cause: unknown) => {
          overlayScene.dispose();
          if (this.overlayScenes.get(target.index) === overlayScene) {
            this.overlayScenes.delete(target.index);
            callbacks.onError(cause instanceof Error ? cause : new Error("Unable to load artwork AR layers."));
          }
        });
      };

      for (const target of targets) {
        const anchor = runtime.addAnchor(target.index);
        anchors.set(target.index, anchor);
        anchor.onTargetFound = () => {
          if (this.runtime !== runtime) return;
          this.visibleTargets.add(target.index);
          this.overlayScenes.get(target.index)?.setTargetVisible(true);
          if (this.started) ensureOverlay(target);
          callbacks.onTargetFound(target.index);
        };
        anchor.onTargetLost = () => {
          if (this.runtime !== runtime) return;
          this.visibleTargets.delete(target.index);
          this.overlayScenes.get(target.index)?.setTargetVisible(false);
          callbacks.onTargetLost(target.index);
        };
      }

      // Request tracking first so Safari has the same camera permission path.
      await runtime.start();

      const cameraVideo = runtime.video ?? container.querySelector<HTMLVideoElement>("video");
      if (!cameraVideo || !(cameraVideo.srcObject instanceof MediaStream)) {
        throw new Error("Camera started but the live preview stream is unavailable.");
      }

      cameraVideo.muted = true;
      cameraVideo.defaultMuted = true;
      cameraVideo.playsInline = true;
      cameraVideo.autoplay = true;
      cameraVideo.setAttribute("muted", "");
      cameraVideo.setAttribute("playsinline", "");
      cameraVideo.setAttribute("webkit-playsinline", "");
      cameraVideo.setAttribute("autoplay", "");
      Object.assign(cameraVideo.style, {
        zIndex: "0", display: "block", visibility: "visible", opacity: "1", background: "#000",
      });

      Object.assign(renderer.domElement.style, {
        zIndex: "1", pointerEvents: "none", background: "transparent",
      });
      if (runtime.cssRenderer?.domElement) {
        Object.assign(runtime.cssRenderer.domElement.style, {
          zIndex: "2", pointerEvents: "none",
        });
      }

      this.bindViewportSync(runtime, container);
      try {
        await cameraVideo.play();
      } catch {
        // Safari may reject redundant play() when the camera is already live.
      }

      this.started = true;
      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        const elapsed = clock.getElapsedTime();
        for (const overlayScene of this.overlayScenes.values()) overlayScene.update(elapsed);
        renderer.render(scene, camera);
      });
      callbacks.onScanning();

      // Prepare the single-artwork layer immediately; in universal mode only
      // prepare the recognized artwork, keeping other videos/GLBs unloaded.
      if (!("targets" in config)) ensureOverlay(targets[0]!);
      for (const target of targets) {
        if (this.visibleTargets.has(target.index)) ensureOverlay(target);
      }
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error("Unable to start the AR camera.");
      callbacks.onError(error);
      await this.stop();
      throw error;
    }
  }

  private bindViewportSync(runtime: MindArRuntime, container: HTMLElement) {
    this.cleanupViewportSync?.();

    let frameId: number | null = null;
    let settleTimer: number | null = null;

    const resize = () => {
      if (this.runtime !== runtime || !container.isConnected) return;
      if (container.clientWidth <= 0 || container.clientHeight <= 0) return;
      runtime.resize();
    };

    const scheduleResize = () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        resize();
        window.requestAnimationFrame(resize);
      });

      if (settleTimer !== null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(resize, 250);
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", scheduleResize, { passive: true });
    window.addEventListener("orientationchange", scheduleResize, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleResize, { passive: true });
    window.visualViewport?.addEventListener("scroll", scheduleResize, { passive: true });

    this.cleanupViewportSync = () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("orientationchange", scheduleResize);
      window.visualViewport?.removeEventListener("resize", scheduleResize);
      window.visualViewport?.removeEventListener("scroll", scheduleResize);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      this.cleanupViewportSync = null;
    };

    scheduleResize();
  }

  async stop() {
    this.cleanupViewportSync?.();
    for (const overlayScene of this.overlayScenes.values()) overlayScene.dispose();
    this.overlayScenes.clear();
    this.visibleTargets.clear();

    if (!this.runtime) return;
    const runtime = this.runtime;
    this.runtime = null;
    runtime.renderer.setAnimationLoop(null);

    if (this.started) {
      try {
        await runtime.stop();
      } catch {
        // Some browsers can report a redundant video-stop error during teardown.
      }
    }

    this.started = false;
    const canvas = runtime.renderer.domElement;
    canvas.parentElement?.removeChild(canvas);
    runtime.renderer.dispose();
  }
}
