"use client";

import { useLanguage } from "@/context/LanguageContext";

/** Inline text for server-rendered AR pages that updates without navigation. */
export function ArText({ id, vars }: { id: string; vars?: Record<string, string | number> }) {
  const { t } = useLanguage();
  return <>{t(id, vars)}</>;
}
