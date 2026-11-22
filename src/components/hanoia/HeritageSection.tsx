"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Award } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function HeritageSection() {
  const { t, language } = useLanguage();
  const isEn = language === "en";

  return (
    <section className="py-24 bg-[#F8F7F4] border-t border-b border-neutral-200" id="heritage">
      <div className="max-w-[1300px] mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold flex items-center justify-center space-x-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("home.heritageEyebrow")}</span>
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-light tracking-wide uppercase text-black">
            {t("home.heritageTitle")}
          </h2>
          <div className="w-16 h-0.5 bg-[#C5A880] mx-auto my-3" />
          <p className="text-sm md:text-base text-neutral-700 leading-relaxed font-light">
            {t("home.heritageP1")}
          </p>
          <p className="text-sm md:text-base text-neutral-700 leading-relaxed font-light">
            {t("home.heritageP2")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div className="group relative bg-white border border-neutral-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300">
            <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
              <Image
                src="/images/hanoia/heritage-craft.webp"
                alt={isEn ? "Thanh Ha pottery craft" : "Nghệ nhân gốm Thanh Hà"}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1300px) 50vw, 650px"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 bg-black/80 text-white text-[11px] uppercase tracking-widest font-semibold px-3 py-1 backdrop-blur-xs flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{isEn ? "14–45 making days" : "14–45 ngày chế tác"}</span>
              </div>
            </div>
            <div className="p-8 text-center space-y-3">
              <h3 className="text-2xl font-serif font-normal uppercase tracking-wider text-black">
                {isEn ? "Thanh Hà pottery" : "Làng gốm Thanh Hà"}
              </h3>
              <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
                {isEn
                  ? "Local clay, stone glaze, wood-fired kilns. Each flower is shaped once — Classic 14–21 days, Themed 21–28, Bespoke 30–45."
                  : "Đất sét địa phương, men đá, lửa củi. Mỗi đóa hoa nặn một lần — Classic 14–21 ngày, Themed 21–28, Bespoke 30–45."}
              </p>
              <div className="pt-2">
                <Link
                  href="/heritage"
                  className="inline-flex items-center space-x-2 text-xs uppercase tracking-[2px] font-semibold text-black hover:text-[#C5A880] transition-colors border-b border-black hover:border-[#C5A880] pb-1"
                >
                  <span>{t("home.craftCta")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="group relative bg-white border border-neutral-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300">
            <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
              <Image
                src="/images/hanoia/heritage-creativity.webp"
                alt={isEn ? "From clay to flower" : "Từ đất sét đến đóa hoa"}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1300px) 50vw, 650px"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 bg-black/80 text-white text-[11px] uppercase tracking-widest font-semibold px-3 py-1 backdrop-blur-xs flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{isEn ? "Shape, fire, engrave" : "Nặn, nung, khắc"}</span>
              </div>
            </div>
            <div className="p-8 text-center space-y-3">
              <h3 className="text-2xl font-serif font-normal uppercase tracking-wider text-black">
                {isEn ? "From Clay to Flower" : "Từ đất sét đến hoa"}
              </h3>
              <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
                {isEn
                  ? "Artisans shape petals, fire the glaze, then engrave the base. Bespoke is a single piece after you approve the drawing."
                  : "Nghệ nhân nặn cánh, nung men, rồi khắc chữ trên đế. Bespoke là bản duy nhất sau khi bạn duyệt bản vẽ."}
              </p>
              <div className="pt-2">
                <Link
                  href="/bespoke"
                  className="inline-flex items-center space-x-2 text-xs uppercase tracking-[2px] font-semibold text-black hover:text-[#C5A880] transition-colors border-b border-black hover:border-[#C5A880] pb-1"
                >
                  <span>{t("bespoke.begin")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
