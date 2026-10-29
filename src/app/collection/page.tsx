import { BackLink } from "@/components/atoms/back-link";
import { EverieBrand } from "@/components/atoms/everie-brand";
import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";
import { CollectionGrid } from "@/features/collection/presentation/components/collection-grid";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const { listPublishedArtworks } = createArtworkServices();
  const artworks = await listPublishedArtworks.execute();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none absolute right-[8%] top-24 size-80 rounded-full bg-violet-700/7 blur-[130px]" />
      <header className="relative mx-auto grid w-full max-w-[94rem] grid-cols-[1fr_auto_1fr] items-center everie-nav-surface px-5 py-5 sm:px-8 lg:px-12">
        <BackLink href="/" />
        <EverieBrand />
        <span aria-hidden="true" />
      </header>

      <section className="relative mx-auto w-full max-w-[94rem] px-5 pb-12 pt-16 sm:px-8 lg:px-12 lg:pb-16 lg:pt-24">
        <h1 className="max-w-5xl font-serif text-6xl leading-[0.88] tracking-[-0.055em] sm:text-8xl lg:text-9xl">
          Works you <span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">discovered.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-6 text-white/38">
          Open a published work in AR and point the camera at the physical artwork. It appears here only after recognition succeeds; remove anything you no longer want to keep.
        </p>
      </section>

      <div className="relative mx-auto w-full max-w-[94rem] px-5 pb-24 sm:px-8 lg:px-12">
        <CollectionGrid artworks={artworks} />
      </div>
    </main>
  );
}
