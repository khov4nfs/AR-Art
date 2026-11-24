"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, RotateCcw, Settings, TriangleAlert, X } from "lucide-react";

import { BackLink } from "@/components/atoms/back-link";
import { ArLanguageSwitcher } from "@/components/everie-ar/ar-language-switcher";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/atoms/button";
import type { SingleArExperienceConfig } from "@/features/ar-experience/domain/ar-experience";
import { useArExperience } from "@/features/ar-experience/presentation/hooks/use-ar-experience";
import {
  collectArtwork,
  getCurrentCollectionUser,
} from "@/features/collection/infrastructure/local/collection-repository";

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
  const { t, language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const autoStartedRef = useRef(false);
  const collectionSavedRef = useRef(false);
  const [collectionSaved, setCollectionSaved] = useState(false);
  const [collectionSignInRequired, setCollectionSignInRequired] = useState(false);
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

  // Viewing a published AR work is public. Signing in is only required for
  // mutations such as saving a recognized work to the EVERIE Collection.
  useEffect(() => {
    if (autoStartedRef.current) return;
    const arContainer = containerRef.current;
    if (!arContainer) return;

    autoStartedRef.current = true;
    void start(arContainer);
    return () => {
      void stop();
    };
  }, [start, stop]);

  useEffect(() => {
    if (status !== "found" || !artwork?.id || collectionSavedRef.current) return;

    collectionSavedRef.current = true;

    void getCurrentCollectionUser()
      .then(async (user) => {
        if (!user) {
          setCollectionSignInRequired(true);
          return;
        }
        if (artwork.ownerId && artwork.ownerId === user.id) return;

        const result = await collectArtwork(artwork.id);
        if (result.collected) {
          setCollectionSignInRequired(false);
          setCollectionSaveError(null);
          setCollectionSaved(true);
        } else if (result.reason === "unauthenticated") {
          setCollectionSignInRequired(true);
        }
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
    <main className="ar-fullscreen-view fixed inset-0 h-[100dvh] w-full overflow-hidden bg-black text-white">
      <div
        ref={containerRef}
        className="absolute inset-0 isolate overflow-hidden bg-black [&>video]:!max-w-none [&>video]:!max-h-none [&>video]:!z-0 [&>video]:!opacity-100 [&>video]:!visible [&>canvas]:!z-[1] [&>canvas]:pointer-events-none [&>div]:!z-[2] [&>div]:pointer-events-none"
      />

      <div className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-30 rounded-sm bg-black/28 px-3 py-2 backdrop-blur-md sm:left-6">
        <BackLink href={backHref} label={t(artwork ? "ar.common.work" : "ar.common.gallery")} className="text-white/64 hover:text-white" />
      </div>

      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-30 sm:right-6"><ArLanguageSwitcher /></div>

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
                aria-label={t("ar.viewer.closePermission")}
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
                {t("ar.viewer.permissionTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {cameraPermissionIssue === "timeout"
                  ? t("ar.viewer.permissionTimeout")
                  : t("ar.viewer.permissionBlocked")}
              </p>
            </div>

            <div className="mt-5 border border-white/10 bg-white/[0.04] p-4">
              <ol className="space-y-3 text-sm leading-5 text-white/75">
                <li>{t("ar.viewer.step1")} <strong className="font-medium text-white">{t("ar.viewer.webSettings")}</strong>.</li>
                <li>{t("ar.viewer.step2")} <strong className="font-medium text-white">{t("ar.viewer.cameraAllow")}</strong>.</li>
                <li>{t("ar.viewer.step3")} <strong className="font-medium text-white">{t("ar.common.retry")}</strong>.</li>
              </ol>
            </div>

            <p className="mt-4 text-xs leading-5 text-white/40">
              {t("ar.viewer.inAppBrowser")}
            </p>

            <Button
              type="button"
              className="mt-5 w-full rounded-none bg-white text-black hover:bg-amber-100"
              onClick={retry}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              {t("ar.common.retry")}
            </Button>
          </div>
        </div>
      )}

      {status === "error" && !cameraPermissionIssue && error && (
        <div className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-start gap-3 border border-white/12 bg-black/75 p-4 backdrop-blur-xl">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t("ar.viewer.cameraError")}</p>
            <p className="mt-1 text-xs leading-5 text-white/60">{language === "vi" ? t("ar.viewer.cameraError") : error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-3 text-xs font-medium text-white underline underline-offset-4"
            >
              {t("ar.common.retry")}
            </button>
          </div>
        </div>
      )}

      {collectionSaveError && (
        <div className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md border border-amber-300/15 bg-black/75 px-4 py-3 text-xs leading-5 text-amber-100/75 backdrop-blur-xl">
          {language === "vi" ? t("ar.viewer.saveError") : collectionSaveError}
        </div>
      )}

      {collectionSignInRequired && artwork && !collectionSaved && (
        <div className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center justify-between gap-4 border border-amber-100/15 bg-black/85 p-4 backdrop-blur-xl">
          <p className="text-xs leading-5 text-white/70">
            {t("ar.viewer.signInMessage")}
          </p>
          <Link
            href={"/login?next=" + encodeURIComponent("/ar/" + artwork.slug)}
            className="shrink-0 text-xs font-medium text-amber-100 underline underline-offset-4"
          >
            {t("ar.viewer.signInEverie")}
          </Link>
        </div>
      )}

      {collectionSaved && !collectionSaveError && (
        <div className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 border border-amber-100/18 bg-black/78 p-4 backdrop-blur-xl">
          <CheckCircle2 className="size-5 shrink-0 text-amber-100" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">{t("ar.viewer.unlocked")}</p>
            <p className="mt-0.5 text-xs text-white/48">{t("ar.viewer.added")}</p>
          </div>
          <Link
            href="/collection"
            className="shrink-0 text-xs font-medium text-white underline underline-offset-4"
          >
            {t("ar.viewer.viewCollection")}
          </Link>
        </div>
      )}
    </main>
  );
}
