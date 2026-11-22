"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Clock,
  AlertCircle,
  Flower2,
  ShoppingCart,
} from "lucide-react";
import type { BespokeRequest, BespokeStatus, OrderItem } from "@/lib/store";
import CustomSelect from "@/components/admin/CustomSelect";
import { BESPOKE_FLOW, CRAFT_DAYS, expectedReceiveRange } from "@/lib/everie";

interface BespokeDetailResponse {
  success: boolean;
  data?: BespokeRequest;
  error?: string;
}

interface OrderCreateResponse {
  success: boolean;
  data?: OrderItem;
  error?: string;
}


export default function AdminBespokeDetailPage() {
  const params = useParams();
  const requestId = typeof params?.id === "string" ? params.id : "";

  const [request, setRequest] = useState<BespokeRequest | null>(null);
  const [status, setStatus] = useState<BespokeStatus>("Mới");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [shipAddress, setShipAddress] = useState("");

  useEffect(() => {
    if (!requestId) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/bespoke/${requestId}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as BespokeDetailResponse;
        if (json.success && json.data) {
          setRequest(json.data);
          setStatus(json.data.status);
        } else {
          setError(json.error || "Không tìm thấy yêu cầu");
        }
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError("Lỗi khi tải yêu cầu Bespoke");
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [requestId]);

  const persist = async (payload: Partial<BespokeRequest>) => {
    if (!request) return null;
    const res = await fetch(`/api/bespoke/${request.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as BespokeDetailResponse;
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || "Lưu thất bại");
    }
    setRequest(json.data);
    setStatus(json.data.status);
    return json.data;
  };

  const handleSave = async () => {
    if (!request) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      // Revision counting and transition rules live on the server.
      if (status !== request.status) await persist({ status });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi khi lưu yêu cầu";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!request) return;
    const amount = Number(quoteAmount.replace(/[^\d]/g, ""));
    const address = shipAddress.trim();
    if (!amount || amount <= 0 || !address) {
      setError("Nhập giá báo và địa chỉ giao trước khi tạo đơn.");
      return;
    }
    setCreatingOrder(true);
    setError(null);
    try {
      const range = expectedReceiveRange(CRAFT_DAYS.bespoke.min, CRAFT_DAYS.bespoke.max);
      const orderBody: Omit<OrderItem, "id" | "orderNumber" | "date"> = {
        total: amount,
        status: "Chờ xác nhận",
        paymentMethod: "Chuyển khoản ngân hàng",
        paymentStatus: "Đã thanh toán",
        customerName: request.customerName,
        phone: request.phone,
        email: request.email,
        address,
        notes: `Từ yêu cầu Bespoke ${request.code}. Dịp: ${request.occasion || "—"}. ${request.notes}`.trim(),
        hasEngraving: Boolean(request.engravingText),
        expectedMinDays: range.min,
        expectedMaxDays: range.max,
        items: [
          {
            sku: request.code,
            name: request.flowerPreference
              ? `Bespoke — ${request.flowerPreference}`
              : "Hoa gốm Bespoke",
            price: amount,
            quantity: 1,
            image: request.attachments[0] || "/images/hanoia/heritage-craft.webp",
            color: request.colorPreference || undefined,
            engravingText: request.engravingText || undefined,
          },
        ],
      };

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...orderBody, customerId: request.customerId }),
      });
      const orderJson = (await orderRes.json()) as OrderCreateResponse;
      if (!orderRes.ok || !orderJson.success || !orderJson.data) {
        throw new Error(orderJson.error || "Không tạo được đơn hàng");
      }

      await persist({
        status: "Đã thanh toán",
        orderId: orderJson.data.id,
        quoteAmount: amount,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi khi tạo đơn hàng";
      setError(message);
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-stone-400">
        <Clock className="w-8 h-8 animate-spin mx-auto text-[#C5A880] mb-3" />
        Đang tải yêu cầu Bespoke...
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="p-12 text-center text-stone-400">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-stone-200 font-semibold mb-2">{error}</p>
        <Link
          href="/admin/bespoke"
          className="inline-flex items-center gap-2 text-xs text-[#C5A880] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (!request) return null;

  const remaining = Math.max(0, request.maxRevisions - request.revisionCount);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/bespoke"
            className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors border border-stone-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono text-white tracking-wide">
                {request.code}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]/30">
                {request.status}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-2">
              <Flower2 className="w-3.5 h-3.5 text-stone-500" />
              Gửi lúc {request.createdAt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {request.status === "Đã duyệt" && !request.orderId && (
            <button
              type="button"
              onClick={() => void handleCreateOrder()}
              disabled={creatingOrder}
              className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {creatingOrder ? "Đang tạo…" : "Tạo đơn hàng"}
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 bg-[#C5A880] hover:bg-[#b59870] text-black text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-[#C5A880]/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Đã cập nhật yêu cầu Bespoke.
        </div>
      )}
      {error && request && (
        <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#141417] border border-stone-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Thông tin yêu cầu</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <Info label="Họ tên" value={request.customerName} />
              <Info label="Điện thoại" value={request.phone} />
              <Info label="Email" value={request.email} />
              <Info label="Dịp tặng" value={request.occasion || "—"} />
              <Info label="Loài hoa" value={request.flowerPreference || "—"} />
              <Info label="Màu men" value={request.colorPreference || "—"} />
              <Info
                label="Chữ khắc"
                value={request.engravingText || "Không khắc"}
              />
              <Info
                label="Đơn hàng liên kết"
                value={request.orderId || "Chưa tạo"}
              />
            </dl>
            <div>
              <p className="text-[11px] text-stone-400 mb-1">Ghi chú</p>
              <p className="text-xs text-stone-200 whitespace-pre-wrap">
                {request.notes || "—"}
              </p>
            </div>
          </div>

          <div className="bg-[#141417] border border-stone-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">
              Ảnh đính kèm ({request.attachments.length})
            </h2>
            {request.attachments.length === 0 ? (
              <p className="text-xs text-stone-500">Không có ảnh tham khảo.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {request.attachments.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden border border-stone-800 bg-stone-900"
                  >
                    <Image
                      src={url}
                      alt="Ảnh tham khảo Bespoke"
                      fill
                      className="object-cover"
                      sizes="160px"
                      unoptimized
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#141417] border border-stone-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Trạng thái</h2>
            <CustomSelect
              value={status}
              onChange={(val) => setStatus(val as BespokeStatus)}
              options={[request.status, ...(BESPOKE_FLOW[request.status] || [])]
                .filter((item) => item !== "Đã thanh toán" || request.orderId)
                .filter((item) => item !== "Yêu cầu sửa" || request.revisionCount < request.maxRevisions)
                .map((item) => ({ value: item, label: item }))}
              searchable={false}
            />
            {request.status === "Đã duyệt" && !request.orderId && (
              <div className="space-y-2">
                <label className="text-[11px] text-stone-400 block">
                  Giá báo (VND)
                  <input
                    type="text"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="mt-1 w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2 text-xs text-stone-200 font-mono"
                    placeholder="8500000"
                  />
                </label>
                <label className="text-[11px] text-stone-400 block">
                  Địa chỉ giao
                  <textarea
                    rows={2}
                    value={shipAddress}
                    onChange={(e) => setShipAddress(e.target.value)}
                    className="mt-1 w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2 text-xs text-stone-200"
                    placeholder="Số nhà, quận, thành phố"
                  />
                </label>
              </div>
            )}
            <div className="p-3 bg-[#1A1A1D] border border-stone-800 rounded-lg text-xs space-y-1">
              <p className="text-stone-300">
                Đã sửa:{" "}
                <span className="font-mono text-[#C5A880]">
                  {request.revisionCount}/{request.maxRevisions}
                </span>
              </p>
              <p className="text-stone-400">Còn {remaining} lượt sửa bản vẽ.</p>
              {status === "Yêu cầu sửa" && remaining === 0 && (
                <p className="text-amber-400">Đã hết lượt sửa — không tăng thêm.</p>
              )}
            </div>
            {request.orderId && (
              <Link
                href={`/admin/orders/${request.orderId}`}
                className="block text-center px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg border border-stone-700"
              >
                Mở đơn {request.orderId}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-stone-400 mb-1">{label}</dt>
      <dd className="text-stone-200">{value}</dd>
    </div>
  );
}
