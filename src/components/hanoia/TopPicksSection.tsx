"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface TopPickItem {
  title: string;
  image: string;
  link: string;
  price: string;
}

interface TopPickCollection {
  name: string;
  sideLabel?: string;
  subtitle: string;
  items: TopPickItem[];
}

export default function TopPicksSection() {
  const { t } = useLanguage();
  const [collections, setCollections] = useState<TopPickCollection[]>([]);

  useEffect(() => {
    fetch("/api/top-picks", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setCollections(res.data);
      })
      .catch(() => {});
  }, []);

  if (collections.length === 0) return null;

  return (
    <section
      className="py-20 bg-neutral-950 text-white overflow-hidden"
      id="top-picks"
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
            {t("home.topPicksEyebrow")}
          </span>
          <h2 className="text-3xl md:text-5xl font-serif tracking-wider font-light uppercase text-white">
            {t("home.topPicks")}
          </h2>
          <div className="w-12 h-0.5 bg-[#C5A880] mx-auto" />
          <p className="text-xs md:text-sm text-neutral-400 font-light max-w-lg mx-auto">
            {t("home.topPicksDesc")}
          </p>
        </div>

        <div className="space-y-12">
          {collections.map((collection, index) => (
            <div
              key={collection.name}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch border-b border-neutral-800/80 pb-12 last:border-b-0"
            >
              <div
                className={`lg:col-span-3 flex flex-col justify-center p-6 bg-neutral-900/50 border border-neutral-800/60 rounded-xs ${
                  index % 2 === 1 ? "lg:order-last" : ""
                }`}
              >
                <span className="text-xs tracking-[4px] text-[#C5A880] uppercase font-semibold">
                  {t("home.collection")}
                </span>
                <h3 className="text-3xl md:text-4xl font-serif font-normal tracking-wide text-white mt-2 mb-3">
                  {collection.name}
                </h3>
                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed font-light mb-6">
                  {collection.subtitle}
                </p>
                <Link
                  href={`/collections/${collection.name.toLowerCase() === "prism" ? "all" : collection.name.toLowerCase()}`}
                  className="inline-flex items-center space-x-2 text-xs uppercase tracking-[2px] text-[#C5A880] hover:text-white transition-colors"
                >
                  <span>{t("btn.viewCollection")}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {collection.items.map((item) => (
                  <Link
                    key={item.title}
                    href={item.link || "/collections/all"}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xs bg-neutral-900 border border-neutral-800 block"
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 540px"
                      loading="lazy"
                      className="object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent group-hover:from-black/90 transition-all duration-300" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="space-y-1 transform group-hover:-translate-y-1 transition-transform duration-300">
                        <span className="text-[11px] text-[#C5A880] uppercase tracking-widest font-semibold block">
                          {t("home.handmade")}
                        </span>
                        <h4 className="text-xl md:text-2xl font-serif font-normal tracking-wide text-white">
                          {item.title}
                        </h4>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-neutral-300 font-light">
                            {item.price}
                          </span>
                          <span className="text-xs text-white/80 group-hover:text-white uppercase tracking-wider flex items-center space-x-1 underline underline-offset-4">
                            <span>{t("btn.discover")}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
