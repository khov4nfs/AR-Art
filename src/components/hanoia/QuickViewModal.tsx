"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { craftDaysForLine, formatDayRange, productHref } from "@/lib/everie";

export default function QuickViewModal() {
  const { quickViewProduct, setQuickViewProduct, addToCart, formatPrice } = useCart();
  const { t, language } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();

  const [shownProduct, setShownProduct] = useState(quickViewProduct);
  if (shownProduct !== quickViewProduct) {
    setShownProduct(quickViewProduct);
    if (quickViewProduct) {
      setQuantity(1);
      setSelectedColor(quickViewProduct.colors?.[0]?.name);
    }
  }

  if (!quickViewProduct) return null;

  const craft = craftDaysForLine(quickViewProduct.line);
  const craftMin = quickViewProduct.craftDaysMin ?? craft.min;
  const craftMax = quickViewProduct.craftDaysMax ?? craft.max;

  const handleAddToCart = () => {
    addToCart(quickViewProduct, quantity, selectedColor);
    setQuickViewProduct(null);
    setQuantity(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={() => setQuickViewProduct(null)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-xs shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2 animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-3 right-3 z-20 p-2 text-neutral-500 hover:text-black bg-white/80 rounded-full backdrop-blur-xs focus:outline-hidden cursor-pointer"
          aria-label={t("common.close")}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Side */}
        <div className="relative aspect-square md:aspect-auto w-full bg-neutral-50 min-h-[320px]">
          <Image
            src={quickViewProduct.image}
            alt={quickViewProduct.name}
            fill
            sizes="(max-width: 768px) 100vw, 350px"
            className="object-cover object-center"
          />
          {quickViewProduct.tag && (
            <span className="absolute top-4 left-4 bg-black text-white text-[10px] tracking-widest font-semibold px-2.5 py-1 uppercase">
              {quickViewProduct.tag}
            </span>
          )}
        </div>

        {/* Product Details Side */}
        <div className="p-6 md:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div>
              <span className="text-[11px] text-neutral-400 uppercase tracking-widest font-medium block">
                {quickViewProduct.category}
              </span>
              <h2 className="text-xl md:text-2xl font-serif font-normal text-neutral-900 mt-1">
                {quickViewProduct.name}
              </h2>
              {quickViewProduct.sku && (
                <p className="text-xs text-neutral-400 mt-0.5">
                  {t("product.skuLabel")}: {quickViewProduct.sku}
                </p>
              )}
            </div>

            <div className="flex items-baseline space-x-3 pt-1">
              <span className="text-xl md:text-2xl font-semibold text-black">
                {formatPrice(quickViewProduct.price)}
              </span>
              {quickViewProduct.originalPrice && (
                <span className="text-sm text-neutral-400 line-through">
                  {formatPrice(quickViewProduct.originalPrice)}
                </span>
              )}
            </div>

            <div className="border-t border-b border-neutral-100 py-3 space-y-2">
              <p className="text-xs md:text-sm text-neutral-600 font-light leading-relaxed">
                {quickViewProduct.description || t("product.defaultDesc")}
              </p>
              {quickViewProduct.meaning && (
                <p className="text-xs text-neutral-500 font-light leading-relaxed">
                  {t("pdp.meaning")}: {quickViewProduct.meaning}
                </p>
              )}
              <p className="text-xs text-neutral-500 font-light">
                {t("pdp.craftTime")}:{" "}
                {formatDayRange(craftMin, craftMax, language)}
              </p>
            </div>

            {quickViewProduct.colors && quickViewProduct.colors.length > 0 && (
              <div className="flex items-center space-x-1.5">
                {quickViewProduct.colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                      selectedColor === color.name
                        ? "ring-2 ring-black ring-offset-1 scale-110"
                        : "border-neutral-300 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    aria-label={color.name}
                    aria-pressed={selectedColor === color.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center space-x-3">
              {/* Quantity Selector */}
              <div className="flex items-center border border-neutral-300 rounded-xs">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="p-2 text-neutral-600 hover:text-black cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-semibold text-neutral-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="p-2 text-neutral-600 hover:text-black cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add To Cart Button */}
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 px-6 bg-black text-white text-xs uppercase tracking-[2px] font-semibold hover:bg-[#C5A880] transition-colors flex items-center justify-center space-x-2 rounded-xs shadow-md cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t("btn.addToCart")}</span>
              </button>
            </div>
            <Link
              href={productHref(quickViewProduct)}
              onClick={() => setQuickViewProduct(null)}
              className="block text-center text-[11px] uppercase tracking-wider text-neutral-500 hover:text-black"
            >
              {t("pdp.fullConfig")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
