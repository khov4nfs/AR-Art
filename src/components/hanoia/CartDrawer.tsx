"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { formatDayRange } from "@/lib/everie";
import { cartReceiveRange } from "@/lib/orderRange";

export default function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartCount,
    formatPrice,
  } = useCart();
  const { t, language } = useLanguage();
  const { settings } = useSettings();

  if (!cartOpen) return null;

  const receive = cartReceiveRange(cart, settings);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer content */}
      <div className="cart-drawer relative z-10 flex h-full w-full max-w-md flex-col bg-white text-black shadow-2xl dark:bg-neutral-950 dark:text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800 md:p-6">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
            <h3 className="font-serif text-base font-medium uppercase tracking-wider text-black dark:text-white">
              {t("cart.drawerTitle", { count: cartCount })}
            </h3>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="cursor-pointer p-1.5 text-neutral-500 transition-colors hover:text-black focus:outline-hidden dark:text-neutral-400 dark:hover:text-white"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-neutral-200 bg-[#F8F7F4] p-4 text-xs dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-neutral-700 dark:text-neutral-300">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {t("cart.shippingFree")}
            </span>
            {cart.length > 0 && (
              <>
                <span className="text-neutral-400"> · </span>
                {t("pdp.expected")}:{" "}
                <strong className="font-semibold text-black dark:text-white">
                  {formatDayRange(receive.min, receive.max, language)}
                </strong>
              </>
            )}
          </p>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 divide-y divide-neutral-100 overflow-y-auto p-4 dark:divide-neutral-800 md:p-6">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <p className="text-sm font-light">{t("cart.emptyShort")}</p>
              <button
                onClick={() => setCartOpen(false)}
                className="cursor-pointer bg-black px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#C5A880] hover:text-black dark:bg-[#C5A880] dark:text-black dark:hover:bg-[#dfc9a8]"
              >
                {t("btn.explore")}
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.lineKey} className="flex space-x-4 py-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xs border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
                  <Image
                    src={item.previewImage || item.product.image}
                    alt={item.product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="block text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                        {item.product.category}
                      </span>
                      <h4 className="line-clamp-1 font-serif text-xs font-medium text-neutral-900 dark:text-neutral-100 md:text-sm">
                        {item.product.name}
                      </h4>
                      {(item.selectedColor || item.engravingText) && (
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {item.selectedColor}
                          {item.selectedColor && item.engravingText ? " · " : ""}
                          {item.engravingText
                            ? `${t("pdp.engrave")}: ${item.engravingText}`
                            : ""}
                        </p>
                      )}
                      {item.product.sku && (
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          {t("label.sku")}: {item.product.sku}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.lineKey)}
                      className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
                      title={t("cart.removeItem")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-xs border border-neutral-300 dark:border-neutral-600">
                      <button
                        onClick={() =>
                          updateQuantity(item.lineKey, item.quantity - 1)
                        }
                        className="cursor-pointer p-1 text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white"
                        aria-label={t("label.quantity")}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 text-xs font-medium text-neutral-800 dark:text-neutral-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.lineKey, item.quantity + 1)
                        }
                        className="cursor-pointer p-1 text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white"
                        aria-label={t("label.quantity")}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="text-xs font-semibold text-black dark:text-white md:text-sm">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Subtotal & Checkout */}
        {cart.length > 0 && (
          <div className="space-y-4 border-t border-neutral-200 bg-[#F8F7F4] p-4 dark:border-neutral-800 dark:bg-neutral-900 md:p-6">
            <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
              <div className="flex justify-between">
                <span>{t("label.subtotal")}:</span>
                <span className="text-sm font-semibold text-black dark:text-white">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("label.shipping")}:</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  {t("label.freeShipping")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-700">
              <span className="font-serif text-sm font-bold uppercase tracking-wider text-black dark:text-white">
                {t("label.total")}:
              </span>
              <span className="text-base font-bold text-black dark:text-white md:text-lg">
                {formatPrice(cartTotal)}
              </span>
            </div>

            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className="flex w-full cursor-pointer items-center justify-center space-x-2 rounded-xs bg-black py-3.5 text-center text-xs font-semibold uppercase tracking-[2px] text-white shadow-lg transition-colors hover:bg-[#C5A880] hover:text-black dark:bg-[#C5A880] dark:text-black dark:hover:bg-[#dfc9a8]"
              >
                <span>{t("btn.checkout")}</span>
                <ArrowRight className="ml-1 inline-block h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
