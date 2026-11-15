"use client";

import { useEffect, useRef } from "react";

/** Count an artwork view after the detail page actually opens in a browser. */
export function ArtworkViewTracker({ slug }: { slug: string }) {
  const requestedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (requestedSlug.current === slug) return;
    requestedSlug.current = slug;

    void fetch("/api/gallery/views/" + encodeURIComponent(slug), {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => {
      // The artwork remains readable if the view counter is temporarily unavailable.
    });
  }, [slug]);

  return null;
}
