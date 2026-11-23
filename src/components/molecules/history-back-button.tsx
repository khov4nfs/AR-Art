"use client";

import type { ComponentProps, ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/atoms/button";

type HistoryBackButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  fallbackHref: string;
  children: ReactNode;
};

export function HistoryBackButton({
  fallbackHref,
  children,
  ...buttonProps
}: HistoryBackButtonProps) {
  const router = useRouter();

  function goBack() {
    const navigate = () => {
      if (window.history.length > 1) {
        router.back();
        return;
      }
      router.push(fallbackHref);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate();
      return;
    }

    const root = document.documentElement;
    if (root.classList.contains("route-leaving")) return;
    root.classList.remove("route-entering");
    root.classList.add("route-leaving");
    window.setTimeout(navigate, 260);
  }

  return (
    <Button {...buttonProps} onClick={goBack}>
      {children}
    </Button>
  );
}
