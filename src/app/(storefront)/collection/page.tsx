import Link from "next/link";
import { StorefrontPageFrame } from "@/components/hanoia/StorefrontPageFrame";
import { ArText } from "@/components/everie-ar/ar-text";
import { createArtworkServices } from "@/features/artwork/infrastructure/local/artwork-services";
import { CollectionGrid } from "@/features/collection/presentation/components/collection-grid";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {

  const { listPublishedArtworks } = createArtworkServices();
  const artworks = await listPublishedArtworks.execute();
  return (
    <StorefrontPageFrame mainClassName="bg-[#FAFAF8] dark:bg-neutral-950">
      <section className="mx-auto max-w-[1440px] px-4 pb-20 pt-12 md:px-8 lg:pt-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#94734C] dark:text-[#C5A880]"><ArText id="ar.collection.kicker" /></p>
        <h1 className="mt-5 max-w-4xl font-serif text-6xl leading-[0.95] tracking-tight md:text-8xl"><ArText id="ar.collection.headingPrefix" /> <span className="italic text-[#94734C] dark:text-[#C5A880]"><ArText id="ar.collection.headingEmphasis" /></span></h1>
        <p className="mt-7 max-w-2xl text-sm leading-7 text-neutral-500 dark:text-neutral-400"><ArText id="ar.collection.description" /></p>
        <div className="mt-8 flex flex-wrap gap-4 text-xs uppercase tracking-widest"><Link href="/ar" className="border-b border-[#C5A880] pb-2 text-[#94734C] dark:text-[#C5A880]"><ArText id="ar.nav.scan" /></Link><Link href="/gallery" className="border-b border-neutral-300 dark:border-neutral-700 pb-2 text-neutral-600 dark:text-neutral-300"><ArText id="ar.collection.viewGallery" /></Link></div>
        <div className="mt-12"><CollectionGrid artworks={artworks} /></div>
      </section>
    </StorefrontPageFrame>
  );
}
