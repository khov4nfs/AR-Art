"use client";

import { placementLabel } from "@/lib/engraving";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  ArrowLeft,
} from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useMounted } from "@/hooks/useMounted";
import { formatDayRange, productHref } from "@/lib/everie";
import { cartReceiveRange } from "@/lib/orderRange";
import { useSettings } from "@/context/SettingsContext";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    formatPrice,
    showToast,
  } = useCart();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const mounted = useMounted();
  const activeCart = cart;
  const receive = cartReceiveRange(activeCart, settings);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-black">
        <Header />
        <main className="flex-1 py-12 md:py-16 px-4 md:px-8 max-w-[1400px] mx-auto w-full">
          <div className="text-center space-y-2 mb-10">
            <div className="h-3 w-32 bg-neutral-100 mx-auto animate-pulse" />
            <div className="h-8 w-60 bg-neutral-200 mx-auto animate-pulse" />
            <div className="w-12 h-0.5 bg-[#C5A880] mx-auto mt-2" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <div className="h-44 bg-neutral-50 border border-neutral-100 animate-pulse" />
            </div>
            <div className="lg:col-span-4">
              <div className="h-72 bg-[#F8F7F4] border border-neutral-200 animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === "EVERIE10") {
      setDiscountPercent(10);
      try {
        sessionStorage.setItem("everie_discount_percent", "10");
        sessionStorage.setItem("everie_promo_code", code);
      } catch {
        // ignore
      }
      showToast(t("cart.promoOk"));
    } else {
      showToast(t("cart.promoFail"));
    }
  };

  const discountAmount = Math.round((cartTotal * discountPercent) / 100);
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  return (
    <div className="cart-page min-h-screen flex flex-col bg-white text-black">
      <Header />

      <main className="flex-1 py-12 md:py-16 px-4 md:px-8 max-w-[1400px] mx-auto w-full">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
            {t("cart.eyebrow")}
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-light uppercase tracking-wide">
            {t("cart.title")}
          </h1>
          <div className="w-12 h-0.5 bg-[#C5A880] mx-auto mt-2" />
        </div>

        {activeCart.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-300 space-y-5 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <p className="text-base text-neutral-600 font-light">{t("cart.empty")}</p>
            <Link
              href="/classic"
              className="inline-flex items-center space-x-2 px-8 py-3 bg-black text-white text-xs uppercase tracking-[2px] font-semibold hover:bg-[#C5A880] transition-colors"
            >
              <span>{t("cart.continue")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="border border-neutral-200 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold border-b border-neutral-200">
                      <th className="py-3.5 px-4 md:px-6">{t("label.product")}</th>
                      <th className="py-3.5 px-4 text-center hidden md:table-cell">
                        {t("label.price")}
                      </th>
                      <th className="py-3.5 px-4 text-center">{t("label.quantity")}</th>
                      <th className="py-3.5 px-4 text-right">{t("label.lineTotal")}</th>
                      <th className="py-3.5 px-4 text-center w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-sm">
                    {activeCart.map((item) => (
                      <tr key={item.lineKey} className="hover:bg-neutral-50/50">
                        <td className="py-5 px-4 md:px-6">
                          <div className="flex items-center space-x-4">
                            <div className="relative w-16 h-16 md:w-20 md:h-20 bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                              <Image
                                src={item.previewImage || item.product.image}
                                alt={item.product.name}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-neutral-400 uppercase tracking-widest block">
                                {item.product.category}
                              </span>
                              <Link
                                href={productHref(item.product)}
                                className="font-serif font-medium text-black hover:text-[#C5A880] transition-colors line-clamp-1 text-sm md:text-base"
                              >
                                {item.product.name}
                              </Link>
                              {item.selectedColor && (
                                <p className="text-xs text-neutral-500">
                                  {t("label.color")}:{" "}
                                  <span className="font-medium text-black">
                                    {item.selectedColor}
                                  </span>
                                </p>
                              )}
                              {item.engravingText && (
                                <p className="text-xs text-neutral-500">
                                  {t("pdp.engrave")}:{" "}
                                  <span className="font-medium text-black">
                                    {item.engravingText}
                                  </span>
                                  {" · "}
                                  {placementLabel(item.engravingPlacement, language === "en" ? "en" : "vi")}
                                </p>
                              )}
                              {item.product.sku && (
                                <p className="text-[11px] text-neutral-400 font-mono">
                                  {t("label.sku")}: {item.product.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-4 text-center hidden md:table-cell text-neutral-700">
                          {formatPrice(item.product.price)}
                        </td>
                        <td className="py-5 px-4 text-center">
                          <div className="inline-flex items-center border border-neutral-300">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.lineKey, item.quantity - 1)
                              }
                              className="p-1.5 text-neutral-600 hover:text-black cursor-pointer"
                              aria-label={t("label.quantity")}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.lineKey, item.quantity + 1)
                              }
                              className="p-1.5 text-neutral-600 hover:text-black cursor-pointer"
                              aria-label={t("label.quantity")}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-5 px-4 text-right font-semibold">
                          {formatPrice(item.product.price * item.quantity)}
                        </td>
                        <td className="py-5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.lineKey)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                            title={t("cart.removeItem")}
                            aria-label={t("cart.removeItem")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                <Link
                  href="/classic"
                  className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-black"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t("cart.continue")}</span>
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-neutral-500 hover:text-red-600 underline cursor-pointer"
                >
                  {t("cart.clear")}
                </button>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-[#F8F7F4] border border-neutral-200 p-6 md:p-8 space-y-6 sticky top-24">
                <h3 className="text-base font-serif font-semibold uppercase tracking-wider border-b border-neutral-300 pb-3">
                  {t("cart.summary")}
                </h3>

                <form onSubmit={applyPromo} className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700">
                    {t("cart.promo")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder={t("cart.promoPlaceholder")}
                      className="flex-1 px-3 py-2 bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-black uppercase font-medium"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-black text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#C5A880] transition-colors cursor-pointer"
                    >
                      {t("btn.apply")}
                    </button>
                  </div>
                </form>

                <div className="space-y-2.5 text-xs text-neutral-700 border-t border-b border-neutral-300 py-4">
                  <div className="flex justify-between">
                    <span>
                      {t("label.subtotal")} ({activeCart.length} {t("label.items")}
                      ):
                    </span>
                    <span className="font-semibold text-black">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>
                        {t("label.discount")} ({discountPercent}%):
                      </span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t("label.shipping")}:</span>
                    <span className="text-emerald-700 font-semibold">
                      {t("cart.shippingFree")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("pdp.expected")}:</span>
                    <span className="font-semibold text-black">
                      {formatDayRange(receive.min, receive.max, language)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-sm uppercase font-serif font-bold tracking-wider">
                    {t("label.total")}:
                  </span>
                  <span className="text-xl md:text-2xl font-bold">
                    {formatPrice(finalTotal)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full py-4 bg-black text-white text-xs uppercase tracking-[2px] font-bold hover:bg-[#C5A880] transition-colors flex items-center justify-center space-x-2 shadow-lg"
                >
                  <span>{t("btn.checkout")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="space-y-2 text-[11px] text-neutral-500 pt-2">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{t("cart.insured")}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{t("cart.certificate")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
