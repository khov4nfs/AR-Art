"use client";

import { placementLabel } from "@/lib/engraving";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Truck } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { statusText } from "@/lib/statusText";

type Detail = {
  id: string; orderNumber: string; date: string; total: number; shippingFee?: number; discountAmount?: number;
  status: string; paymentMethod: string; paymentStatus?: string; customerName: string; phone: string; email?: string;
  address: string; trackingCode?: string; timeline: { time: string; title: string; note: string }[];
  items: { name: string; price: number; quantity: number; image: string; color?: string; engravingText?: string; engravingFont?: string; engravingPlacement?: string; giftMessage?: string; previewImage?: string }[];
  expectedMinDays?: number; expectedMaxDays?: number;
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, ready } = useAuth();
  const { formatPrice } = useCart();
  const { language } = useLanguage();
  const en = language === "en";
  const router = useRouter();
  const [order, setOrder] = useState<Detail | null | "missing">(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=/account/orders/${encodeURIComponent(id)}`);
      return;
    }
    let alive = true;
    fetch(`/api/account/orders/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((r) => alive && setOrder(r?.success ? r.data : "missing"))
      .catch(() => alive && setOrder("missing"));
    return () => {
      alive = false;
    };
  }, [ready, user, id, router]);

  const subtotal = order && order !== "missing" ? order.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-10" data-testid="order-detail">
        <Link href="/account?tab=orders" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest underline mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> {en ? "My orders" : "Đơn hàng của tôi"}
        </Link>
        {order === null ? (
          <p className="text-xs text-neutral-400">…</p>
        ) : order === "missing" ? (
          <p role="alert" className="text-sm text-neutral-600">{en ? "Order not found." : "Không tìm thấy đơn hàng."}</p>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap justify-between gap-3 items-end">
              <div>
                <h1 className="font-serif text-2xl">{order.orderNumber}</h1>
                <p className="text-xs text-neutral-500">{order.date}</p>
              </div>
              <div className="text-right text-xs space-y-1">
                <p><span className="px-2 py-1 bg-black text-white">{statusText(order.status, language)}</span></p>
                <p>{order.paymentMethod}{order.paymentStatus ? ` · ${statusText(order.paymentStatus, language)}` : ""}</p>
              </div>
            </div>

            {order.trackingCode && (
              <p className="flex items-center gap-2 text-sm border border-neutral-200 p-3" data-testid="tracking-code">
                <Truck className="w-4 h-4" /> {en ? "Tracking code" : "Mã vận đơn"}: <strong>{order.trackingCode}</strong>
              </p>
            )}
            {order.expectedMinDays && order.expectedMaxDays && (
              <p className="text-xs text-neutral-500">
                {en ? "Expected delivery" : "Dự kiến nhận hàng"}: {order.expectedMinDays}–{order.expectedMaxDays} {en ? "days" : "ngày"}
              </p>
            )}

            <ul className="divide-y divide-neutral-200 border border-neutral-200">
              {order.items.map((it, i) => (
                <li key={i} className="p-4 flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.previewImage || it.image} alt={it.name} className="w-20 h-20 object-cover bg-neutral-100 shrink-0" />
                  <div className="flex-1 min-w-0 text-sm space-y-1">
                    <p className="font-semibold">{it.name} × {it.quantity}</p>
                    {it.color && <p className="text-xs text-neutral-500">{en ? "Colour" : "Màu"}: {it.color}</p>}
                    {it.engravingText && (
                      <p className="text-xs text-neutral-500">{en ? "Engraving" : "Khắc chữ"}: “{it.engravingText}”{it.engravingFont ? ` (${it.engravingFont})` : ""} · {placementLabel(it.engravingPlacement, en ? "en" : "vi")}</p>
                    )}
                    {it.giftMessage && <p className="text-xs text-neutral-500">{en ? "Gift note" : "Lời nhắn"}: {it.giftMessage}</p>}
                    {it.previewImage && <p className="text-[10px] uppercase tracking-wider text-[#C5A880]">{en ? "3D design snapshot" : "Ảnh thiết kế 3D"}</p>}
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(it.price * it.quantity)}</p>
                </li>
              ))}
            </ul>

            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">{en ? "Delivery" : "Giao đến"}</p>
                <p>{order.customerName} · {order.phone}</p>
                {order.email && <p>{order.email}</p>}
                <p className="text-neutral-600">{order.address}</p>
              </div>
              <div className="space-y-1">
                <p className="flex justify-between"><span>{en ? "Subtotal" : "Tạm tính"}</span><span>{formatPrice(subtotal)}</span></p>
                {order.discountAmount ? <p className="flex justify-between"><span>{en ? "Discount" : "Giảm giá"}</span><span>-{formatPrice(order.discountAmount)}</span></p> : null}
                <p className="flex justify-between"><span>{en ? "Shipping" : "Phí giao"}</span><span>{formatPrice(order.shippingFee || 0)}</span></p>
                <p className="flex justify-between font-semibold border-t pt-1"><span>{en ? "Total" : "Tổng"}</span><span>{formatPrice(order.total)}</span></p>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 mb-3">{en ? "Timeline" : "Tiến trình"}</p>
              <ol className="border-l border-neutral-300 pl-4 space-y-3" data-testid="order-timeline">
                {[...order.timeline].reverse().map((ev, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-semibold">{statusText(ev.title, language)}</p>
                    <p className="text-xs text-neutral-500">{ev.time}{ev.note ? ` · ${ev.note}` : ""}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
