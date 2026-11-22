"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const LINES = [
  {
    href: "/classic",
    eyebrow: "14–21 ngày",
    title: "Classic Flowers",
    descVi:
      "Năm loài hoa gốm. Chọn màu men, khắc chữ trên đế, thêm vào giỏ.",
    descEn: "Five ceramic flowers. Choose glaze, engrave the base, add to bag.",
    image: "/images/hanoia/product-vase-monument.webp",
  },
  {
    href: "/themed",
    eyebrow: "21–28 ngày",
    title: "Themed Collection",
    descVi: "PHẤP · DỆT · VANG — lễ hội Việt Nam. Mua lẻ hoặc cả bộ.",
    descEn: "PHẤP · DỆT · VANG — Vietnamese festivals. Buy one or the set.",
    image: "/images/hanoia/hero-banner-2.webp",
  },
  {
    href: "/bespoke",
    eyebrow: "30–45 ngày",
    title: "Bespoke Flowers",
    descVi: "Gửi yêu cầu, duyệt thiết kế, sửa tối đa 3 lần. Thanh toán sau.",
    descEn: "Send a brief, review the design, up to 3 revisions. Pay after approval.",
    image: "/images/hanoia/heritage-creativity.webp",
  },
] as const;

export default function FurnitureFashionSection() {
  const { t, language } = useLanguage();

  return (
    <section className="py-20 bg-[#F8F7F4] dark:bg-neutral-950" id="brand-lines">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
            EVERIE
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide uppercase text-black dark:text-white">
            {language === "en"
              ? "Beauty that stays with time"
              : "Vẻ đẹp ở lại cùng thời gian"}
          </h2>
          <div className="w-12 h-0.5 bg-[#C5A880] mx-auto" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400 font-light max-w-lg mx-auto">
            {language === "en"
              ? "Three ways to keep a flower: Classic, Themed, and Bespoke."
              : "Ba cách giữ một đóa hoa: Classic, Themed và Bespoke."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {LINES.map((line) => (
            <Link
              key={line.href}
              href={line.href}
              className="group relative aspect-[3/4] overflow-hidden rounded-xs bg-neutral-100 block"
            >
              <Image
                src={line.image}
                alt={line.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1440px) 33vw, 460px"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end text-white">
                <span className="text-xs uppercase tracking-[2px] text-[#C5A880] font-semibold">
                  {line.eyebrow}
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-normal uppercase tracking-wide mt-1 mb-2">
                  {line.title}
                </h3>
                <p className="text-xs md:text-sm text-neutral-200 font-light max-w-sm mb-4">
                  {language === "en" ? line.descEn : line.descVi}
                </p>
                <span className="inline-flex items-center space-x-2 text-xs uppercase tracking-[2px] font-semibold text-white border-b border-white pb-1 group-hover:text-[#C5A880] group-hover:border-[#C5A880] transition-colors w-fit">
                  <span>{t("btn.discover")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/heritage"
            className="inline-flex items-center space-x-2 text-xs uppercase tracking-[2px] font-semibold text-black dark:text-white border-b border-black dark:border-white pb-1 hover:text-[#C5A880] hover:border-[#C5A880] transition-colors"
          >
            <span>{t("nav.ourStory")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
