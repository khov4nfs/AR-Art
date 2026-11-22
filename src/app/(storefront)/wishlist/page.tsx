"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingBag, ArrowRight, Trash2, Sparkles } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import ProductCard from "@/components/hanoia/ProductCard";
import StorefrontBreadcrumb from "@/components/hanoia/StorefrontBreadcrumb";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useMounted } from "@/hooks/useMounted";
import { useProducts } from "@/hooks/useProducts";

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, showToast } = useCart();
  const { t } = useLanguage();
  const mounted = useMounted();
  const { products: allProducts } = useProducts();

  // Find wishlisted products (only when mounted)
  const activeWishlist = mounted ? wishlist : [];
  const wishlistedProducts = allProducts.filter((p) =>
    activeWishlist.includes(p.id),
  );

  // Add all wishlisted items to cart
  const handleAddAllToCart = () => {
    if (wishlistedProducts.length === 0) return;
    wishlistedProducts.forEach((prod) => {
      addToCart(prod, 1, prod.colors?.[0]?.name);
    });
    showToast(t("wishlist.addedAll", { count: wishlistedProducts.length }));
  };

  // Clear entire wishlist
  const handleClearAll = () => {
    if (wishlistedProducts.length === 0) return;
    wishlist.forEach((id) => toggleWishlist(id));
    showToast(t("wishlist.cleared"));
  };

  // Featured suggestion products for empty state
  const suggestedProducts = allProducts.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-neutral-100 transition-colors duration-300">
      <Header />

      <main className="flex-1 py-8 md:py-16 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        {/* Breadcrumb */}
        <StorefrontBreadcrumb
          current={t("header.wishlist")}
          className="mb-8"
        />

        {/* Page Header */}
        <div className="border-b border-neutral-200 pb-6 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("wishlist.eyebrow")}</span>
            </span>
            <h1 className="text-2xl md:text-4xl font-serif font-normal uppercase tracking-wide text-black">
              {t("header.wishlist")}
              {wishlistedProducts.length > 0 && (
                <span className="text-neutral-400 font-sans text-xl md:text-2xl font-light ml-3">
                  ({wishlistedProducts.length})
                </span>
              )}
            </h1>
          </div>

          {/* Action buttons when items exist */}
          {wishlistedProducts.length > 0 && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClearAll}
                className="px-4 py-2.5 border border-neutral-300 text-neutral-600 text-xs uppercase tracking-wider font-semibold hover:border-red-500 hover:text-red-500 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("btn.clearAll")}</span>
              </button>
              <button
                onClick={handleAddAllToCart}
                className="px-5 py-2.5 bg-black text-white text-xs uppercase tracking-[1.5px] font-semibold hover:bg-[#C5A880] transition-colors flex items-center space-x-2 cursor-pointer shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t("btn.addAllToCart")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Wishlist Items Grid */}
        {wishlistedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {wishlistedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showWishlistRemove={true}
                onRemoveFromWishlist={() => {
                  toggleWishlist(product.id);
                  showToast(t("product.wishlistRemove"));
                }}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 md:py-24 text-center max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center mx-auto text-neutral-400">
              <Heart className="w-9 h-9 stroke-[1.2]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-serif uppercase tracking-wide text-black">
                {t("wishlist.emptyTitle")}
              </h2>
              <p className="text-xs md:text-sm text-neutral-500 font-light leading-relaxed">
                {t("wishlist.emptyDesc")}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/collections/all"
                className="inline-flex items-center space-x-2 px-8 py-3.5 bg-black text-white text-xs uppercase tracking-[2px] font-semibold hover:bg-[#C5A880] transition-colors shadow-md"
              >
                <span>{t("btn.explore")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Recommended Collection for Inspiration */}
        {wishlistedProducts.length === 0 && (
          <div className="mt-20 border-t border-neutral-200 pt-16">
            <div className="text-center space-y-2 mb-10">
              <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
                {t("wishlist.suggested")}
              </span>
              <h3 className="text-2xl md:text-3xl font-serif uppercase tracking-wide">
                {t("home.bestSeller")}
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {suggestedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
