"use client";

import React, { useState } from "react";
import Image from "next/image";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatDayRange } from "@/lib/everie";
import type { BespokeRequest, OrderItem } from "@/lib/store";

type LookupResult = {
  order?: OrderItem;
  request?: BespokeRequest;
};

export default function LookupPage() {
  const { formatPrice } = useCart();
  const { t, language } = useLanguage();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);

  const fieldClass =
    "w-full px-3 py-2.5 border border-neutral-300 text-sm focus:outline-hidden focus:border-black bg-white";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = orderNumber.trim();
    const mail = email.trim();
    const tel = phone.trim();
    if (!code || (!mail && !tel)) {
      setError(t("lookup.empty"));
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: code,
          email: mail || undefined,
          phone: tel || undefined,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        data?: LookupResult;
        error?: string;
      };
      if (!res.ok || !data.success || !data.data) {
        setError(res.status === 404 || !data.error ? t("lookup.notFound") : data.error);
        return;
      }
      setResult(data.data);
    } catch {
      setError(t("lookup.notFound"));
    } finally {
      setLoading(false);
    }
  };

  const order = result?.order;
  const request = result?.request;
  const remainingRevisions = request
    ? Math.max(0, request.maxRevisions - request.revisionCount)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Header />
      <main className="flex-1 py-12 md:py-16 px-4 md:px-8 max-w-[720px] mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
            EVERIE
          </span>
          <h1 className="text-3xl font-serif font-light uppercase tracking-wide">
            {t("lookup.title")}
          </h1>
          <p className="text-sm text-neutral-600">{t("lookup.hint")}</p>
          <div className="w-12 h-0.5 bg-[#C5A880] mx-auto mt-2" />
        </div>

        <form onSubmit={handleSubmit} className="border border-neutral-200 p-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              {t("lookup.orderNumber")}
            </span>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className={fieldClass}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              {t("label.email")}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              {t("label.phone")}
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
            />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white text-xs uppercase tracking-[2px] font-semibold hover:bg-[#C5A880] disabled:opacity-50 cursor-pointer"
          >
            {loading ? t("label.loading") : t("lookup.submit")}
          </button>
        </form>

        {order && (
          <div className="border border-neutral-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-lg">{order.orderNumber}</h2>
              <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 border border-black">
                {order.status}
              </span>
            </div>
            {order.trackingCode && (
              <p className="text-sm">
                {t("lookup.tracking")}: <strong>{order.trackingCode}</strong>
              </p>
            )}
            {order.expectedMinDays != null && order.expectedMaxDays != null && (
              <p className="text-sm">
                {t("pdp.expected")}:{" "}
                <strong>
                  {formatDayRange(
                    order.expectedMinDays,
                    order.expectedMaxDays,
                    language,
                  )}
                </strong>
              </p>
            )}
            <div className="divide-y divide-neutral-100 border-t border-neutral-200">
              {order.items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex gap-3 py-3">
                  <div className="relative w-14 h-14 bg-neutral-50 border border-neutral-200 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="text-xs flex-1">
                    <p className="font-serif">{item.name}</p>
                    {item.color && (
                      <p className="text-neutral-500">
                        {t("label.color")}: {item.color}
                      </p>
                    )}
                    {item.engravingText && (
                      <p className="text-neutral-500">
                        {t("pdp.engrave")}: {item.engravingText}
                      </p>
                    )}
                    <p>
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {request && (
          <div className="border border-neutral-200 p-6 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-lg">{t("lookup.bespoke")}</h2>
              <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 border border-black">
                {request.status}
              </span>
            </div>
            <p>
              {t("lookup.orderNumber")}: <strong>{request.code}</strong>
            </p>
            <p>
              {t("lookup.revisionsLeft")}:{" "}
              <strong>
                {remainingRevisions}/{request.maxRevisions}
              </strong>
            </p>
            {request.engravingText && (
              <p>
                {t("pdp.engrave")}: <strong>{request.engravingText}</strong>
              </p>
            )}
            {request.notes && (
              <p className="text-neutral-600">{request.notes}</p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
