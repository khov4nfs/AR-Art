"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CreditCard,
  User,
  MapPin,
} from "lucide-react";
import { OrderItem } from "@/lib/store";
import CustomSelect from "@/components/admin/CustomSelect";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [quickUpdatingId, setQuickUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderItem["status"]) => {
    try {
      setQuickUpdatingId(orderId);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái đơn hàng:", err);
    } finally {
      setQuickUpdatingId(null);
    }
  };

  // Filtering
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    const matchesPayment =
      paymentFilter === "ALL" ||
      order.paymentMethod.toLowerCase().includes(paymentFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: OrderItem["status"]) => {
    switch (status) {
      case "Đã giao hàng":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <CheckCircle className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case "Đang vận chuyển":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950/60 text-blue-400 border border-blue-800/60">
            <Truck className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case "Đang xử lý":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 text-amber-400 border border-amber-800/60">
            <Clock className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case "Chờ xác nhận":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-800/60">
            <Clock className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case "Đã hủy":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-950/60 text-red-400 border border-red-800/60">
            <XCircle className="w-3.5 h-3.5" /> {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-800 text-stone-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            Quản Lý Đơn Hàng
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Tổng cộng <span className="text-[#C5A880] font-semibold">{orders.length}</span> đơn hàng trên toàn hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="px-3.5 py-2 bg-stone-800/80 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700/60 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141417] border border-stone-800/80 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách, số điện thoại, địa chỉ..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg pl-10 pr-4 py-2 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-[#C5A880]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2 min-w-[190px]">
            <span className="text-xs text-stone-400 shrink-0">Trạng thái:</span>
            <CustomSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "Chờ xác nhận", label: "Chờ xác nhận" },
                { value: "Đang xử lý", label: "Đang xử lý" },
                { value: "Đang vận chuyển", label: "Đang vận chuyển" },
                { value: "Đã giao hàng", label: "Đã giao hàng" },
                { value: "Đã hủy", label: "Đã hủy" },
              ]}
              searchable={false}
              size="sm"
            />
          </div>

          {/* Payment Filter */}
          <div className="flex items-center gap-2 min-w-[210px]">
            <span className="text-xs text-stone-400 shrink-0">Thanh toán:</span>
            <CustomSelect
              value={paymentFilter}
              onChange={(val) => {
                setPaymentFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "ALL", label: "Tất cả phương thức" },
                { value: "COD", label: "COD (Tiền mặt)" },
                { value: "Chuyển khoản", label: "Chuyển khoản" },
                { value: "Thẻ tín dụng", label: "Thẻ tín dụng / VNPAY" },
              ]}
              searchable={false}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Dense Orders Table */}
      <div className="bg-[#141417] border border-stone-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-stone-800/80 bg-[#17171A] text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                <th className="py-3.5 px-4">Mã Đơn</th>
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Khách Hàng</th>
                <th className="py-3.5 px-4">Sản Phẩm</th>
                <th className="py-3.5 px-4 text-right">Tổng Tiền</th>
                <th className="py-3.5 px-4">Thanh Toán</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/40 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C5A880] mb-2" />
                    Đang tải dữ liệu đơn hàng...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const itemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
                  const firstItem = order.items[0];

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-stone-800/30 transition-colors group"
                    >
                      {/* Order Code */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-bold text-[#C5A880] hover:text-[#e4cfb3] transition-colors"
                        >
                          {order.orderNumber}
                        </Link>
                        {order.trackingCode && (
                          <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                            MVD: {order.trackingCode}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-stone-400 whitespace-nowrap">
                        {order.date}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-medium text-stone-200 truncate flex items-center gap-1.5">
                          <User className="w-3 h-3 text-stone-500 shrink-0" />
                          <span>{order.customerName}</span>
                        </div>
                        <div className="text-stone-400 text-[11px] font-mono mt-0.5">
                          {order.phone}
                        </div>
                        <div className="text-stone-500 text-[10px] truncate mt-0.5" title={order.address}>
                          {order.address}
                        </div>
                      </td>

                      {/* Products Summary */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {firstItem && (
                            <div className="relative w-9 h-9 rounded bg-stone-900 border border-stone-800 overflow-hidden shrink-0">
                              <Image
                                src={firstItem.image || "/images/placeholder.jpg"}
                                alt={firstItem.name}
                                fill
                                className="object-cover"
                                sizes="36px"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-stone-300 font-medium truncate max-w-[160px]">
                              {firstItem?.name || "Sản phẩm"}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {itemsCount} món hàng {order.items.length > 1 && `(${order.items.length} loại)`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-semibold text-stone-100 font-mono">
                          {order.total.toLocaleString("vi-VN")} ₫
                        </div>
                        {order.shippingFee !== undefined && (
                          <div className="text-[10px] text-stone-500">
                            Ship: {order.shippingFee.toLocaleString("vi-VN")} ₫
                          </div>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-stone-300">
                          <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                          <span>{order.paymentMethod}</span>
                        </div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                          {order.paymentStatus || "Đã thanh toán"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          {getStatusBadge(order.status)}
                          {/* Quick Status Dropdown */}
                          <div className="w-36">
                            <CustomSelect
                              value={order.status}
                              disabled={quickUpdatingId === order.id}
                              onChange={(val) =>
                                handleQuickStatusChange(order.id, val as OrderItem["status"])
                              }
                              options={[
                                { value: "Chờ xác nhận", label: "Chờ xác nhận" },
                                { value: "Đang xử lý", label: "Đang xử lý" },
                                { value: "Đang vận chuyển", label: "Đang vận chuyển" },
                                { value: "Đã giao hàng", label: "Đã giao hàng" },
                                { value: "Đã hủy", label: "Đã hủy" },
                              ]}
                              searchable={false}
                              size="sm"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#C5A880]/15 hover:bg-[#C5A880] text-[#C5A880] hover:text-black font-medium rounded-lg text-xs transition-colors border border-[#C5A880]/30"
                        >
                          <Eye className="w-3.5 h-3.5" /> Chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-[#17171A] border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <div>
            Hiển thị <span className="font-semibold text-stone-200">{filteredOrders.length === 0 ? 0 : startIndex + 1}</span> -{" "}
            <span className="font-semibold text-stone-200">
              {Math.min(startIndex + itemsPerPage, filteredOrders.length)}
            </span>{" "}
            trong tổng số <span className="font-semibold text-stone-200">{filteredOrders.length}</span> đơn hàng
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-stone-800 bg-[#1A1A1D] hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-stone-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-stone-900 border border-stone-800 rounded-lg font-mono text-xs text-stone-300">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-stone-800 bg-[#1A1A1D] hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-stone-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
