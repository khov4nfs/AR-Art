"use client";

import { useEffect, useState } from "react";
import type { ProductItem } from "@/lib/store";

export function useProducts(query = "") {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const loading = loadedQuery !== query;

  useEffect(() => {
    const controller = new AbortController();
    const qs = query ? `?${query}` : "";
    fetch(`/api/products${qs}`, { signal: controller.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setProducts(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoadedQuery(query);
      });
    return () => controller.abort();
  }, [query]);

  return { products, loading };
}
