import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { StorefrontPageFrame } from "@/components/hanoia/StorefrontPageFrame";
import { arConfig } from "@/config/ar";

export default function DemoTargetPage() {
  return (
    <StorefrontPageFrame mainClassName="bg-[#FAFAF8] dark:bg-neutral-950">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-8 md:py-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#94734C] dark:text-[#C5A880]">EVERIE / AR</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight md:text-6xl">
            Scan this image <span className="italic text-[#94734C] dark:text-[#C5A880]">with the AR camera.</span>
          </h1>
          <div className="mt-8 overflow-hidden border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-[#171719] md:p-5">
            {/* This exact image is used by the default .mind target. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={arConfig.targetImageUrl} alt="MindAR demo image target" className="mx-auto h-auto w-full" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <Link href="/ar/demo" className="inline-flex min-h-11 items-center bg-neutral-900 px-5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#94734C] dark:bg-[#C5A880] dark:text-black">
              Open demo AR
            </Link>
            <a href={arConfig.targetImageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs uppercase text-neutral-600 hover:text-[#94734C] dark:text-neutral-400">
              Open original target <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </StorefrontPageFrame>
  );
}
