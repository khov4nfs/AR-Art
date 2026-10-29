import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Camera, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { backNavigationClassName } from "@/components/atoms/back-link";
import { EverieBrand } from "@/components/atoms/everie-brand";
import { HistoryBackButton } from "@/components/molecules/history-back-button";
import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";
import { ArtworkArQrCode } from "@/features/artwork/presentation/components/artwork-ar-qr-code";
import { EditArtworkButton } from "@/features/artwork/presentation/components/edit-artwork-button";
import { ShareArtworkButton } from "@/features/artwork/presentation/components/share-artwork-button";

export const dynamic = "force-dynamic";

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { getPublishedArtwork } = createArtworkServices();
  const artwork = await getPublishedArtwork.execute(slug);

  if (!artwork) notFound();

  const arHref = `/ar/${artwork.slug}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none absolute right-[10%] top-[18%] size-80 rounded-full bg-violet-700/7 blur-[130px]" />
      <header className="relative mx-auto grid w-full max-w-[94rem] grid-cols-[1fr_auto_1fr] items-center everie-nav-surface px-5 py-5 sm:px-8 lg:px-12">
        <HistoryBackButton
          fallbackHref="/"
          variant="ghost"
          className={`${backNavigationClassName} h-auto p-0 hover:bg-transparent`}
        >
          <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden="true" />
          Gallery
        </HistoryBackButton>
        <EverieBrand />
        <span aria-hidden="true" />
      </header>

      <section className="relative mx-auto grid min-h-[calc(100svh-4.8rem)] w-full max-w-[94rem] gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.16fr_0.84fr] lg:items-center lg:px-12 lg:py-16">
        <div className="relative">
          <div className="overflow-hidden rounded-[7px] bg-[#0a0a0d] p-2 shadow-[0_35px_120px_rgba(0,0,0,0.38)] ring-1 ring-inset ring-white/[0.06] sm:p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.targetImageUrl}
              alt={artwork.title}
              className="mx-auto aspect-[4/5] max-h-[74svh] w-full object-contain"
            />
          </div>
          <div className="mt-3 flex items-center justify-between pt-1 text-[0.62rem] uppercase tracking-[0.15em] text-white/30">
            <span>Everie archive</span>
            <span className="text-cyan-100/45">AR enabled</span>
          </div>
        </div>

        <div className="lg:pl-8">
          <h1 className="font-serif text-6xl leading-[0.86] tracking-[-0.06em] sm:text-8xl">
            {artwork.title}
          </h1>
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-violet-100/45">{artwork.artistName}</p>

          {artwork.description ? (
            <p className="mt-9 max-w-xl whitespace-pre-wrap text-sm leading-7 text-white/48">
              {artwork.description}
            </p>
          ) : null}

          <div className="mt-12 grid grid-cols-2 border-y border-white/12 py-4 text-xs uppercase tracking-[0.12em] text-white/38">
            <span>AR layer</span>
            <span className="text-right">Scans save to Collection</span>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Link
              href={arHref}
              className="inline-flex h-12 items-center gap-2 rounded-[4px] bg-white px-5 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-violet-100"
            >
              <Camera className="size-4" aria-hidden="true" />
              Open AR
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>

            <Link
              href="/collection"
              className="inline-flex h-12 items-center gap-2 rounded-[4px] bg-white/[0.035] px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/58 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.06] hover:text-white hover:ring-white/20"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Collection
            </Link>

            <EditArtworkButton
              id={artwork.id}
              ownerId={artwork.ownerId}
              title={artwork.title}
              artistName={artwork.artistName}
              description={artwork.description}
              status={artwork.status}
            />
          </div>

          <div className="mt-3">
            <ShareArtworkButton
              title={artwork.title}
              text={artwork.description || `Discover ${artwork.title} in Everie.`}
              imageUrl={artwork.targetImageUrl}
            />
          </div>

          <div className="mt-12 flex justify-end lg:mt-16">
            <ArtworkArQrCode href={arHref} title={artwork.title} />
          </div>
        </div>
      </section>
    </main>
  );
}