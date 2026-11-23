"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { useMounted } from "@/hooks/useMounted";
import { everieMenus as megaMenuItems } from "@/data/everieData";
import ThemeToggle from "@/components/common/ThemeToggle";

export default function MobileMenu() {
  const { mobileMenuOpen, setMobileMenuOpen, setCurrency } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { settings } = useSettings();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [menuList, setMenuList] = useState(megaMenuItems);
  const mounted = useMounted();

  useEffect(() => {
    fetch("/api/menus")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data && Array.isArray(res.data)) {
          setMenuList(res.data);
        }
      })
      .catch(() => {});
  }, []);

  if (!mobileMenuOpen) return null;

  const toggleSection = (label: string) => {
    setOpenSection(openSection === label ? null : label);
  };

  const getMenuLabel = (label: string) => {
    if (label === "CLASSIC FLOWERS" || label === "HÀNG MỚI") return t("nav.classic");
    if (label === "THEMED COLLECTION" || label === "QUÀ TẶNG") return t("nav.themed");
    if (label === "BESPOKE FLOWERS" || label === "TRANG TRÍ NHÀ") return t("nav.bespoke");
    if (label === "OUR STORY" || label === "CÂU CHUYỆN HANOIA") return t("nav.ourStory");
    return label;
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-[340px] bg-white dark:bg-neutral-950 h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e5e5e5] dark:border-neutral-800">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
            {settings.logoHeader &&
            settings.logoHeader !== "/images/hanoia/logo-lettering.png" ? (
              <Image
                src={settings.logoHeader}
                alt={settings.siteName || "EVERIE"}
                width={110}
                height={28}
                className="w-[110px] h-auto object-contain"
              />
            ) : (
              <span className="font-serif text-xl tracking-[0.28em] uppercase text-black dark:text-white">
                {settings.siteName || "EVERIE"}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-black dark:text-neutral-200 hover:opacity-70 focus:outline-hidden cursor-pointer"
            aria-label="Đóng menu"
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 7L7 25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M25 25L7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 6 Visible Menu Items */}
        <div className="flex-1 py-3 px-5 divide-y divide-neutral-100 dark:divide-neutral-800">
          {menuList.map((item) => (
            <div key={item.label} className="py-2.5">
              {item.columns ? (
                <div>
                  <button
                    onClick={() => toggleSection(item.label)}
                    className="w-full flex items-center justify-between text-left text-[13px] font-medium tracking-[0.5px] uppercase text-black dark:text-neutral-200 py-1"
                  >
                    <span>{getMenuLabel(item.label)}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                        openSection === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded Subcategories */}
                  {openSection === item.label && (
                    <div className="mt-2 pl-3 space-y-3 pb-2 border-l border-neutral-200 dark:border-neutral-700">
                      {item.columns.map((col) => (
                        <div key={col.title} className="space-y-1">
                          <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider pt-1">
                            {col.title}
                          </p>
                          {col.links.map((link) => (
                            <Link
                              key={link.text}
                              href={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-[13px] text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white py-1"
                            >
                              {link.text}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-[13px] font-medium tracking-[0.5px] uppercase text-black dark:text-neutral-200 py-1"
                >
                  {getMenuLabel(item.label)}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 space-y-3">
          <Link href="/ar" onClick={() => setMobileMenuOpen(false)} className="block border border-[#C5A880] px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-[#8C6D46] dark:text-[#C5A880]">{t("ar.nav.scan")}</Link>
          <Link href="/gallery" onClick={() => setMobileMenuOpen(false)} className="block text-center text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-300">{t("ar.nav.gallery")}</Link>
        </div>

        {/* Drawer Footer: admin (if any) + support + language */}
        <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-3">
          {mounted && (
            <div className="flex items-center justify-between pt-1 gap-3">
              {isAuthenticated && user ? (
                <>
                  <Link
                    href={user.role === "SUPER_ADMIN" || user.role === "CONTENT_EDITOR" ? "/admin" : "/account"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-semibold uppercase tracking-wider text-[#C5A880] truncate"
                  >
                    {user.role === "SUPER_ADMIN" || user.role === "CONTENT_EDITOR"
                      ? t("header.adminCms")
                      : `${t("header.account")} · ${user.name}`}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-red-600 hover:underline cursor-pointer shrink-0"
                  >
                    {t("header.logout")}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold uppercase tracking-wider"
                >
                  {t("header.signIn")}
                </Link>
              )}
            </div>
          )}

          {/* Quick Support Links */}
          <div className="grid grid-cols-2 gap-2 py-2 border-t border-neutral-200 dark:border-neutral-800 text-center text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-medium">
            <Link
              href="/policies"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-black dark:hover:text-white"
            >
              {t("nav.policies")}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-black dark:hover:text-white"
            >
              {t("nav.contact")}
            </Link>
          </div>

          {/* Theme Toggle for Mobile */}
          <div className="flex items-center justify-center pt-1">
            <ThemeToggle variant="pill" />
          </div>

          {/* Language Switcher */}
          <div className="flex items-center justify-center space-x-2 text-xs font-medium">
            <button
              onClick={() => {
                setLanguage("vi");
                setCurrency("VND");
              }}
              className={`transition-colors cursor-pointer ${
                language === "vi" ? "text-black dark:text-white font-semibold" : "text-[#999999]"
              }`}
            >
              VN
            </button>
            <span className="text-[#999999]">|</span>
            <button
              onClick={() => {
                setLanguage("en");
                setCurrency("USD");
              }}
              className={`transition-colors cursor-pointer ${
                language === "en" ? "text-black dark:text-white font-semibold" : "text-[#999999]"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
