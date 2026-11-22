"use client";

import React from "react";
import { Quote } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PressMentions() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const reviews = [
    {
      source: "ELLE DECORATION",
      quote: isEn
        ? "EVERIE keeps a flower after the day has passed — clay from Thanh Hà, glaze that does not wilt, a name cut into the base."
        : "EVERIE giữ một đóa hoa sau ngày đã qua — đất sét Thanh Hà, men không héo, tên khắc trên đế.",
      author: isEn ? "Design editor" : "Biên tập viên Thiết kế",
    },
    {
      source: "HARPER'S BAZAAR",
      quote: isEn
        ? "Fourteen to forty-five days of shaping, firing and packing. Luxury here is patience, not shine."
        : "Mười bốn đến bốn mươi lăm ngày nặn, nung và đóng gói. Sự xa xỉ ở đây là sự kiên nhẫn, không phải độ bóng.",
      author: isEn ? "Living arts" : "Chuyên mục Nghệ thuật sống",
    },
    {
      source: "ROBB REPORT VIETNAM",
      quote: isEn
        ? "Classic, Themed, Bespoke — three lines, one village kiln, and a flower meant to stay with time."
        : "Classic, Themed, Bespoke — ba dòng, một lò làng, và một đóa hoa ở lại cùng thời gian.",
      author: isEn ? "Lifestyle special" : "Đặc san Phong cách sống",
    },
  ];

  return (
    <section className="py-20 bg-white border-t border-neutral-200">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
            {isEn ? "Press & collectors" : "Báo chí & người yêu gốm"}
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-light uppercase tracking-wide">
            {isEn
              ? "Words on ceramic flowers"
              : "Lời viết về hoa gốm"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev) => (
            <div
              key={rev.source}
              className="bg-[#F8F7F4] border border-neutral-200 p-8 rounded-xs flex flex-col justify-between space-y-4 hover:shadow-lg transition-all"
            >
              <Quote className="w-8 h-8 text-[#C5A880]" />
              <p className="font-serif italic text-xs md:text-sm text-neutral-800 leading-relaxed font-light">
                &ldquo;{rev.quote}&rdquo;
              </p>
              <div className="pt-4 border-t border-neutral-300">
                <p className="text-xs font-bold uppercase tracking-[2px] text-black">
                  {rev.source}
                </p>
                <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                  {rev.author}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
