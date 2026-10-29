"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

import { EverieBrand } from "@/components/atoms/everie-brand";
import { getCurrentCollectionUser } from "@/features/collection/infrastructure/supabase/collection-repository";

const SECTION_IDS = ["how-it-works", "works", "artists"] as const;
type SectionId = (typeof SECTION_IDS)[number];

function sectionLinkClass(active: boolean) {
  return `group relative py-2 transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-white after:transition-transform after:duration-300 ${
    active
      ? "text-white after:scale-x-100"
      : "text-white/46 after:scale-x-0 hover:text-white group-hover:after:scale-x-100"
  }`;
}

export function SiteHeader() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let active = true;
    void getCurrentCollectionUser()
      .then((user) => {
        if (active) setAuthenticated(Boolean(user));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 36);

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(Math.min(1, Math.max(0, window.scrollY / maxScroll)));

      const activationLine = window.innerHeight * 0.38;
      let nextSection: SectionId | null = null;
      SECTION_IDS.forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= activationLine) nextSection = id;
      });
      setActiveSection(nextSection);
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 text-white transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled
          ? "everie-nav-surface bg-[#030305]/92 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[94rem] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <EverieBrand className="opacity-90" />
          <span className="hidden text-[0.58rem] uppercase tracking-[0.2em] text-white/32 lg:inline">
            Art in another layer
          </span>
        </div>

        <nav className="flex items-center gap-3 text-[0.6rem] font-medium uppercase tracking-[0.1em] sm:gap-5 sm:text-[0.65rem] sm:tracking-[0.12em] lg:gap-7">
          <a
            href="#how-it-works"
            aria-current={activeSection === "how-it-works" ? "location" : undefined}
            className={`hidden md:inline ${sectionLinkClass(activeSection === "how-it-works")}`}
          >
            How it works
          </a>
          <a
            href="#works"
            aria-current={activeSection === "works" ? "location" : undefined}
            className={`hidden sm:inline ${sectionLinkClass(activeSection === "works")}`}
          >
            Works
          </a>
          <a
            href="#artists"
            aria-current={activeSection === "artists" ? "location" : undefined}
            className={`hidden lg:inline ${sectionLinkClass(activeSection === "artists")}`}
          >
            Artists
          </a>
          <Link href="/ar" className="text-cyan-100/80 transition hover:text-cyan-100">Scan AR</Link>
          <Link href="/collection" className="hidden text-white/46 transition hover:text-white sm:inline">
            Collection
          </Link>
          <span className="inline-flex justify-end sm:min-w-[3.8rem]">
            {authenticated === true ? (
              <Link href="/studio" className="text-white/46 transition-opacity duration-300 hover:text-white">
                Studio
              </Link>
            ) : authenticated === false ? (
              <Link href="/login" className="text-white/46 transition-opacity duration-300 hover:text-white">
                Sign in
              </Link>
            ) : (
              <span aria-hidden="true" className="select-none opacity-0">Studio</span>
            )}
          </span>
          <Link
            href={authenticated === false ? "/login?next=%2Fcreate" : "/create"}
            className="hidden h-10 items-center gap-2 border-b border-white/55 sm:inline-flex px-0 text-white/78 transition-[border-color,color] duration-300 hover:border-white hover:text-white"
          >
            Publish <ArrowUpRight className="size-3.5" />
          </Link>
        </nav>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden bg-white/[0.04]">
        <div
          className="h-full origin-left bg-gradient-to-r from-violet-300/80 via-white/65 to-cyan-200/75 transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${scrollProgress})` }}
        />
      </div>
    </header>
  );
}