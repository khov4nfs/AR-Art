import Link from "next/link";
import { ArText } from "@/components/everie-ar/ar-text";
import {
  ArrowUpRight,
  Camera,
  ImagePlus,
  Images,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

const entries = [
  {
    href: "/ar",
    title: "ar.nav.scan",
    description: "ar.admin.scannerDesc",
    icon: ScanLine,
  },
  {
    href: "/gallery",
    title: "ar.nav.gallery",
    description: "ar.admin.galleryDesc",
    icon: Images,
  },
  {
    href: "/studio/products",
    title: "ar.admin.manager",
    description: "ar.admin.managerDesc",
    icon: Camera,
  },
  {
    href: "/create",
    title: "ar.admin.publish",
    description: "ar.admin.publishDesc",
    icon: ImagePlus,
  },
] as const;

export default function AdminArPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-5 py-10 text-stone-200 sm:px-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.27em] text-[#C5A880]">
          EVERIE / Digital Atelier
        </p>
        <h1 className="mt-4 font-serif text-4xl text-white sm:text-5xl">
          <ArText id="ar.admin.title" />
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-400">
          <ArText id="ar.admin.desc" />
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-48 flex-col justify-between border border-stone-800 bg-[#18181A] p-6 transition-colors hover:border-[#C5A880]/70"
          >
            <div className="flex items-start justify-between">
              <Icon className="size-7 text-[#C5A880]" strokeWidth={1.4} />
              <ArrowUpRight className="size-4 text-stone-500 transition group-hover:text-[#C5A880]" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-white">
                <ArText id={title} />
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                <ArText id={description} />
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="flex gap-4 border-l-2 border-[#C5A880] bg-[#1B1A19] p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#C5A880]" />
        <div>
          <p className="text-sm font-semibold text-white">
            <ArText id="ar.admin.account" />
          </p>
          <p className="mt-2 text-xs leading-6 text-stone-400">
            <ArText id="ar.admin.accountDesc" />
          </p>
        </div>
      </div>
    </main>
  );
}
