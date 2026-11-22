"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  CheckCircle,
  Globe,
  Shield,
  RefreshCw,
  Search,
  Share2,
  Landmark,
  Flower2,
} from "lucide-react";
import { SiteSettings } from "@/lib/store";
import ImageUploadWithPreview from "@/components/admin/ImageUploadWithPreview";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải cài đặt:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Lưu thất bại: " + data.error);
      }
    } catch (err) {
      alert("Lỗi khi lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-16 text-center text-stone-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#C5A880] mb-3" />
        Đang tải cấu hình hệ thống...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            Cài Đặt Hệ Thống & Cửa Hàng
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Cấu hình thông tin pháp nhân, nhận diện thương hiệu, chứng chỉ và thông số toàn cục
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#C5A880] hover:bg-[#b59870] text-black text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-[#C5A880]/20 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? "Đang lưu..." : "Lưu Cài Đặt"}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Đã lưu thay đổi cài đặt hệ thống thành công!
        </div>
      )}

      {/* General Settings */}
      <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#C5A880]" /> Nhận Diện & Thông Tin Liên Hệ
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">Tên Cửa Hàng / Website</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">Khẩu Hiệu Thương Hiệu</label>
            <input
              type="text"
              value={settings.siteTagline}
              onChange={(e) => setSettings({ ...settings, siteTagline: e.target.value })}
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">Số Hotline CSKH</label>
            <input
              type="text"
              value={settings.hotline}
              onChange={(e) => setSettings({ ...settings, hotline: e.target.value })}
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">Email Hỗ Trợ Khách Hàng</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">Thời Gian Làm Việc</label>
            <input
              type="text"
              value={settings.workingHours}
              onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
            />
          </div>
        </div>

        {/* Visual Logo & Favicon Uploads */}
        <div className="pt-6 border-t border-stone-800 grid grid-cols-1 md:grid-cols-3 gap-6">
          <ImageUploadWithPreview
            label="Logo Đầu Trang (Header Logo)"
            value={settings.logoHeader}
            onChange={(url) => setSettings({ ...settings, logoHeader: url })}
            aspectRatio="wide"
          />

          <ImageUploadWithPreview
            label="Logo Chân Trang (Footer Logo)"
            value={settings.logoFooter}
            onChange={(url) => setSettings({ ...settings, logoFooter: url })}
            aspectRatio="wide"
          />

          <ImageUploadWithPreview
            label="Favicon Trình Duyệt"
            value={settings.favicon}
            onChange={(url) => setSettings({ ...settings, favicon: url })}
            aspectRatio="square"
          />
        </div>
      </div>

      <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#C5A880]" /> Mạng xã hội
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">Facebook</label>
            <input
              type="url"
              value={settings.facebookUrl || ""}
              onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
              placeholder="https://facebook.com/everie.vn"
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
            />
          </div>
          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">Instagram</label>
            <input
              type="url"
              value={settings.instagramUrl || ""}
              onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
              placeholder="https://instagram.com/everie.vn"
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
            />
          </div>
          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">TikTok</label>
            <input
              type="url"
              value={settings.tiktokUrl || ""}
              onChange={(e) => setSettings({ ...settings, tiktokUrl: e.target.value })}
              placeholder="https://tiktok.com/@everie.vn"
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Landmark className="w-4 h-4 text-[#C5A880]" /> Chuyển khoản ngân hàng
        </h2>
        <p className="text-xs text-stone-400">
          Thông tin hiển thị cho khách khi thanh toán chuyển khoản. Không lưu thẻ.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">Ngân hàng</label>
            <input
              type="text"
              value={settings.bankName || ""}
              onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
              placeholder="VD: Vietcombank"
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
            />
          </div>
          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">Số tài khoản</label>
            <input
              type="text"
              value={settings.bankAccount || ""}
              onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })}
              placeholder="0123456789"
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
            />
          </div>
          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">Tên tài khoản</label>
            <input
              type="text"
              value={settings.bankAccountName || ""}
              onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
              placeholder="EVERIE CERAMIC"
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Flower2 className="w-4 h-4 text-[#C5A880]" /> Ngày chế tác & vận chuyển
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <DayRange
            label="Classic (ngày)"
            min={settings.craftClassicMin}
            max={settings.craftClassicMax}
            onMin={(n) => setSettings({ ...settings, craftClassicMin: n })}
            onMax={(n) => setSettings({ ...settings, craftClassicMax: n })}
          />
          <DayRange
            label="Themed (ngày)"
            min={settings.craftThemedMin}
            max={settings.craftThemedMax}
            onMin={(n) => setSettings({ ...settings, craftThemedMin: n })}
            onMax={(n) => setSettings({ ...settings, craftThemedMax: n })}
          />
          <DayRange
            label="Bespoke (ngày)"
            min={settings.craftBespokeMin}
            max={settings.craftBespokeMax}
            onMin={(n) => setSettings({ ...settings, craftBespokeMin: n })}
            onMax={(n) => setSettings({ ...settings, craftBespokeMax: n })}
          />
          <DayRange
            label="Vận chuyển (ngày)"
            min={settings.shippingDaysMin}
            max={settings.shippingDaysMax}
            onMin={(n) => setSettings({ ...settings, shippingDaysMin: n })}
            onMax={(n) => setSettings({ ...settings, shippingDaysMax: n })}
          />
        </div>
      </div>

      {/* SEO & Social Share Settings */}
      <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-[#C5A880]" /> Cấu Hình SEO Trang Chủ & Mạng Xã Hội (Open Graph)
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Tối ưu hiển thị tiêu đề, thẻ mô tả trên máy tìm kiếm Google và khi chia sẻ liên kết trang chủ lên mạng xã hội
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#C5A880] px-2 py-0.5 rounded bg-[#C5A880]/10 border border-[#C5A880]/30 w-fit">
            Next.js Dynamic Metadata
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Left Form: Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-stone-300 font-semibold uppercase tracking-wide">
                  Tiêu Đề SEO (Meta Title)
                </label>
                <span className={`text-[10px] font-mono ${
                  (settings.seoTitle?.length || 0) > 60 ? "text-amber-400" : "text-stone-500"
                }`}>
                  {settings.seoTitle?.length || 0}/60 ký tự (Khuyên dùng 50-60)
                </span>
              </div>
              <input
                type="text"
                placeholder="VD: EVERIE | Hoa gốm thủ công — Vẻ đẹp ở lại cùng thời gian"
                value={settings.seoTitle || ""}
                onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-stone-300 font-semibold uppercase tracking-wide">
                  Mô Tả SEO (Meta Description)
                </label>
                <span className={`text-[10px] font-mono ${
                  (settings.seoDescription?.length || 0) > 160 ? "text-amber-400" : "text-stone-500"
                }`}>
                  {settings.seoDescription?.length || 0}/160 ký tự (Khuyên dùng 150-160)
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="VD: Hoa gốm Classic, Themed và Bespoke. Làm theo đơn, khắc chữ, giao theo khoảng ngày chế tác."
                value={settings.seoDescription || ""}
                onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
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
                  placeholder="Cách nhau bởi dấu phẩy, VD: everie, hoa gốm, classic flowers"
                  value={settings.seoKeywords || ""}
                  onChange={(e) => setSettings({ ...settings, seoKeywords: e.target.value })}
                  className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="text-stone-300 font-semibold uppercase block mb-1.5">
                  Đường Dẫn Chuẩn (Canonical URL)
                </label>
                <input
                  type="text"
                  placeholder="VD: https://everievn.com"
                  value={settings.seoCanonical || ""}
                  onChange={(e) => setSettings({ ...settings, seoCanonical: e.target.value })}
                  className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>

            <div>
              <ImageUploadWithPreview
                label="Ảnh Đại Diện Chia Sẻ MXH (Open Graph / Facebook / Zalo Image)"
                value={settings.seoOgImage || ""}
                onChange={(url) => setSettings({ ...settings, seoOgImage: url })}
                aspectRatio="video"
                helperText="Kích thước khuyên dùng: 1200 x 630 px. Hiển thị khi gửi link web trên Facebook, Zalo, Telegram."
              />
            </div>
          </div>

          {/* Right Preview: SERP Simulator & Social Share Simulator */}
          <div className="lg:col-span-5 space-y-4">
            {/* Google SERP Preview */}
            <div className="p-4 bg-[#1A1A1D] border border-stone-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-semibold pb-1 border-b border-stone-800">
                <span className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-blue-400" /> Mô Phỏng Tìm Kiếm Google (SERP)
                </span>
                <span className="text-[10px] text-stone-500 font-mono">Google Search</span>
              </div>
              <div className="pt-1 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <span className="w-4 h-4 rounded-full bg-stone-800 flex items-center justify-center text-[9px] text-[#C5A880] font-bold">E</span>
                  <span className="truncate">{settings.seoCanonical || "https://everievn.com"}</span>
                </div>
                <div className="text-sm font-medium text-[#8ab4f8] hover:underline cursor-pointer truncate">
                  {settings.seoTitle || `${settings.siteName} | ${settings.siteTagline}`}
                </div>
                <p className="text-[11px] text-stone-300 line-clamp-2 leading-relaxed">
                  {settings.seoDescription || "Hoa gốm Classic, Themed và Bespoke từ EVERIE."}
                </p>
              </div>
            </div>

            {/* Social Share Preview (Facebook / Zalo / iMessage) */}
            <div className="p-4 bg-[#1A1A1D] border border-stone-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-semibold pb-1 border-b border-stone-800">
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-indigo-400" /> Mô Phỏng Thẻ Chia Sẻ MXH
                </span>
                <span className="text-[10px] text-stone-500 font-mono">Open Graph</span>
              </div>
              <div className="border border-stone-800 rounded-lg overflow-hidden bg-[#121214]">
                <div className="relative aspect-[1.91/1] w-full bg-stone-900 overflow-hidden flex items-center justify-center">
                  {settings.seoOgImage ? (
                    <img
                      src={settings.seoOgImage}
                      alt="OG Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-stone-500 text-xs flex items-center gap-1.5">
                      <Share2 className="w-4 h-4" /> Chưa chọn ảnh OG
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1 bg-[#161619]">
                  <div className="text-[10px] uppercase font-mono text-stone-500 tracking-wider">
                    {(() => {
                      try {
                        return new URL(settings.seoCanonical || "https://everievn.com").hostname.toUpperCase();
                      } catch {
                        return "EVERIEVN.COM";
                      }
                    })()}
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {settings.seoTitle || settings.siteName}
                  </div>
                  <div className="text-[11px] text-stone-400 line-clamp-1">
                    {settings.seoDescription || settings.siteTagline}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal & Compliance */}
      <div className="bg-[#141417] border border-stone-800 rounded-xl p-6 space-y-6">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#C5A880]" /> Pháp Nhân & Bản Quyền Doanh Nghiệp
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">
              Bản Quyền Tiếng Việt
            </label>
            <textarea
              rows={3}
              value={settings.copyrightVi}
              onChange={(e) => setSettings({ ...settings, copyrightVi: e.target.value })}
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">
              Bản Quyền Tiếng Anh
            </label>
            <textarea
              rows={3}
              value={settings.copyrightEn}
              onChange={(e) => setSettings({ ...settings, copyrightEn: e.target.value })}
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div>
            <label className="text-stone-300 font-semibold uppercase block mb-1.5">
              Link Chứng Nhận Bộ Công Thương
            </label>
            <input
              type="text"
              value={settings.bctCertificateUrl}
              onChange={(e) => setSettings({ ...settings, bctCertificateUrl: e.target.value })}
              className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <ImageUploadWithPreview
            label="Huy Hiệu Bộ Công Thương (Badge)"
            value={settings.bctBadgeImage}
            onChange={(url) => setSettings({ ...settings, bctBadgeImage: url })}
            aspectRatio="wide"
          />
        </div>
      </div>
    </div>
  );
}

function DayRange({
  label,
  min,
  max,
  onMin,
  onMax,
}: {
  label: string;
  min?: number;
  max?: number;
  onMin: (value: number | undefined) => void;
  onMax: (value: number | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-stone-300 font-semibold uppercase block">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min={0}
          value={min ?? ""}
          onChange={(e) => onMin(e.target.value === "" ? undefined : Number(e.target.value))}
          placeholder="Min"
          className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
        />
        <input
          type="number"
          min={0}
          value={max ?? ""}
          onChange={(e) => onMax(e.target.value === "" ? undefined : Number(e.target.value))}
          placeholder="Max"
          className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
        />
      </div>
    </div>
  );
}
