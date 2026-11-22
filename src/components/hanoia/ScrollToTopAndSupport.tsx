"use client";

import React, { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";

export default function ScrollToTopAndSupport() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { settings } = useSettings();

  const supportSettings = {
    showScrollToTop: settings.showScrollToTop !== false,
    showSocialSupport: settings.showSocialSupport !== false,
    messengerUrl: settings.messengerUrl || "https://m.me/everie.vn",
    zaloNumber: settings.zaloNumber || "0908 188 188",
    supportPhone: settings.supportPhone || settings.hotline || "0908 188 188",
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed right-4 md:right-7 bottom-[calc(1.5rem+var(--sticky-bar-h,0px))] md:bottom-[calc(2rem+var(--sticky-bar-h,0px))] transition-[bottom] duration-300 z-40 flex flex-col items-center space-y-3 select-none">
      {/* 1. SOCIAL SUPPORT BUTTONS (Messenger, Zalo, Phone) */}
      {supportSettings.showSocialSupport && (
        <div className="flex flex-col items-center space-y-3">
          {/* Messenger Button */}
          <div className="relative group">
            <a
              href={supportSettings.messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-[46px] h-[46px] md:w-[50px] md:h-[50px] rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-md hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-108 cursor-pointer focus:outline-hidden"
              aria-label="Chat qua Facebook Messenger"
            >
              <svg width="26" height="26" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
              <radialGradient
                id="msg_grad"
                cx="101.9"
                cy="809"
                r="1.1"
                gradientTransform="matrix(800 0 0 -800 -81386 648000)"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" style={{ stopColor: "#09f" }} />
                <stop offset=".6" style={{ stopColor: "#a033ff" }} />
                <stop offset=".9" style={{ stopColor: "#ff5280" }} />
                <stop offset="1" style={{ stopColor: "#ff7061" }} />
              </radialGradient>
              <path
                fill="url(#msg_grad)"
                d="M400 0C174.7 0 0 165.1 0 388c0 116.6 47.8 217.4 125.6 287 6.5 5.8 10.5 14 10.7 22.8l2.2 71.2a32 32 0 0 0 44.9 28.3l79.4-35c6.7-3 14.3-3.5 21.4-1.6 36.5 10 75.3 15.4 115.8 15.4 225.3 0 400-165.1 400-388S625.3 0 400 0z"
              />
              <path
                fill="#FFF"
                d="m159.8 501.5 117.5-186.4a60 60 0 0 1 86.8-16l93.5 70.1a24 24 0 0 0 28.9-.1l126.2-95.8c16.8-12.8 38.8 7.4 27.6 25.3L522.7 484.9a60 60 0 0 1-86.8 16l-93.5-70.1a24 24 0 0 0-28.9.1l-126.2 95.8c-16.8 12.8-38.8-7.3-27.5-25.2z"
              />
            </svg>
          </a>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-black text-white text-[11px] font-medium tracking-wide rounded-xs shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Chat Messenger
          </span>
        </div>

        {/* Zalo Button */}
        <div className="relative group">
          <a
            href={`https://zalo.me/${(supportSettings.zaloNumber || "0908188188").replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-[46px] h-[46px] md:w-[50px] md:h-[50px] rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-md hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-108 cursor-pointer focus:outline-hidden"
            aria-label="Chat qua Zalo"
          >
            <svg width="28" height="12" viewBox="0 0 36 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18.6343 3.93038V3.24788H20.5901V12.8362H19.4721C19.2508 12.8367 19.0384 12.7454 18.8813 12.5825C18.7243 12.4196 18.6355 12.1984 18.6343 11.9672V11.9687C17.818 12.593 16.8322 12.9288 15.8205 12.9272C14.5565 12.9272 13.3441 12.4029 12.45 11.4695C11.5559 10.5361 11.0532 9.27 11.0525 7.94955C11.0532 6.6291 11.5559 5.36301 12.45 4.4296C13.3441 3.49619 14.5565 2.97185 15.8205 2.97185C16.8317 2.97066 17.8169 3.30644 18.6329 3.93038H18.6343ZM10.5458 0.166016V0.476932C10.5458 1.0563 10.4717 1.5295 10.1102 2.0846L10.0666 2.13617C9.94618 2.27726 9.82903 2.42139 9.71527 2.56841L3.43866 10.7978H10.5458V11.9626C10.5458 12.0775 10.5241 12.1912 10.482 12.2973C10.4398 12.4034 10.3781 12.4998 10.3003 12.5809C10.2225 12.6621 10.1301 12.7264 10.0285 12.7702C9.92686 12.814 9.81795 12.8364 9.70801 12.8362H0.5V12.2872C0.5 11.6153 0.65971 11.315 0.862977 11.0026L7.55192 2.35001H0.778767V0.166016H10.5472H10.5458ZM22.961 12.8362C22.7762 12.8362 22.5989 12.7595 22.4682 12.623C22.3375 12.4865 22.2641 12.3013 22.2641 12.1082V0.166016H24.3563V12.8362H22.961ZM30.5444 2.91118C31.1747 2.91098 31.7989 3.04048 32.3813 3.29228C32.9638 3.54408 33.493 3.91324 33.9389 4.37871C34.3848 4.84417 34.7385 5.39681 34.9799 6.00507C35.2213 6.61333 35.3456 7.2653 35.3458 7.92377C35.346 8.58223 35.222 9.23428 34.981 9.84269C34.7399 10.4511 34.3865 11.004 33.941 11.4697C33.4954 11.9355 32.9663 12.305 32.384 12.5571C31.8017 12.8093 31.1776 12.9392 30.5473 12.9394C29.2742 12.9398 28.0532 12.4119 27.1527 11.4719C26.2523 10.5318 25.7462 9.25662 25.7458 7.9268C25.7454 6.59698 26.2508 5.32146 27.1507 4.38085C28.0506 3.44024 29.2713 2.91159 30.5444 2.91118ZM15.822 10.8782C16.1956 10.8871 16.5672 10.8179 16.9149 10.6747C17.2626 10.5315 17.5794 10.3171 17.8466 10.0442C18.1139 9.77129 18.3262 9.44535 18.4712 9.08551C18.6162 8.72567 18.6909 8.3392 18.6909 7.94879C18.6909 7.55838 18.6162 7.17191 18.4712 6.81207C18.3262 6.45224 18.1139 6.12629 17.8466 5.85339C17.5794 5.58049 17.2626 5.36613 16.9149 5.2229C16.5672 5.07967 16.1956 5.01047 15.822 5.01935C15.0893 5.03677 14.3922 5.35305 13.8799 5.90053C13.3676 6.44801 13.0807 7.1832 13.0807 7.94879C13.0807 8.71438 13.3676 9.44957 13.8799 9.99705C14.3922 10.5445 15.0893 10.8608 15.822 10.8782ZM30.5444 10.8737C31.2933 10.8737 32.0116 10.5629 32.5412 10.0097C33.0708 9.45646 33.3683 8.70613 33.3683 7.92377C33.3683 7.1414 33.0708 6.39108 32.5412 5.83786C32.0116 5.28464 31.2933 4.97385 30.5444 4.97385C29.7954 4.97385 29.0771 5.28464 28.5475 5.83786C28.0179 6.39108 27.7204 7.1414 27.7204 7.92377C27.7204 8.70613 28.0179 9.45646 28.5475 10.0097C29.0771 10.5629 29.7954 10.8737 30.5444 10.8737Z"
                fill="#2288FF"
              />
            </svg>
          </a>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-black text-white text-[11px] font-medium tracking-wide rounded-xs shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Zalo: {supportSettings.zaloNumber || "0908 188 188"}
          </span>
        </div>

        {/* Hotline Phone Button */}
        <div className="relative group">
          <a
            href={`tel:${(supportSettings.supportPhone || "0908188188").replace(/[^0-9]/g, "")}`}
            className="w-[46px] h-[46px] md:w-[50px] md:h-[50px] rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-md hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-108 cursor-pointer focus:outline-hidden"
            aria-label={`Gọi Hotline ${supportSettings.supportPhone || "0908 188 188"}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.68715 17.2624C7.88236 18.4658 9.14893 19.5533 10.4868 20.525C11.8248 21.4878 13.1627 22.2499 14.5006 22.8115C15.8474 23.3821 17.1229 23.6673 18.3271 23.6673C19.1566 23.6673 19.9236 23.5202 20.6283 23.2261C21.3329 22.9319 21.9751 22.4728 22.5549 21.8488C22.876 21.4833 23.1391 21.0866 23.3443 20.6587C23.5583 20.2308 23.6654 19.8029 23.6654 19.3751C23.6654 19.072 23.5985 18.7778 23.4647 18.4925C23.3398 18.1984 23.1257 17.9488 22.8225 17.7437L18.9291 15.0026C18.6526 14.7975 18.3895 14.6504 18.1398 14.5613C17.8989 14.4632 17.6626 14.4142 17.4307 14.4142C17.1542 14.4142 16.8776 14.49 16.6011 14.6415C16.3336 14.7931 16.0571 15.0115 15.7716 15.2967L14.8618 16.1793C14.7281 16.313 14.5675 16.3798 14.3802 16.3798C14.2821 16.3798 14.1884 16.3665 14.0992 16.3397C14.019 16.3041 13.9431 16.2729 13.8718 16.2461C13.4882 16.0411 12.9888 15.6845 12.3733 15.1764C11.7579 14.6683 11.1335 14.0978 10.5002 13.4648C9.86694 12.8319 9.29164 12.2079 8.77431 11.5928C8.2659 10.9688 7.91358 10.4652 7.71735 10.0818C7.68167 10.0105 7.65046 9.93475 7.6237 9.85452C7.59694 9.77429 7.58356 9.68515 7.58356 9.58709C7.58356 9.4088 7.646 9.25726 7.77087 9.13246L8.66728 8.20982C8.9527 7.90673 9.17123 7.62147 9.32286 7.35404C9.47449 7.08661 9.5503 6.80581 9.5503 6.51163C9.5503 6.28878 9.49679 6.057 9.38975 5.81631C9.29164 5.56671 9.14447 5.29928 8.94824 5.01402L6.25902 1.21651C6.03603 0.913418 5.77291 0.690559 5.46965 0.547929C5.16638 0.405299 4.84528 0.333984 4.50634 0.333984C3.65007 0.333984 2.84286 0.699473 2.08471 1.43045C1.47818 2.0188 1.03221 2.674 0.746787 3.39607C0.470283 4.10922 0.332031 4.86694 0.332031 5.66923C0.332031 6.87267 0.608535 8.14296 1.16154 9.48012C1.72347 10.8173 2.48162 12.15 3.43601 13.4782C4.39931 14.8064 5.48302 16.0678 6.68715 17.2624Z"
                fill="#339901"
              />
            </svg>
          </a>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-black text-white text-[11px] font-medium tracking-wide rounded-xs shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Hotline: {supportSettings.supportPhone}
          </span>
        </div>
      </div>
      )}

      {/* 2. SCROLL TO TOP BUTTON (#toTop - Exact 1:1 SVG from Hanoia) */}
      {supportSettings.showScrollToTop && (
        <div
          className={`transition-all duration-300 ${
            showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <button
            onClick={scrollToTop}
            id="toTop"
            className="w-[46px] h-[46px] md:w-[50px] md:h-[50px] rounded-full bg-white dark:bg-neutral-900 border border-[#BFBFBF] dark:border-neutral-700 shadow-md hover:shadow-xl hover:border-black dark:hover:border-[#C5A880] flex items-center justify-center transition-all duration-200 hover:-translate-y-1 cursor-pointer group focus:outline-hidden relative"
            aria-label="Lên đầu trang"
          >
            <svg width="44" height="44" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="25.5" fill="currentColor" className="text-white dark:text-neutral-900" stroke="none" />
              <path d="M16 36L26 26L36 36" stroke="currentColor" className="text-black dark:text-neutral-200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 26L26 16L36 26" stroke="currentColor" className="text-black dark:text-neutral-200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-black text-white text-[11px] font-medium tracking-wide rounded-xs shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Lên đầu trang
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
