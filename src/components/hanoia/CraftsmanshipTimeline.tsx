"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, Layers, Award, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CraftsmanshipTimeline() {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: "01",
      title: isEn ? "Shape the flower" : "Nặn dáng",
      subtitle: isEn
        ? "Petals and base, one piece at a time"
        : "Cánh hoa và đế, từng đóa một",
      desc: isEn
        ? "Artisans in Thanh Hà shape Classic, Themed, or a Bespoke drawing by hand. Clay is local; the form is not moulded in bulk."
        : "Nghệ nhân làng gốm Thanh Hà nặn cánh hoa và đế theo mẫu Classic, Themed hoặc bản vẽ Bespoke. Đất sét địa phương, không đúc hàng loạt.",
      image: "/images/hanoia/heritage-craft.webp",
      duration: isEn ? "3–7 days" : "3–7 ngày",
    },
    {
      number: "02",
      title: isEn ? "Dry and fire" : "Phơi và nung",
      subtitle: isEn
        ? "Bisque, stone glaze, wood kiln"
        : "Nung sơ, men đá, lò củi",
      desc: isEn
        ? "The piece dries, takes a first firing, then stone glaze and a second wood firing. Colour settles in the kiln — close to the swatch, never identical."
        : "Phôi phơi, nung sơ, phủ men đá, nung lần hai trong lò củi. Màu men ổn định sau lửa — gần mẫu, không trùng tuyệt đối.",
      image: "/images/hanoia/heritage-creativity.webp",
      duration: isEn ? "7–14 days" : "7–14 ngày",
    },
    {
      number: "03",
      title: isEn ? "Engrave the base" : "Khắc chữ",
      subtitle: isEn
        ? "Name, letters, or a mark — after the glaze cools"
        : "Tên, chữ hoặc ký hiệu — khi men đã nguội",
      desc: isEn
        ? "Engraving sits on a fixed zone of the base, after glaze is stable. Once the order is confirmed the text cannot change."
        : "Chữ được khắc trên vùng đế cố định sau khi men ổn. Sau khi xác nhận đơn, nội dung không đổi.",
      image: "/images/hanoia/product-vase-monument.webp",
      duration: isEn ? "1–3 days" : "1–3 ngày",
    },
    {
      number: "04",
      title: isEn ? "Pack against breakage" : "Đóng gói chống vỡ",
      subtitle: isEn
        ? "Foam, rigid box, unboxing film"
        : "Foam, hộp cứng, quay video mở hộp",
      desc: isEn
        ? "Ceramic flowers chip. We wrap foam, a rigid box, and paper fill. The shipping email asks you to film the unboxing."
        : "Hoa gốm dễ vỡ. Bọc foam, hộp cứng, chèn giấy. Email giao hàng nhắc quay video lúc mở hộp.",
      image: "/images/hanoia/hero-banner-3.webp",
      duration: isEn ? "1–2 days" : "1–2 ngày",
    },
  ];

  return (
    <section className="py-20 bg-neutral-950 text-white overflow-hidden border-t border-neutral-900" id="craftsmanship-story">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold flex items-center justify-center space-x-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? "From Clay to Flower" : "Từ đất sét đến đóa hoa"}</span>
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-light tracking-wide uppercase text-white">
            {isEn ? "Handmade ceramic" : "Hoa gốm thủ công"}
          </h2>
          <div className="w-12 h-0.5 bg-[#C5A880] mx-auto" />
          <p className="text-xs md:text-sm text-neutral-400 font-light max-w-xl mx-auto">
            {isEn
              ? "Classic 14–21 days, Themed 21–28, Bespoke 30–45. Engraving after the glaze has settled."
              : "Classic 14–21 ngày, Themed 21–28, Bespoke 30–45. Khắc chữ sau khi men đã ổn."}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-10">
          {steps.map((step, idx) => (
            <button
              key={step.number}
              onClick={() => setActiveStep(idx)}
              className={`p-3 md:p-4 text-left rounded-xs transition-all border ${
                activeStep === idx
                  ? "bg-neutral-900 border-[#C5A880] shadow-lg translate-y-[-2px]"
                  : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono text-[#C5A880] mb-1">
                <span>{step.number}</span>
                <Clock className="w-3 h-3 text-neutral-500" />
              </div>
              <h4 className="text-xs md:text-sm font-serif font-normal text-white line-clamp-1">
                {step.title}
              </h4>
            </button>
          ))}
        </div>

        <div className="bg-neutral-900/70 border border-neutral-800 rounded-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 md:p-10">
          <div className="lg:col-span-6 relative aspect-[16/10] rounded-xs overflow-hidden bg-neutral-950 border border-neutral-800">
            <Image
              src={steps[activeStep].image}
              alt={steps[activeStep].title}
              fill
              sizes="(max-width: 1024px) 100vw, 650px"
              className="object-cover object-center animate-fade-in"
            />
            <div className="absolute top-4 left-4 bg-black/80 px-3 py-1 text-xs text-[#C5A880] font-mono rounded-xs border border-neutral-800">
              {isEn ? "Time:" : "Thời gian:"} {steps[activeStep].duration}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4 animate-fade-in">
            <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#C5A880]">
              <Layers className="w-4 h-4" />
              <span>
                {isEn ? "Stage" : "Giai đoạn"} {steps[activeStep].number} / 04
              </span>
            </div>
            <h3 className="text-2xl md:text-4xl font-serif font-light text-white tracking-wide">
              {steps[activeStep].title}
            </h3>
            <p className="text-sm text-[#C5A880] font-serif italic">
              {steps[activeStep].subtitle}
            </p>
            <p className="text-xs md:text-sm text-neutral-300 font-light leading-relaxed">
              {steps[activeStep].desc}
            </p>

            <div className="pt-3 border-t border-neutral-800 flex items-center space-x-3 text-xs text-neutral-400">
              <Award className="w-4 h-4 text-[#C5A880]" />
              <span>
                {isEn
                  ? "Made with artisans of Thanh Hà pottery village, Hoi An"
                  : "Làm cùng nghệ nhân làng gốm Thanh Hà, Hội An"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
