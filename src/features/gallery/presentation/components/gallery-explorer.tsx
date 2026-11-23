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
      <div className={`relative overflow-hidden border border-white/10 bg-[#111116] transition duration-500 group-hover:border-white/30 ${featured ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.035]"
        />
        <span className="pointer-events-none absolute left-4 top-4 rounded-[3px] border border-white/15 bg-black/65 px-2.5 py-1.5 text-[0.58rem] tracking-[0.16em] text-white/75 backdrop-blur-md">
          {String(rank).padStart(2, "0")}
        </span>
        <span className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full border border-white/30 bg-[#08080c]/70 text-white opacity-0 backdrop-blur-md transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4 border-t border-white/15 pt-3">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-[1.65rem] leading-none tracking-[-0.025em] text-white sm:text-[1.85rem]">
            {artwork.title}
          </h3>
          <p className="mt-2 truncate text-[0.62rem] uppercase tracking-[0.17em] text-white/40">
            {artwork.artistName}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[0.66rem] tabular-nums text-white/45" aria-label={t("ar.gallery.views", { count: artwork.viewCount })}>
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
        <section aria-labelledby="gallery-newest" className="relative border-b border-white/10 bg-[#08080c]/70">
          <div className="mx-auto max-w-[94rem] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.26em] text-[#C5A880]/65">{t("ar.gallery.newShelf")}</p>
                <h2 id="gallery-newest" className="mt-3 font-serif text-5xl tracking-[-0.055em] sm:text-7xl">
                  {t("ar.gallery.newHeading")}<span className="text-[#C5A880]">.</span>
                </h2>
              </div>
              <p className="max-w-[15rem] text-sm leading-6 text-white/43">{t("ar.gallery.newDesc")}</p>
            </div>
            {newest.length ? (
              <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {newest.map((artwork, index) => <ArtworkCard key={artwork.id} artwork={artwork} rank={index + 1} featured />)}
              </div>
            ) : (
              <p className="border-t border-white/10 py-12 text-sm text-white/50">{t("ar.gallery.newEmpty")}</p>
            )}
          </div>
        </section>
      )}

      <section id="all-works" aria-labelledby="gallery-all-heading" className="mx-auto max-w-[94rem] px-5 pb-24 pt-16 sm:px-8 lg:px-12 lg:pb-32 lg:pt-24">
        <div className="flex flex-col justify-between gap-7 border-b border-white/15 pb-7 lg:flex-row lg:items-end">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.26em] text-[#C5A880]/65">
              {t(showNewest ? "ar.gallery.allShelfSecond" : "ar.gallery.allShelfFirst")}
            </p>
            <h2 id="gallery-all-heading" className="mt-3 font-serif text-5xl tracking-[-0.055em] sm:text-7xl">
              {t(filter === "newest" ? "ar.gallery.latest" : "ar.gallery.mostViewed")}<span className="text-[#C5A880]">.</span>
            </h2>
            <p className="mt-4 text-sm text-white/42">
              {t("ar.common.countWork", { count: listed.length })} · {t(filter === "newest" ? "ar.gallery.sortNewest" : "ar.gallery.sortViews")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label={t("ar.gallery.sortLabel")}>
            <SlidersHorizontal className="mr-2 size-4 text-white/45" aria-hidden="true" />
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={`rounded-[4px] border px-4 py-3 text-[0.65rem] uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A880] ${
                  filter === key
                    ? "border-white bg-white text-[#08080c]"
                    : "border-white/15 bg-white/[0.025] text-white/55 hover:border-white/35 hover:text-white"
                }`}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        {listed.length ? (
          <div className="mt-9 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listed.map((artwork, index) => (
              <ArtworkCard key={artwork.id} artwork={artwork} rank={index + 1} />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex min-h-60 flex-col items-start justify-center border border-dashed border-white/15 px-7 py-12">
            <Clock3 className="size-7 text-[#C5A880]/55" aria-hidden="true" />
            <p className="mt-5 font-serif text-3xl">{t("ar.gallery.emptyTitle")}</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">{t("ar.gallery.emptyDesc")}</p>
            <Link href="/create" className="mt-6 inline-flex items-center gap-2 border-b border-white/50 pb-2 text-xs uppercase tracking-[0.14em] text-white/80">
              {t("ar.gallery.publish")} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
