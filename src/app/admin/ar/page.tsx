import Link from "next/link";
import { ArrowUpRight, Images, ScanLine } from "lucide-react";

import { ArText } from "@/components/everie-ar/ar-text";
import { StudioApp } from "@/features/studio/presentation/components/studio-app";

/** AR is one workspace inside the existing EVERIE administration shell. */
export default function AdminArPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-stone-800 pb-7">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.27em] text-[#C5A880]">
            EVERIE / AR
          </p>
          <h1 className="mt-3 font-serif text-3xl text-white sm:text-4xl">
            <ArText id="ar.admin.manager" />
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">
            <ArText id="ar.admin.managerDesc" />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/gallery" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-stone-700 px-4 py-2.5 text-xs text-stone-300 transition hover:border-[#C5A880] hover:text-white">
            <Images className="size-4" /><ArText id="ar.nav.gallery" /><ArrowUpRight className="size-3" />
          </Link>
          <Link href="/ar" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-stone-700 px-4 py-2.5 text-xs text-stone-300 transition hover:border-[#C5A880] hover:text-white">
            <ScanLine className="size-4" /><ArText id="ar.nav.scan" /><ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
      <StudioApp />
    </div>
  );
}
