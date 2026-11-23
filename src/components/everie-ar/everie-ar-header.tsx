"use client";

import Link from "next/link";

import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ArLanguageSwitcher } from "./ar-language-switcher";

/** A lightweight header for immersive AR routes, matching Everie's storefront identity. */
export function EverieArHeader({ active }: { active?: "gallery" | "scanner" | "studio" }) {
  const { t } = useLanguage();
  const links = [
    { href: "/", label: t("ar.nav.home") },
    { href: "/gallery", label: t("ar.nav.gallery"), id: "gallery" },
    { href: "/ar", label: t("ar.nav.scan"), id: "scanner" },
    { href: "/studio/products", label: t("ar.nav.studio"), id: "studio" },
  ] as const;

  return (
    <header className="relative z-20 border-b border-white/10 bg-[#111113] text-white">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href="/" aria-label={"EVERIE – " + t("ar.nav.home")} className="flex items-center gap-3">
          <span className="font-serif text-2xl tracking-[0.22em]">EVERIE</span>
        </Link>
        <nav aria-label={t("ar.nav.experience")} className="flex flex-wrap items-center gap-4 md:gap-7">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={"id" in link && link.id === active ? "page" : undefined}
              className={`text-[10px] font-medium uppercase tracking-[0.12em] transition hover:text-[#C5A880] ${"id" in link && link.id === active ? "text-[#C5A880]" : "text-white/70"}`}>
              {link.label}
            </Link>
          ))}
          <ArLanguageSwitcher />
          <Link href="/create" className="hidden items-center gap-1.5 border border-[#C5A880] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C5A880] transition hover:bg-[#C5A880] hover:text-black md:inline-flex">
            {t("ar.nav.create")} <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
