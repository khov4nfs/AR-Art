"use client";

import { useEffect } from "react";

import {
  parseAuthCallbackHash,
  PENDING_SIGNUP_NEXT_PATH_KEY,
  sanitizeNextPath,
} from "@/features/auth/domain/auth-confirmation";

export function AuthCallbackForwarder() {
  useEffect(() => {
    if (window.location.pathname === "/ar-login") return;

    const callback = parseAuthCallbackHash(window.location.hash);
    if (callback.kind === "none") return;

    const existingSearch = new URLSearchParams(window.location.search);
    if (!existingSearch.has("next")) {
      const pendingNextPath = window.localStorage.getItem(
        PENDING_SIGNUP_NEXT_PATH_KEY,
      );

      if (pendingNextPath) {
        existingSearch.set("next", sanitizeNextPath(pendingNextPath));
      }
    }

    const search = existingSearch.toString();
    const target = `/ar-login${search ? `?${search}` : ""}${window.location.hash}`;
    window.location.replace(target);
  }, []);

  return null;
}
