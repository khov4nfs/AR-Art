"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import ProductCard from "@/components/hanoia/ProductCard";
import StorefrontBreadcrumb from "@/components/hanoia/StorefrontBreadcrumb";
import { useProducts } from "@/hooks/useProducts";
import { useLanguage } from "@/context/LanguageContext";

const COPY = {
  vi: { crumb: "Tìm kiếm", title: "Tìm kiếm tác phẩm", ph: "Tìm theo tên hoa, bộ sưu tập, màu men...", btn: "Tìm kiếm", resFor: "Kết quả cho", found: "Tìm thấy", items: "tác phẩm phù hợp", all: "Tất cả", sort: "Sắp xếp:", featured: "Nổi bật", low: "Giá: Thấp đến Cao", high: "Giá: Cao đến Thấp", name: "Tên: A - Z", none: "Không tìm thấy tác phẩm phù hợp", noneHint: "Quý khách vui lòng thử từ khóa khác hoặc khám phá toàn bộ bộ sưu tập.", viewAll: "Xem tất cả tác phẩm", loading: "Đang tải kết quả tìm kiếm..." },
  en: { crumb: "Search", title: "Search our pieces", ph: "Search by flower, collection, glaze...", btn: "Search", resFor: "Results for", found: "Found", items: "matching pieces", all: "All", sort: "Sort:", featured: "Featured", low: "Price: Low to High", high: "Price: High to Low", name: "Name: A - Z", none: "No matching pieces found", noneHint: "Try another keyword or browse the full collection.", viewAll: "View all pieces", loading: "Loading search results..." },
} as const;


function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { products: allProducts } = useProducts();
  const { language } = useLanguage();
  const c = COPY[language === "en" ? "en" : "vi"];

  const [searchKeyword, setSearchKeyword] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  const categories = [
    { id: "all", name: c.all },
    ...Array.from(new Set(allProducts.map((p) => p.category).filter(Boolean) as string[])).map((cat) => ({ id: cat, name: cat })),
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = initialQuery.toLowerCase().trim();
    return allProducts
      .filter((p) => {
        // Query match
        if (q) {
          const matchName = p.name.toLowerCase().includes(q);
          const matchCat = (p.category || "").toLowerCase().includes(q);
          const matchDesc = (p.description || "").toLowerCase().includes(q);
          const matchCol = (p.collection || "").toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchDesc && !matchCol) return false;
        }

        // Category filter
        if (
          selectedCategory !== "all" &&
          !p.category?.includes(selectedCategory)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [initialQuery, selectedCategory, sortBy, allProducts]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-16">
      {/* Breadcrumb */}
      <StorefrontBreadcrumb current={c.crumb} className="mb-8" />

      {/* Search Header Form */}
      <div className="max-w-2xl mx-auto text-center space-y-4 mb-12">
        <h1 className="text-2xl md:text-4xl font-serif font-normal uppercase tracking-wide text-black">
          {c.title}
        </h1>

        <form
          onSubmit={handleSearchSubmit}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder={c.ph}
            className="w-full pl-5 pr-14 py-3.5 bg-neutral-50 border border-neutral-300 text-xs md:text-sm focus:outline-hidden focus:border-black rounded-xs transition-colors shadow-xs"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-black text-white hover:bg-[#C5A880] transition-colors rounded-xs cursor-pointer"
            aria-label={c.btn}
          >
            <SearchIcon className="w-4 h-4" />
          </button>
        </form>

        {initialQuery && (
          <p className="text-xs text-neutral-500 font-light pt-1">
            {c.resFor}: &ldquo;
            <strong className="text-black font-medium">{initialQuery}</strong>
            &rdquo; &bull; {c.found} <strong>
              {filteredProducts.length}
            </strong>{" "}
            {c.items}
          </p>
        )}
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="border-t border-b border-neutral-200 py-3 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-[11px] uppercase tracking-wider px-3 py-1.5 transition-colors border rounded-xs cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-black text-white border-black font-semibold"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-black"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort select */}
        <div className="flex items-center space-x-2 text-xs text-neutral-600 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{c.sort}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent border border-neutral-200 py-1 px-2 text-xs text-black focus:outline-hidden cursor-pointer rounded-xs"
          >
            <option value="featured">{c.featured}</option>
            <option value="price-low">{c.low}</option>
            <option value="price-high">{c.high}</option>
            <option value="name">{c.name}</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center max-w-md mx-auto space-y-5">
          <div className="w-16 h-16 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center mx-auto text-neutral-400">
            <SearchIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-serif uppercase tracking-wide text-black">
              {c.none}
            </h3>
            <p className="text-xs text-neutral-500 font-light">
              {c.noneHint}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/collections/all"
              className="inline-flex items-center space-x-2 px-8 py-3 bg-black text-white text-xs uppercase tracking-[2px] font-semibold hover:bg-[#C5A880] transition-colors"
            >
              <span>{c.viewAll}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-neutral-100 transition-colors duration-300">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="py-24 text-center text-xs uppercase tracking-widest text-neutral-400">
              Đang tải kết quả tìm kiếm...
            </div>
          }
        >
          <SearchContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
