import Link from "next/link";
import { ScanLine } from "lucide-react";

import { EverieArHeader } from "@/components/everie-ar/everie-ar-header";

/** Server-only readiness check; never return keys to browser components. */
export function isArBackendConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** A readable fallback until production Supabase credentials are configured. */
export function ArBackendUnavailable({ area }: { area: string }) {
  return (
    <div className="min-h-screen bg-[#0C0C0E] text-white">
      <EverieArHeader active="gallery" />
      <main className="mx-auto flex min-h-[65vh] max-w-4xl flex-col items-start justify-center px-6 py-24 md:px-8">
        <ScanLine className="size-12 text-[#C5A880]" strokeWidth={1.1} aria-hidden="true" />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-[#C5A880]">EVERIE / Digital Atelier</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight md:text-7xl">{area} đang được kết nối.</h1>
        <p className="mt-7 max-w-xl text-sm leading-7 text-stone-400">
          Hệ thống lưu trữ và xuất bản AR chưa được cấu hình trên môi trường này.
          Tính năng mua sắm của EVERIE vẫn hoạt động bình thường; bạn có thể thử chế độ AR demo hoặc quay về cửa hàng.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/ar/demo" className="inline-flex h-12 items-center bg-[#C5A880] px-6 text-xs font-semibold uppercase tracking-widest text-black">Xem AR demo</Link>
          <Link href="/" className="inline-flex h-12 items-center border border-white/20 px-6 text-xs uppercase tracking-widest text-white">Cửa hàng EVERIE</Link>
        </div>
      </main>
    </div>
  );
}
