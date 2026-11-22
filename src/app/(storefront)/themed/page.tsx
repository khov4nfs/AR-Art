"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import ProductCard from "@/components/hanoia/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useLanguage } from "@/context/LanguageContext";
import { CRAFT_DAYS, formatDayRange } from "@/lib/everie";
import { everieCollectionsMeta } from "@/data/everieData";

export default function ThemedCollectionPage() {
  const { products, loading } = useProducts("line=themed");
  const { t, language } = useLanguage();
  const meta = everieCollectionsMeta.themed;
  const craft = formatDayRange(
    CRAFT_DAYS.themed.min,
    CRAFT_DAYS.themed.max,
    language,
  );
  const isEn = language === "en";
  const singles = products.filter((product) => !product.isSet);
  const sets = products.filter((product) => product.isSet);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-neutral-100 transition-colors duration-300">
      <Header />

      <main className="flex-1 pb-24">
        <div className="relative aspect-[21/9] sm:aspect-[24/7] min-h-[220px] md:min-h-[280px] w-full overflow-hidden bg-neutral-900">
          <Image
            src={meta.banner}
            alt={meta.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col justify-end pb-8 md:pb-12 text-white">
            <span className="text-[11px] uppercase tracking-[3px] text-[#C5A880] font-semibold mb-2">
              {isEn ? "Vietnamese festivals" : "Lễ hội Việt Nam"}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-light tracking-wide uppercase">
              {t("nav.themed")}
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 font-light max-w-xl mt-2">
              {isEn
                ? `PHẤP · DỆT · VANG. Glaze is fixed to the design. Making time ${craft}.`
                : `PHẤP · DỆT · VANG. Màu men cố định theo thiết kế. Thời gian chế tác ${craft}.`}
            </p>
          </div>
        </div>

        <div className="border-b border-neutral-200 bg-[#FBFBFA] dark:bg-neutral-900 dark:border-neutral-800">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 flex items-center space-x-2 text-xs text-neutral-500 font-light">
            <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
              {t("header.home")}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-black dark:text-white font-medium">
              {t("nav.themed")}
            </span>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-12 space-y-16">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-2xl md:text-3xl font-serif font-light uppercase tracking-wide">
              {isEn ? "A festival kept in glaze" : "Lễ hội giữ trên men"}
            </h2>
            <div className="w-12 h-0.5 bg-[#C5A880]" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
              {isEn
                ? "Lễ hội Việt Nam is three ceramic flowers: PHẤP (New Year red), DỆT (loom and brocade), VANG (ripe rice and village drums). You may buy one piece or the whole set. The set price is not the sum of the three — it can be lower."
                : "Lễ hội Việt Nam gồm ba đóa hoa gốm: PHẤP (sắc đỏ giao thừa), DỆT (khung cửi và thổ cẩm), VANG (vàng lúa chín và trống hội). Có thể mua từng hoa hoặc cả bộ. Giá bộ không bằng tổng ba hoa lẻ — thường thấp hơn."}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-xs bg-neutral-100 dark:bg-neutral-800"
                />
              ))}
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-xs uppercase tracking-[2px] font-semibold text-[#C5A880] mb-6">
                  PHẤP · DỆT · VANG
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                  {singles.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>

              {sets.length > 0 && (
                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-12">
                  <h3 className="text-xs uppercase tracking-[2px] font-semibold text-[#C5A880] mb-3">
                    {isEn ? "The festival set" : "Bộ Lễ hội"}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 font-light max-w-xl mb-8">
                    {isEn
                      ? "PHẤP, DỆT and VANG together. One inscription for the whole set (box or card). Set price is not the sum of the three singles."
                      : "Cả PHẤP, DỆT và VANG. Một dòng khắc cho cả bộ (hộp hoặc thiệp). Giá bộ không bằng tổng ba hoa lẻ."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                    {sets.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
