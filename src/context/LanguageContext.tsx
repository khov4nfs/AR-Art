"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translate } from "@/lib/i18n/translations";

export type Language = "vi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({
  children,
  initialLanguage = "vi",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hanoia_language") as Language | null;
      if (stored === "vi" || stored === "en") {
        setLanguageState(stored);
      }
    } catch {
      // ignore
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      document.cookie = `hanoia_language=${language}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = language;
    } catch {
      // ignore
    }
  }, [language, ready]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("hanoia_language", lang);
      document.cookie = `hanoia_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  };

  const t = (key: string, vars?: Record<string, string | number>): string => {
    return translate(language, key, vars);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
