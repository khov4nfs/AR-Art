"use client";

import { placementLabel } from "@/lib/engraving";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { useMounted } from "@/hooks/useMounted";
import {
  formatDayRange,
  isValidEmail,
  isValidVnPhone,
  productHref,
} from "@/lib/everie";
import { LAST_ORDER_KEY, type LastOrderSnapshot } from "@/lib/lastOrder";
import { cartReceiveRange } from "@/lib/orderRange";
import { useAuth, type Address } from "@/context/AuthContext";

type PaymentMethod = "transfer" | "cod";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart, formatPrice } = useCart();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const mounted = useMounted();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");
  // Client-only page (renders a loader until mounted), so session values can seed state.
  const [discountPercent] = useState(() => {
    try {
      return typeof window === "undefined" ? 0 : Number(sessionStorage.getItem("everie_discount_percent") || 0);
    } catch {
      return 0;
    }
  });
  const [promoCode] = useState(() => {
    try {
      return typeof window === "undefined" ? "" : sessionStorage.getItem("everie_promo_code") || "";
    } catch {
      return "";
    }
  });

  // Signed-in customers: prefill from the profile/default address once (render-phase
  // adjustment, so no effect + setState). Guests fill the form themselves.
  const { user } = useAuth();
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  const applyAddress = (a: Address) => {
    setFullName(a.name);
    setPhone(a.phone);
    setAddress([a.address, a.ward, a.district].filter(Boolean).join(", "));
    setCity(a.city);
  };
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
    if (!email) setEmail(user.email);
    if (def) applyAddress(def);
    else {
      if (!fullName) setFullName(user.name);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }

  const receive = cartReceiveRange(cart, settings);
  const hasEngraving = cart.some((item) => Boolean(item.engravingText?.trim()));
  const discountAmount = Math.round((cartTotal * discountPercent) / 100);
  const payableTotal = Math.max(0, cartTotal - discountAmount);

  // Engraved items are made to order: COD is not allowed.
  if (hasEngraving && paymentMethod === "cod") setPaymentMethod("transfer");

  useEffect(() => {
    if (!mounted || placed || submitting) return;
    if (cart.length === 0) {
      router.replace("/cart");
    }
  }, [mounted, cart.length, router, placed, submitting]);

  if (!mounted || (cart.length === 0 && !placed)) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-black">
        <Header />
        <main className="flex-1 flex items-center justify-center text-xs uppercase tracking-widest text-neutral-400">
          {t("label.loading")}
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedAddress = address.trim();
    const trimmedCity = city.trim();

    if (!trimmedName || !trimmedPhone || !trimmedEmail || !trimmedAddress || !trimmedCity) {
      setError(t("checkout.required"));
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError(t("checkout.invalidEmail"));
      return;
    }
    if (!isValidVnPhone(trimmedPhone)) {
      setError(t("checkout.invalidPhone"));
      return;
    }
    if (hasEngraving && paymentMethod === "cod") {
      setError(t("checkout.codBlocked"));
      return;
    }

    setError("");
    setSubmitting(true);

    const paymentLabel =
      paymentMethod === "cod"
        ? "Thanh toán khi nhận hàng (COD)"
        : "Chuyển khoản";
    const fullAddress = `${trimmedAddress}, ${trimmedCity}`;
    const items = cart.map((item) => ({
      productId: item.product.id,
      sku: item.product.sku,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image,
      color: item.selectedColor,
      engravingText: item.engravingText,
      engravingFont: item.engravingFont,
      engravingPlacement: item.engravingPlacement,
      engravingSpot: item.engravingSpot,
      giftMessage: item.giftMessage,
      previewImage: item.previewImage,
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: discountPercent > 0 ? promoCode || undefined : undefined,
          customerName: trimmedName,
          phone: trimmedPhone,
          email: trimmedEmail,
          address: fullAddress,
          notes: note.trim() || undefined,
          items,
          paymentMethod: paymentLabel,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        data?: {
          orderNumber?: string;
          total?: number;
          expectedMinDays?: number;
          expectedMaxDays?: number;
          paymentMethod?: string;
        };
        error?: string;
      };

      if (!res.ok || !data.success || !data.data?.orderNumber) {
        setError(data.error || t("checkout.error"));
        setSubmitting(false);
        return;
      }

      const snapshot: LastOrderSnapshot = {
        orderNumber: data.data.orderNumber,
        total: data.data.total ?? payableTotal,
        paymentMethod: data.data.paymentMethod ?? paymentLabel,
        expectedMinDays: data.data.expectedMinDays ?? receive.min,
        expectedMaxDays: data.data.expectedMaxDays ?? receive.max,
        hasEngraving,
        customerName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        address: fullAddress,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.previewImage || item.image,
          color: item.color,
          engravingText: item.engravingText,
          engravingPlacement: item.engravingPlacement,
        })),
      };
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(snapshot));
      } catch {
        // ignore
      }

      try {
        sessionStorage.removeItem("everie_discount_percent");
        sessionStorage.removeItem("everie_promo_code");
      } catch {
        // ignore
      }
      setPlaced(true);
      clearCart();
      router.push(`/order-success?order=${encodeURIComponent(data.data.orderNumber)}`);
    } catch {
      setError(t("checkout.error"));
      setSubmitting(false);
    }
  };

  const fieldClass =
    "w-full px-3 py-2.5 border border-neutral-300 text-sm focus:outline-hidden focus:border-black bg-white";

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Header />
      <main className="flex-1 py-12 md:py-16 px-4 md:px-8 max-w-[1200px] mx-auto w-full">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
            EVERIE
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-light uppercase tracking-wide">
            {t("checkout.title")}
          </h1>
          <p className="text-xs text-neutral-500">{t("checkout.guest")}</p>
          <div className="w-12 h-0.5 bg-[#C5A880] mx-auto mt-2" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10"
        >
          <div className="lg:col-span-7 space-y-6">
            <div className="border border-neutral-200 p-6 space-y-4">
              <h2 className="font-serif text-lg">{t("checkout.contact")}</h2>
              {user && user.addresses.length > 0 && (
                <label className="block space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {language === "en" ? "Saved addresses" : "Địa chỉ đã lưu"}
                  </span>
                  <select
                    data-testid="saved-address"
                    defaultValue={(user.addresses.find((a) => a.isDefault) || user.addresses[0]).id}
                    onChange={(e) => {
                      const a = user.addresses.find((x) => x.id === e.target.value);
                      if (a) applyAddress(a);
                    }}
                    className={fieldClass}
                  >
                    {user.addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {[a.address, a.district, a.city].filter(Boolean).join(", ")}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!user && (
                <p className="text-xs text-neutral-500">
                  {language === "en" ? "Have an account? " : "Đã có tài khoản? "}
                  <Link href="/login?next=/checkout" className="underline text-black">
                    {language === "en" ? "Sign in" : "Đăng nhập"}
                  </Link>
                  {language === "en" ? " to track this order in your account." : " để theo dõi đơn trong tài khoản."}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1.5 md:col-span-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {t("label.name")}
                  </span>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {t("label.phone")}
                  </span>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {t("label.email")}
                  </span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1.5 md:col-span-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {t("checkout.address")}
                  </span>
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1.5 md:col-span-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {t("checkout.city")}
                  </span>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1.5 md:col-span-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {t("checkout.note")}
                  </span>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>

            <div className="border border-neutral-200 p-6 space-y-3">
              <h2 className="font-serif text-lg">{t("checkout.payment")}</h2>
              <label
                className={`flex items-start gap-3 border p-4 cursor-pointer ${
                  paymentMethod === "transfer"
                    ? "border-black"
                    : "border-neutral-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "transfer"}
                  onChange={() => setPaymentMethod("transfer")}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium">
                    {t("checkout.transfer")}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {t("checkout.transferHint")}
                  </span>
                </span>
              </label>
              {hasEngraving ? (
                <p className="text-xs text-[#8B6E44]">{t("checkout.codBlocked")}</p>
              ) : (
                <label
                  className={`flex items-start gap-3 border p-4 cursor-pointer ${
                    paymentMethod === "cod"
                      ? "border-black"
                      : "border-neutral-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      {t("checkout.cod")}
                    </span>
                  </span>
                </label>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-[#F8F7F4] border border-neutral-200 p-6 space-y-5 sticky top-24">
              <h3 className="font-serif uppercase tracking-wider border-b border-neutral-300 pb-3">
                {t("cart.summary")}
              </h3>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.lineKey} className="flex gap-3">
                    <Link
                      href={productHref(item.product)}
                      className="relative w-16 h-16 bg-white border border-neutral-200 shrink-0"
                    >
                      <Image
                        src={item.previewImage || item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-serif line-clamp-1">{item.product.name}</p>
                      {item.selectedColor && (
                        <p className="text-neutral-500">
                          {t("label.color")}: {item.selectedColor}
                        </p>
                      )}
                      {item.engravingText && (
                        <p className="text-neutral-500">
                          {t("pdp.engrave")}: {item.engravingText}
                          {item.engravingText && ` · ${placementLabel(item.engravingPlacement, language === "en" ? "en" : "vi")}`}
                        </p>
                      )}
                      <p className="font-medium pt-1">
                        {item.quantity} × {formatPrice(item.product.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-xs border-t border-neutral-300 pt-4">
                <div className="flex justify-between">
                  <span>{t("label.subtotal")}</span>
                  <span className="font-semibold">{formatPrice(cartTotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>EVERIE10</span>
                    <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t("label.shipping")}</span>
                  <span className="font-semibold text-emerald-700">
                    {t("label.freeShipping")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("pdp.expected")}</span>
                  <span className="font-semibold">
                    {formatDayRange(receive.min, receive.max, language)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <span className="font-serif uppercase font-bold">
                    {t("label.total")}
                  </span>
                  <span className="text-xl font-bold">{formatPrice(payableTotal)}</span>
                </div>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-black text-white text-xs uppercase tracking-[2px] font-bold hover:bg-[#C5A880] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? t("checkout.submitting") : t("checkout.placeOrder")}
              </button>
              <Link
                href="/cart"
                className="block text-center text-[11px] uppercase tracking-wider text-neutral-500 hover:text-black"
              >
                {t("btn.back")}
              </Link>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
