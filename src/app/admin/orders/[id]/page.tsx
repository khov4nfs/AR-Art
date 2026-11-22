"use client";

import { placementLabel } from "@/lib/engraving";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Clock,
  User,
  Phone,
  CreditCard,
  Package,
  Save,
  Trash2,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import { OrderItem } from "@/lib/store";
import CustomSelect from "@/components/admin/CustomSelect";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for editable fields
  const [status, setStatus] = useState<OrderItem["status"]>("Chờ xác nhận");
  const [paymentStatus, setPaymentStatus] = useState<"Chưa thanh toán" | "Đã thanh toán" | "Đã hoàn tiền">("Đã thanh toán");
  const [trackingCode, setTrackingCode] = useState("");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [siteSettings, setSiteSettings] = useState<{ siteName?: string; hotline?: string; email?: string }>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setSiteSettings(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const o: OrderItem = data.data;
          setOrder(o);
          setStatus(o.status);
          setPaymentStatus(o.paymentStatus || "Đã thanh toán");
          setTrackingCode(o.trackingCode || "");
          setNotes(o.notes || "");
          setCustomerName(o.customerName || "");
          setPhone(o.phone || "");
          setEmail(o.email || "");
          setAddress(o.address || "");
        } else {
          setError("Không tìm thấy đơn hàng này");
        }
      } catch {
        setError("Lỗi khi tải thông tin đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleSave = async () => {
    if (!order) return;
    if (status === "Đang vận chuyển" && !trackingCode.trim()) {
      setError("Cần mã vận đơn trước khi chuyển sang Đang vận chuyển.");
      return;
    }
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentStatus,
          trackingCode,
          notes,
          customerName,
          phone,
          email,
          address,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Lưu thất bại: " + data.error);
      }
    } catch {
      alert("Lỗi khi lưu thông tin đơn hàng");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng ${order.orderNumber}?`)) return;

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/orders");
      } else {
        alert("Xóa thất bại: " + data.error);
      }
    } catch {
      alert("Lỗi khi xóa đơn hàng");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-stone-400">
        <Clock className="w-8 h-8 animate-spin mx-auto text-[#C5A880] mb-3" />
        Đang tải thông tin chi tiết đơn hàng...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-stone-400">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-stone-200 font-semibold mb-2">{error || "Đơn hàng không tồn tại"}</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs text-[#C5A880] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const subtotal = order.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingFee = order.shippingFee || 0;
  const discountAmount = order.discountAmount || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 print:p-0 print:m-0">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors border border-stone-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono text-white tracking-wide">
                Đơn Hàng #{order.orderNumber}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]/30">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              Đặt lúc: {order.date}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 flex items-center gap-2 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> In Hóa Đơn
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#C5A880] hover:bg-[#b59870] text-black text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-[#C5A880]/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg border border-red-900/40 transition-colors"
            title="Xóa đơn hàng"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn print:hidden">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Đã cập nhật thông tin đơn hàng thành công!
        </div>
      )}
      {error && order && (
        <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2 print:hidden">
          <AlertCircle className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      {/* Printable Invoice Header (Visible on print) */}
      <div className="hidden print:block mb-8 pb-4 border-b border-stone-300 text-black">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold font-serif">{siteSettings.siteName?.toUpperCase() || "EVERIE"}</h1>
            <p className="text-sm">Hóa đơn bán lẻ / Order Receipt</p>
            <p className="text-xs text-stone-600">Hotline: {siteSettings.hotline || "0908 188 188"} | {siteSettings.email || "hello@everie.vn"}</p>
          </div>
          <div className="text-right">
            <p className="font-bold font-mono text-lg">#{order.orderNumber}</p>
            <p className="text-xs text-stone-600">Ngày: {order.date}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Financial Breakdown (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table Card */}
          <div className="bg-[#141417] border border-stone-800 rounded-xl overflow-hidden print:bg-white print:border-stone-300 print:text-black">
            <div className="p-4 border-b border-stone-800 bg-[#17171A] flex items-center justify-between print:bg-stone-100">
              <h2 className="text-sm font-semibold text-white print:text-black flex items-center gap-2">
                <Package className="w-4 h-4 text-[#C5A880]" /> Danh Sách Sản Phẩm ({order.items.length})
              </h2>
            </div>

            <div className="divide-y divide-stone-800/60 print:divide-stone-300">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center gap-4 hover:bg-stone-800/20 transition-colors">
                  <div className="relative w-16 h-16 rounded-lg bg-stone-900 border border-stone-800 overflow-hidden shrink-0 print:border-stone-300">
                    <Image
                      src={item.image || "/images/placeholder.jpg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-stone-200 print:text-black truncate">
                      {item.name}
                    </h3>
                    <div className="mt-0.5 space-y-0.5 text-xs text-stone-400 print:text-stone-600">
                      {item.sku && (
                        <p className="font-mono">
                          SKU: <span className="text-stone-300 print:text-black">{item.sku}</span>
                        </p>
                      )}
                      {item.color && (
                        <p>
                          Màu men: <span className="text-stone-300 print:text-black">{item.color}</span>
                        </p>
                      )}
                      {item.engravingText && (
                        <p>
                          Khắc chữ:{" "}
                          <span className="text-[#C5A880] print:text-black">“{item.engravingText}”</span>
                        </p>
                      )}
                      {item.engravingText && (
                        <p>
                          Vị trí khắc:{" "}
                          <span className="text-stone-300 print:text-black">{placementLabel(item.engravingPlacement)}</span>
                          {item.engravingSpot && (
                            <span className="block text-[10px] text-stone-500 font-mono print:text-black">
                              {item.engravingSpot.frame === "model" ? "trên hoa" : "trên đế"} · điểm ({item.engravingSpot.p.join(", ")}) · pháp tuyến ({item.engravingSpot.n.join(", ")}) · xoay {item.engravingSpot.rot}° · cỡ {Math.round(item.engravingSpot.scale * 100)}% — xem ảnh 3D xem trước để thấy đúng chỗ khắc
                            </span>
                          )}
                        </p>
                      )}
                      {item.engravingFont && (
                        <p>
                          Kiểu chữ: <span className="text-stone-300 print:text-black">{item.engravingFont}</span>
                        </p>
                      )}
                      {item.giftMessage && (
                        <p>
                          Thiệp: <span className="text-stone-300 print:text-black italic">“{item.giftMessage}”</span>
                        </p>
                      )}
                      {item.previewImage && (
                        <a
                          href={item.previewImage}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block w-40 border border-[#C5A880]/40 rounded-lg overflow-hidden"
                          title="Ảnh 3D khách đã cấu hình"
                        >
                          <Image
                            src={item.previewImage}
                            alt={`Bản thiết kế 3D – ${item.name}`}
                            width={160}
                            height={160}
                            unoptimized
                            className="w-40 h-40 object-cover"
                          />
                          <span className="block text-[10px] text-center py-1 text-[#C5A880] print:text-black">
                            Ảnh 3D khách đã cấu hình
                          </span>
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 print:text-stone-600 mt-0.5 font-mono">
                      {item.price.toLocaleString("vi-VN")} ₫ × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white print:text-black font-mono">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="p-5 bg-[#17171A]/80 border-t border-stone-800 space-y-2.5 text-xs text-stone-400 print:bg-stone-50 print:text-stone-700 print:border-stone-300">
              <div className="flex justify-between">
                <span>Tạm tính tiền hàng:</span>
                <span className="font-mono text-stone-200 print:text-black">{subtotal.toLocaleString("vi-VN")} ₫</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển giao hàng:</span>
                <span className="font-mono text-stone-200 print:text-black">
                  {shippingFee === 0 ? "Miễn phí (0 ₫)" : `${shippingFee.toLocaleString("vi-VN")} ₫`}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Khuyến mãi / Giảm giá:</span>
                  <span className="font-mono">-{discountAmount.toLocaleString("vi-VN")} ₫</span>
                </div>
              )}
              <div className="pt-3 border-t border-stone-800 print:border-stone-300 flex justify-between items-center text-sm font-semibold text-white print:text-black">
                <span>Tổng cộng đơn hàng:</span>
                <span className="text-lg font-bold font-mono text-[#C5A880] print:text-black">
                  {order.total.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>
          </div>

          {/* Status & Payment Controls */}
          <div className="bg-[#141417] border border-stone-800 rounded-xl p-5 space-y-4 print:hidden">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#C5A880]" /> Trạng Thái & Xử Lý Đơn Hàng
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-stone-400 mb-1.5 block">Tiến trình đơn hàng</label>
                <CustomSelect
                  value={status}
                  onChange={(val) => setStatus(val as OrderItem["status"])}
                  options={[
                    { value: "Chờ xác nhận", label: "Chờ xác nhận" },
                    { value: "Đang chế tác", label: "Đang chế tác (Xưởng đang làm)" },
                    { value: "Đang xử lý", label: "Đang xử lý (Đang chuẩn bị gói hàng)" },
                    { value: "Đang vận chuyển", label: "Đang vận chuyển (Đã bàn giao bưu tá)" },
                    { value: "Đã giao hàng", label: "Đã giao hàng thành công" },
                    { value: "Hư hỏng khi vận chuyển", label: "Hư hỏng khi vận chuyển" },
                    { value: "Đã hủy", label: "Đã hủy đơn" },
                  ]}
                  searchable={false}
                />
              </div>

              <div>
                <label className="text-xs text-stone-400 mb-1.5 block">Trạng thái thanh toán</label>
                <CustomSelect
                  value={paymentStatus}
                  onChange={(val) =>
                    setPaymentStatus(val as "Chưa thanh toán" | "Đã thanh toán" | "Đã hoàn tiền")
                  }
                  options={[
                    { value: "Đã thanh toán", label: "Đã thanh toán đủ" },
                    { value: "Chưa thanh toán", label: "Chưa thanh toán (Thu COD khi giao)" },
                    { value: "Đã hoàn tiền", label: "Đã hoàn tiền" },
                  ]}
                  searchable={false}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-[#1A1A1D] border border-stone-800 rounded-lg text-xs">
                <p className="text-stone-400 mb-1">Khắc chữ trên đơn</p>
                <p className={order.hasEngraving ? "text-[#C5A880] font-medium" : "text-stone-300"}>
                  {order.hasEngraving ? "Có khắc chữ" : "Không khắc chữ"}
                </p>
              </div>
              <div className="p-3 bg-[#1A1A1D] border border-stone-800 rounded-lg text-xs">
                <p className="text-stone-400 mb-1">Dự kiến nhận hàng</p>
                <p className="text-stone-200 font-mono">
                  {order.expectedMinDays != null && order.expectedMaxDays != null
                    ? `${order.expectedMinDays}–${order.expectedMaxDays} ngày`
                    : "Chưa ước tính"}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-400 mb-1.5 block">
                Mã vận đơn giao hàng (Tracking Number)
                {status === "Đang vận chuyển" && (
                  <span className="text-red-400"> *</span>
                )}
              </label>
              <input
                type="text"
                placeholder="VD: GHN8291039VN, VTP98129..."
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Notes (1 col wide) */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="bg-[#141417] border border-stone-800 rounded-xl p-5 space-y-4 print:bg-white print:border-stone-300 print:text-black">
            <h2 className="text-sm font-semibold text-white print:text-black flex items-center gap-2">
              <User className="w-4 h-4 text-[#C5A880]" /> Thông Tin Khách Hàng
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 text-[11px] block mb-1">Họ và tên người nhận</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2 text-stone-200 focus:border-[#C5A880] focus:outline-none print:bg-transparent print:border-none print:p-0 print:text-black"
                />
              </div>

              <div>
                <label className="text-stone-400 text-[11px] block mb-1">Số điện thoại</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-[#1A1A1D] border border-stone-800 rounded-lg p-2 text-stone-200 font-mono focus:border-[#C5A880] focus:outline-none print:bg-transparent print:border-none print:p-0 print:text-black"
                  />
                  <a
                    href={`tel:${phone}`}
                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 print:hidden"
                    title="Gọi điện"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div>
                <label className="text-stone-400 text-[11px] block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Chưa có email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2 text-stone-200 focus:border-[#C5A880] focus:outline-none print:bg-transparent print:border-none print:p-0 print:text-black"
                />
              </div>

              <div>
                <label className="text-stone-400 text-[11px] block mb-1">Địa chỉ giao hàng</label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2 text-stone-200 focus:border-[#C5A880] focus:outline-none resize-none print:bg-transparent print:border-none print:p-0 print:text-black"
                />
              </div>
            </div>
          </div>

          {/* Internal Notes Card */}
          <div className="bg-[#141417] border border-stone-800 rounded-xl p-5 space-y-3 print:hidden">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C5A880]" /> Ghi Chú Đơn Hàng
            </h2>
            <textarea
              rows={4}
              placeholder="Nhập ghi chú nội bộ của nhân viên (ví dụ: khách dặn giao trước 17h, tặng kèm thiệp chúc mừng sinh nhật...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-[#C5A880] focus:outline-none resize-none"
            />
          </div>

          {(order.timeline?.length ?? 0) > 0 && (
            <div className="bg-[#141417] border border-stone-800 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">Lịch sử trạng thái</h2>
              <ol className="space-y-3">
                {order.timeline?.map((event, index) => (
                  <li key={`${event.time}-${index}`} className="text-xs border-l border-stone-700 pl-3">
                    <p className="text-stone-200 font-medium">{event.title}</p>
                    <p className="text-stone-400">{event.note}</p>
                    <p className="text-stone-500 font-mono mt-1">
                      {event.time}
                      {event.actor ? ` · ${event.actor}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
