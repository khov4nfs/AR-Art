"use client";

import { placementLabel } from "@/lib/engraving";
import { useMounted } from "@/hooks/useMounted";
import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { formatDayRange } from "@/lib/everie";
import { LAST_ORDER_KEY, type LastOrderSnapshot } from "@/lib/lastOrder";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || "";
  const { formatPrice } = useCart();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const mounted = useMounted();
  const [snapshotState, setSnapshotState] = useState<{ key: string; value: LastOrderSnapshot | null } | null>(null);
  const snapKey = orderNumber || "";
  if (mounted && snapshotState?.key !== snapKey) {
    let value: LastOrderSnapshot | null = null;
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      const parsed = raw ? (JSON.parse(raw) as LastOrderSnapshot) : null;
      if (parsed && (!orderNumber || parsed.orderNumber === orderNumber)) value = parsed;
    } catch {
      // ignore
    }
    setSnapshotState({ key: snapKey, value });
  }
  const snapshot = snapshotState?.value ?? null;
  const [qrUrl, setQrUrl] = useState("");


  const isTransfer = Boolean(
    snapshot?.paymentMethod.toLowerCase().includes("chuyển khoản") ||
      snapshot?.paymentMethod.toLowerCase().includes("transfer"),
  );

  useEffect(() => {
    if (!isTransfer || !snapshot) return;
    const lines = [
      settings.bankName,
      settings.bankAccount,
      settings.bankAccountName,
      snapshot.orderNumber,
      String(snapshot.total),
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");
    let cancelled = false;
    QRCode.toDataURL(lines, {
      width: 200,
      margin: 1,
      color: { dark: "#111111", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [
    isTransfer,
    snapshot,
    settings.bankName,
    settings.bankAccount,
    settings.bankAccountName,
  ]);

  const code = snapshot?.orderNumber || orderNumber;

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Header />
      <main className="flex-1 py-12 md:py-16 px-4 md:px-8 max-w-[720px] mx-auto w-full space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
            EVERIE
          </span>
          <h1 className="text-3xl font-serif font-light uppercase tracking-wide">
            {t("success.title")}
          </h1>
          <p className="text-sm text-neutral-600">{t("success.thanks")}</p>
        </div>

        <div className="border border-neutral-200 p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">{t("success.code")}</span>
            <span className="font-semibold tracking-wider">{code || "—"}</span>
          </div>
          {snapshot && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">{t("pdp.expected")}</span>
                <span className="font-medium">
                  {formatDayRange(
                    snapshot.expectedMinDays,
                    snapshot.expectedMaxDays,
                    language,
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">{t("label.total")}</span>
                <span className="font-semibold">{formatPrice(snapshot.total)}</span>
              </div>
              <div className="divide-y divide-neutral-100 border-t border-neutral-200 pt-3">
                {snapshot.items.map((item, index) => (
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
                          {t("pdp.engrave")}: {item.engravingText} · {placementLabel(item.engravingPlacement, language === "en" ? "en" : "vi")}
                        </p>
                      )}
                      <p>
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {isTransfer && (
          <div className="border border-[#C5A880]/50 bg-[#F8F7F4] p-6 space-y-3 text-sm">
            <h2 className="font-serif uppercase tracking-wider">
              {t("success.bank")}
            </h2>
            <p>
              {t("checkout.bankName")}:{" "}
              <strong>{settings.bankName || "—"}</strong>
            </p>
            <p>
              {t("checkout.bankAccount")}:{" "}
              <strong>{settings.bankAccount || "—"}</strong>
            </p>
            <p>
              {t("checkout.bankAccountName")}:{" "}
              <strong>{settings.bankAccountName || "—"}</strong>
            </p>
            <p className="text-xs text-neutral-600">
              {t("success.transferNote", { order: code })}
            </p>
            {qrUrl && (
              <div className="pt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="QR"
                  width={160}
                  height={160}
                  className="border border-neutral-200 bg-white"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/lookup"
            className="px-6 py-3 bg-black text-white text-xs uppercase tracking-[2px] font-semibold text-center hover:bg-[#C5A880]"
          >
            {t("success.lookup")}
          </Link>
          <Link
            href="/classic"
            className="px-6 py-3 border border-black text-xs uppercase tracking-[2px] font-semibold text-center hover:bg-neutral-50"
          >
            {t("success.continue")}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs uppercase tracking-widest text-neutral-400">
          Đang tải...
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
