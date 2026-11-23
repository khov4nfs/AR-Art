"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useMounted } from "@/hooks/useMounted";
import { useSettings } from "@/context/SettingsContext";
import { everieMenus as megaMenuItems } from "@/data/everieData";
import { SiteSettings } from "@/lib/store";
import ThemeToggle from "@/components/common/ThemeToggle";

export default function Header({
  initialSettings,
}: {
  initialSettings?: Partial<SiteSettings>;
} = {}) {
  const {
    cartCount,
    setCartOpen,
    setSearchOpen,
    setMobileMenuOpen,
    setCurrency,
  } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { settings: contextSettings } = useSettings();

  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuList, setMenuList] = useState(megaMenuItems);
  const mounted = useMounted();
  const compactHeader = mounted && isAuthenticated;
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const siteSettings = initialSettings
    ? { ...contextSettings, ...initialSettings }
    : contextSettings;

  // Fetch dynamic CMS menus
  useEffect(() => {
    fetch("/api/menus")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data && Array.isArray(res.data))
          setMenuList(res.data);
      })
      .catch(() => {});
  }, []);

  const getMenuLabel = (label: string) => {
    if (label === "CLASSIC FLOWERS" || label === "HÀNG MỚI") return t("nav.classic");
    if (label === "THEMED COLLECTION" || label === "QUÀ TẶNG") return t("nav.themed");
    if (label === "BESPOKE FLOWERS" || label === "TRANG TRÍ NHÀ") return t("nav.bespoke");
    if (label === "OUR STORY" || label === "CÂU CHUYỆN HANOIA") return t("nav.ourStory");
    return label;
  };

  // Rotating announcements on top bar
  const defaultAnnouncements = [
    { text: t("ticker.1"), href: "/" },
    { text: t("ticker.2"), href: "/classic" },
    { text: t("ticker.3"), href: "/themed" },
    { text: t("ticker.4"), href: "/bespoke" },
    { text: t("ticker.5"), href: "/lookup" },
  ];

  const announcements =
    siteSettings?.announcements && siteSettings.announcements.length > 0
      ? siteSettings.announcements
          .filter((a) => a.active !== false)
          .map((a) => ({ text: a.text, href: a.link }))
      : defaultAnnouncements;

  // Rotate announcements
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [announcements.length]);

  // Sticky header: hysteresis avoids hide/show jitter when top bar height changes
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setIsScrolled((prev) => {
          if (!prev && y > 72) return true;
          if (prev && y < 12) return false;
          return prev;
        });
        ticking = false;
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveMegaMenu(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 200);
  };

  return (
    <>
      {/* Top announcement — scrolls away naturally (not sticky) → no hide/show jitter */}
      <div className="bg-[#000000] dark:bg-[#1A1A1D] text-white flex items-center justify-center px-4 h-8">
        <div className="text-center overflow-hidden">
          <Link
            href={announcements[tickerIndex]?.href || "/"}
            className="inline-block transition-opacity duration-500 ease-in-out hover:underline"
            suppressHydrationWarning
          >
            <strong
              className="text-[12px] font-semibold text-white tracking-wide"
              suppressHydrationWarning
            >
              {announcements[tickerIndex]?.text}
            </strong>
          </Link>
        </div>
      </div>

      {/* Main header — sticky, fixed height (no compact resize on scroll) */}
      <div className="sticky top-0 z-50 w-full bg-white dark:bg-neutral-950 font-sans select-none">
      <header
        className={`w-full h-[72px] bg-white dark:bg-neutral-950 border-b border-[#e5e5e5] dark:border-neutral-800 relative ${
          isScrolled ? "shadow-md" : "shadow-xs"
        }`}
      >
        <div className="max-w-[1440px] h-full mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between">
          {/* LEFT: Logo only — site name removed from header row to free nav space */}
          <div className="logo__container shrink-0 pr-3 flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-hidden"
              aria-label={siteSettings?.siteName || "EVERIE Trang chủ"}
            >
              {siteSettings?.logoHeader &&
              siteSettings.logoHeader !== "/images/hanoia/logo-lettering.png" ? (
                <Image
                  src={siteSettings.logoHeader}
                  alt={siteSettings?.siteName || "EVERIE"}
                  width={130}
                  height={32}
                  priority
                  className="h-auto w-[110px] md:w-[120px] object-contain"
                />
              ) : (
                <span className="font-serif text-xl md:text-2xl tracking-[0.28em] uppercase text-black dark:text-white">
                  {siteSettings?.siteName || "EVERIE"}
                </span>
              )}
            </Link>
          </div>

          {/* CENTER: Collapse sooner for signed-in users to make room for account controls. */}
          <nav className={`hidden ${compactHeader ? "min-[1440px]:flex" : "xl:flex"} flex-1 items-center justify-center h-full min-w-0 gap-x-2 2xl:gap-x-4`}>
            {menuList.map((item) => {
              const hasDropdown = Boolean(item.columns || item.featuredImage);
              const isActive = activeMegaMenu === item.label;

              return (
                <div
                  key={item.label}
                  className="h-full flex items-center relative group shrink-0"
                  onMouseEnter={() =>
                    hasDropdown && handleMouseEnter(item.label)
                  }
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={item.href}
                    className="whitespace-nowrap text-[11px] xl:text-[12px] 2xl:text-[12.5px] font-medium tracking-[0.6px] xl:tracking-[0.8px] text-black dark:text-neutral-200 hover:opacity-70 transition-opacity uppercase py-2 leading-none"
                  >
                    <span suppressHydrationWarning>
                      {getMenuLabel(item.label)}
                    </span>
                  </Link>

                  {/* MEGA MENU DROPDOWN */}
                  {hasDropdown && isActive && (
                    <div
                      className="fixed left-0 right-0 top-full w-full bg-white dark:bg-neutral-950 shadow-2xl border-t border-[#e5e5e5] dark:border-neutral-800 py-8 px-6 lg:px-12 z-50 animate-fade-in"
                      onMouseEnter={() => handleMouseEnter(item.label)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="max-w-[1240px] mx-auto grid grid-cols-12 gap-8 items-start">
                        {/* Subcategory Links */}
                        <div
                          className={`${
                            item.featuredImage ? "col-span-8" : "col-span-12"
                          } grid ${
                            item.columns && item.columns.length > 1
                              ? "grid-cols-2"
                              : "grid-cols-1"
                          } gap-8`}
                        >
                          {item.columns?.map((col) => (
                            <div key={col.title} className="space-y-3">
                              <h4 className="text-[12.5px] font-bold text-black dark:text-white uppercase tracking-wider pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                                {col.title}
                              </h4>
                              <ul className="space-y-2">
                                {col.links.map((link) => (
                                  <li key={link.text}>
                                    <Link
                                      href={link.href}
                                      onClick={() => setActiveMegaMenu(null)}
                                      className="text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:underline transition-colors block py-0.5"
                                    >
                                      {link.text}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        {/* Promo Image */}
                        {item.featuredImage && (
                          <div className="col-span-4 pl-6 border-l border-neutral-100 flex flex-col items-center">
                            <Link
                              href={item.href}
                              onClick={() => setActiveMegaMenu(null)}
                              className="block w-full overflow-hidden rounded-xs group/banner"
                            >
                              <div className="relative aspect-[4/3] w-full bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
                                <Image
                                  src={item.featuredImage}
                                  alt={item.label}
                                  fill
                                  sizes="(max-width: 1240px) 33vw, 400px"
                                  className="object-cover group-hover/banner:scale-102 transition-transform duration-300"
                                />
                              </div>
                            </Link>
                            {item.featuredText && (
                              <p className="mt-2.5 text-xs text-neutral-500 font-serif italic text-center">
                                {item.featuredText}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <Link href="/ar" title="Trải nghiệm AR" className="hidden xl:inline-flex shrink-0 items-center whitespace-nowrap border border-[#C5A880] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#8C6D46] dark:text-[#C5A880] transition hover:bg-[#C5A880] hover:text-black">{mounted && isAuthenticated ? "AR" : "Trải nghiệm AR"}</Link>
          </nav>

          {/* RIGHT SIDE: Smaller horizontal gaps keep lookup clear of the AR CTA at xl. */}
          <div className="flex shrink-0 items-center space-x-3 sm:space-x-4 xl:space-x-2 2xl:space-x-3">
            <Link
              href="/lookup"
              className="hidden md:inline-block text-[11px] xl:text-[12px] font-medium tracking-[0.8px] uppercase text-black dark:text-neutral-200 hover:text-[#C5A880] transition-colors whitespace-nowrap"
            >
              <span suppressHydrationWarning>{t("nav.lookup")}</span>
            </Link>

            {/* 1. Search Icon Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="text-black dark:text-neutral-200 hover:opacity-75 transition-opacity p-1 cursor-pointer flex items-center justify-center focus:outline-hidden"
              aria-label="Tìm kiếm"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.7061 19.293L17.0241 15.611C18.4641 13.8095 19.1597 11.5249 18.9679 9.22654C18.776 6.92817 17.7113 4.79051 15.9925 3.25267C14.2736 1.71483 12.0312 0.893565 9.72568 0.957581C7.4202 1.0216 5.22675 1.96603 3.5959 3.59688C1.96505 5.22773 1.02062 7.42118 0.956605 9.72666C0.892589 12.0321 1.71385 14.2746 3.25169 15.9935C4.78953 17.7123 6.92719 18.777 9.22557 18.9688C11.5239 19.1607 13.8085 18.4651 15.6101 17.025L19.2921 20.707L20.7061 19.293ZM9.99906 17C8.61459 17 7.26121 16.5895 6.11007 15.8203C4.95892 15.0512 4.06172 13.9579 3.5319 12.6788C3.00209 11.3997 2.86347 9.99227 3.13356 8.6344C3.40366 7.27654 4.07034 6.02926 5.04931 5.05029C6.02828 4.07132 7.27556 3.40464 8.63343 3.13454C9.99129 2.86444 11.3988 3.00307 12.6778 3.53288C13.9569 4.06269 15.0502 4.9599 15.8193 6.11104C16.5885 7.26219 16.9991 8.61557 16.9991 10C16.9969 11.8559 16.2588 13.6351 14.9465 14.9474C13.6342 16.2597 11.8549 16.9979 9.99906 17Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            {/* Account state: staff → CMS + sign out; customer → account; guest → sign in */}
            {mounted && (
              <div className="flex items-center gap-3" data-testid="header-account">
                {isAuthenticated && user ? (
                  <>
                    {user.role === "SUPER_ADMIN" || user.role === "CONTENT_EDITOR" ? (
                      <Link
                        href="/admin"
                        className="hidden sm:inline text-[11px] xl:text-[12px] font-medium tracking-[0.8px] uppercase text-[#C5A880] hover:opacity-80 transition-opacity whitespace-nowrap"
                      >
                        {t("header.adminCms")}
                      </Link>
                    ) : null}
                    <Link
                      href="/account"
                      aria-label={t("header.account")}
                      title={t("header.account")}
                      className="flex items-center gap-1.5 text-[11px] xl:text-[12px] font-medium tracking-[0.8px] uppercase hover:text-[#C5A880] transition-colors whitespace-nowrap"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#C5A880] text-black text-[11px] font-semibold flex items-center justify-center">
                        {(user.name || user.email).trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="hidden lg:inline max-w-[110px] truncate normal-case">
                        {(user.name || "").split(" ").slice(-1)[0]}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="hidden sm:inline text-[11px] xl:text-[12px] font-medium tracking-[0.8px] uppercase text-neutral-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {t("header.logout")}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="hidden sm:inline text-[11px] xl:text-[12px] font-medium tracking-[0.8px] uppercase hover:text-[#C5A880] transition-colors whitespace-nowrap"
                  >
                    {t("header.signIn")}
                  </Link>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle variant="icon" className="hidden sm:flex" />

            {/* 3. Language Switcher: VN | EN */}
            <div className="flex items-center text-[13px] font-medium tracking-wide">
              <button
                onClick={() => {
                  setLanguage("vi");
                  setCurrency("VND");
                }}
                className={`transition-colors cursor-pointer ${
                  language === "vi"
                    ? "text-black dark:text-white font-semibold"
                    : "text-[#999999] hover:text-black dark:hover:text-white"
                }`}
              >
                VN
              </button>
              <span className="text-[#999999] mx-1.5">|</span>
              <button
                onClick={() => {
                  setLanguage("en");
                  setCurrency("USD");
                }}
                className={`transition-colors cursor-pointer ${
                  language === "en"
                    ? "text-black dark:text-white font-semibold"
                    : "text-[#999999] hover:text-black dark:hover:text-white"
                }`}
              >
                EN
              </button>
            </div>

            {/* 4. Shopping Cart: Icon + (0) */}
            <div className="minicart-wrapper flex items-center">
              <button
                onClick={() => setCartOpen(true)}
                className="action showcart flex items-center text-black dark:text-neutral-200 hover:opacity-75 transition-opacity focus:outline-hidden cursor-pointer"
                aria-label={t("header.cart")}
              >
                <div className="cart-icon flex items-center">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.5 21.75C8.32843 21.75 9 21.0784 9 20.25C9 19.4216 8.32843 18.75 7.5 18.75C6.67157 18.75 6 19.4216 6 20.25C6 21.0784 6.67157 21.75 7.5 21.75Z"
                      fill="currentColor"
                    />
                    <path
                      d="M17.25 21.75C18.0784 21.75 18.75 21.0784 18.75 20.25C18.75 19.4216 18.0784 18.75 17.25 18.75C16.4216 18.75 15.75 19.4216 15.75 20.25C15.75 21.0784 16.4216 21.75 17.25 21.75Z"
                      fill="currentColor"
                    />
                    <path
                      d="M3.96429 6.75H20.7857L18.3108 15.4121C18.2213 15.7255 18.0321 16.0012 17.7718 16.1975C17.5116 16.3938 17.1945 16.5 16.8685 16.5H7.88145C7.55549 16.5 7.23839 16.3938 6.97816 16.1975C6.71792 16.0012 6.52872 15.7255 6.43917 15.4121L3.04827 3.54396C3.0035 3.38725 2.90889 3.24939 2.77878 3.15124C2.64866 3.05309 2.49011 3 2.32713 3H0.75"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="counter qty text-[13.5px] font-semibold leading-none ml-1 text-black dark:text-neutral-200">
                  ({mounted ? cartCount : 0})
                </span>
              </button>
            </div>

            {/* 5. Mobile Hamburger Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`${compactHeader ? "min-[1440px]:hidden" : "xl:hidden"} flex flex-col justify-center items-center w-7 h-7 space-y-1 focus:outline-hidden cursor-pointer ml-1`}
              aria-label="Mở Menu"
            >
              <span className="w-5 h-[1.5px] bg-black dark:bg-neutral-200 block" />
              <span className="w-5 h-[1.5px] bg-black dark:bg-neutral-200 block" />
              <span className="w-5 h-[1.5px] bg-black dark:bg-neutral-200 block" />
            </button>
          </div>
        </div>
      </header>
      </div>
    </>
  );
}
