"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { SiteSettings } from "@/lib/store";

function SocialGlyph({
  className,
  path,
}: {
  className?: string;
  path: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const FACEBOOK_PATH =
  "M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4V10c0-.6.4-1 1-1Z";
const INSTAGRAM_PATH =
  "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8ZM17.35 6.4a.95.95 0 1 1-.95.95.95.95 0 0 1 .95-.95Z";
const TIKTOK_PATH =
  "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.16 16.2a6.34 6.34 0 0 0 10.67 4.61V8.73a8.19 8.19 0 0 0 4.77 1.52V6.79a4.84 4.84 0 0 1-1.01-.1Z";

export default function Footer({
  initialSettings,
}: {
  initialSettings?: Partial<SiteSettings>;
} = {}) {
  const { t, language } = useLanguage();
  const { settings: contextSettings } = useSettings();
  const settings = initialSettings
    ? { ...contextSettings, ...initialSettings }
    : contextSettings;
  const isEn = language === "en";
  const brand = settings?.siteName || "EVERIE";

  const socials = [
    { href: settings?.facebookUrl, label: "Facebook", path: FACEBOOK_PATH },
    { href: settings?.instagramUrl, label: "Instagram", path: INSTAGRAM_PATH },
    { href: settings?.tiktokUrl, label: "TikTok", path: TIKTOK_PATH },
  ].filter((item): item is typeof item & { href: string } => Boolean(item.href));

  const classicLinks = [
    { text: "Hoa Tulip", href: "/classic/tulip" },
    { text: "Hoa Sen", href: "/classic/sen" },
    { text: "Hoa Hồng", href: "/classic/hong" },
    { text: "Hoa Lan Hồ Điệp", href: "/classic/lan" },
    { text: "Hoa Mẫu Đơn", href: "/classic/mau-don" },
  ];

  const themedLinks = [
    { text: "PHẤP", href: "/themed/phap" },
    { text: "DỆT", href: "/themed/det" },
    { text: "VANG", href: "/themed/vang" },
    { text: isEn ? "Festival set" : "Bộ Lễ hội", href: "/themed/bo-le-hoi" },
  ];

  const bespokeLinks = [
    { text: isEn ? "Begin Bespoke" : "Gửi yêu cầu", href: "/bespoke/request" },
    { text: t("bespoke.steps"), href: "/bespoke" },
    { text: t("nav.ourStory"), href: "/heritage" },
  ];

  const policyLinks = [
    { text: t("footer.shippingPolicy"), href: "/policies?tab=shipping" },
    { text: t("footer.returnPolicy"), href: "/policies?tab=returns" },
    { text: t("footer.warrantyPolicy"), href: "/policies?tab=warranty" },
    {
      text: isEn ? "Ceramic flower care" : "Bảo quản hoa gốm",
      href: "/policies?tab=care",
    },
    { text: t("footer.privacyPolicy"), href: "/policies?tab=privacy" },
    { text: t("footer.contact"), href: "/contact" },
    { text: t("nav.lookup"), href: "/lookup" },
  ];

  return (
    <footer
      className="bg-[#F4F3EF] dark:bg-neutral-950 text-neutral-800 dark:text-neutral-300 pt-16 pb-12 border-t border-neutral-300 dark:border-neutral-800"
      id="stores"
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-16 border-b border-neutral-300 dark:border-neutral-800">
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-1.5">
              {settings?.logoFooter &&
              settings.logoFooter !== "/images/hanoia/logo-lettering.png" ? (
                <div className="relative w-40 h-10">
                  <Image
                    src={settings.logoFooter}
                    alt={brand}
                    fill
                    sizes="160px"
                    className="object-contain object-left"
                  />
                </div>
              ) : (
                <div className="font-serif text-2xl tracking-[0.28em] uppercase text-neutral-900 dark:text-white">
                  {brand}
                </div>
              )}
              {settings?.siteName && (
                <div className="font-serif font-bold text-xs tracking-[0.2em] text-neutral-900 dark:text-neutral-100 pt-1 uppercase">
                  {settings.siteName}
                </div>
              )}
              {settings?.siteTagline && (
                <p className="text-[11px] text-[#8C6D46] font-medium italic">
                  {settings.siteTagline}
                </p>
              )}
            </div>
            <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-light leading-relaxed max-w-sm pt-1">
              {t("footer.desc")}
            </p>
            <div className="pt-3 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-[2px] text-black dark:text-white border-b border-neutral-300 dark:border-neutral-700 pb-2 max-w-sm">
                {t("nav.ourStory")}
              </h4>
              <Link
                href="/heritage"
                className="text-xs text-neutral-600 dark:text-neutral-400 font-light hover:text-black dark:hover:text-white transition-colors"
              >
                {t("nav.ourStory")}
              </Link>
            </div>
            <div className="pt-2 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
              <p className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-400" />
                <span>
                  {t("footer.hotline")}: {settings?.hotline || "0908 188 188"} (
                  {settings?.workingHours || "9:00 - 18:00"})
                </span>
              </p>
              <p className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-400" />
                <span>
                  {t("footer.email")}: {settings?.email || "hello@everie.vn"}
                </span>
              </p>
              <div className="pt-3 space-y-1">
                <strong
                  className="text-neutral-900 dark:text-neutral-200 font-medium block"
                  suppressHydrationWarning
                >
                  {isEn ? "Thanh Hà workshop" : "Xưởng Thanh Hà"}
                </strong>
                <p className="text-neutral-600" suppressHydrationWarning>
                  {isEn
                    ? "Thanh Hà pottery village, Hoi An. Orders on the website — no showroom chain."
                    : "Làng gốm Thanh Hà, Hội An. Đặt trên website — không chuỗi showroom."}
                </p>
              </div>
            </div>
            {socials.length > 0 && (
              <div className="flex items-center gap-3 pt-2">
                {socials.map(({ href, label, path }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-black hover:text-white hover:border-black dark:hover:bg-[#C5A880] dark:hover:text-black transition-colors"
                  >
                    <SocialGlyph className="w-3.5 h-3.5" path={path} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[2px] text-black dark:text-white border-b border-neutral-300 dark:border-neutral-700 pb-2">
              {t("nav.classic")}
            </h4>
            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 font-light">
              {classicLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-black dark:hover:text-white transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[2px] text-black dark:text-white border-b border-neutral-300 dark:border-neutral-700 pb-2">
              {t("nav.themed")}
            </h4>
            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 font-light">
              {themedLinks.map((link) => (
                <li key={link.href + link.text}>
                  <Link
                    href={link.href}
                    className="hover:text-black dark:hover:text-white transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[2px] text-black dark:text-white border-b border-neutral-300 dark:border-neutral-700 pb-2">
              {t("nav.bespoke")}
            </h4>
            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 font-light">
              {bespokeLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-black dark:hover:text-white transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[2px] text-black dark:text-white border-b border-neutral-300 dark:border-neutral-700 pb-2">
              {t("footer.support")}
            </h4>
            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 font-light">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-black dark:hover:text-white transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <a
                href={settings?.bctCertificateUrl || "http://online.gov.vn"}
                target="_blank"
                rel="noreferrer"
                className="inline-block relative w-36 h-14"
              >
                <Image
                  src={
                    settings?.bctBadgeImage || "/images/hanoia/logo-bct.webp"
                  }
                  alt="Đã thông báo Bộ Công Thương"
                  fill
                  sizes="144px"
                  className="object-contain object-left"
                />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 space-y-4 md:space-y-0 font-light">
          <p>
            {(language === "en"
              ? settings?.copyrightEn
              : settings?.copyrightVi) || t("footer.copyrightLegal")}
          </p>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>{t("footer.rights", { name: brand })}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
