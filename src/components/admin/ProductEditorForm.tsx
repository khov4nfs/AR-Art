"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  ExternalLink,
  Package,
  Image as ImageIcon,
  Sparkles,
  Globe,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Search,
} from "lucide-react";
import { ProductItem } from "@/lib/store";
import { CRAFT_DAYS, ENGRAVING_MAX_CHARS, productHref } from "@/lib/everie";
import ImageUploadWithPreview from "@/components/admin/ImageUploadWithPreview";
import CustomSelect from "@/components/admin/CustomSelect";
import Image from "next/image";
import Model3DStudio from "@/components/admin/Model3DStudio";

interface ProductEditorFormProps {
  initialProduct?: ProductItem;
  isNew?: boolean;
}

export default function ProductEditorForm({
  initialProduct,
  isNew = false,
}: ProductEditorFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"basic" | "images" | "craft" | "seo">("basic");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<ProductItem>(() => {
    if (initialProduct) return initialProduct;
    return {
      id: `prod-${Date.now()}`,
      slug: "",
      name: "",
      sku: `EV-${Math.floor(1000 + Math.random() * 9000)}`,
      price: 0,
      originalPrice: 0,
      image: "/images/placeholder.jpg",
      hoverImage: "",
      galleryImages: [],
      category: "Hoa gốm",
      collection: "Classic Flowers",
      tag: "NEW",
      description: "",
      dimensions: "",
      material: "Gốm thủ công",
      finish: "Men bóng, khắc chữ sau khi hoàn thiện",
      inStock: true,
      colors: [
        { name: "Trắng ngà", hex: "#F3EDE2" },
        { name: "Hồng đào", hex: "#E8B4A2" },
      ],
      line: "classic",
      species: "",
      craftDaysMin: CRAFT_DAYS.classic.min,
      craftDaysMax: CRAFT_DAYS.classic.max,
      engravingEnabled: true,
      maxEngravingChars: ENGRAVING_MAX_CHARS,
      meaning: "",
      inspiration: "",
      isSet: false,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      seoCanonical: "",
      seoOgImage: "",
      seoRobots: "index, follow",
    };
  });

  // State for new color input
  const [newColorName, setNewColorName] = useState("");
  const [glbUploading, setGlbUploading] = useState(false);
  const [glbError, setGlbError] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/generate-3d")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: { enabled?: boolean } } | null) => {
        if (alive) setAiEnabled(Boolean(j?.data?.enabled));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const [newColorHex, setNewColorHex] = useState("#C5A880");

  // Helper to auto-generate slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };

  const handleNameChange = (name: string) => {
    const updates: Partial<ProductItem> = { name };
    if (isNew || !formData.slug) {
      updates.slug = generateSlug(name);
    }
    if (!formData.seoTitle || formData.seoTitle === formData.name) {
      updates.seoTitle = `${name} | EVERIE`;
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên sản phẩm!");
      setActiveTab("basic");
      return;
    }
    if (!formData.slug.trim()) {
      alert("Vui lòng nhập đường dẫn URL slug!");
      setActiveTab("basic");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const url = isNew ? "/api/products" : `/api/products/${formData.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Lỗi khi lưu sản phẩm");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (isNew) {
        router.push(`/admin/products/${data.data.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu sản phẩm";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm "${formData.name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${formData.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/products");
      } else {
        alert("Xóa thất bại: " + data.error);
      }
    } catch {
      alert("Lỗi khi xóa sản phẩm");
    }
  };

  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    setFormData((prev) => ({
      ...prev,
      colors: [...(prev.colors || []), { name: newColorName.trim(), hex: newColorHex }],
    }));
    setNewColorName("");
    setNewColorHex("#C5A880");
  };

  const handleRemoveColor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      colors: (prev.colors || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddGalleryImage = (url: string) => {
    if (!url) return;
    setFormData((prev) => ({
      ...prev,
      galleryImages: [...(prev.galleryImages || []), url],
    }));
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: (prev.galleryImages || []).filter((_, i) => i !== index),
    }));
  };

  // SEO Snippet calculations
  const seoTitleLength = formData.seoTitle?.length || 0;
  const seoDescLength = formData.seoDescription?.length || 0;
  const displayTitle = formData.seoTitle || formData.name || "Tên Sản Phẩm";
  const displayDesc =
    formData.seoDescription ||
    formData.description ||
    "Hoa gốm thủ công EVERIE — làm theo đơn, khắc chữ, giao theo ngày chế tác.";
  const displaySlug = formData.slug || "hoa-gom";
  const storefrontHref = productHref(formData);
  const slugPrefix =
    formData.line === "themed"
      ? "/themed/"
      : formData.line === "classic"
        ? "/classic/"
        : "/products/";

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors border border-stone-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-wide">
                {isNew ? "Thêm Sản Phẩm Mới" : formData.name || "Chỉnh Sửa Sản Phẩm"}
              </h1>
              {!isNew && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-400 border border-stone-700">
                  {formData.sku}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {isNew ? "Tạo sản phẩm mới vào hệ thống danh mục" : `ID: ${formData.id}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {!isNew && (
            <Link
              href={storefrontHref}
              target="_blank"
              className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Xem Trang Bán Hàng
            </Link>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#C5A880] hover:bg-[#b59870] text-black text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-[#C5A880]/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? "Đang lưu..." : "Lưu Sản Phẩm"}
          </button>
          {!isNew && (
            <button
              onClick={handleDelete}
              className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg border border-red-900/40 transition-colors"
              title="Xóa sản phẩm này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Đã lưu thông tin sản phẩm và cập nhật cấu hình SEO thành công!
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400" />
          {errorMessage}
        </div>
      )}

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex border-b border-stone-800 gap-1 bg-[#141417] p-1 rounded-xl overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("basic")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "basic"
              ? "bg-[#C5A880] text-black font-semibold shadow"
              : "text-stone-400 hover:text-white hover:bg-stone-800/40"
          }`}
        >
          <Package className="w-4 h-4" /> Thông Tin Cơ Bản
        </button>
        <button
          onClick={() => setActiveTab("images")}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "images"
              ? "bg-[#C5A880] text-black font-semibold shadow"
              : "text-stone-400 hover:text-white hover:bg-stone-800/40"
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Hình Ảnh & Album
        </button>
        <button
          onClick={() => setActiveTab("craft")}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "craft"
              ? "bg-[#C5A880] text-black font-semibold shadow"
              : "text-stone-400 hover:text-white hover:bg-stone-800/40"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Kỹ Thuật & Màu Sắc
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "seo"
              ? "bg-[#C5A880] text-black font-semibold shadow"
              : "text-stone-400 hover:text-white hover:bg-stone-800/40"
          }`}
        >
          <Globe className="w-4 h-4" /> Chuẩn SEO Google
        </button>
      </div>

      {/* TAB 1: THÔNG TIN CƠ BẢN */}
      {activeTab === "basic" && (
        <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Tên Sản Phẩm <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="VD: Hoa Tulip, Hoa Sen, PHẤP…"
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-3 text-sm text-stone-200 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Mã Sản Phẩm (SKU)
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Đường Dẫn Tĩnh (URL Slug)
              </label>
              <div className="flex items-center bg-[#1A1A1D] border border-stone-800 rounded-lg overflow-hidden focus-within:border-[#C5A880]">
                <span className="px-3 text-xs text-stone-500 font-mono select-none">{slugPrefix}</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 bg-transparent p-2.5 text-xs text-stone-200 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Giá Bán Niêm Yết (VNĐ) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Original Price */}
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Giá Gốc (Để hiển thị giảm giá gạch ngang)
              </label>
              <input
                type="number"
                value={formData.originalPrice || 0}
                onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Danh Mục Chính
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="VD: Hoa gốm Classic, Themed Collection"
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Collection */}
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Bộ Sưu Tập (Collection)
              </label>
              <input
                type="text"
                value={formData.collection}
                onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                placeholder="VD: Classic Flowers, PHẤP · DỆT · VANG"
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Dòng sản phẩm (Line)
              </label>
              <CustomSelect
                value={formData.line || "classic"}
                onChange={(val) => {
                  const line = val === "themed" ? "themed" : "classic";
                  setFormData((prev) => ({
                    ...prev,
                    line,
                    ...(isNew
                      ? {
                          craftDaysMin: CRAFT_DAYS[line].min,
                          craftDaysMax: CRAFT_DAYS[line].max,
                        }
                      : {}),
                  }));
                }}
                options={[
                  { value: "classic", label: "Classic Flowers" },
                  { value: "themed", label: "Themed Collection" },
                ]}
                searchable={false}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Loài hoa (Species)
              </label>
              <input
                type="text"
                value={formData.species || ""}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                placeholder="VD: Tulip, Sen, Hồng"
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Tag */}
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Nhãn Nổi Bật (Tag)
              </label>
              <CustomSelect
                value={formData.tag || ""}
                onChange={(val) => setFormData({ ...formData, tag: val })}
                options={[
                  { value: "", label: "Không có nhãn" },
                  { value: "NEW", label: "NEW (Mới ra mắt)" },
                  { value: "BEST SELLER", label: "BEST SELLER (Bán chạy nhất)" },
                  { value: "LIMITED", label: "LIMITED (Phiên bản giới hạn)" },
                  { value: "SPECIAL EDITION", label: "SPECIAL EDITION (Đặc biệt)" },
                ]}
                searchable={false}
              />
            </div>

            {/* Stock Toggle */}
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="stockCheck"
                checked={formData.inStock}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                className="w-4 h-4 rounded bg-stone-900 border-stone-700 text-[#C5A880] focus:ring-[#C5A880]"
              />
              <label htmlFor="stockCheck" className="text-xs font-medium text-stone-200 cursor-pointer">
                Sản phẩm đang còn hàng trong kho (In Stock)
              </label>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isSetCheck"
                checked={Boolean(formData.isSet)}
                onChange={(e) => setFormData({ ...formData, isSet: e.target.checked })}
                className="w-4 h-4 rounded bg-stone-900 border-stone-700 text-[#C5A880] focus:ring-[#C5A880]"
              />
              <label htmlFor="isSetCheck" className="text-xs font-medium text-stone-200 cursor-pointer">
                Đây là bộ sản phẩm (isSet)
              </label>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Mô Tả Chi Tiết Tác Phẩm
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả loài hoa, men, và cách trưng bày..."
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-3 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880] resize-y"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HÌNH ẢNH & GALLERY (VỚI VISUAL PREVIEW & UPLOAD) */}
      {activeTab === "images" && (
        <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Image */}
            <ImageUploadWithPreview
              label="Ảnh Đại Diện Chính (Primary Image)"
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url })}
              helperText="Ảnh xuất hiện ở danh sách sản phẩm, kích thước khuyến nghị 800x800px"
              aspectRatio="square"
            />

            {/* Hover Image */}
            <ImageUploadWithPreview
              label="Ảnh Hiệu Ứng Rê Chuột (Hover Image)"
              value={formData.hoverImage || ""}
              onChange={(url) => setFormData({ ...formData, hoverImage: url })}
              helperText="Ảnh hiển thị khi người dùng lướt chuột qua sản phẩm trên danh mục"
              aspectRatio="square"
            />
          </div>

          {/* Gallery Images Album */}
          <div className="pt-6 border-t border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Album Ảnh Chi Tiết (Product Gallery)</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Các góc nhìn cận cảnh, hoa văn mài xước, chi tiết mạ vàng, nắp hộp...
                </p>
              </div>
            </div>

            {/* Gallery Images Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(formData.galleryImages || []).map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative group aspect-square rounded-xl border border-stone-800 bg-[#1A1A1D] overflow-hidden"
                >
                  <Image
                    src={imgUrl}
                    alt={`Gallery ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 768px) 50vw, 200px"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="p-1.5 bg-red-950/80 hover:bg-red-800 text-red-200 rounded-full transition-colors"
                      title="Xóa ảnh này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 rounded text-[9px] font-mono text-stone-300">
                    #{idx + 1}
                  </span>
                </div>
              ))}

              {/* Add New Gallery Image Box */}
              <div className="aspect-square">
                <ImageUploadWithPreview
                  value=""
                  onChange={(url) => {
                    if (url) handleAddGalleryImage(url);
                  }}
                  placeholderText="+ Thêm ảnh album"
                  aspectRatio="square"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: THÔNG SỐ CHẾ TÁC & MÀU SẮC */}
      {activeTab === "craft" && (
        <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dimensions */}
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Kích Thước (Dimensions)
              </label>
              <input
                type="text"
                value={formData.dimensions || ""}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                placeholder="VD: D25 x R18 x C12 cm"
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Material */}
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Chất Liệu
              </label>
              <input
                type="text"
                value={formData.material || ""}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="VD: Gốm thủ công, men đá, nung lò củi"
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Finish */}
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Kỹ Thuật Hoàn Thiện Bề Mặt
              </label>
              <input
                type="text"
                value={formData.finish || ""}
                onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                placeholder="VD: Men bóng, khắc chữ sau khi hoàn thiện"
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-stone-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Ngày chế tác tối thiểu
              </label>
              <input
                type="number"
                min={1}
                value={formData.craftDaysMin ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    craftDaysMin: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Ngày chế tác tối đa
              </label>
              <input
                type="number"
                min={1}
                value={formData.craftDaysMax ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    craftDaysMax: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="engravingCheck"
                checked={Boolean(formData.engravingEnabled)}
                onChange={(e) =>
                  setFormData({ ...formData, engravingEnabled: e.target.checked })
                }
                className="w-4 h-4 rounded bg-stone-900 border-stone-700 text-[#C5A880] focus:ring-[#C5A880]"
              />
              <label htmlFor="engravingCheck" className="text-xs font-medium text-stone-200 cursor-pointer">
                Cho phép khắc chữ
              </label>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Số ký tự khắc tối đa
              </label>
              <input
                type="number"
                min={1}
                max={64}
                value={formData.maxEngravingChars ?? ENGRAVING_MAX_CHARS}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxEngravingChars: Number(e.target.value) || ENGRAVING_MAX_CHARS,
                  })
                }
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Ý nghĩa
              </label>
              <textarea
                rows={3}
                value={formData.meaning || ""}
                onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                placeholder="Ý nghĩa loài hoa, dịp tặng…"
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880] resize-y"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Cảm hứng
              </label>
              <textarea
                rows={3}
                value={formData.inspiration || ""}
                onChange={(e) => setFormData({ ...formData, inspiration: e.target.value })}
                placeholder="Nguồn cảm hứng thiết kế, làng nghề, men…"
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880] resize-y"
              />
            </div>
          </div>

          <div className="border-t border-stone-800 pt-6 space-y-3">
            <h3 className="text-sm font-semibold text-white">Trải nghiệm AR theo hình ảnh</h3>
            <p className="text-xs leading-6 text-stone-400">Xuất bản cặp ảnh + video từ <a href="/studio/products" target="_blank" rel="noopener noreferrer" className="text-[#C5A880] underline">AR Studio</a>, sau đó nhập slug tác phẩm đã xuất bản để hiển thị nút AR trên trang sản phẩm.</p>
            <label htmlFor="ar-artwork-slug" className="block text-xs font-semibold uppercase tracking-wide text-stone-300">Slug tác phẩm AR</label>
            <input id="ar-artwork-slug" type="text" value={formData.arArtworkSlug ?? ""}
              onChange={(event) => setFormData({ ...formData, arArtworkSlug: event.target.value.trim() || undefined })}
              placeholder="vi-du-hoa-sen-ar" className="w-full rounded-lg border border-stone-800 bg-[#1A1A1D] p-3 text-sm text-stone-200 outline-none focus:border-[#C5A880]" />
            {formData.arArtworkSlug && <a href={`/ar/${encodeURIComponent(formData.arArtworkSlug)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C5A880] underline">Thử liên kết AR →</a>}
          </div>

          {/* 3D configurator source */}
          <div className="pt-6 border-t border-stone-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">Mô hình 3D (Configurator)</h3>
            <p className="text-xs text-stone-400">
              Ưu tiên file GLB của nghệ nhân. Chưa có GLB thì dùng mẫu dựng sẵn (placeholder) hoặc chỉ ảnh chụp.
              Đặt tên material cánh hoa chứa &quot;glaze&quot; để đổi màu men, và mesh vùng khắc tên &quot;engrave_zone&quot;.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                  Mẫu placeholder khi chưa có GLB
                </label>
                <select
                  value={formData.model3dPreset ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      model3dPreset: (e.target.value || undefined) as ProductItem["model3dPreset"],
                    })
                  }
                  className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="">Không — chỉ hiển thị ảnh</option>
                  <option value="rose">Hoa hồng (procedural)</option>
                  <option value="tulip">Tulip (procedural)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                  File GLB (≤ 25MB, khuyến nghị ≤ 3MB)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.model3dGlb || ""}
                    onChange={(e) => setFormData({ ...formData, model3dGlb: e.target.value || undefined })}
                    placeholder="/uploads/models/hoa-hong.glb"
                    className="flex-1 bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                  />
                  <label className="px-3 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap">
                    {glbUploading ? "Đang tải…" : "Tải .glb"}
                    <input
                      type="file"
                      accept=".glb,model/gltf-binary"
                      className="hidden"
                      disabled={glbUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setGlbUploading(true);
                        setGlbError("");
                        try {
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch("/api/upload", { method: "POST", body: fd });
                          const json = (await res.json()) as { success: boolean; data?: { fileUrl: string }; error?: string };
                          if (json.success && json.data) {
                            setFormData((prev) => ({ ...prev, model3dGlb: json.data?.fileUrl }));
                          } else {
                            setGlbError(json.error || "Tải lên thất bại");
                          }
                        } catch {
                          setGlbError("Tải lên thất bại");
                        } finally {
                          setGlbUploading(false);
                        }
                      }}
                    />
                  </label>
                  {formData.model3dGlb && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, model3dGlb: undefined })}
                      className="p-2 text-stone-500 hover:text-red-400"
                      aria-label="Xóa GLB"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {glbError && <p className="text-[11px] text-red-400 mt-1">{glbError}</p>}
                {aiEnabled && (
                  <label className="mt-2 inline-flex items-center gap-2 px-3 py-2 border border-[#C5A880]/50 text-[#C5A880] rounded-lg text-xs cursor-pointer hover:bg-[#C5A880]/10">
                    {aiBusy ? "Đang tạo mô hình (1–5 phút)…" : "Tạo 3D từ ảnh (AI, bản nháp)"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={aiBusy}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setAiBusy(true);
                        setGlbError("");
                        try {
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch("/api/admin/generate-3d", { method: "POST", body: fd });
                          const json = (await res.json()) as { success: boolean; data?: { fileUrl: string }; error?: string };
                          if (json.success && json.data) {
                            setFormData((prev) => ({ ...prev, model3dGlb: json.data?.fileUrl }));
                          } else {
                            setGlbError(json.error || "Tạo mô hình thất bại");
                          }
                        } catch {
                          setGlbError("Tạo mô hình thất bại");
                        } finally {
                          setAiBusy(false);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <Model3DStudio
              glbUrl={formData.model3dGlb}
              preset={formData.model3dPreset}
              fit={formData.model3dFit}
              colors={formData.colors}
              poster={formData.image || "/images/hanoia/product-vase-monument.webp"}
              onGlbChange={(url) => setFormData((prev) => ({ ...prev, model3dGlb: url }))}
              onFitChange={(fit) => setFormData((prev) => ({ ...prev, model3dFit: fit }))}
            />
          </div>

          {/* Color Swatches Management */}
          <div className="pt-6 border-t border-stone-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">Bảng màu men (Glaze Colors)</h3>
            <p className="text-xs text-stone-400">
              Các màu men có tên — màu trên màn hình gần đúng màu sau nung
            </p>

            <div className="flex flex-wrap gap-3">
              {(formData.colors || []).map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#1A1A1D] border border-stone-800 text-xs"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-stone-700 shadow-inner shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-stone-200 font-medium">{c.name}</span>
                  <span className="text-stone-500 font-mono text-[10px]">{c.hex}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(idx)}
                    className="text-stone-500 hover:text-red-400 transition-colors ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add color row */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                placeholder="Tên màu men (VD: Trắng ngà, Hồng đào…)"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                className="bg-[#1A1A1D] border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880] w-64"
              />
              <button
                type="button"
                onClick={handleAddColor}
                className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#C5A880]" /> Thêm Màu Này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CẤU HÌNH SEO CHUYÊN SÂU CHUẨN GOOGLE (SERP PREVIEW) */}
      {activeTab === "seo" && (
        <div className="space-y-6">
          {/* Google SERP Snippet Preview Box */}
          <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#C5A880]" />
                <h3 className="text-sm font-semibold text-white">
                  Mô Phỏng Hiển Thị Kết Quả Tìm Kiếm Google (Google SERP Snippet)
                </h3>
              </div>
              <span className="text-[11px] text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded font-mono">
                Rich Snippet Preview
              </span>
            </div>

            {/* Google Search Result Card (Authentic Google Appearance) */}
            <div className="p-4 bg-white text-black rounded-xl border border-stone-300 shadow-md font-sans max-w-2xl">
              {/* Google URL Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-[#202124] mb-1">
                <div className="w-4 h-4 rounded-full bg-stone-900 text-[#C5A880] flex items-center justify-center text-[9px] font-bold">
                  E
                </div>
                <div className="flex items-center gap-1 text-[12px] truncate">
                  <span className="font-medium">everievn.com</span>
                  <span className="text-stone-400">›</span>
                  <span className="text-stone-600">collections</span>
                  <span className="text-stone-400">›</span>
                  <span className="text-stone-600 truncate">{displaySlug}</span>
                </div>
              </div>

              {/* Title */}
              <h4 className="text-[18px] text-[#1a0dab] hover:underline cursor-pointer font-medium leading-snug line-clamp-1">
                {displayTitle}
              </h4>

              {/* Description & Rich Snippet */}
              <p className="text-[13px] text-[#4d5156] mt-1 leading-relaxed line-clamp-2">
                <span className="text-[#006621] font-semibold">
                  {formData.price.toLocaleString("vi-VN")} ₫ · {formData.inStock ? "Còn hàng" : "Hết hàng"} ·{" "}
                </span>
                {displayDesc}
              </p>
            </div>
          </div>

          {/* Detailed SEO Inputs */}
          <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
            {/* Meta Title */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide">
                  Tiêu Đề Trang (Meta Title)
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    seoTitleLength >= 40 && seoTitleLength <= 60
                      ? "text-emerald-400"
                      : seoTitleLength > 60
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                >
                  {seoTitleLength} / 60 ký tự {seoTitleLength >= 40 && seoTitleLength <= 60 && "✓ Tối ưu"}
                </span>
              </div>
              <input
                type="text"
                value={formData.seoTitle || ""}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="VD: Hoa Tulip gốm thủ công | EVERIE"
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Tiêu đề hiển thị to nhất trên kết quả tìm kiếm Google. Khuyến nghị 40-60 ký tự.
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide">
                  Mô Tả Tìm Kiếm (Meta Description)
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    seoDescLength >= 120 && seoDescLength <= 160
                      ? "text-emerald-400"
                      : seoDescLength > 160
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                >
                  {seoDescLength} / 160 ký tự {seoDescLength >= 120 && seoDescLength <= 160 && "✓ Tối ưu"}
                </span>
              </div>
              <textarea
                rows={3}
                value={formData.seoDescription || ""}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="VD: Hoa gốm thủ công EVERIE, chọn màu men, khắc chữ, chế tác theo ngày."
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880] resize-none"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Đoạn tóm tắt nội dung kích thích người dùng bấm vào liên kết trên Google. Khuyến nghị 120-160 ký tự.
              </p>
            </div>

            {/* Focus Keywords */}
            <div>
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                Từ Khóa Chính & Phụ (Focus Keywords)
              </label>
              <input
                type="text"
                value={formData.seoKeywords || ""}
                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                placeholder="VD: hoa gốm, everie, tulip, sen, khắc chữ…"
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
              />
              <p className="text-[11px] text-stone-500 mt-1">Phân cách các từ khóa bằng dấu phẩy (,)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-800">
              {/* Meta Robots */}
              <div>
                <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                  Cấu Hình Chỉ Mục Tìm Kiếm (Robots Meta Tag)
                </label>
                <CustomSelect
                  value={formData.seoRobots || "index, follow"}
                  onChange={(val) =>
                    setFormData({ ...formData, seoRobots: val as ProductItem["seoRobots"] })
                  }
                  options={[
                    {
                      value: "index, follow",
                      label: "index, follow (Cho phép Google lập chỉ mục & xếp hạng)",
                    },
                    {
                      value: "noindex, nofollow",
                      label: "noindex, nofollow (Ẩn hoàn toàn khỏi Google)",
                    },
                  ]}
                  searchable={false}
                />
              </div>

              {/* Canonical URL */}
              <div>
                <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                  Đường Dẫn Chuẩn Tắc (Canonical URL)
                </label>
                <input
                  type="text"
                  value={formData.seoCanonical || ""}
                  onChange={(e) => setFormData({ ...formData, seoCanonical: e.target.value })}
                  placeholder={`https://everievn.com${slugPrefix}${formData.slug}`}
                  className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880] font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Social Share Image (OpenGraph Image) */}
            <div className="pt-4 border-t border-stone-800">
              <ImageUploadWithPreview
                label="Ảnh Chia Sẻ Mạng Xã Hội (Facebook, Zalo, Twitter OpenGraph Image)"
                value={formData.seoOgImage || ""}
                onChange={(url) => setFormData({ ...formData, seoOgImage: url })}
                helperText="Hình ảnh hiển thị khi gửi link sản phẩm qua Messenger, Zalo hoặc Facebook. Kích thước khuyến nghị 1200x630px"
                aspectRatio="video"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
