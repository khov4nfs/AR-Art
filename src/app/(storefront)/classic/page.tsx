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

export default function ClassicFlowersPage() {
  const { products, loading } = useProducts("line=classic");
  const { t, language } = useLanguage();
  const meta = everieCollectionsMeta.classic;
  const craft = formatDayRange(
    CRAFT_DAYS.classic.min,
    CRAFT_DAYS.classic.max,
    language,
  );
  const isEn = language === "en";

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
              EVERIE
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-light tracking-wide uppercase">
              {t("nav.classic")}
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 font-light max-w-xl mt-2">
              {isEn
                ? `Five ceramic flowers. Choose glaze, engrave the base. Making time ${craft}.`
                : `Năm loài hoa gốm. Chọn màu men, khắc chữ trên đế. Thời gian chế tác ${craft}.`}
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
              {t("nav.classic")}
            </span>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-12">
          <div className="max-w-2xl mb-10 space-y-3">
            <div className="w-12 h-0.5 bg-[#C5A880]" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
              {isEn
                ? "Tulip, Lotus, Rose, Orchid, Peony. Each piece is made to order in Thanh Hà — not held in a warehouse."
                : "Tulip, Sen, Hồng, Lan Hồ Điệp, Mẫu Đơn. Mỗi đóa làm theo đơn tại Thanh Hà — không giữ sẵn kho."}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-xs bg-neutral-100 dark:bg-neutral-800"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
