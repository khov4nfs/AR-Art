import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ScanLine } from "lucide-react";

import { StorefrontPageFrame } from "@/components/hanoia/StorefrontPageFrame";
import { ArText } from "@/components/everie-ar/ar-text";
import type { GalleryArtwork } from "@/features/gallery/domain/gallery-artwork";
import { GalleryExplorer } from "@/features/gallery/presentation/components/gallery-explorer";
import { readArData } from "@/features/artwork/infrastructure/local/ar-data";
import { arPublicMediaUrl } from "@/features/artwork/infrastructure/local/ar-media-path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AR Gallery — EVERIE",
  description: "Discover the latest and most-viewed AR products from EVERIE.",
};

async function loadGalleryArtworks(): Promise<GalleryArtwork[]> {
  const data = await readArData();
  return data.artworks.filter(artwork => artwork.status === "published").map(artwork => ({
    id: artwork.id,
    slug: artwork.slug,
    title: artwork.title,
    artistName: artwork.artistName,
    description: artwork.description,
    imageUrl: arPublicMediaUrl(artwork.targetImagePath),
    publishedAt: artwork.publishedAt ?? artwork.createdAt,
    viewCount: Math.max(0, Number(artwork.viewCount ?? 0)),
  }));
}

export default async function GalleryPage() {
  const artworks = await loadGalleryArtworks();
  const artists = new Set(artworks.map((artwork) => artwork.artistName).filter(Boolean)).size;

  return (
    <StorefrontPageFrame mainClassName="bg-[#FAFAF8] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <section className="border-b border-neutral-200 bg-[#F5F2EC] dark:border-neutral-800 dark:bg-[#191919]">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#94734C] dark:text-[#C5A880]">EVERIE / AR</p>
            <h1 className="mt-4 font-serif text-5xl font-normal tracking-tight md:text-7xl">
              <ArText id="ar.gallery.heading" /> <span className="italic text-[#94734C] dark:text-[#C5A880]">AR.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
              <ArText id="ar.gallery.subtitle" />
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/ar" className="inline-flex min-h-11 items-center gap-2 bg-[#171717] px-5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#8C6D46] dark:bg-[#C5A880] dark:text-black">
                <ScanLine className="size-4" aria-hidden="true" /> <ArText id="ar.gallery.openCamera" />
              </Link>
              <Link href="/create" className="inline-flex min-h-11 items-center gap-2 border border-[#94734C] px-5 text-xs font-semibold uppercase tracking-wide text-[#80603C] transition hover:bg-[#E8DFD1] dark:border-[#C5A880] dark:text-[#C5A880] dark:hover:bg-neutral-800">
                <ArText id="ar.gallery.publish" /> <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="flex gap-8 border-t border-neutral-300 pt-5 dark:border-neutral-700 lg:border-t-0 lg:pt-0">
            <div><p className="text-[11px] uppercase tracking-wide text-neutral-500"><ArText id="ar.gallery.artworks" /></p><p className="mt-1 font-serif text-4xl">{artworks.length}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-neutral-500"><ArText id="ar.gallery.artists" /></p><p className="mt-1 font-serif text-4xl">{artists}</p></div>
          </div>
        </div>
      </section>
      <GalleryExplorer artworks={artworks} />
    </StorefrontPageFrame>
  );
}
