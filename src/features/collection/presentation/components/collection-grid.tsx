"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, LoaderCircle, LogOut, ScanLine, Trash2 } from "lucide-react";

import { AmbientDivider } from "@/components/atoms/ambient-divider";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  getCurrentCollectionUser,
  listCollectedArtworkIds,
  removeCollectedArtwork,
} from "@/features/collection/infrastructure/local/collection-repository";

interface CollectionGridProps {
  artworks: PublishedArtwork[];
}

export function CollectionGrid({ artworks }: CollectionGridProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [collectedArtworkIds, setCollectedArtworkIds] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCollection() {
      try {
        const user = await getCurrentCollectionUser();
        if (!active) return;

        if (!user) {
          setUserEmail(null);
          setCollectedArtworkIds([]);
          return;
        }

        setUserEmail(user.email ?? "Everie account");
        const artworkIds = await listCollectedArtworkIds();
        if (active) setCollectedArtworkIds(artworkIds);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "ar.collection.loadError");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCollection();
    return () => {
      active = false;
    };
  }, []);

  const artworkById = useMemo(
    () => new Map(artworks.map((artwork) => [artwork.id, artwork])),
    [artworks],
  );
  const collectedArtworks = collectedArtworkIds
    .map((id) => artworkById.get(id))
    .filter((artwork): artwork is PublishedArtwork => Boolean(artwork));

  async function signOut() {
    await logout();
    router.replace("/login?next=%2Fcollection");
    router.refresh();
  }

  async function removeArtwork(artworkId: string) {
    setRemovingId(artworkId);
    setError(null);
    try {
      await removeCollectedArtwork(artworkId);
      setCollectedArtworkIds((current) => current.filter((id) => id !== artworkId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ar.collection.removeError");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-10 text-xs uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
        {t("ar.collection.loading")}
      </div>
    );
  }

  if (!userEmail) {
    return (
      <section className="min-h-[28rem] py-14">
        <div className="max-w-2xl">
          <ScanLine className="size-5 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
          <h2 className="mt-6 font-serif text-5xl leading-[0.95] tracking-[-0.045em] sm:text-6xl">
            {t("ar.collection.signInTitle")}<br /><span className="text-[#94734C] dark:text-[#C5A880] italic">{t("ar.collection.signInEmphasis")}</span>
          </h2>
          <Link
            href="/login?next=%2Fcollection"
            className="mt-9 inline-flex items-center gap-3 rounded-[4px] bg-neutral-900 px-6 py-4 text-xs font-medium uppercase tracking-[0.14em] text-white transition hover:bg-[#8C6D46]"
          >
            {t("ar.common.signIn")} <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[5px] bg-neutral-100 dark:bg-neutral-900 px-4 py-4">
        <div className="flex items-baseline gap-4">
          <span className="text-[0.62rem] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">{t("ar.collection.signedIn")}</span>
          <span className="text-sm text-neutral-600 dark:text-neutral-300">{userEmail}</span>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400 transition hover:text-neutral-900 dark:hover:text-white"
        >
          <LogOut className="size-3.5" /> {t("ar.common.signOut")}
        </button>
      </div>

      <AmbientDivider compact className="mb-7" />

      {error ? (
        <div className="mb-8 rounded-[5px] bg-rose-300/[0.035] px-4 py-3 text-sm text-rose-200/80">{error.startsWith("ar.") ? t(error) : error}</div>
      ) : null}

      {collectedArtworks.length > 0 ? (
        <div className="grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {collectedArtworks.map((artwork, index) => (
            <article key={artwork.id} className={index % 3 === 1 ? "lg:mt-12" : ""}>
              <Link href={`/art/${artwork.slug}`} className="group block">
                <div className="relative overflow-hidden rounded-[5px] bg-[#0a0a0d] ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artwork.targetImageUrl}
                    alt={artwork.title}
                    className="aspect-[4/5] w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.02] group-hover:opacity-100"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-950/20 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                  <div className="absolute left-4 top-4 text-[0.62rem] tabular-nums tracking-[0.14em] text-white">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto] gap-5 pt-1">
                  <div>
                    <h2 className="font-serif text-2xl leading-none text-neutral-900 dark:text-white">{artwork.title}</h2>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">{artwork.artistName}</p>
                  </div>
                  <ArrowUpRight className="mt-1 size-4 text-neutral-500 dark:text-neutral-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#94734C] dark:text-[#C5A880]" />
                </div>
              </Link>

              <button
                type="button"
                disabled={removingId === artwork.id}
                onClick={() => void removeArtwork(artwork.id)}
                className="mt-4 inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.13em] text-neutral-500 dark:text-neutral-400 transition hover:text-rose-200 disabled:cursor-wait disabled:opacity-50"
              >
                {removingId === artwork.id ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                {t(removingId === artwork.id ? "ar.collection.removing" : "ar.collection.remove")}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <section className="flex min-h-[24rem] flex-col items-center justify-center px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
            <ScanLine className="size-6" />
          </div>
          <h2 className="mt-6 font-serif text-4xl tracking-[-0.035em]">{t("ar.collection.empty")}</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {t("ar.collection.emptyDesc")}
          </p>
        </section>
      )}
    </div>
  );
}