"use client";

import type { EngraveSpot } from "@/lib/engraving";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { cartLineKey } from "@/lib/everie";

export interface Product {
  id: string;
  slug?: string;
  name: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  image: string;
  hoverImage?: string;
  galleryImages?: string[];
  category?: string;
  collection?: string;
  tag?: string;
  description?: string;
  dimensions?: string;
  material?: string;
  finish?: string;
  inStock?: boolean;
  colors?: { name: string; hex: string }[];
  line?: "classic" | "themed";
  species?: string;
  craftDaysMin?: number;
  craftDaysMax?: number;
  engravingEnabled?: boolean;
  maxEngravingChars?: number;
  meaning?: string;
  inspiration?: string;
  isSet?: boolean;
  setProductIds?: string[];
}

export interface CartItem {
  lineKey: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  engravingText?: string;
  engravingFont?: string;
  engravingPlacement?: string;
  engravingSpot?: EngraveSpot;
  giftMessage?: string;
  /** JPEG data URL of the configured 3D view (uploaded with the order). */
  previewImage?: string;
}

export interface CartLineExtras {
  engravingFont?: string;
  engravingPlacement?: string;
  engravingSpot?: EngraveSpot;
  giftMessage?: string;
  previewImage?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedColor?: string,
    engravingText?: string,
    extras?: CartLineExtras,
  ) => void;
  removeFromCart: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  currency: "VND" | "USD";
  setCurrency: (currency: "VND" | "USD") => void;
  formatPrice: (price: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
  initialCurrency = "VND",
}: {
  children: React.ReactNode;
  initialCurrency?: "VND" | "USD";
}) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hanoia_cart");
        if (saved) {
          const parsed = JSON.parse(saved) as CartItem[];
          if (!Array.isArray(parsed)) return [];
          return parsed.map((item) => ({
            ...item,
            lineKey:
              item.lineKey ||
              cartLineKey(item.product.id, item.selectedColor, item.engravingText),
          }));
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hanoia_wishlist");
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [currency, setCurrencyState] = useState<"VND" | "USD">(initialCurrency);

  // Keep currency cookie in sync for subsequent SSR requests
  useEffect(() => {
    try {
      document.cookie = `hanoia_currency=${currency}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, [currency]);

  const setCurrency = (curr: "VND" | "USD") => {
    setCurrencyState(curr);
    try {
      localStorage.setItem("hanoia_currency", curr);
      document.cookie = `hanoia_currency=${curr}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  };

  const formatPrice = (price: number) => {
    if (currency === "USD") {
      const usd = Math.round(price / 25000);
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(usd);
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };
  const [cartOpen, setCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("hanoia_cart", JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("hanoia_wishlist", JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  // Wishlist: local for guests; server-side for signed-in users. On sign-in the
  // local list is merged into the account; on sign-out the local copy is cleared.
  const { user: authUser } = useAuth();
  const authUserId = authUser?.id ?? null;
  const prevUserRef = useRef<string | null>(null);
  const pushWishlist = async (ids: string[], merge: boolean) => {
    const res = await fetch("/api/account/wishlist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, merge }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (data?.success && Array.isArray(data.data)) setWishlist(data.data);
  };
  useEffect(() => {
    const prev = prevUserRef.current;
    prevUserRef.current = authUserId;
    if (authUserId && authUserId !== prev) {
      let local: string[] = [];
      try {
        local = JSON.parse(localStorage.getItem("hanoia_wishlist") || "[]");
      } catch {
        // ignore
      }
      fetch("/api/account/wishlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.isArray(local) ? local : [], merge: true }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.data)) setWishlist(data.data);
        })
        .catch(() => {});
    } else if (!authUserId && prev) {
      void Promise.resolve().then(() => setWishlist([]));
    }
  }, [authUserId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedColor?: string,
    engravingText?: string,
    extras?: CartLineExtras,
  ) => {
    const lineKey = [
      cartLineKey(product.id, selectedColor, engravingText),
      extras?.engravingFont ?? "",
      extras?.engravingPlacement ?? "",
      extras?.engravingSpot ? JSON.stringify(extras.engravingSpot) : "",
      extras?.giftMessage ?? "",
    ].join("::");
    setCart((prev) => {
      const existing = prev.find((item) => item.lineKey === lineKey);
      if (existing) {
        return prev.map((item) =>
          item.lineKey === lineKey
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [
        ...prev,
        {
          lineKey,
          product,
          quantity,
          selectedColor,
          engravingText,
          engravingFont: extras?.engravingFont,
          engravingPlacement: extras?.engravingPlacement,
          engravingSpot: extras?.engravingSpot,
          giftMessage: extras?.giftMessage,
          previewImage: extras?.previewImage,
        },
      ];
    });
    showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
    setCartOpen(true);
  };

  const removeFromCart = (lineKey: string) => {
    setCart((prev) => prev.filter((item) => item.lineKey !== lineKey));
  };

  const updateQuantity = (lineKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(lineKey);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.lineKey === lineKey ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    const has = wishlist.includes(productId);
    const next = has ? wishlist.filter((id) => id !== productId) : [...wishlist, productId];
    setWishlist(next);
    showToast(has ? "Đã xóa khỏi danh sách yêu thích" : "Đã thêm vào danh sách yêu thích");
    if (authUserId) void pushWishlist(next, false);
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        cartOpen,
        setCartOpen,
        quickViewProduct,
        setQuickViewProduct,
        searchOpen,
        setSearchOpen,
        mobileMenuOpen,
        setMobileMenuOpen,
        toastMessage,
        showToast,
        wishlist,
        toggleWishlist,
        isInWishlist,
        currency,
        setCurrency,
        formatPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
