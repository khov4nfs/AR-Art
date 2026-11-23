import Link from "next/link";
import { ArrowUpRight, Camera, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { StorefrontPageFrame } from "@/components/hanoia/StorefrontPageFrame";
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
    <StorefrontPageFrame mainClassName="bg-[#FAFAF8] dark:bg-neutral-950">
      <ArtworkViewTracker slug={artwork.slug} />
      <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-16">
        <div>
          <div className="overflow-hidden border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#171719] p-3 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={artwork.targetImageUrl} alt={artwork.title} className="mx-auto aspect-[4/5] max-h-[72svh] w-full object-contain" />
          </div>
          <p className="mt-4 flex justify-between text-[10px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400"><span>EVERIE</span><span className="text-[#94734C] dark:text-[#C5A880]"><ArText id="ar.art.enabled" /></span></p>
        </div>
        <div className="lg:pl-8">
          <Link href="/gallery" className="text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 transition hover:text-[#94734C] dark:text-[#C5A880]"><ArText id="ar.art.backGallery" /></Link>
          <p className="mt-10 text-[11px] uppercase tracking-[0.25em] text-[#94734C] dark:text-[#C5A880]"><ArText id="ar.art.interactive" /></p>
          <h1 className="mt-4 font-serif text-6xl leading-[0.95] tracking-tight md:text-7xl">{artwork.title}</h1>
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">{artwork.artistName}</p>
          {artwork.description && <p className="mt-8 max-w-xl whitespace-pre-wrap text-sm leading-8 text-neutral-600 dark:text-neutral-300">{artwork.description}</p>}
          <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <Link href={arHref} className="inline-flex min-h-12 items-center gap-2 bg-[#C5A880] px-5 text-xs font-semibold uppercase tracking-widest text-[#111113] transition hover:bg-[#E3C89D]"><Camera className="size-4" /> <ArText id="ar.art.experience" /> <ArrowUpRight className="size-3.5" /></Link>
            <Link href="/collection" className="inline-flex min-h-12 items-center gap-2 border border-neutral-300 dark:border-neutral-700 px-5 text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-300 transition hover:border-[#C5A880]"><Sparkles className="size-4" /> <ArText id="ar.art.collection" /></Link>
            <EditArtworkButton id={artwork.id} ownerId={artwork.ownerId} title={artwork.title} artistName={artwork.artistName} description={artwork.description} status={artwork.status} />
          </div>
          <div className="mt-5"><ShareArtworkButton title={artwork.title} text={artwork.description} imageUrl={artwork.targetImageUrl} /></div>
          <div className="mt-12 flex justify-start"><ArtworkArQrCode href={arHref} title={artwork.title} /></div>
        </div>
      </section>
    </StorefrontPageFrame>
  );
}
