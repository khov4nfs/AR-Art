import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Eye, ScanLine } from "lucide-react";

import { EverieBrand } from "@/components/atoms/everie-brand";
import type { GalleryArtwork } from "@/features/gallery/domain/gallery-artwork";
import { GalleryExplorer } from "@/features/gallery/presentation/components/gallery-explorer";
import { getArtworkBucketName, getSupabaseServerClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery — Everie",
  description: "Explore the newest and most-viewed AR artworks published by artists in the Everie gallery.",
};

type GalleryRow = {
  id: string;
  slug: string;
  title: string;
  artist_name: string;
  description: string;
  target_image_path: string;
  published_at: string | null;
  created_at: string;
  view_count: number | null;
};

async function loadGalleryArtworks(): Promise<GalleryArtwork[]> {
  const client = getSupabaseServerClient();
  const bucket = getArtworkBucketName();
  const pageSize = 200;
  const rows: GalleryRow[] = [];

  // Paginate through all published artwork rather than the 10-item studio limit.
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from("artworks")
      .select("id,slug,title,artist_name,description,target_image_path,published_at,created_at,view_count")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(offset, offset + pageSize - 1)
      .returns<GalleryRow[]>();

    if (error) throw new Error(`Unable to load Gallery: ${error.message}`);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }

  return rows.map((artwork) => ({
    id: artwork.id,
    slug: artwork.slug,
    title: artwork.title,
    artistName: artwork.artist_name,
    description: artwork.description,
    imageUrl: client.storage.from(bucket).getPublicUrl(artwork.target_image_path).data.publicUrl,
    publishedAt: artwork.published_at ?? artwork.created_at,
    viewCount: Math.max(0, Number(artwork.view_count ?? 0)),
  }));
}

export default async function GalleryPage() {
  const artworks = await loadGalleryArtworks();
  const artists = new Set(artworks.map((artwork) => artwork.artistName)).size;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050507] text-white">
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_73%_38%,rgba(105,65,186,0.19),transparent_42%),radial-gradient(ellipse_at_18%_90%,rgba(22,126,139,0.12),transparent_42%)]" />
        <header className="relative z-10 border-b border-white/10 bg-[#050507]/55 backdrop-blur-lg">
          <div className="mx-auto flex max-w-[94rem] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
            <EverieBrand />
            <nav aria-label="Gallery navigation" className="flex items-center gap-5 text-[0.65rem] uppercase tracking-[0.12em] text-white/55 sm:gap-8">
              <Link href="/" className="transition-colors hover:text-white">Home</Link>
              <Link href="/gallery" aria-current="page" className="border-b border-cyan-200 pb-1 text-white">Gallery</Link>
              <Link href="/ar" className="transition-colors hover:text-white">Scan AR</Link>
              <Link href="/create" className="hidden items-center gap-1.5 text-white transition-colors hover:text-cyan-100 sm:inline-flex">
                Publish <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </nav>
          </div>
        </header>

        <section className="relative mx-auto grid max-w-[94rem] gap-14 px-5 pb-16 pt-20 sm:px-8 sm:pb-24 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:px-12 lg:pb-28 lg:pt-32">
          <div>
            <p className="inline-flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.26em] text-cyan-100/65">
              <span className="size-1.5 rounded-full bg-cyan-300" />
              The Everie archive / Open to all
            </p>
            <h1 className="mt-7 font-serif text-[clamp(5.5rem,15vw,12rem)] leading-[0.77] tracking-[-0.08em]">
              The <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text italic text-transparent">gallery.</span>
            </h1>
            <p className="mt-9 max-w-xl text-base leading-8 text-white/50">
              An evolving collection of artists and their worlds. Discover what is new, explore what people love, and step inside each work through AR.
            </p>
          </div>
          <div className="flex items-end justify-between gap-8 border-t border-white/20 pt-5 lg:mb-1">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/36">Published works</p>
              <p className="mt-2 font-serif text-5xl leading-none tracking-[-0.05em]">{artworks.length}</p>
            </div>
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/36">Artists</p>
              <p className="mt-2 font-serif text-5xl leading-none tracking-[-0.05em]">{artists}</p>
            </div>
            <Link href="/ar" className="inline-flex size-12 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/50 hover:text-white" aria-label="Explore the AR scanner">
              <ScanLine className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      <GalleryExplorer artworks={artworks} />

      <footer className="border-t border-white/10 px-5 py-7 text-[0.65rem] uppercase tracking-[0.15em] text-white/30 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[94rem] items-center justify-between gap-6">
          <span>Everie / The open gallery</span>
          <Link href="/ar" className="inline-flex items-center gap-2 transition hover:text-white">
            <Eye className="size-3.5" aria-hidden="true" /> Enter AR
          </Link>
        </div>
      </footer>
    </main>
  );
}
