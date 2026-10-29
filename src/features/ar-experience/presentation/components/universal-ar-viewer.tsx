"use client";

import Link from "next/link";
import { Camera, CheckCircle2, LoaderCircle, RotateCcw, ScanLine, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BackLink } from "@/components/atoms/back-link";
import { Button } from "@/components/atoms/button";
import type { ArOverlay } from "@/features/ar-experience/domain/ar-experience";
import { useArExperience } from "@/features/ar-experience/presentation/hooks/use-ar-experience";
import { compileMindTargetImages } from "@/features/artwork/presentation/lib/compile-mind-target";
import { collectArtwork, getCurrentCollectionUser } from "@/features/collection/infrastructure/supabase/collection-repository";

type ScannerArtwork = {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  ownerId: string | null;
  targetImageUrl: string;
  overlay: ArOverlay;
};

type CollectionNote = "saved" | "sign-in" | "own" | "error" | null;

export function UniversalArViewer({ artworks }: { artworks: ScannerArtwork[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef(new Set<string>());
  const activeArtworkRef = useRef<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [targetBundle, setTargetBundle] = useState<string | null>(null);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [matched, setMatched] = useState<ScannerArtwork | null>(null);
  const [collectionNote, setCollectionNote] = useState<CollectionNote>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!artworks.length) return;
    let active = true;
    let objectUrl: string | null = null;

    void compileMindTargetImages(artworks.map((artwork) => artwork.targetImageUrl), (progress) => {
      if (active) setCompileProgress(progress);
    }).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      if (active) setTargetBundle(objectUrl);
      else URL.revokeObjectURL(objectUrl);
    }).catch((cause: unknown) => {
      if (active) setCompileError(cause instanceof Error ? cause.message : "Unable to prepare artwork targets.");
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [artworks, attempt]);

  const onRecognized = useCallback((index: number) => {
    const artwork = artworks[index];
    if (!artwork) return;

    activeArtworkRef.current = artwork.id;
    setMatched(artwork);
    setCollectionError(null);
    setCollectionNote(null);

    // Only genuine MindAR targetFound events reach this callback.
    if (savedRef.current.has(artwork.id)) {
      setCollectionNote("saved");
      return;
    }
    savedRef.current.add(artwork.id);

    void getCurrentCollectionUser().then(async (user) => {
      if (!user) return "sign-in" as const;
      if (artwork.ownerId && artwork.ownerId === user.id) return "own" as const;
      const result = await collectArtwork(artwork.id);
      return result.collected ? "saved" as const : "sign-in" as const;
    }).then((note) => {
      if (note !== "saved") savedRef.current.delete(artwork.id);
      if (activeArtworkRef.current === artwork.id) setCollectionNote(note);
    }).catch((cause: unknown) => {
      savedRef.current.delete(artwork.id);
      if (activeArtworkRef.current !== artwork.id) return;
      setCollectionNote("error");
      setCollectionError(cause instanceof Error ? cause.message : "Could not save the artwork to Collection.");
    });
  }, [artworks]);

  const config = useMemo(() => ({
    targetUrl: targetBundle ?? "",
    targets: artworks.map((artwork, index) => ({ index, overlay: artwork.overlay })),
  }), [artworks, targetBundle]);

  const {
    status, error, cameraPermissionIssue, start, stop,
  } = useArExperience(config, onRecognized);

  const startScanner = () => {
    const container = containerRef.current;
    if (targetBundle && container) void start(container);
  };

  const retryPreparation = () => {
    setCompileProgress(0);
    setCompileError(null);
    setTargetBundle(null);
    setAttempt((value) => value + 1);
  };

  return (
    <main className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#050507] text-white">
      <div ref={containerRef} className="absolute inset-0 isolate overflow-hidden bg-black [&>video]:!max-w-none [&>video]:!max-h-none [&>video]:!z-0 [&>video]:!opacity-100 [&>video]:!visible [&>canvas]:!z-[1] [&>canvas]:pointer-events-none [&>div]:!z-[2] [&>div]:pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_32%,rgba(0,0,0,0.45))]" />

      <div className="absolute inset-x-5 top-[max(1.25rem,env(safe-area-inset-top))] z-30 flex items-start justify-between gap-4 sm:inset-x-8">
        <BackLink href="/" label="Gallery" className="rounded-[4px] bg-black/45 px-3 py-2 text-white/75 backdrop-blur-md hover:text-white" />
        <span className="rounded-[4px] bg-black/40 px-3 py-2 text-[0.64rem] uppercase tracking-[0.14em] text-white/70 backdrop-blur-md">
          {status === "scanning" ? "Looking for artwork" : status === "found" ? "Artwork recognized" : "Everie AR"}
        </span>
      </div>

      {status === "scanning" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden="true">
          <div className="h-48 w-48 rounded-[16px] border border-white/25 sm:h-64 sm:w-64" />
        </div>
      )}

      {(status === "idle" || status === "error") && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050507]/90 px-6 text-center backdrop-blur-sm">
          <div className="mx-auto w-full max-w-md">
            <ScanLine className="mx-auto size-9 text-violet-200/75" aria-hidden="true" />
            <h1 className="mt-7 font-serif text-5xl leading-none tracking-[-0.05em] sm:text-6xl">Scan the art.</h1>
            <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-white/52">
              Point your camera at a work on display. Everie recognizes the artwork and brings its AR layer to life.
            </p>

            {artworks.length === 0 ? (
              <p className="mt-8 text-sm text-white/50">There are no published artworks available to scan yet.</p>
            ) : compileError ? (
              <div className="mt-8 space-y-4">
                <p role="alert" className="text-sm leading-6 text-rose-200/85">{compileError}</p>
                <Button type="button" onClick={retryPreparation} className="h-12 bg-white px-6 text-black">
                  <RotateCcw className="size-4" /> Retry preparation
                </Button>
              </div>
            ) : (
              <>
                <p className="mt-7 text-xs text-white/36">
                  {artworks.length} {artworks.length === 1 ? "artwork" : "artworks"} ready for discovery
                </p>
                <Button
                  type="button"
                  disabled={!targetBundle}
                  onClick={startScanner}
                  className="mt-6 h-12 rounded-[5px] bg-white px-7 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-violet-100 disabled:bg-white/10 disabled:text-white/40"
                >
                  {!targetBundle ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
                  {!targetBundle ? `Preparing targets · ${compileProgress}%` : "Open camera"}
                </Button>
              </>
            )}

            {status === "error" && error && (
              <div role="alert" className="mt-6 text-sm leading-6 text-amber-100/80">
                <TriangleAlert className="mx-auto mb-2 size-5" />
                {error}
                {cameraPermissionIssue ? (
                  <p className="mt-3 text-xs text-white/50">On iPhone, open this page directly in Safari and allow Camera in Website Settings.</p>
                ) : null}
              </div>
            )}
            <p className="mt-8 text-xs leading-5 text-white/32">
              Camera access requires your permission. Recognition, not opening the camera, unlocks a Collection entry.
            </p>
          </div>
        </div>
      )}

      {status === "starting" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/65">
          <LoaderCircle className="size-8 animate-spin text-violet-200" aria-label="Starting AR camera" />
        </div>
      )}

      {matched && status !== "error" && (
        <div role="status" aria-live="polite" className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-md rounded-[7px] bg-[#08080c]/90 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/10 backdrop-blur-xl sm:p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-cyan-100" />
            <div className="min-w-0 flex-1">
              <p className="font-serif text-2xl leading-none">{matched.title}</p>
              <p className="mt-1 text-xs text-white/45">by {matched.artistName}</p>
              <p className="mt-3 text-xs leading-5 text-white/60">
                {collectionNote === "saved" ? "Recognized and saved to your Collection." :
                  collectionNote === "own" ? "Your artwork is recognized." :
                  collectionNote === "sign-in" ? "Recognized. Sign in to save it to your Collection." :
                  collectionNote === "error" ? collectionError :
                  "Artwork recognized. Checking Collection…"}
              </p>
              <div className="mt-4 flex flex-wrap gap-5 text-xs font-medium">
                <Link href={`/art/${matched.slug}`} className="text-white/80 underline underline-offset-4">View work</Link>
                {collectionNote === "sign-in" ? (
                  <Link href="/login?next=%2Far" className="text-cyan-100 underline underline-offset-4">Sign in</Link>
                ) : collectionNote === "saved" ? (
                  <Link href="/collection" className="text-cyan-100 underline underline-offset-4">Collection</Link>
                ) : null}
                <button type="button" onClick={() => { setMatched(null); setCollectionNote(null); void stop(); }} className="text-white/45 underline underline-offset-4 hover:text-white">Close camera</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}