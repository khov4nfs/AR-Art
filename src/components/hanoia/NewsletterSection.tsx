"use client";

import React, { useState } from "react";
import { Mail, Check, ShieldCheck, Truck, Sparkles, Gift } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

export default function NewsletterSection() {
  const { showToast } = useCart();
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const isEn = language === "en";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      showToast(t("common.required"));
      return;
    }
    setSubscribed(true);
    showToast(t("home.newsletterSuccess"));
    setEmail("");
  };

  const perks = [
    {
      icon: Truck,
      title: isEn ? "Craft then ship" : "Chế tác rồi giao",
      desc: isEn
        ? "Making 14–45 days, then 2–5 days on the road"
        : "Chế tác 14–45 ngày, rồi giao 2–5 ngày",
    },
    {
      icon: ShieldCheck,
      title: isEn ? "Anti-break packing" : "Đóng gói chống vỡ",
      desc: isEn
        ? "Rigid box, foam, film the unboxing"
        : "Hộp cứng, foam, nhắc quay video lúc mở hộp",
    },
    {
      icon: Gift,
      title: isEn ? "Gift-ready" : "Đóng gói sang trọng",
      desc: isEn
        ? "Gift box and a handwritten card on request"
        : "Hộp quà & thiệp viết tay theo yêu cầu",
    },
    {
      icon: Sparkles,
      title: "Bespoke Flowers",
      desc: isEn
        ? "Send a brief, up to 3 revisions, 30–45 days"
        : "Gửi yêu cầu, sửa tối đa 3 lần, 30–45 ngày",
    },
  ];

  return (
    <section className="bg-black text-white py-20 px-4 md:px-8 border-t border-neutral-900">
      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-16 border-b border-neutral-800">
          {perks.map((perk) => {
            const Icon = perk.icon;
            return (
              <div key={perk.title} className="flex flex-col items-center text-center space-y-2 p-4">
                <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#C5A880] mb-1">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold tracking-wider uppercase font-serif text-white">
                  {perk.title}
                </h4>
                <p className="text-xs text-neutral-400 font-light max-w-xs">
                  {perk.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="pt-16 max-w-2xl mx-auto text-center space-y-5">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
            EVERIE
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-light tracking-wide uppercase text-white">
            {t("home.newsletterTitle")}
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 font-light leading-relaxed">
            {isEn
              ? "Hear about new ceramic flowers and how to care for glaze."
              : t("home.newsletterDesc")}
          </p>

          {subscribed ? (
            <div className="p-4 bg-neutral-900 border border-[#C5A880]/50 rounded-xs flex items-center justify-center space-x-2 text-[#C5A880] text-sm animate-fade-in">
              <Check className="w-5 h-5" />
              <span>{t("home.newsletterSuccess")}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("home.newsletterPlaceholder")}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 text-xs tracking-wider focus:outline-hidden focus:border-[#C5A880] transition-colors rounded-xs"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3.5 bg-[#C5A880] text-black text-xs uppercase tracking-[2px] font-bold hover:bg-white transition-colors duration-200 rounded-xs shrink-0"
              >
                {t("home.newsletterCta")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
