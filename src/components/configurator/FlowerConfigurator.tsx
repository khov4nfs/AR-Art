"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Move3d, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { placementDegrees, type EngraveSpot, type EngravingFontId } from "@/lib/engraving";
import type { FlowerPreset, FlowerSceneApi, ModelFit } from "./flowerScene";

export interface ConfiguratorHandle {
  snapshot: () => string | null;
}

export interface FlowerConfiguratorProps {
  preset?: FlowerPreset;
  glbUrl?: string;
  fit?: ModelFit;
  poster: string;
  alt: string;
  glazeHex: string;
  engravingText: string;
  fontFamily: string;
  fontId: EngravingFontId;
  /** "front" | "back" | "both" | "a<deg>" (see lib/engraving). */
  placement?: string;
  /** Free placement on the model (used when placement === "spot"). */
  spot?: EngraveSpot | null;
  /** When set, the viewer is in "pick a spot" mode and reports clicks. */
  onPickSpot?: (spot: EngraveSpot) => void;
  handleRef?: React.MutableRefObject<ConfiguratorHandle | null>;
  onFail?: () => void;
}

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Luxury studio viewer: auto-rotating turntable on a warm dark vignette,
 * "Explore 360°" unlocks orbit/zoom (so touch scrolling is never hijacked).
 */
