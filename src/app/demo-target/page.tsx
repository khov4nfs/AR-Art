import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { BackLink } from "@/components/atoms/back-link";
import { EverieBrand } from "@/components/atoms/everie-brand";
import { arConfig } from "@/config/ar";

export default function DemoTargetPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] px-5 py-6 text-white sm:px-8">
      <div className="pointer-events-none absolute right-[12%] top-20 size-72 rounded-full bg-violet-700/7 blur-[120px]" />
      <div className="relative mx-auto w-full max-w-4xl">
        <div className="everie-nav-surface grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-[6px] px-4 py-4">
          <BackLink href="/" label="Home" className="justify-self-start" />
          <EverieBrand />
          <span aria-hidden="true" />
        </div>

        <section className="mx-auto mt-14 max-w-2xl">
          <h1 className="font-serif text-5xl leading-[0.92] tracking-[-0.045em] sm:text-7xl">
            Scan this image<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">with the AR camera.</span>
          </h1>

          <div className="mt-10 overflow-hidden rounded-[7px] bg-[#09090d] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/[0.06] sm:p-5">
            {/* External img is intentional: this target is the exact image used by the default .mind file. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={arConfig.targetImageUrl} alt="MindAR demo image target" className="mx-auto h-auto w-full bg-white" />
          </div>

          <div className="mt-5"><Link href="/ar/demo" className="inline-flex h-10 items-center rounded-[4px] bg-white px-5 text-xs font-semibold uppercase tracking-wider text-black">Open demo AR</Link></div>
          <a
            href={arConfig.targetImageUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 border-b border-white/18 pb-1 text-xs uppercase tracking-[0.12em] text-white/42 transition hover:border-cyan-200/65 hover:text-white"
          >
            Open original target <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </section>
      </div>
    </main>
  );
}