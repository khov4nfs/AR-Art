"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, Settings, TriangleAlert, X } from "lucide-react";

import { BackLink } from "@/components/atoms/back-link";
import { Button } from "@/components/atoms/button";
import type { SingleArExperienceConfig } from "@/features/ar-experience/domain/ar-experience";
import { useArExperience } from "@/features/ar-experience/presentation/hooks/use-ar-experience";
import {
  collectArtwork,
  getCurrentCollectionUser,
} from "@/features/collection/infrastructure/supabase/collection-repository";

interface ArViewerProps {
  config: SingleArExperienceConfig;
  backHref?: string;
  artwork?: {
    id: string;
    slug: string;
    title: string;
    artistName: string;
    ownerId: string | null;
  };
}

export function ArViewer({
  config,
  backHref = "/",
  artwork,
}: ArViewerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const autoStartedRef = useRef(false);
  const collectionSavedRef = useRef(false);
  const viewerUserIdRef = useRef<string | null>(null);
  const [collectionSaved, setCollectionSaved] = useState(false);
  const [collectionSaveError, setCollectionSaveError] = useState<string | null>(null);

  const stableConfig = useMemo(
    () => ({
      targetUrl: config.targetUrl,
      targetIndex: config.targetIndex,
      overlay: config.overlay,
    }),
    [config.overlay, config.targetIndex, config.targetUrl],
  );

  const {
    status,
    error,
    cameraPermissionIssue,
    start,
    stop,
    dismissCameraPermissionHelp,
  } = useArExperience(stableConfig);

  useEffect(() => {
    if (autoStartedRef.current) return;

    let active = true;

    async function beginAr() {
      if (artwork) {
        const user = await getCurrentCollectionUser();
        if (!active) return;

        if (!user) {
          const nextPath = `${window.location.pathname}${window.location.search}`;
          router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
          return;
        }

        viewerUserIdRef.current = user.id;
      }

      const arContainer = containerRef.current;
      if (!active || !arContainer) return;

      autoStartedRef.current = true;
      await start(arContainer);
    }

    void beginAr();

    return () => {
      active = false;
      void stop();
    };
  }, [artwork, router, start, stop]);

  useEffect(() => {
    if (
      status !== "found" ||
      !artwork?.id ||
      (artwork.ownerId && artwork.ownerId === viewerUserIdRef.current) ||
      collectionSavedRef.current
    ) {
      return;
    }

    collectionSavedRef.current = true;
    setCollectionSaveError(null);

    void collectArtwork(artwork.id)
      .then((result) => {
        if (result.collected) setCollectionSaved(true);
      })
      .catch((cause) => {
        collectionSavedRef.current = false;
        setCollectionSaveError(
          cause instanceof Error
            ? cause.message
            : "Đã nhận diện sản phẩm nhưng chưa thể lưu vào Collection.",
        );
      });
  }, [artwork?.id, artwork?.ownerId, status]);

  const retry = () => {
    const container = containerRef.current;
    if (container) void start(container);
  };

  return (
    <main className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-black text-white">
      <div
        ref={containerRef}
        className="absolute inset-0 isolate overflow-hidden bg-black [&>video]:!max-w-none [&>video]:!max-h-none [&>video]:!z-0 [&>video]:!opacity-100 [&>video]:!visible [&>canvas]:!z-[1] [&>canvas]:pointer-events-none [&>div]:!z-[2] [&>div]:pointer-events-none"
      />

      <div className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-30 rounded-sm bg-black/28 px-3 py-2 backdrop-blur-md sm:left-6">
        <BackLink href={backHref} label={artwork ? "Work" : "Gallery"} className="text-white/64 hover:text-white" />
      </div>

      {cameraPermissionIssue && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="camera-permission-title"
            className="w-full max-w-md border border-white/12 bg-[#09090d]/96 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center border border-amber-300/20 bg-amber-300/10 text-amber-200">
                <Settings className="size-5" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={dismissCameraPermissionHelp}
                className="flex size-10 shrink-0 items-center justify-center border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close camera permission help"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-amber-200/70">
                iPhone Safari
              </p>
              <h2
                id="camera-permission-title"
                className="mt-2 text-xl font-semibold tracking-tight"
              >
                Camera permission is required
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {cameraPermissionIssue === "timeout"
                  ? "Safari did not show the camera permission prompt."
                  : "Safari has blocked camera access for this website."}
              </p>
            </div>

            <div className="mt-5 border border-white/10 bg-white/[0.04] p-4">
              <ol className="space-y-3 text-sm leading-5 text-white/75">
                <li>1. Tap <strong className="font-medium text-white">aA → Website Settings</strong>.</li>
                <li>2. Set <strong className="font-medium text-white">Camera → Allow</strong>.</li>
                <li>3. Return here and tap <strong className="font-medium text-white">Try again</strong>.</li>
              </ol>
            </div>

            <p className="mt-4 text-xs leading-5 text-white/40">
              If the link opened inside Messenger, Zalo, Facebook, or another in-app browser, open it directly in Safari.
            </p>

            <Button
              type="button"
              className="mt-5 w-full rounded-none bg-white text-black hover:bg-violet-100"
              onClick={retry}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        </div>
      )}

      {status === "error" && !cameraPermissionIssue && error && (
        <div className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-start gap-3 border border-white/12 bg-black/75 p-4 backdrop-blur-xl">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Camera could not start</p>
            <p className="mt-1 text-xs leading-5 text-white/60">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-3 text-xs font-medium text-white underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {collectionSaveError && (
        <div className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md border border-amber-300/15 bg-black/75 px-4 py-3 text-xs leading-5 text-amber-100/75 backdrop-blur-xl">
          {collectionSaveError}
        </div>
      )}

      {collectionSaved && !collectionSaveError && (
        <div className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 border border-cyan-100/18 bg-black/78 p-4 backdrop-blur-xl">
          <CheckCircle2 className="size-5 shrink-0 text-cyan-100" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">Artwork unlocked</p>
            <p className="mt-0.5 text-xs text-white/48">Added to your collection.</p>
          </div>
          <Link
            href="/collection"
            className="shrink-0 text-xs font-medium text-white underline underline-offset-4"
          >
            View collection
          </Link>
        </div>
      )}
    </main>
  );
}