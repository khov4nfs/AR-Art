"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock3, Eye, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

import {
  newestGalleryArtworks,
  showNewestGallerySection,
  sortGalleryArtworks,
  type GalleryArtwork,
  type GallerySort,
} from "@/features/gallery/domain/gallery-artwork";

const FILTERS: { key: GallerySort; label: string }[] = [
  { key: "all", label: "ar.gallery.filterAll" },
  { key: "newest", label: "ar.gallery.filterNewest" },
  { key: "views", label: "ar.gallery.filterViews" },
];

function ArtworkCard({
  artwork,
  rank,
  featured = false,
}: {
  artwork: GalleryArtwork;
  rank: number;
  featured?: boolean;
}) {
  const { t, language } = useLanguage();
  return (
    <Link
      href={`/art/${artwork.slug}`}
      className="group block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C5A880]"
      aria-label={t("ar.gallery.viewBy", { title: artwork.title, artist: artwork.artistName })}
    >
      <div className={`relative overflow-hidden border border-neutral-200 bg-white transition duration-500 group-hover:border-[#C5A880] dark:border-neutral-800 dark:bg-[#171719] ${featured ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.035]"
        />
        <span className="pointer-events-none absolute left-4 top-4 rounded-[3px] bg-black/70 px-2.5 py-1.5 text-[0.58rem] tracking-[0.16em] text-white backdrop-blur-md">
          {String(rank).padStart(2, "0")}
        </span>
        <span className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full bg-[#C5A880] text-black opacity-0 backdrop-blur-md transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-[1.65rem] leading-none tracking-[-0.025em] text-neutral-900 sm:text-[1.85rem] dark:text-white">
            {artwork.title}
          </h3>
          <p className="mt-2 truncate text-[0.62rem] uppercase tracking-[0.17em] text-neutral-500 dark:text-neutral-400">
            {artwork.artistName}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[0.66rem] tabular-nums text-neutral-500 dark:text-neutral-400" aria-label={t("ar.gallery.views", { count: artwork.viewCount })}>
          <Eye className="size-3.5" aria-hidden="true" />
          {new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(artwork.viewCount)}
        </span>
      </div>
    </Link>
  );
}

export function GalleryExplorer({ artworks }: { artworks: GalleryArtwork[] }) {
  const [filter, setFilter] = useState<GallerySort>("all");
  const { t } = useLanguage();
  const newest = useMemo(() => newestGalleryArtworks(artworks, 4), [artworks]);
  const listed = useMemo(
    () => sortGalleryArtworks(artworks, filter === "newest" ? "newest" : "views"),
    [artworks, filter],
  );
  const showNewest = showNewestGallerySection(filter);

  return (
    <>
      {showNewest && (
        <section aria-labelledby="gallery-newest" className="relative border-b border-neutral-200 dark:border-neutral-800">
          <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-8 md:py-16">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.26em] text-[#94734C] dark:text-[#C5A880]">{t("ar.gallery.newShelf")}</p>
                <h2 id="gallery-newest" className="mt-3 font-serif text-3xl tracking-tight md:text-5xl">
                  {t("ar.gallery.newHeading")}<span className="text-[#C5A880]">.</span>
                </h2>
              </div>
              <p className="max-w-[15rem] text-sm leading-6 text-neutral-500 dark:text-neutral-400">{t("ar.gallery.newDesc")}</p>
            </div>
            {newest.length ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
                {newest.map((artwork, index) => <ArtworkCard key={artwork.id} artwork={artwork} rank={index + 1} featured />)}
              </div>
            ) : (
              <p className="border-t border-neutral-200 py-12 text-sm text-neutral-500 dark:border-neutral-800">{t("ar.gallery.newEmpty")}</p>
            )}
          </div>
        </section>
      )}

      <section id="all-works" aria-labelledby="gallery-all-heading" className="mx-auto max-w-[1440px] px-4 pb-20 pt-12 md:px-8 md:pt-16">
        <div className="flex flex-col justify-between gap-7 border-b border-neutral-200 pb-7 dark:border-neutral-800 lg:flex-row lg:items-end">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.26em] text-[#94734C] dark:text-[#C5A880]">
              {t(showNewest ? "ar.gallery.allShelfSecond" : "ar.gallery.allShelfFirst")}
            </p>
            <h2 id="gallery-all-heading" className="mt-3 font-serif text-3xl tracking-tight md:text-5xl">
              {t(filter === "newest" ? "ar.gallery.latest" : "ar.gallery.mostViewed")}<span className="text-[#C5A880]">.</span>
            </h2>
            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              {t("ar.common.countWork", { count: listed.length })} · {t(filter === "newest" ? "ar.gallery.sortNewest" : "ar.gallery.sortViews")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label={t("ar.gallery.sortLabel")}>
            <SlidersHorizontal className="mr-2 size-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={`rounded-[4px] border px-4 py-3 text-[0.65rem] uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A880] ${
                  filter === key
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-[#C5A880] dark:bg-[#C5A880] dark:text-black"
                    : "border-neutral-300 text-neutral-600 hover:border-[#C5A880] dark:border-neutral-700 dark:text-neutral-300"
                }`}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        {listed.length ? (
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
            {listed.map((artwork, index) => (
              <ArtworkCard key={artwork.id} artwork={artwork} rank={index + 1} />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex min-h-60 flex-col items-start justify-center border border-dashed border-neutral-300 px-7 py-12 dark:border-neutral-700">
            <Clock3 className="size-7 text-[#C5A880]/55" aria-hidden="true" />
            <p className="mt-5 font-serif text-3xl">{t("ar.gallery.emptyTitle")}</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">{t("ar.gallery.emptyDesc")}</p>
            <Link href="/create" className="mt-6 inline-flex items-center gap-2 border-b border-[#94734C] pb-2 text-xs uppercase tracking-[0.14em] text-[#80603C] dark:text-[#C5A880]">
              {t("ar.gallery.publish")} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