export default function FlowerConfigurator(props: FlowerConfiguratorProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<FlowerSceneApi | null>(null);
  const [ready, setReady] = useState(false);
  const [explore, setExplore] = useState(false);
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  const { preset, glbUrl, onFail } = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!supportsWebGL()) {
      onFail?.();
      return;
    }
    let cancelled = false;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    import("./flowerScene")
      .then(({ createFlowerScene }) => {
        if (cancelled) return;
        const p = latest.current;
        const api = createFlowerScene({
          canvas,
          preset,
          glbUrl,
          glazeHex: p.glazeHex,
          fit: p.fit,
          reducedMotion: reduced,
          onReady: () => {
            const cur = latest.current;
            api.setPlacement(placementDegrees(cur.placement), cur.placement === "both");
            api.setSpot(cur.placement === "spot" ? cur.spot ?? null : null);
            api.setEngraving(cur.engravingText, cur.fontFamily, cur.fontId);
            setReady(true);
          },
          onError: () => onFail?.(),
        });
        apiRef.current = api;
        if (p.handleRef) p.handleRef.current = { snapshot: () => api.snapshot() };
      })
      .catch(() => onFail?.());
    return () => {
      cancelled = true;
      apiRef.current?.dispose();
      apiRef.current = null;
      setReady(false);
    };
  }, [preset, glbUrl, onFail]);

  useEffect(() => {
    apiRef.current?.setGlaze(props.glazeHex);
  }, [props.glazeHex]);

  const fitKey = JSON.stringify(props.fit ?? {});
  useEffect(() => {
    apiRef.current?.setFit(JSON.parse(fitKey) as ModelFit);
  }, [fitKey, ready]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    api.setEngraving(props.engravingText, props.fontFamily, props.fontId);
    if (props.engravingText) api.showFront();
    // Fonts load asynchronously: redraw once the face (with diacritics) is ready.
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts
        .load(`64px ${props.fontFamily}`, props.engravingText || "Aă")
        .then(() => api.setEngraving(props.engravingText, props.fontFamily, props.fontId))
        .catch(() => undefined);
    }
  }, [props.engravingText, props.fontFamily, props.fontId, ready]);

  const firstPlacement = useRef(true);
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const deg = placementDegrees(props.placement);
    api.setPlacement(deg, props.placement === "both");
    // Don't swing the camera on first mount, only when the customer changes it.
    if (firstPlacement.current) {
      firstPlacement.current = false;
      return;
    }
    if (props.engravingText && props.placement !== "spot") api.focusAngle(deg);
  }, [props.placement, props.engravingText, ready]);

  const spotKey = props.placement === "spot" && props.spot ? JSON.stringify(props.spot) : "";
  const lastSpotKey = useRef("");
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const sp = spotKey ? (JSON.parse(spotKey) as EngraveSpot) : null;
    // Focus only when the point itself moves (not on rotate/size tweaks).
    const pos = sp ? JSON.stringify([sp.p, sp.n]) : "";
    api.setSpot(sp, Boolean(sp) && pos !== lastSpotKey.current && Boolean(latest.current.engravingText));
    lastSpotKey.current = pos;
  }, [spotKey, ready]);

  // Pick mode: a click (not a drag) on the model places the engraving there.
  const picking = Boolean(props.onPickSpot);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !picking || !ready) return;
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const r = canvas.getBoundingClientRect();
      const sp = apiRef.current?.pick(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      if (sp) latest.current.onPickSpot?.(sp);
      down = null;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    apiRef.current?.setAutoRotate(false);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      apiRef.current?.setAutoRotate(!explore);
    };
  }, [picking, ready, explore]);

  useEffect(() => {
    apiRef.current?.setExplore(explore);
    apiRef.current?.setAutoRotate(!explore && !picking);
  }, [explore, ready, picking]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,#ffffff_0%,#F7F4EE_60%,#ECE6DB_100%)]">
      {/* Poster shows instantly; 3D fades in on top once ready. */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
        aria-hidden={ready}
      >
        <Image src={props.poster} alt={props.alt} fill priority sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover opacity-60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="h-10 w-10 rounded-full border-2 border-neutral-300 border-t-neutral-800 animate-spin motion-reduce:animate-none" />
          <span className="text-[10px] uppercase tracking-[4px] text-neutral-700 font-medium">{t("cfg.loading")}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"} ${picking ? "cursor-crosshair" : explore ? "cursor-grab active:cursor-grabbing" : ""}`}
        aria-label={props.alt}
        role="img"
      />

      <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-neutral-300/80 bg-white/80 px-3 py-1 backdrop-blur-sm shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        <span className="text-[9px] uppercase tracking-[2.5px] text-neutral-800 font-medium">{t("cfg.badge")}</span>
      </div>

      {ready && (
        <div className="absolute bottom-3 inset-x-0 flex flex-wrap items-center justify-center gap-2 px-2">
          <button
            type="button"
            onClick={() => setExplore((v) => !v)}
            aria-pressed={explore}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] uppercase tracking-[2.5px] backdrop-blur-sm transition-all cursor-pointer shadow-sm ${
              explore
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white/90 text-neutral-800 hover:border-neutral-500 hover:bg-white"
            }`}
          >
            <Move3d className="h-3.5 w-3.5" />
            {explore ? t("cfg.exploreDone") : t("cfg.explore")}
          </button>
          {(["top", "side", "bottom"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => apiRef.current?.setViewPreset(v)}
              aria-label={t(`cfg.view.${v}`)}
              title={t(`cfg.view.${v}`)}
              className="rounded-full border border-neutral-300 bg-white/90 px-3 py-2 text-[10px] uppercase tracking-[2px] text-neutral-800 backdrop-blur-sm hover:border-neutral-500 hover:bg-white cursor-pointer shadow-sm"
            >
              {t(`cfg.view.${v}`)}
            </button>
          ))}
          {explore && (
            <button
              type="button"
              onClick={() => apiRef.current?.resetView()}
              aria-label={t("cfg.reset")}
              className="rounded-full border border-neutral-300 bg-white/90 p-2 text-neutral-800 backdrop-blur-sm hover:bg-white hover:border-neutral-500 cursor-pointer shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      {picking && ready && (
        <p className="pointer-events-none absolute top-11 inset-x-0 text-center text-[10px] text-neutral-700 font-medium">
          {t("cfg.pickHint")}
        </p>
      )}
      {explore && (
        <p className="pointer-events-none absolute bottom-14 inset-x-0 text-center text-[10px] text-neutral-600 bg-white/60 py-0.5 max-w-xs mx-auto rounded-full backdrop-blur-sm shadow-xs">
          {t("cfg.exploreHint")}
        </p>
      )}
    </div>
  );
}
