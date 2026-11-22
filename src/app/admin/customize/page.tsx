"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Palette,
  Eye,
  Edit3,
  Monitor,
  Smartphone,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle,
  ChevronDown,
  Sparkles,
  Phone,
  MessageCircle,
  ArrowUp,
  Sliders,
  Globe,
  Search,
  Share2,
} from "lucide-react";
import { SiteSettings, MenuItem } from "@/lib/store";
import ImageUploadWithPreview from "@/components/admin/ImageUploadWithPreview";

interface HeroSlideItem {
  id?: string;
  desktopImage: string;
  mobileImage?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

export default function AdminCustomizePage() {
  // Navigation & Mode
  const [activeSection, setActiveSection] = useState<
    "header" | "tickers" | "banners" | "menus" | "footer" | "widgets" | "seo"
  >("header");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");

  // Data states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [heroSlides, setHeroSlides] = useState<HeroSlideItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);

  // Preview interactive states
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [previewMegaHover, setPreviewMegaHover] = useState<number | null>(null);

  // Load initial data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [resSettings, resSlides, resMenus] = await Promise.all([
        fetch("/api/settings").then((r) => r.json()),
        fetch("/api/hero-slides").then((r) => r.json()),
        fetch("/api/menus").then((r) => r.json()),
      ]);

      if (resSettings.success) setSettings(resSettings.data);
      if (resSlides.success) setHeroSlides(resSlides.data);
      if (resMenus.success) setMenus(resMenus.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu tuỳ biến:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSaveAll = async () => {
    if (!settings) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      await Promise.all([
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        }),
        fetch("/api/hero-slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ heroSlides }),
        }),
        fetch("/api/menus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ menus }),
        }),
      ]);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert("Lỗi khi lưu cấu hình tuỳ biến");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-16 text-center text-stone-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#C5A880] mb-3" />
        Đang nạp bộ tuỳ biến giao diện & hệ thống xem trước 2 lớp...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      {/* Top Header & Sticky 2-Layer Mode Switcher */}
      <div className="bg-[#141417] border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold font-serif text-white tracking-wide">
              Bộ Tuỳ Biến Giao Diện Trực Quan
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30 shrink-0">
              Live Preview
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Thay đổi logo, dải thông báo, banner slider, mega menu, chân trang & widget hỗ trợ
          </p>
        </div>

        {/* 2-LAYER MODE TOGGLE (SOẠN THẢO vs XEM TRƯỚC) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          <div className="grid grid-cols-2 sm:flex bg-[#1E1E22] p-1 rounded-xl border border-stone-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${viewMode === "edit"
                  ? "bg-[#C5A880] text-black shadow-md font-bold"
                  : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                }`}
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Soạn Thảo</span>
              <span className="hidden sm:inline">(Form)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${viewMode === "preview"
                  ? "bg-[#C5A880] text-black shadow-md font-bold"
                  : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Xem Trước</span>
              <span className="hidden sm:inline">Trực Quan</span>
            </button>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full sm:w-auto justify-center px-5 py-2.5 sm:py-2 bg-[#C5A880] hover:bg-[#b59870] text-black text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-md shadow-[#C5A880]/20 disabled:opacity-50 shrink-0"
          >
            <Save className="w-3.5 h-3.5 shrink-0" />
            <span>{saving ? "Đang lưu..." : "Lưu Thay Đổi"}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Đã xuất bản toàn bộ nội dung tuỳ biến giao diện lên cửa hàng trực tiếp thành công!</span>
        </div>
      )}

      {/* Section Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-stone-800 pb-2 custom-scrollbar -mx-1 px-1">
        {[
          { key: "header", label: "Logo & Đầu Trang (Header)", icon: Sparkles },
          { key: "tickers", label: "Dải Thông Báo (Tickers)", icon: Sliders },
          { key: "banners", label: "Hero Banners Slider", icon: Palette },
          { key: "menus", label: "Mega Menu Điều Hướng", icon: ChevronDown },
          { key: "footer", label: "Chân Trang & Bản Quyền", icon: Globe },
          { key: "widgets", label: "Nút Hỗ Trợ & Widget Nổi", icon: MessageCircle },
          { key: "seo", label: "Cấu Hình SEO & Meta Trang Chủ", icon: Search },
        ].map((sec) => {
          const active = activeSection === sec.key;
          const Icon = sec.icon;
          return (
            <button
              key={sec.key}
              onClick={() => setActiveSection(sec.key as typeof activeSection)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-all shrink-0 ${active
                  ? "bg-stone-800 text-white border border-[#C5A880]/40 shadow-sm"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-850"
                }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-[#C5A880]" : "text-stone-500"}`} />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          LỚP 1: LỚP SOẠN THẢO (EDIT MODE) - 100% CHIỀU RỘNG, RỘNG RÃI, TIỆN NGHI
         ========================================================================= */}
      {viewMode === "edit" && (
        <div className="animate-fadeIn space-y-6">
          {/* SECTION: HEADER & BRAND IDENTITY */}
          {activeSection === "header" && (
            <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A880]" /> Thông Tin Nhận Diện Thương Hiệu & Logo
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                    Tên Website / Thương Hiệu
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                    Khẩu Hiệu (Site Tagline)
                  </label>
                  <input
                    type="text"
                    value={settings.siteTagline}
                    onChange={(e) => setSettings({ ...settings, siteTagline: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                    Số Hotline Tư Vấn
                  </label>
                  <input
                    type="text"
                    value={settings.hotline}
                    onChange={(e) => setSettings({ ...settings, hotline: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                    Email Liên Hệ
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Image Uploads with Visual Preview */}
              <div className="pt-4 border-t border-stone-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                <ImageUploadWithPreview
                  label="Logo Thanh Đầu Trang (Header Logo)"
                  value={settings.logoHeader}
                  onChange={(url) => setSettings({ ...settings, logoHeader: url })}
                  helperText="File PNG trong suốt, khuyến nghị cao 40px"
                  aspectRatio="wide"
                />

                <ImageUploadWithPreview
                  label="Logo Chân Trang (Footer Logo)"
                  value={settings.logoFooter}
                  onChange={(url) => setSettings({ ...settings, logoFooter: url })}
                  helperText="Logo nền tối/sáng ở chân trang"
                  aspectRatio="wide"
                />

                <ImageUploadWithPreview
                  label="Biểu Tượng Favicon Trình Duyệt"
                  value={settings.favicon}
                  onChange={(url) => setSettings({ ...settings, favicon: url })}
                  helperText="File .ico hoặc .png 32x32px"
                  aspectRatio="square"
                />
              </div>
            </div>
          )}

          {/* SECTION: ANNOUNCEMENT TICKERS */}
          {activeSection === "tickers" && (
            <div className="bg-[#141417] border border-stone-800 rounded-xl p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#C5A880]" /> Quản Lý Dải Thông Báo (Announcement Bar)
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Các dòng thông báo khuyến mãi chạy ngang liên tục trên cùng màn hình
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      announcements: [
                        ...settings.announcements,
                        {
                          id: Date.now().toString(),
                          text: "Thông báo khuyến mãi sơn mài mới...",
                          link: "/collections/all",
                          active: true,
                        },
                      ],
                    })
                  }
                  className="w-full sm:w-auto justify-center px-3.5 py-2 bg-[#C5A880] text-black text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Dòng Thông Báo
                </button>
              </div>

              <div className="space-y-3">
                {settings.announcements.map((ann, idx) => (
                  <div
                    key={ann.id}
                    className="p-3.5 sm:p-4 bg-[#1A1A1D] border border-stone-800 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-stone-800 text-[#C5A880] flex items-center justify-center text-xs font-mono font-bold shrink-0">
                        {idx + 1}
                      </span>
                      {/* Mobile controls */}
                      <div className="flex items-center gap-3 sm:hidden">
                        <label className="flex items-center gap-1.5 text-xs text-stone-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ann.active}
                            onChange={(e) => {
                              const next = [...settings.announcements];
                              next[idx].active = e.target.checked;
                              setSettings({ ...settings, announcements: next });
                            }}
                            className="rounded text-[#C5A880] focus:ring-0"
                          />
                          <span>Hiện</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const next = settings.announcements.filter((_, i) => i !== idx);
                            setSettings({ ...settings, announcements: next });
                          }}
                          className="p-1 text-stone-500 hover:text-red-400 rounded transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={ann.text}
                      onChange={(e) => {
                        const next = [...settings.announcements];
                        next[idx].text = e.target.value;
                        setSettings({ ...settings, announcements: next });
                      }}
                      placeholder="Nội dung thông báo..."
                      className="w-full sm:flex-1 bg-[#141417] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
                    />

                    <input
                      type="text"
                      value={ann.link}
                      onChange={(e) => {
                        const next = [...settings.announcements];
                        next[idx].link = e.target.value;
                        setSettings({ ...settings, announcements: next });
                      }}
                      placeholder="Đường dẫn link (/collections/all)..."
                      className="w-full sm:w-56 bg-[#141417] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-300 font-mono focus:outline-none focus:border-[#C5A880]"
                    />

                    {/* Desktop controls */}
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 text-xs text-stone-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ann.active}
                          onChange={(e) => {
                            const next = [...settings.announcements];
                            next[idx].active = e.target.checked;
                            setSettings({ ...settings, announcements: next });
                          }}
                          className="rounded text-[#C5A880] focus:ring-0"
                        />
                        <span>Hiện</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const next = settings.announcements.filter((_, i) => i !== idx);
                          setSettings({ ...settings, announcements: next });
                        }}
                        className="p-1.5 text-stone-500 hover:text-red-400 rounded transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: HERO BANNERS */}
          {activeSection === "banners" && (
            <div className="bg-[#141417] border border-stone-800 rounded-xl p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#C5A880]" /> Quản Lý Banner Slider Trang Chủ
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Banner toàn màn hình lớn nhất đón khách tại trang chủ Hanoia
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setHeroSlides([
                      ...heroSlides,
                      {
                        id: `slide-${Date.now()}`,
                        desktopImage: "/images/placeholder.jpg",
                        mobileImage: "/images/placeholder.jpg",
                        title: "BỘ SƯU TẬP MỚI",
                        subtitle: "Nghệ Thuật Tạo Tác Sơn Mài Thủ Công",
                        ctaText: "KHÁM PHÁ NGAY",
                        ctaLink: "/collections/all",
                      },
                    ])
                  }
                  className="w-full sm:w-auto justify-center px-3.5 py-2 bg-[#C5A880] text-black text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Slide Mới
                </button>
              </div>

              <div className="space-y-6">
                {heroSlides.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className="p-4 sm:p-5 bg-[#1A1A1D] border border-stone-800 rounded-xl space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#C5A880] text-black flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        Slide: {slide.title || "Chưa có tiêu đề"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setHeroSlides(heroSlides.filter((_, i) => i !== idx))}
                        className="text-stone-500 hover:text-red-400 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Desktop Image */}
                      <ImageUploadWithPreview
                        label="Ảnh Banner Màn Hình Máy Tính (Desktop)"
                        value={slide.desktopImage}
                        onChange={(url) => {
                          const next = [...heroSlides];
                          next[idx].desktopImage = url;
                          setHeroSlides(next);
                        }}
                        helperText="Kích thước khuyến nghị 1920x800px"
                        aspectRatio="wide"
                      />

                      {/* Mobile Image */}
                      <ImageUploadWithPreview
                        label="Ảnh Banner Điện Thoại (Mobile)"
                        value={slide.mobileImage || slide.desktopImage}
                        onChange={(url) => {
                          const next = [...heroSlides];
                          next[idx].mobileImage = url;
                          setHeroSlides(next);
                        }}
                        helperText="Kích thước khuyến nghị 800x1200px"
                        aspectRatio="video"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-stone-400 block mb-1">Tiêu đề chính (Title)</label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => {
                            const next = [...heroSlides];
                            next[idx].title = e.target.value;
                            setHeroSlides(next);
                          }}
                          className="w-full bg-[#141417] border border-stone-800 rounded-lg p-2 text-stone-200 focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>
                      <div>
                        <label className="text-stone-400 block mb-1">Phụ đề (Subtitle)</label>
                        <input
                          type="text"
                          value={slide.subtitle}
                          onChange={(e) => {
                            const next = [...heroSlides];
                            next[idx].subtitle = e.target.value;
                            setHeroSlides(next);
                          }}
                          className="w-full bg-[#141417] border border-stone-800 rounded-lg p-2 text-stone-200 focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>
                      <div>
                        <label className="text-stone-400 block mb-1">Chữ nút bấm (CTA Button)</label>
                        <input
                          type="text"
                          value={slide.ctaText}
                          onChange={(e) => {
                            const next = [...heroSlides];
                            next[idx].ctaText = e.target.value;
                            setHeroSlides(next);
                          }}
                          className="w-full bg-[#141417] border border-stone-800 rounded-lg p-2 text-stone-200 focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>
                      <div>
                        <label className="text-stone-400 block mb-1">Link liên kết (CTA Link)</label>
                        <input
                          type="text"
                          value={slide.ctaLink}
                          onChange={(e) => {
                            const next = [...heroSlides];
                            next[idx].ctaLink = e.target.value;
                            setHeroSlides(next);
                          }}
                          className="w-full bg-[#141417] border border-stone-800 rounded-lg p-2 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: MEGA MENUS */}
          {activeSection === "menus" && (
            <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-[#C5A880]" /> Quản Lý Mega Menu Điều Hướng
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Hệ thống menu danh mục lớn có cột liên kết và hình ảnh giới thiệu
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {menus.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-[#1A1A1D] border border-stone-800 rounded-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-stone-800 text-[#C5A880] flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const next = [...menus];
                            next[idx].label = e.target.value;
                            setMenus(next);
                          }}
                          className="font-bold text-white bg-transparent border-b border-stone-700 pb-0.5 focus:outline-none focus:border-[#C5A880] text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500 font-mono">Link:</span>
                        <input
                          type="text"
                          value={item.href}
                          onChange={(e) => {
                            const next = [...menus];
                            next[idx].href = e.target.value;
                            setMenus(next);
                          }}
                          className="bg-[#141417] border border-stone-800 rounded px-2 py-1 text-xs text-stone-300 font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Featured Image on Menu */}
                      <div className="md:col-span-1">
                        <ImageUploadWithPreview
                          label="Ảnh Giới Thiệu Menu (Featured Banner)"
                          value={item.featuredImage || ""}
                          onChange={(url) => {
                            const next = [...menus];
                            next[idx].featuredImage = url;
                            setMenus(next);
                          }}
                          helperText="Ảnh góc phải trong mega menu"
                          aspectRatio="video"
                        />
                        <input
                          type="text"
                          value={item.featuredText || ""}
                          onChange={(e) => {
                            const next = [...menus];
                            next[idx].featuredText = e.target.value;
                            setMenus(next);
                          }}
                          placeholder="Dòng chữ chú thích ảnh..."
                          className="w-full mt-2 bg-[#141417] border border-stone-800 rounded p-2 text-xs text-stone-200 focus:outline-none"
                        />
                      </div>

                      {/* Columns and links */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                            <span>Các Cột Liên Kết Con</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-800 text-[#C5A880] font-mono">
                              {item.columns.length} cột
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...menus];
                              next[idx].columns.push({
                                title: `Cột ${next[idx].columns.length + 1}`,
                                links: [
                                  { text: "Liên kết mới", href: "/collections/all" },
                                ],
                              });
                              setMenus(next);
                            }}
                            className="text-[11px] text-[#C5A880] hover:text-[#e0c49d] hover:bg-[#C5A880]/10 border border-[#C5A880]/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Plus className="w-3 h-3" /> Thêm Cột Mới
                          </button>
                        </div>

                        {/* List of columns */}
                        <div className="grid grid-cols-1 gap-4">
                          {item.columns.map((col, colIdx) => (
                            <div
                              key={colIdx}
                              className="p-3.5 bg-[#141417] border border-stone-800 hover:border-stone-750 rounded-xl space-y-3 transition-colors"
                            >
                              {/* Column Header: Title & Delete Column Button */}
                              <div className="flex items-center justify-between gap-3 border-b border-stone-800/80 pb-2.5">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-[10px] font-mono text-stone-500 uppercase shrink-0">
                                    Cột #{colIdx + 1}:
                                  </span>
                                  <input
                                    type="text"
                                    value={col.title}
                                    placeholder="Tên tiêu đề cột (VD: BỘ SƯU TẬP)"
                                    onChange={(e) => {
                                      const next = [...menus];
                                      next[idx].columns[colIdx].title = e.target.value;
                                      setMenus(next);
                                    }}
                                    className="font-bold text-xs text-[#C5A880] bg-transparent border-b border-transparent hover:border-stone-700 focus:border-[#C5A880] w-full pb-0.5 focus:outline-none transition-colors"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Bạn có chắc muốn xóa cột "${col.title}"?`)) {
                                      const next = [...menus];
                                      next[idx].columns.splice(colIdx, 1);
                                      setMenus(next);
                                    }
                                  }}
                                  className="p-1 rounded text-stone-500 hover:text-red-400 hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
                                  title="Xóa cột này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Child Links list */}
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide flex items-center justify-between">
                                  <span>Danh sách liên kết con ({col.links.length})</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...menus];
                                      next[idx].columns[colIdx].links.push({
                                        text: `Trang con ${next[idx].columns[colIdx].links.length + 1}`,
                                        href: "/collections/all",
                                      });
                                      setMenus(next);
                                    }}
                                    className="text-[10px] text-[#C5A880] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                                  >
                                    <Plus className="w-2.5 h-2.5" /> Thêm liên kết con
                                  </button>
                                </div>

                                {col.links.length === 0 ? (
                                  <div className="p-3 text-center text-[11px] text-stone-500 bg-[#161619] rounded-lg border border-dashed border-stone-800">
                                    Chưa có liên kết con nào trong cột này. Bấm &quot;Thêm liên kết con&quot; ở trên để tạo.
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    {col.links.map((link, linkIdx) => (
                                      <div
                                        key={linkIdx}
                                        className="flex items-center gap-2 p-1.5 bg-[#17171B] border border-stone-800/80 rounded-lg group"
                                      >
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                          <input
                                            type="text"
                                            value={link.text}
                                            placeholder="Tên liên kết (VD: Đèn bàn)"
                                            onChange={(e) => {
                                              const next = [...menus];
                                              next[idx].columns[colIdx].links[linkIdx].text = e.target.value;
                                              setMenus(next);
                                            }}
                                            className="bg-[#121214] border border-stone-800 focus:border-[#C5A880] rounded px-2 py-1 text-xs text-stone-200 focus:outline-none"
                                          />
                                          <input
                                            type="text"
                                            value={link.href}
                                            placeholder="Đường dẫn /slug"
                                            onChange={(e) => {
                                              const next = [...menus];
                                              next[idx].columns[colIdx].links[linkIdx].href = e.target.value;
                                              setMenus(next);
                                            }}
                                            className="bg-[#121214] border border-stone-800 focus:border-[#C5A880] rounded px-2 py-1 text-xs text-stone-400 font-mono focus:outline-none"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const next = [...menus];
                                            next[idx].columns[colIdx].links.splice(linkIdx, 1);
                                            setMenus(next);
                                          }}
                                          className="p-1.5 rounded text-stone-600 hover:text-red-400 hover:bg-red-950/30 transition-colors shrink-0 cursor-pointer"
                                          title="Xóa liên kết này"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: FOOTER & COPYRIGHT */}
          {activeSection === "footer" && (
            <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#C5A880]" /> Cấu Hình Chân Trang & Bản Quyền Doanh Nghiệp
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                    Thông Tin Bản Quyền Tiếng Việt
                  </label>
                  <textarea
                    rows={3}
                    value={settings.copyrightVi}
                    onChange={(e) => setSettings({ ...settings, copyrightVi: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                    Thông Tin Bản Quyền Tiếng Anh
                  </label>
                  <textarea
                    rows={3}
                    value={settings.copyrightEn}
                    onChange={(e) => setSettings({ ...settings, copyrightEn: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 uppercase tracking-wide block mb-1.5">
                    Liên Kết Chứng Nhận Bộ Công Thương (URL)
                  </label>
                  <input
                    type="text"
                    value={settings.bctCertificateUrl}
                    onChange={(e) => setSettings({ ...settings, bctCertificateUrl: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                {/* BCT Badge Image with preview & upload */}
                <ImageUploadWithPreview
                  label="Huy Hiệu Chứng Nhận Bộ Công Thương"
                  value={settings.bctBadgeImage}
                  onChange={(url) => setSettings({ ...settings, bctBadgeImage: url })}
                  aspectRatio="wide"
                />
              </div>
            </div>
          )}

          {/* SECTION: FLOATING SUPPORT WIDGETS */}
          {activeSection === "widgets" && (
            <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#C5A880]" /> Cấu Hình Tiện Ích Nổi (Chỉ Hiển Thị Cho Khách Hàng)
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-[#1A1A1D] border border-stone-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-xs">Nút Cuộn Lên Đầu Trang (Scroll to Top)</div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Hiển thị nút mũi tên góc phải dưới khi người dùng cuộn quá 400px
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showScrollToTop !== false}
                    onChange={(e) => setSettings({ ...settings, showScrollToTop: e.target.checked })}
                    className="w-4 h-4 rounded text-[#C5A880] focus:ring-0"
                  />
                </div>

                <div className="p-4 bg-[#1A1A1D] border border-stone-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-xs">Cụm Nút Hỗ Trợ Trực Tuyến (Social Support)</div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Bao gồm nút Messenger, Zalo Chat và Hotline gọi điện thoại trực tiếp
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showSocialSupport !== false}
                    onChange={(e) => setSettings({ ...settings, showSocialSupport: e.target.checked })}
                    className="w-4 h-4 rounded text-[#C5A880] focus:ring-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-800 text-xs">
                <div>
                  <label className="text-stone-300 font-semibold uppercase block mb-1.5">
                    Đường Dẫn Facebook Messenger
                  </label>
                  <input
                    type="text"
                    value={settings.messengerUrl || ""}
                    onChange={(e) => setSettings({ ...settings, messengerUrl: e.target.value })}
                    placeholder="https://m.me/hanoia.official"
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-semibold uppercase block mb-1.5">
                    Số Điện Thoại Zalo Hỗ Trợ
                  </label>
                  <input
                    type="text"
                    value={settings.zaloNumber || ""}
                    onChange={(e) => setSettings({ ...settings, zaloNumber: e.target.value })}
                    placeholder="0961 272 486"
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-semibold uppercase block mb-1.5">
                    Hotline Hỗ Trợ Nhanh
                  </label>
                  <input
                    type="text"
                    value={settings.supportPhone || ""}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                    placeholder="1900 0468"
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION: HOMEPAGE SEO & OPEN GRAPH */}
          {activeSection === "seo" && settings && (
            <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#C5A880]" /> Cấu Hình SEO & Thẻ Meta Trang Chủ
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Tối ưu thẻ tiêu đề, mô tả và ảnh đại diện khi xuất hiện trên Google & mạng xã hội
                  </p>
                </div>
                <span className="text-[10px] font-mono text-[#C5A880] px-2 py-0.5 rounded bg-[#C5A880]/10 border border-[#C5A880]/30 w-fit">
                  Live Dynamic Metadata
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-stone-300 font-semibold uppercase tracking-wide">
                      Tiêu Đề SEO Trang Chủ (Meta Title)
                    </label>
                    <span className={`text-[10px] font-mono ${(settings.seoTitle?.length || 0) > 60 ? "text-amber-400" : "text-stone-500"
                      }`}>
                      {settings.seoTitle?.length || 0}/60 ký tự (Khuyên dùng 50-60)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={settings.seoTitle || ""}
                    onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                    placeholder="VD: Hanoia | Nghệ Thuật Sơn Mài Thủ Công Cao Cấp Việt Nam"
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-stone-300 font-semibold uppercase tracking-wide">
                      Mô Tả Tóm Tắt (Meta Description)
                    </label>
                    <span className={`text-[10px] font-mono ${(settings.seoDescription?.length || 0) > 160 ? "text-amber-400" : "text-stone-500"
                      }`}>
                      {settings.seoDescription?.length || 0}/160 ký tự (Khuyên dùng 150-160)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={settings.seoDescription || ""}
                    onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                    placeholder="VD: Khám phá các tuyệt tác sơn mài thủ công Hanoia: đồ trang trí, trang sức, nội thất cao cấp chế tác tinh xảo..."
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-stone-300 font-semibold uppercase block mb-1.5">
                      Từ Khóa SEO (Meta Keywords)
                    </label>
                    <input
                      type="text"
                      value={settings.seoKeywords || ""}
                      onChange={(e) => setSettings({ ...settings, seoKeywords: e.target.value })}
                      placeholder="sơn mài, hanoia, thủ công cao cấp"
                      className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <label className="text-stone-300 font-semibold uppercase block mb-1.5">
                      Đường Dẫn Chuẩn (Canonical URL)
                    </label>
                    <input
                      type="text"
                      value={settings.seoCanonical || ""}
                      onChange={(e) => setSettings({ ...settings, seoCanonical: e.target.value })}
                      placeholder="https://everievn.com"
                      className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <ImageUploadWithPreview
                    label="Ảnh Đại Diện Chia Sẻ MXH (Open Graph / Facebook / Zalo Image)"
                    value={settings.seoOgImage || ""}
                    onChange={(url) => setSettings({ ...settings, seoOgImage: url })}
                    aspectRatio="video"
                    helperText="Tỷ lệ 1.91:1 (khuyên dùng 1200 x 630 px) để hiển thị đẹp nhất khi chia sẻ lên mạng xã hội"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          LỚP 2: LỚP XEM TRƯỚC TRỰC QUAN (PREVIEW MODE) - 100% CHIỀU RỘNG, INTERACTIVE
         ========================================================================= */}
      {viewMode === "preview" && (
        <div className="animate-fadeIn space-y-4">
          {/* Device Frame Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141417] border border-stone-800 p-3 sm:px-4 sm:py-2.5 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-stone-300">
              <Eye className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
              <span>Đang xem trước phần:</span>
              <span className="font-semibold text-white uppercase tracking-wider">
                {activeSection}
              </span>
            </div>

            {/* Desktop vs Mobile Toggle */}
            <div className="grid grid-cols-2 sm:flex items-center gap-1 bg-[#1E1E22] p-1 rounded-lg border border-stone-700 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDevicePreview("desktop")}
                className={`px-3 py-1.5 sm:py-1 rounded text-xs flex items-center justify-center gap-1.5 transition-colors ${devicePreview === "desktop"
                    ? "bg-[#C5A880] text-black font-semibold shadow"
                    : "text-stone-400 hover:text-white"
                  }`}
              >
                <Monitor className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Desktop (Màn Rộng)</span>
              </button>
              <button
                type="button"
                onClick={() => setDevicePreview("mobile")}
                className={`px-3 py-1.5 sm:py-1 rounded text-xs flex items-center justify-center gap-1.5 transition-colors ${devicePreview === "mobile"
                    ? "bg-[#C5A880] text-black font-semibold shadow"
                    : "text-stone-400 hover:text-white"
                  }`}
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Mobile (Điện Thoại)</span>
              </button>
            </div>
          </div>

          {/* Interactive Simulation Frame with Responsive Wrapper */}
          <div className="w-full overflow-x-auto pb-4">
            <div
              className={`mx-auto transition-all duration-300 ${devicePreview === "mobile"
                  ? "w-full max-w-[380px] border-4 sm:border-[8px] border-stone-800 rounded-3xl sm:rounded-[40px] overflow-hidden shadow-2xl bg-black"
                  : "w-full border border-stone-800 rounded-2xl overflow-hidden shadow-2xl bg-black min-w-[300px]"
                }`}
            >
              {/* 1. Header & Identity Preview */}
              {activeSection === "header" && (
                <div className="bg-black text-white p-6 space-y-4">
                  <div className="border-b border-stone-800/80 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {settings.logoHeader ? (
                        <div className="relative h-9 w-36">
                          <Image
                            src={settings.logoHeader}
                            alt="Logo Preview"
                            fill
                            sizes="144px"
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <span className="font-serif text-xl tracking-[0.2em] font-bold text-white">
                          {settings.siteName}
                        </span>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-6 text-xs tracking-widest text-stone-300">
                      <span>BST MỚI</span>
                      <span>SẢN PHẨM</span>
                      <span>QUÀ TẶNG</span>
                      <span>CÂU CHUYỆN</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#C5A880]">
                      <span>Hotline: {settings.hotline}</span>
                    </div>
                  </div>

                  <div className="py-8 text-center space-y-2">
                    <h3 className="font-serif text-2xl text-white tracking-widest uppercase">
                      {settings.siteName}
                    </h3>
                    <p className="text-xs text-stone-400 max-w-md mx-auto italic">
                      {settings.siteTagline}
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Ticker Preview */}
              {activeSection === "tickers" && (
                <div className="bg-[#121214] py-12 px-4 space-y-6">
                  <div className="text-center text-xs text-stone-400 mb-2">
                    Dải thông báo chạy chữ hoạt hình thực tế:
                  </div>
                  {/* Live Ticker Bar */}
                  <div className="bg-black border-y border-stone-800 overflow-hidden py-2.5">
                    <div className="flex items-center gap-12 whitespace-nowrap animate-marquee text-xs text-stone-300 font-light tracking-wider">
                      {settings.announcements
                        .filter((a) => a.active)
                        .map((ann, i) => (
                          <span key={i} className="flex items-center gap-6">
                            <span className="text-[#C5A880]">◆</span>
                            <span className="hover:text-white transition-colors cursor-pointer">
                              {ann.text}
                            </span>
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Hero Banners Slider Preview */}
              {activeSection === "banners" && (
                <div
                  className={`relative w-full overflow-hidden bg-black group select-none ${devicePreview === "mobile"
                      ? "aspect-[3/4] min-h-[360px]"
                      : "aspect-[16/9] min-h-[300px]"
                    }`}
                >
                  {heroSlides.length > 0 && (
                    <>
                      <Image
                        src={
                          devicePreview === "mobile"
                            ? heroSlides[activeSlideIndex]?.mobileImage ||
                            heroSlides[activeSlideIndex]?.desktopImage
                            : heroSlides[activeSlideIndex]?.desktopImage
                        }
                        alt={heroSlides[activeSlideIndex]?.title || "Hero Banner"}
                        fill
                        sizes="(max-width: 768px) 100vw, 1200px"
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-3">
                        <span className="text-xs tracking-[0.3em] text-[#C5A880] uppercase font-semibold">
                          {heroSlides[activeSlideIndex]?.subtitle}
                        </span>
                        <h2 className="text-xl sm:text-2xl md:text-4xl font-serif text-white tracking-wider max-w-xl">
                          {heroSlides[activeSlideIndex]?.title}
                        </h2>
                        <button className="mt-2 px-5 sm:px-6 py-2 sm:py-2.5 bg-transparent border border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880] hover:text-black text-xs tracking-widest uppercase font-semibold transition-all">
                          {heroSlides[activeSlideIndex]?.ctaText || "KHÁM PHÁ NGAY"}
                        </button>
                      </div>

                      {/* Slide Navigation Dots */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                        {heroSlides.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveSlideIndex(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${activeSlideIndex === i ? "bg-[#C5A880] w-6" : "bg-white/40"
                              }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 4. Mega Menu Preview */}
              {activeSection === "menus" && (
                <div className="bg-black text-white p-4 sm:p-6 space-y-4">
                  <div className="flex overflow-x-auto custom-scrollbar sm:flex-wrap items-center justify-start sm:justify-center gap-4 sm:gap-8 border-b border-stone-800 pb-3 sm:pb-4 text-xs font-semibold tracking-wider px-2">
                    {menus.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setPreviewMegaHover(i)}
                        className={`hover:text-[#C5A880] pb-1 whitespace-nowrap transition-colors ${previewMegaHover === i ? "text-[#C5A880] border-b-2 border-[#C5A880]" : "text-stone-300"
                          }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Dropdown Card Preview */}
                  {previewMegaHover !== null && menus[previewMegaHover] && (
                    <div className="p-4 sm:p-6 bg-[#141416] border border-stone-800 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 animate-fadeIn">
                      <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {menus[previewMegaHover].columns.map((col, ci) => (
                          <div key={ci} className="space-y-2">
                            <h4 className="text-xs font-bold text-[#C5A880] uppercase tracking-wider">
                              {col.title}
                            </h4>
                            <ul className="space-y-1.5 text-xs text-stone-400">
                              {col.links.map((link, li) => (
                                <li key={li} className="hover:text-white cursor-pointer">
                                  {link.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {menus[previewMegaHover].featuredImage && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-stone-800">
                          <Image
                            src={menus[previewMegaHover].featuredImage!}
                            alt="Featured"
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            className="object-cover"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                            <span className="text-[11px] text-white font-medium">
                              {menus[previewMegaHover].featuredText}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 5. Footer Preview */}
              {activeSection === "footer" && (
                <footer className="bg-[#0B0B0C] border-t border-stone-900 text-stone-400 p-4 sm:p-8 space-y-6 sm:space-y-8 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    <div className="space-y-3">
                      <div className="font-serif text-lg text-white font-bold tracking-widest">
                        {settings.siteName}
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        {settings.siteTagline}
                      </p>
                      <p className="text-[11px] text-stone-400">Hotline: {settings.hotline}</p>
                      <p className="text-[11px] text-stone-400">Email: {settings.email}</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-white font-semibold uppercase tracking-wider text-[11px]">
                        Hỗ Trợ Khách Hàng
                      </h4>
                      <ul className="space-y-1 text-stone-400 text-[11px]">
                        <li>Chính sách vận chuyển</li>
                        <li>Bảo hành sơn mài</li>
                        <li>Phương thức thanh toán</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-white font-semibold uppercase tracking-wider text-[11px]">
                        Về Hanoia
                      </h4>
                      <ul className="space-y-1 text-stone-400 text-[11px]">
                        <li>Lịch sử làng nghề</li>
                        <li>Nghệ nhân tạo tác</li>
                        <li>Hệ thống cửa hàng</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-white font-semibold uppercase tracking-wider text-[11px]">
                        Chứng Nhận Bộ Công Thương
                      </h4>
                      {settings.bctBadgeImage && (
                        <div className="relative h-10 w-28">
                          <Image
                            src={settings.bctBadgeImage}
                            alt="BCT"
                            fill
                            sizes="112px"
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-stone-900 text-center text-[10px] text-stone-600">
                    {settings.copyrightVi}
                  </div>
                </footer>
              )}

              {/* 6. Floating Widgets Simulation */}
              {activeSection === "widgets" && (
                <div className="relative min-h-[360px] bg-stone-950 p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
                  <div className="text-center space-y-1 pt-8">
                    <h3 className="text-white font-serif text-lg">Mô Phỏng Trang Storefront Khách Hàng</h3>
                    <p className="text-xs text-stone-500">
                      Thử nghiệm tương tác các nút nổi hỗ trợ ở góc dưới bên phải màn hình
                    </p>
                  </div>

                  {/* Floating Widgets Container */}
                  <div className="absolute bottom-6 right-6 flex flex-col items-center gap-3 z-20">
                    {/* Scroll to Top Button */}
                    {settings.showScrollToTop !== false && (
                      <button
                        type="button"
                        className="w-10 h-10 rounded-full bg-stone-900/90 text-[#C5A880] border border-[#C5A880]/40 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        title="Cuộn lên đầu trang"
                      >
                        <ArrowUp className="w-5 h-5" />
                      </button>
                    )}

                    {/* Social & Hotline Stack */}
                    {settings.showSocialSupport !== false && (
                      <>
                        {/* Hotline */}
                        <a
                          href={`tel:${settings.supportPhone || settings.hotline}`}
                          className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-pulse"
                          title="Gọi Hotline"
                        >
                          <Phone className="w-5 h-5" />
                        </a>

                        {/* Messenger */}
                        <a
                          href={settings.messengerUrl || "#"}
                          target="_blank"
                          className="w-11 h-11 rounded-full bg-[#0084FF] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          title="Chat qua Facebook Messenger"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 7. SEO & Open Graph Preview */}
              {activeSection === "seo" && settings && (
                <div className="p-4 sm:p-8 space-y-6 bg-[#0F0F12] max-w-4xl mx-auto rounded-2xl border border-stone-800/80">
                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2">
                      <Search className="w-4 h-4 text-[#C5A880]" /> Mô Phỏng Hiển Thị Thực Tế
                    </h3>
                    <p className="text-xs text-stone-400">
                      Xem trước trang chủ Hanoia khi xuất hiện trên công cụ tìm kiếm và mạng xã hội
                    </p>
                  </div>

                  {/* Google Search Result Preview */}
                  <div className="bg-[#17171B] border border-stone-800 rounded-2xl p-5 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5 text-xs text-stone-400 font-medium">
                      <span className="flex items-center gap-2 text-white font-semibold">
                        <Search className="w-4 h-4 text-blue-400" /> Kết Quả Tìm Kiếm Google (SERP Preview)
                      </span>
                      <span className="text-[11px] font-mono text-stone-500">google.com</span>
                    </div>

                    <div className="space-y-1.5 max-w-2xl pt-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-[10px] text-[#C5A880] font-bold shadow">
                          E
                        </span>
                        <div className="text-xs text-stone-300">
                          <span className="font-medium text-white">{settings.siteName || "EVERIE"}</span>
                          <span className="text-stone-500 mx-1.5">›</span>
                          <span className="text-stone-400 font-mono text-[11px]">{settings.seoCanonical || "https://everievn.com"}</span>
                        </div>
                      </div>

                      <h4 className="text-base sm:text-lg font-medium text-[#8ab4f8] hover:underline cursor-pointer leading-snug">
                        {settings.seoTitle || `${settings.siteName} | ${settings.siteTagline}`}
                      </h4>

                      <p className="text-xs sm:text-sm text-stone-300 leading-relaxed line-clamp-2">
                        {settings.seoDescription || "Khám phá các sản phẩm hoa gốm thủ công cao cấp tại EVERIE: Classic Flowers, Themed Collection, Bespoke..."}
                      </p>
                    </div>
                  </div>

                  {/* Social Share Preview (Facebook / Zalo / Telegram) */}
                  <div className="bg-[#17171B] border border-stone-800 rounded-2xl p-5 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5 text-xs text-stone-400 font-medium">
                      <span className="flex items-center gap-2 text-white font-semibold">
                        <Share2 className="w-4 h-4 text-indigo-400" /> Thẻ Chia Sẻ Mạng Xã Hội (Facebook, Zalo, iMessage)
                      </span>
                      <span className="text-[11px] font-mono text-stone-500">Open Graph</span>
                    </div>

                    <div className="max-w-md mx-auto border border-stone-800 rounded-xl overflow-hidden bg-[#121215] shadow-lg">
                      <div className="relative aspect-[1.91/1] w-full bg-stone-900 overflow-hidden flex items-center justify-center">
                        {settings.seoOgImage ? (
                          <img
                            src={settings.seoOgImage}
                            alt="OG Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-stone-500 text-xs flex items-center gap-2">
                            <Share2 className="w-4 h-4" /> Chưa thiết lập ảnh OG
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-1.5 bg-[#18181D]">
                        <div className="text-[10px] uppercase font-mono text-stone-500 tracking-wider">
                          {(() => {
                            try {
                              return new URL(settings.seoCanonical || "https://everievn.com").hostname.toUpperCase();
                            } catch {
                              return "EVERIEVN.COM";
                            }
                          })()}
                        </div>
                        <div className="text-sm font-bold text-white line-clamp-1">
                          {settings.seoTitle || settings.siteName}
                        </div>
                        <div className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                          {settings.seoDescription || settings.siteTagline}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
