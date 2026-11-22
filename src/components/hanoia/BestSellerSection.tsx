"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "./ProductCard";

export default function BestSellerSection() {
  const { t } = useLanguage();
  const { products, loading } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [scrollIndex, setScrollIndex] = useState(0);

  const categories = [
    { id: "all", name: t("label.all") },
    { id: "classic", name: t("nav.classic") },
    { id: "themed", name: t("nav.themed") },
  ];

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true;
    return product.line === selectedCategory;
  });

  const resetKey = `${selectedCategory}:${products.length}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setScrollIndex(0);
  }

  const handleNext = () => {
    setScrollIndex((prev) =>
      Math.min(prev + 1, Math.max(0, filteredProducts.length - 4)),
    );
  };

  const handlePrev = () => {
    setScrollIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <section
      className="py-20 px-4 md:px-8 max-w-[1440px] mx-auto w-full"
      id="best-seller"
    >
      <div className="text-center space-y-3 mb-10">
        <h2 className="text-3xl md:text-4xl font-serif tracking-wider font-normal text-black dark:text-white uppercase">
          {t("home.bestSeller")}
        </h2>
        <div className="w-12 h-0.5 bg-[#C5A880] mx-auto" />
        <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 font-light max-w-md mx-auto">
          {t("home.bestSellerDesc")}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setScrollIndex(0);
              }}
              className={`text-xs uppercase tracking-[1.5px] px-4 py-2 transition-all duration-200 border cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-black text-white border-black font-semibold"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="relative group/carousel">
        {filteredProducts.length > 4 && (
          <>
            <button
              onClick={handlePrev}
              disabled={scrollIndex === 0}
              className={`absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-neutral-900 shadow-md flex items-center justify-center border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer ${
                scrollIndex === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "opacity-100 hover:bg-black hover:text-white"
              }`}
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={scrollIndex >= filteredProducts.length - 4}
              className={`absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-neutral-900 shadow-md flex items-center justify-center border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer ${
                scrollIndex >= filteredProducts.length - 4
                  ? "opacity-40 cursor-not-allowed"
                  : "opacity-100 hover:bg-black hover:text-white"
              }`}
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 items-stretch">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-xs bg-neutral-100 dark:bg-neutral-800"
                />
              ))
            : filteredProducts
                .slice(scrollIndex, scrollIndex + 4)
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
        </div>
      </div>
    </section>
  );
}
