"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, ShoppingBag } from "lucide-react";
import { Product, useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatDayRange, productHref } from "@/lib/everie";

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
  onRemoveFromWishlist?: () => void;
  showWishlistRemove?: boolean;
  priority?: boolean;
}

export default function ProductCard({
  product,
  showQuickAdd = true,
  onRemoveFromWishlist,
  showWishlistRemove = false,
  priority = false,
}: ProductCardProps) {
  const {
    addToCart,
    setQuickViewProduct,
    formatPrice,
  } = useCart();
  const { t, language } = useLanguage();
  const href = productHref(product);
  const [selectedColor, setSelectedColor] = useState(
    product.colors && product.colors.length > 0
      ? product.colors[0].name
      : undefined,
  );
  const CAT_KEYS: Record<string, string> = {
    "Bình hoa": "cat.vases",
    "Hộp sơn mài": "cat.boxes",
    "Đèn bàn": "cat.lamps",
    "Khung ảnh": "cat.frames",
    "Trang sức": "cat.jewelry",
    "Khay sơn mài": "cat.lacquerTrays",
    "Khay phục vụ": "cat.trays",
    "Bình nước": "cat.bottles",
    "Thời trang": "cat.fashion",
    "Túi xách": "cat.bags",
    "Phụ kiện": "cat.accessories",
    "Nội thất": "cat.furniture",
    "Quà tặng": "cat.gifts",
  };

  const getCategoryLabel = (cat: string) => {
    if (product.line === "classic") return t("line.classic");
    if (product.line === "themed") return t("line.themed");
    const key = CAT_KEYS[cat];
    return key ? t(key) : cat;
  };

  const craftLabel =
    product.craftDaysMin != null && product.craftDaysMax != null
      ? formatDayRange(product.craftDaysMin, product.craftDaysMax, language)
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, selectedColor);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  return (
    <div className="group flex flex-col h-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-300 hover:shadow-lg rounded-xs overflow-hidden relative">
      {/* Product Image Area */}
      <Link
        href={href}
        className="block relative aspect-square w-full bg-neutral-50 dark:bg-neutral-800 overflow-hidden shrink-0"
      >
        {/* Main Image */}
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          className={`object-cover transition-all duration-700 ${
            product.hoverImage
              ? "group-hover:opacity-0 group-hover:scale-105"
              : "group-hover:scale-105"
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 25vw, 350px"
        />

        {/* Hover Swap Image */}
        {product.hoverImage && (
          <Image
            src={product.hoverImage}
            alt={`${product.name} preview`}
            fill
            loading="lazy"
            className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 25vw, 350px"
          />
        )}

        {/* Top Badges */}
        {product.tag && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-block text-[10px] tracking-wider uppercase font-semibold bg-black text-white px-2 py-0.5 rounded-2xs shadow-xs">
              {product.tag}
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 flex flex-col space-y-1.5">
          <button
            onClick={handleQuickView}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs hover:bg-white hover:scale-110 transition-all text-neutral-600 hover:text-black cursor-pointer opacity-0 group-hover:opacity-100 duration-200"
            aria-label={t("btn.quickView")}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add To Cart Bar on Desktop Hover */}
        {showQuickAdd && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 hidden sm:block">
            <button
              onClick={handleAddToCart}
              className="w-full bg-black py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-[#C5A880] hover:text-black dark:bg-[#C5A880] dark:text-black dark:hover:bg-[#dfc9a8] flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t("btn.addToCart")}</span>
            </button>
          </div>
        )}
      </Link>

      {/* Product Information Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2 min-h-[156px]">
        <div className="space-y-1">
          {/* Category / Collection */}
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium block">
            {getCategoryLabel(product.category || product.collection || "")}
          </span>

          {/* Product Title */}
          <Link href={href} className="block">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-black dark:group-hover:text-white group-hover:underline line-clamp-1 font-serif leading-snug">
              {product.name}
            </h3>
          </Link>
          {craftLabel && (
            <p className="text-[11px] text-neutral-500 font-light">
              {t("pdp.craftTime")}: {craftLabel}
            </p>
          )}
        </div>

        {/* Color Swatches if available (with fixed height to ensure cards never shift height) */}
        <div className="h-5 flex items-center">
          {product.colors && product.colors.length > 0 ? (
            <div className="flex items-center space-x-1.5">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(color.name);
                  }}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    selectedColor === color.name
                      ? "ring-2 ring-black ring-offset-1 scale-110"
                      : "border-neutral-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          ) : (
            <div className="h-3.5" />
          )}
        </div>

        {/* Price & Mobile Add Button (fixed min-height to prevent jumping between currencies) */}
        <div className="pt-1 flex items-center justify-between min-h-[28px]">
          <div className="flex items-baseline space-x-2 flex-wrap">
            <span className="text-sm sm:text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-neutral-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Mobile direct add to cart button */}
          <button
            onClick={handleAddToCart}
            className="sm:hidden p-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-black hover:text-white dark:hover:bg-[#C5A880] dark:hover:text-black rounded-full transition-colors cursor-pointer"
            aria-label={t("btn.addToCart")}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
