"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Camera } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function LookbookGallery() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const photos = [
    {
      image: "/images/hanoia/product-vase-monument.webp",
      title: isEn ? "Tulip on the desk" : "Tulip trên bàn làm việc",
      collection: "Classic",
      link: "/classic/tulip",
    },
    {
      image: "/images/hanoia/product-vase-prime.webp",
      title: isEn ? "Lotus, still" : "Sen thanh khiết",
      collection: "Classic",
      link: "/classic/sen",
    },
    {
      image: "/images/hanoia/hero-banner-1.webp",
      title: isEn ? "PHẤP — New Year red" : "PHẤP — sắc đỏ năm mới",
      collection: "Themed",
      link: "/themed/phap",
    },
    {
      image: "/images/hanoia/product-tray-reverie.webp",
      title: isEn ? "Rose kept in glaze" : "Hồng giữ trên men",
      collection: "Classic",
      link: "/classic/hong",
    },
  ];

  return (
    <section className="py-20 bg-white border-t border-neutral-200">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold flex items-center justify-center space-x-1.5">
            <Camera className="w-4 h-4" />
            <span>#EVERIEAtHome</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-light uppercase tracking-wide">
            {isEn ? "Ceramic flowers in the room" : "Hoa gốm trong không gian"}
          </h2>
          <p className="text-xs text-neutral-500 font-light max-w-md mx-auto">
            {isEn
              ? "A flower that does not fade — Classic, Themed, and Bespoke in daily rooms."
              : "Một đóa hoa không tàn — Classic, Themed và Bespoke trong phòng khách, bàn làm việc."}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {photos.map((photo) => (
            <Link
              key={photo.link}
              href={photo.link}
              className="group relative aspect-square rounded-xs overflow-hidden bg-neutral-100 block"
            >
              <Image
                src={photo.image}
                alt={photo.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1440px) 25vw, 360px"
                className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                <span className="text-[10px] text-[#C5A880] uppercase tracking-wider font-semibold">
                  {photo.collection}
                </span>
                <h4 className="text-sm font-serif font-medium flex items-center justify-between">
                  <span>{photo.title}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#C5A880]" />
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
