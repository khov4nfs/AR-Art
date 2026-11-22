"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface StorefrontBreadcrumbProps {
  current: string;
  homeLabel?: string;
  className?: string;
}

export default function StorefrontBreadcrumb({
  current,
  homeLabel,
  className = "",
}: StorefrontBreadcrumbProps) {
  const { t } = useLanguage();
  const label = homeLabel ?? t("common.home");

  return (
    <nav
      aria-label={t("common.home")}
      className={`storefront-breadcrumb flex items-center gap-2 text-xs uppercase tracking-wider ${className}`}
    >
      <Link href="/" className="transition-colors hover:text-foreground">
        {label}
      </Link>
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="m7.5 4 6 6-6 6" />
      </svg>
      <span aria-current="page" className="font-semibold text-foreground">
        {current}
      </span>
    </nav>
  );
}
