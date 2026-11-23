import type { Metadata } from "next";
import Link from "next/link";
import { getDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";
import Header from "@/components/hanoia/Header";
import { ArText } from "@/components/everie-ar/ar-text";
import HeroSlider from "@/components/hanoia/HeroSlider";
import BestSellerSection from "@/components/hanoia/BestSellerSection";
import TopPicksSection from "@/components/hanoia/TopPicksSection";
import FurnitureFashionSection from "@/components/hanoia/FurnitureFashionSection";
import CraftsmanshipTimeline from "@/components/hanoia/CraftsmanshipTimeline";
import HeritageSection from "@/components/hanoia/HeritageSection";
import PressMentions from "@/components/hanoia/PressMentions";
import LookbookGallery from "@/components/hanoia/LookbookGallery";
import NewsletterSection from "@/components/hanoia/NewsletterSection";
import Footer from "@/components/hanoia/Footer";
import { ScanLine, ArrowUpRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const db = await getDatabase();
  const s = db.settings;
  const title = s.seoTitle || `${s.siteName} | ${s.siteTagline}`;
  const description =
    s.seoDescription ||
    `${s.siteName} — ${s.siteTagline}. Hoa gốm thủ công Classic, Themed và Bespoke từ làng gốm Thanh Hà.`;
  const ogImage =
    s.seoOgImage || s.logoHeader || "/images/hanoia/hero-banner-3.webp";
  const canonical = s.seoCanonical || "https://everievn.com";

  return {
    title: {
      absolute: title,
    },
    description,
    keywords: s.seoKeywords
      ? s.seoKeywords.split(",").map((k) => k.trim())
      : undefined,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: s.siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

const LINE_ENTRIES = [
  { href: "/classic", label: "Classic Flowers" },
  { href: "/themed", label: "Themed Collection" },
  { href: "/bespoke", label: "Bespoke Flowers" },
  { href: "/heritage", label: "Our Story" },
] as const;

export default async function Home() {
  const db = await getDatabase();
  const settings = db.settings;
  const tagline = settings.siteTagline || "Vẻ đẹp ở lại cùng thời gian";

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-neutral-100 transition-colors duration-300">
      <Header initialSettings={settings} />

      <main className="flex-1 flex flex-col">
        <HeroSlider />

        <section className="py-14 md:py-20 px-4 md:px-8 max-w-[1440px] mx-auto w-full text-center">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
            {settings.siteName || "EVERIE"}
          </span>
          <h1 className="mt-3 text-3xl md:text-5xl font-serif font-light tracking-wide uppercase text-black dark:text-white">
            {tagline}
          </h1>
          <div className="w-12 h-0.5 bg-[#C5A880] mx-auto my-5" />
          <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 font-light max-w-xl mx-auto leading-relaxed">
            Hoa gốm thủ công từ làng gốm Thanh Hà. Classic chọn màu men, Themed
            kể lễ hội Việt Nam, Bespoke là bản duy nhất.
          </p>
          <nav className="mt-8 flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {LINE_ENTRIES.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="px-5 py-2.5 text-[11px] uppercase tracking-[1.5px] font-semibold border border-black dark:border-neutral-200 text-black dark:text-neutral-100 hover:bg-black hover:text-white dark:hover:bg-[#C5A880] dark:hover:text-black transition-colors"
              >
                {entry.label}
              </Link>
            ))}
          </nav>
        </section>

        <section aria-labelledby="everie-ar-heading" className="border-y border-[#E6DED0] bg-[#F6F3ED] px-5 py-16 text-[#171717] dark:border-neutral-800 dark:bg-[#171719] dark:text-white md:px-8 lg:py-24">
          <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8C6D46] dark:text-[#C5A880]">EVERIE · Digital Atelier</p>
              <h2 id="everie-ar-heading" className="mt-5 max-w-3xl font-serif text-4xl font-normal leading-tight md:text-6xl"><ArText id="ar.home.heading1" /> <span className="italic text-[#8C6D46] dark:text-[#C5A880]"><ArText id="ar.home.heading2" /></span></h2>
              <p className="mt-6 max-w-xl text-sm leading-8 text-neutral-600 dark:text-neutral-400"><ArText id="ar.home.desc" /></p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/ar" className="inline-flex min-h-12 items-center gap-3 bg-[#111113] px-6 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-[#8C6D46] dark:bg-[#C5A880] dark:text-black"><ScanLine className="size-4" /> <ArText id="ar.gallery.openCamera" /></Link>
                <Link href="/gallery" className="inline-flex min-h-12 items-center gap-2 border border-[#8C6D46] px-6 text-xs uppercase tracking-widest text-[#8C6D46] transition hover:bg-[#E8DFD1] dark:border-[#C5A880] dark:text-[#C5A880]"><ArText id="ar.nav.gallery" /> <ArrowUpRight className="size-4" /></Link>
              </div>
            </div>
            <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden border border-[#8C6D46]/30 bg-[#111113] p-12 text-white md:min-h-[400px]">
              <div className="absolute inset-8 border border-[#C5A880]/20" aria-hidden="true" />
              <div className="absolute inset-16 border border-[#C5A880]/10" aria-hidden="true" />
              <div className="relative text-center"><ScanLine className="mx-auto size-20 text-[#C5A880]" strokeWidth={0.8} aria-hidden="true" /><p className="mt-7 font-serif text-3xl tracking-wide"><ArText id="ar.home.motion" /></p><p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-[#C5A880]"><ArText id="ar.home.steps" /></p></div>
            </div>
          </div>
        </section>

        <BestSellerSection />

        <TopPicksSection />

        <FurnitureFashionSection />

        <CraftsmanshipTimeline />

        <HeritageSection />

        <PressMentions />

        <LookbookGallery />

        <NewsletterSection />
      </main>

      <Footer initialSettings={settings} />
    </div>
  );
}
