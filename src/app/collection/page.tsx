import Link from "next/link";
import { EverieArHeader } from "@/components/everie-ar/everie-ar-header";
import { createArtworkServices } from "@/features/artwork/infrastructure/local/artwork-services";
import { CollectionGrid } from "@/features/collection/presentation/components/collection-grid";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {

  const { listPublishedArtworks } = createArtworkServices();
  const artworks = await listPublishedArtworks.execute();
  return (
    <div className="min-h-screen bg-[#0C0C0E] text-white">
      <EverieArHeader active="gallery" />
      <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-16 md:px-8 lg:pt-24">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A880]">EVERIE / Your Collection</p>
        <h1 className="mt-5 max-w-4xl font-serif text-6xl leading-[0.95] tracking-tight md:text-8xl">Tác phẩm bạn đã <span className="italic text-[#C5A880]">khám phá.</span></h1>
        <p className="mt-7 max-w-2xl text-sm leading-7 text-stone-400">Tác phẩm chỉ được thêm sau khi camera AR thực sự nhận diện đúng hình ảnh. Bạn có thể mở lại và quản lý các tác phẩm đã lưu.</p>
        <div className="mt-8 flex flex-wrap gap-4 text-xs uppercase tracking-widest"><Link href="/ar" className="border-b border-[#C5A880] pb-2 text-[#C5A880]">Quét AR</Link><Link href="/gallery" className="border-b border-white/25 pb-2 text-stone-300">Xem thư viện</Link></div>
        <div className="mt-12"><CollectionGrid artworks={artworks} /></div>
      </main>
    </div>
  );
}
