import Link from "next/link";
import { ArrowUpRight, Camera, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { EverieArHeader } from "@/components/everie-ar/everie-ar-header";
import { ArText } from "@/components/everie-ar/ar-text";
import { createArtworkServices } from "@/features/artwork/infrastructure/local/artwork-services";
import { ArtworkArQrCode } from "@/features/artwork/presentation/components/artwork-ar-qr-code";
import { EditArtworkButton } from "@/features/artwork/presentation/components/edit-artwork-button";
import { ShareArtworkButton } from "@/features/artwork/presentation/components/share-artwork-button";
import { ArtworkViewTracker } from "@/features/gallery/presentation/components/artwork-view-tracker";

export const dynamic = "force-dynamic";

export default async function ArtworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { getPublishedArtwork } = createArtworkServices();
  const artwork = await getPublishedArtwork.execute(slug);
  if (!artwork) notFound();
  const arHref = `/ar/${artwork.slug}`;

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-white">
      <ArtworkViewTracker slug={artwork.slug} />
      <EverieArHeader active="gallery" />
      <main className="mx-auto grid max-w-[1440px] gap-14 px-5 py-12 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
        <div>
          <div className="overflow-hidden border border-white/10 bg-[#171719] p-3 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={artwork.targetImageUrl} alt={artwork.title} className="mx-auto aspect-[4/5] max-h-[72svh] w-full object-contain" />
          </div>
          <p className="mt-4 flex justify-between text-[10px] uppercase tracking-[0.2em] text-stone-500"><span>EVERIE / Digital Atelier</span><span className="text-[#C5A880]"><ArText id="ar.art.enabled" /></span></p>
        </div>
        <div className="lg:pl-8">
          <Link href="/gallery" className="text-[11px] uppercase tracking-widest text-stone-400 transition hover:text-[#C5A880]"><ArText id="ar.art.backGallery" /></Link>
          <p className="mt-10 text-[11px] uppercase tracking-[0.25em] text-[#C5A880]"><ArText id="ar.art.interactive" /></p>
          <h1 className="mt-4 font-serif text-6xl leading-[0.95] tracking-tight md:text-7xl">{artwork.title}</h1>
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-stone-400">{artwork.artistName}</p>
          {artwork.description && <p className="mt-8 max-w-xl whitespace-pre-wrap text-sm leading-8 text-stone-300">{artwork.description}</p>}
          <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-white/10 pt-8">
            <Link href={arHref} className="inline-flex min-h-12 items-center gap-2 bg-[#C5A880] px-5 text-xs font-semibold uppercase tracking-widest text-[#111113] transition hover:bg-[#E3C89D]"><Camera className="size-4" /> <ArText id="ar.art.experience" /> <ArrowUpRight className="size-3.5" /></Link>
            <Link href="/collection" className="inline-flex min-h-12 items-center gap-2 border border-white/20 px-5 text-xs uppercase tracking-widest text-stone-300 transition hover:border-[#C5A880]"><Sparkles className="size-4" /> <ArText id="ar.art.collection" /></Link>
            <EditArtworkButton id={artwork.id} ownerId={artwork.ownerId} title={artwork.title} artistName={artwork.artistName} description={artwork.description} status={artwork.status} />
          </div>
          <div className="mt-5"><ShareArtworkButton title={artwork.title} text={artwork.description} imageUrl={artwork.targetImageUrl} /></div>
          <div className="mt-12 flex justify-start"><ArtworkArQrCode href={arHref} title={artwork.title} /></div>
        </div>
      </main>
    </div>
  );
}
