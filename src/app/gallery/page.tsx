import type { Metadata } from "next";
import Link from "next/link";

import { EverieArHeader } from "@/components/everie-ar/everie-ar-header";
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
    <div className="min-h-screen bg-[#0C0C0E] text-white">
      <EverieArHeader active="gallery" />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-[#141314]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_73%_38%,rgba(197,168,128,0.12),transparent_50%)]" />
          <div className="relative mx-auto grid max-w-[1440px] gap-12 px-5 py-20 md:px-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end lg:py-28">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#C5A880]">EVERIE</p>
              <h1 className="mt-7 font-serif text-[clamp(4.2rem,10vw,9rem)] font-normal leading-[0.9] tracking-[-0.06em]">
                <ArText id="ar.gallery.heading" /> <span className="italic text-[#C5A880]">AR.</span>
              </h1>
              <p className="mt-7 max-w-xl text-sm leading-8 text-stone-400 md:text-base">
                <ArText id="ar.gallery.subtitle" />
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/ar" className="inline-flex h-12 items-center bg-[#C5A880] px-6 text-xs font-semibold uppercase tracking-widest text-[#111113] transition hover:bg-[#E3C89D]"><ArText id="ar.gallery.openCamera" /></Link>
                <Link href="/create" className="inline-flex h-12 items-center border border-white/25 px-6 text-xs uppercase tracking-widest text-white transition hover:border-[#C5A880]"><ArText id="ar.gallery.publish" /></Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 border-t border-white/20 pt-6 lg:pb-2">
              <div><p className="text-[10px] uppercase tracking-widest text-stone-500"><ArText id="ar.gallery.artworks" /></p><p className="mt-3 font-serif text-6xl">{artworks.length}</p></div>
              <div><p className="text-[10px] uppercase tracking-widest text-stone-500"><ArText id="ar.gallery.artists" /></p><p className="mt-3 font-serif text-6xl">{artists}</p></div>
            </div>
          </div>
        </section>
        <GalleryExplorer artworks={artworks} />
      </main>
      <footer className="border-t border-white/10 px-5 py-8 text-[11px] uppercase tracking-widest text-stone-500 md:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-4"><span>© EVERIE</span><Link href="/" className="hover:text-[#C5A880]"><ArText id="ar.gallery.backShop" /></Link></div>
      </footer>
    </div>
  );
}
