"use client";

import { useLanguage } from "@/context/LanguageContext";

/** Uses the storefront language state and the same persisted language cookie. */
export function ArLanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div
      role="group"
      aria-label={t("ar.nav.language")}
      className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-white/15 bg-black/35 p-1 text-[10px] font-semibold tracking-[0.08em] backdrop-blur-md"
    >
      {(["vi", "en"] as const).map((value) => (
        <button
          key={value}
          type="button"
          lang={value}
          aria-pressed={language === value}
          aria-label={t(value === "vi" ? "ar.nav.switchVi" : "ar.nav.switchEn")}
          onClick={() => setLanguage(value)}
          className={`min-h-8 min-w-8 rounded-sm px-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A880] ${language === value ? "bg-[#C5A880] text-black" : "text-white/65 hover:text-white"}`}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
