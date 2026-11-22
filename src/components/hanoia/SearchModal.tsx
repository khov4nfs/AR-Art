"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { productHref } from "@/lib/everie";

export default function SearchModal() {
  const { searchOpen, setSearchOpen, formatPrice } = useCart();
  const { t } = useLanguage();
  const { products: allProducts } = useProducts();
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    if (searchOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  const popularKeywords = [
    t("search.kw1"),
    t("search.kw2"),
    t("search.kw3"),
    t("search.kw4"),
    t("search.kw5"),
    t("search.kw6"),
    "Bespoke",
  ];

  const results = query.trim()
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category?.toLowerCase().includes(query.toLowerCase()) ||
          p.collection?.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-start">
      {/* Backdrop (.ox-slideout-shadow) */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity duration-300"
        onClick={() => setSearchOpen(false)}
      />

      {/* Top Slideout Search Wrapper (.header__search-wrapper) */}
      <div className="relative w-full bg-white shadow-2xl z-10 animate-fade-in border-b border-[#e5e5e5]">
        <div className="max-w-[1240px] mx-auto px-6 py-6 md:py-8">
          {/* Close button on top right (.ox-overlay-close-btn-2) */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setSearchOpen(false)}
              className="flex items-center space-x-1.5 text-black hover:opacity-70 transition-opacity cursor-pointer focus:outline-hidden"
              aria-label={t("common.close")}
            >
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25 7L7 25" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M25 25L7 7" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium">{t("common.close")}</span>
            </button>
          </div>

          {/* Search Form (#search_mini_form) */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-3xl mx-auto">
            <div className="relative flex items-center border-b border-black pb-2">
              <input
                id="search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                autoFocus
                className="w-full text-base md:text-xl font-normal text-black placeholder-neutral-400 outline-hidden pr-10 bg-transparent"
              />
              <button
                type="submit"
                aria-label={t("search.title")}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-black hover:opacity-75 cursor-pointer focus:outline-hidden"
              >
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M20.7061 19.293L17.0241 15.611C18.4641 13.8095 19.1597 11.5249 18.9679 9.22654C18.776 6.92817 17.7113 4.79051 15.9925 3.25267C14.2736 1.71483 12.0312 0.893565 9.72568 0.957581C7.4202 1.0216 5.22675 1.96603 3.5959 3.59688C1.96505 5.22773 1.02062 7.42118 0.956605 9.72666C0.892589 12.0321 1.71385 14.2746 3.25169 15.9935C4.78953 17.7123 6.92719 18.777 9.22557 18.9688C11.5239 19.1607 13.8085 18.4651 15.6101 17.025L19.2921 20.707L20.7061 19.293ZM9.99906 17C8.61459 17 7.26121 16.5895 6.11007 15.8203C4.95892 15.0512 4.06172 13.9579 3.5319 12.6788C3.00209 11.3997 2.86347 9.99227 3.13356 8.6344C3.40366 7.27654 4.07034 6.02926 5.04931 5.05029C6.02828 4.07132 7.27556 3.40464 8.63343 3.13454C9.99129 2.86444 11.3988 3.00307 12.6778 3.53288C13.9569 4.06269 15.0502 4.9599 15.8193 6.11104C16.5885 7.26219 16.9991 8.61557 16.9991 10C16.9969 11.8559 16.2588 13.6351 14.9465 14.9474C13.6342 16.2597 11.8549 16.9979 9.99906 17Z"
                    fill="black"
                  />
                </svg>
              </button>
            </div>
          </form>

          {/* Popular searches suggestions */}
          {!query && (
            <div className="mt-6 max-w-3xl mx-auto flex items-center flex-wrap gap-2 text-xs">
              <span className="text-neutral-400 font-medium">{t("search.suggested")}</span>
              {popularKeywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setQuery(kw)}
                  className="px-3 py-1 bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 rounded-xs transition-colors cursor-pointer"
                >
                  {kw}
                </button>
              ))}
            </div>
          )}

          {/* Autocomplete Results dropdown */}
          {query && (
            <div className="mt-6 max-w-3xl mx-auto max-h-[350px] overflow-y-auto divide-y divide-neutral-100">
              {results.length === 0 ? (
                <p className="text-center text-sm text-neutral-500 py-6">
                  {t("search.noResults")}
                </p>
              ) : (
                results.slice(0, 5).map((product) => (
                  <Link
                    key={product.id}
                    href={productHref(product)}
                    onClick={() => setSearchOpen(false)}
                    className="py-3 px-2 flex items-center justify-between hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative w-12 h-12 bg-neutral-100 rounded-xs overflow-hidden shrink-0 border border-neutral-200">
                        <Image src={product.image} alt={product.name} fill sizes="48px" className="object-cover" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-black">{product.name}</h4>
                        <span className="text-xs text-neutral-400">{product.category}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-black">{formatPrice(product.price)}</span>
                  </Link>
                ))
              )}

              {results.length > 0 && (
                <div className="pt-3 text-center border-t border-neutral-100">
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                    }}
                    className="w-full py-2.5 bg-black text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#C5A880] transition-colors rounded-xs cursor-pointer"
                  >
                    {t("search.viewAllResults")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
