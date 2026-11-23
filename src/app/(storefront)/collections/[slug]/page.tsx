"use client";

import React, { useState, useMemo, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Filter, SlidersHorizontal } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import ProductCard from "@/components/hanoia/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { collectionsMeta } from "@/data/hanoiaData";
import { everieCollectionsMeta } from "@/data/everieData";

export default function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug || "all";
  const { products: allProducts } = useProducts();

  const meta = everieCollectionsMeta[slug] || collectionsMeta[slug] || {
    title: slug.toUpperCase().replace(/-/g, " "),
    subtitle: "Hoa gốm thủ công EVERIE — Classic, Themed, Bespoke",
    banner: "/images/hanoia/hero-banner-3.webp",
    description: "Hoa gốm làm theo đơn, khắc chữ, giao theo khoảng ngày chế tác.",
  };

  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      if (slug === "classic") {
        if (product.line !== "classic") return false;
      } else if (slug === "themed") {
        if (product.line !== "themed") return false;
      } else if (slug === "all") {
        // every ceramic line
      } else if (slug === "trang-tri-nha") {
        if (!["Bình hoa", "Hộp sơn mài", "Khay phục vụ", "Khung ảnh", "Bình nước"].includes(product.category || "")) {
          return false;
        }
      } else if (slug === "noi-that") {
        if (!["Đèn bàn", "Bàn", "Ghế", "Tủ"].includes(product.category || "")) {
          return false;
        }
      } else if (slug === "trang-suc") {
        if (product.category !== "Trang sức") return false;
      } else if (slug === "thoi-trang") {
        if (!["Thời trang", "Túi xách", "Phụ kiện"].includes(product.category || "")) return false;
      } else if (slug === "hanoia-pierre-charrie") {
        if (product.collection !== "Pierre Charrié") return false;
      }

      // Sub-category filter
      if (selectedSubCategory === "Classic Flowers" && product.line !== "classic") {
        return false;
      }
      if (selectedSubCategory === "Themed Collection" && product.line !== "themed") {
        return false;
      }
      if (
        selectedSubCategory !== "all" &&
        selectedSubCategory !== "Classic Flowers" &&
        selectedSubCategory !== "Themed Collection" &&
        product.category !== selectedSubCategory
      ) {
        return false;
      }

      // Price filter
      if (selectedPriceRange === "under-5m" && product.price >= 5000000) return false;
      if (selectedPriceRange === "5m-10m" && (product.price < 5000000 || product.price > 10000000)) return false;
      if (selectedPriceRange === "10m-20m" && (product.price < 10000000 || product.price > 20000000)) return false;
      if (selectedPriceRange === "over-20m" && product.price <= 20000000) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0; // featured
    });
  }, [slug, selectedSubCategory, selectedPriceRange, sortBy, allProducts]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-neutral-100 transition-colors duration-300">
      <Header />

      <main className="flex-1 pb-24">
        {/* Category Hero Banner */}
        <div className="relative aspect-[21/9] sm:aspect-[24/7] min-h-[220px] md:min-h-[280px] w-full overflow-hidden bg-neutral-900">
          <Image
            src={meta.banner}
            alt={meta.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col justify-end pb-8 md:pb-12 text-white">
            <span className="text-[11px] uppercase tracking-[3px] text-[#C5A880] font-semibold mb-2">
              {meta.subtitle || "Hoa gốm EVERIE"}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-light tracking-wide uppercase">
              {meta.title}
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 font-light max-w-xl mt-2 line-clamp-2">
              {meta.description}
            </p>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="border-b border-neutral-200 bg-[#FBFBFA]">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 flex items-center space-x-2 text-xs text-neutral-500 font-light">
            <Link href="/" className="hover:text-black transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/collections/all" className="hover:text-black transition-colors">
              Bộ sưu tập
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-black font-medium">{meta.title}</span>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-8">
          {/* Top Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                className="lg:hidden flex items-center space-x-2 px-3 py-2 border border-neutral-300 rounded-xs text-xs uppercase tracking-wider font-semibold"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Bộ lọc</span>
              </button>
              <p className="text-xs text-neutral-600 font-light">
                Hiển thị <strong className="text-black font-semibold">{filteredProducts.length}</strong> tác phẩm
              </p>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-neutral-500 hidden sm:inline">Sắp xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border border-neutral-300 rounded-xs px-3 py-1.5 text-xs focus:outline-hidden focus:border-black cursor-pointer font-medium"
              >
                <option value="featured">Nổi bật nhất</option>
                <option value="price-low">Giá: Thấp đến cao</option>
                <option value="price-high">Giá: Cao đến thấp</option>
                <option value="name">Tên tác phẩm (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Grid Layout with Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-start">
            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24 pr-4 border-r border-neutral-200">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <span className="text-xs uppercase tracking-[2px] font-bold text-black flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#C5A880]" />
                  <span>Bộ Lọc Sản Phẩm</span>
                </span>
                {(selectedSubCategory !== "all" || selectedPriceRange !== "all") && (
                  <button
                    onClick={() => {
                      setSelectedSubCategory("all");
                      setSelectedPriceRange("all");
                    }}
                    className="text-[11px] text-[#C5A880] hover:text-black underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Sub-Category Filter */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-black">
                  Phân loại
                </h4>
                <div className="space-y-1.5 text-xs text-neutral-600 font-light">
                  {["all", "Classic Flowers", "Themed Collection"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedSubCategory(cat)}
                      className={`block w-full text-left py-1 transition-colors ${
                        selectedSubCategory === cat
                          ? "font-semibold text-black translate-x-1"
                          : "hover:text-black"
                      }`}
                    >
                      {cat === "all" ? "Tất cả chủng loại" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2 pt-4 border-t border-neutral-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-black">
                  Khoảng giá
                </h4>
                <div className="space-y-1.5 text-xs text-neutral-600 font-light">
                  {[
                    { id: "all", label: "Tất cả mức giá" },
                    { id: "under-5m", label: "Dưới 5.000.000 ₫" },
                    { id: "5m-10m", label: "5.000.000 ₫ - 10.000.000 ₫" },
                    { id: "10m-20m", label: "10.000.000 ₫ - 20.000.000 ₫" },
                    { id: "over-20m", label: "Trên 20.000.000 ₫" },
                  ].map((range) => (
                    <label key={range.id} className="flex items-center space-x-2 cursor-pointer py-0.5">
                      <input
                        type="radio"
                        name="price-range"
                        checked={selectedPriceRange === range.id}
                        onChange={() => setSelectedPriceRange(range.id)}
                        className="accent-black w-3.5 h-3.5"
                      />
                      <span className={selectedPriceRange === range.id ? "text-black font-medium" : ""}>
                        {range.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#F8F7F4] border border-[#C5A880]/30 rounded-xs text-xs space-y-2">
                <p className="font-serif font-semibold text-black uppercase tracking-wider">
                  14–45 ngày chế tác
                </p>
                <p className="text-neutral-600 font-light text-[11px] leading-relaxed">
                  Hoa gốm EVERIE làm theo đơn tại làng gốm Thanh Hà. Classic 14–21 ngày, Themed 21–28, Bespoke 30–45.
                </p>
              </div>
            </aside>

            {/* Product Grid Area */}
            <div className="col-span-1 lg:col-span-9">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-neutral-300 rounded-xs space-y-4">
                  <p className="text-sm text-neutral-500 font-light">
                    Không tìm thấy tác phẩm nào phù hợp với bộ lọc hiện tại.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSubCategory("all");
                      setSelectedPriceRange("all");
                    }}
                    className="px-6 py-2.5 bg-black text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#C5A880] transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
