"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { ProductItem } from "@/lib/store";
import { productHref } from "@/lib/everie";
import CustomSelect from "@/components/admin/CustomSelect";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách sản phẩm:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Xóa thất bại: " + data.error);
      }
    } catch {
      alert("Lỗi khi xóa sản phẩm");
    } finally {
      setDeletingId(null);
    }
  };

  // Distinct categories
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    const matchesStock =
      stockFilter === "ALL" ||
      (stockFilter === "IN_STOCK" && p.inStock) ||
      (stockFilter === "OUT_OF_STOCK" && !p.inStock);

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const getSeoHealth = (p: ProductItem) => {
    const hasTitle = Boolean(p.seoTitle && p.seoTitle.length >= 30);
    const hasDesc = Boolean(p.seoDescription && p.seoDescription.length >= 60);
    const hasOg = Boolean(p.seoOgImage || p.image);

    if (hasTitle && hasDesc && hasOg) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
          <CheckCircle className="w-3 h-3" /> Chuẩn SEO
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
        <AlertTriangle className="w-3 h-3" /> Cần tối ưu
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            Quản Lý Sản Phẩm
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Tổng cộng <span className="text-[#C5A880] font-semibold">{products.length}</span> tác phẩm sơn mài trong danh mục
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="px-3.5 py-2 bg-stone-800/80 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700/60 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
          </button>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-[#C5A880] hover:bg-[#b59870] text-black text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-[#C5A880]/20"
          >
            <Plus className="w-4 h-4" /> Thêm Sản Phẩm Mới
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141417] border border-stone-800/80 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, mã SKU, danh mục..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg pl-10 pr-4 py-2 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-[#C5A880]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <span className="text-xs text-stone-400 shrink-0">Danh mục:</span>
            <CustomSelect
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "ALL", label: `Tất cả danh mục (${products.length})` },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
              searchPlaceholder="Tìm danh mục..."
              size="sm"
            />
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-2 min-w-[170px]">
            <span className="text-xs text-stone-400 shrink-0">Tồn kho:</span>
            <CustomSelect
              value={stockFilter}
              onChange={(val) => {
                setStockFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "IN_STOCK", label: "Còn hàng" },
                { value: "OUT_OF_STOCK", label: "Hết hàng" },
              ]}
              searchable={false}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Dense Products Table */}
      <div className="bg-[#141417] border border-stone-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-stone-800/80 bg-[#17171A] text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                <th className="py-3.5 px-4 w-16">Ảnh</th>
                <th className="py-3.5 px-4">Tên Sản Phẩm / SKU</th>
                <th className="py-3.5 px-4">Dòng</th>
                <th className="py-3.5 px-4">Danh Mục & BST</th>
                <th className="py-3.5 px-4 text-right">Giá Bán</th>
                <th className="py-3.5 px-4 text-center">Tồn Kho</th>
                <th className="py-3.5 px-4 text-center">Chuẩn SEO</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/40 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C5A880] mb-2" />
                    Đang tải danh sách tác phẩm...
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-stone-800/30 transition-colors group"
                    >
                      {/* Thumbnail Image */}
                      <td className="py-3 px-4">
                        <div className="relative w-12 h-12 rounded-lg bg-stone-900 border border-stone-800 overflow-hidden shrink-0">
                          <Image
                            src={p.image || "/images/placeholder.jpg"}
                            alt={p.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="48px"
                            unoptimized
                          />
                        </div>
                      </td>

                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-medium text-stone-200 hover:text-[#C5A880] transition-colors line-clamp-1 block text-sm"
                        >
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-stone-400 font-mono">
                            SKU: {p.sku}
                          </span>
                          {p.tag && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-stone-800 text-[#C5A880] border border-[#C5A880]/30">
                              {p.tag}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-stone-800 text-[#C5A880] border border-[#C5A880]/30">
                          {p.line === "themed" ? "Themed" : p.line === "classic" ? "Classic" : "—"}
                        </span>
                      </td>

                      {/* Category & Collection */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-stone-300 font-medium">{p.category}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">{p.collection || "Tiêu chuẩn"}</div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-semibold text-stone-100 font-mono text-sm">
                          {p.price.toLocaleString("vi-VN")} ₫
                        </div>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <div className="text-[11px] text-stone-500 line-through font-mono mt-0.5">
                            {p.originalPrice.toLocaleString("vi-VN")} ₫
                          </div>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {p.inStock ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                            Còn hàng
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-950/60 text-red-400 border border-red-800/60">
                            Hết hàng
                          </span>
                        )}
                      </td>

                      {/* SEO Health */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getSeoHealth(p)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-[#C5A880] text-stone-300 hover:text-black transition-colors"
                            title="Chỉnh sửa sản phẩm"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={productHref(p)}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
                            title="Xem trên trang bán hàng"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={deletingId === p.id}
                            className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/60 text-red-400 hover:text-red-200 transition-colors"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
            Hiển thị <span className="font-semibold text-stone-200">{filteredProducts.length === 0 ? 0 : startIndex + 1}</span> -{" "}
            <span className="font-semibold text-stone-200">
              {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
            </span>{" "}
            trong tổng số <span className="font-semibold text-stone-200">{filteredProducts.length}</span> sản phẩm
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
