"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  ChevronDown,
  Clock,
  Gift,
  Lock,
  Mail,
  MapPin,
  Menu,
  Phone,
  Quote,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import type { PageContent, PageSectionItem } from "@/lib/store";

/**
 * ============================================================================
 * SHARED STOREFRONT MINI HEADER & FOOTER
 * ============================================================================
 */
function StorefrontMiniAnnouncement() {
  return (
    <div className="bg-[#1C1C1F] px-4 py-2 text-center text-[10px] tracking-wider text-[#C5A880] uppercase">
      <span className="font-semibold">Đặc quyền Hanoia:</span> Miễn phí vận chuyển toàn quốc cho đơn hàng từ 2.000.000 ₫ · Hotline 1800 1234
    </div>
  );
}

function StorefrontMiniHeader({
  activeSlug,
  isMobile = false,
}: {
  activeSlug: string;
  isMobile?: boolean;
}) {
  if (isMobile) {
    return (
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95">
        <Link
          href="/"
          className="font-serif text-lg tracking-[0.2em] font-bold uppercase text-black dark:text-white"
        >
          HANOIA
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-[#C5A880] px-2.5 py-0.5 font-semibold text-black text-[9px] uppercase tracking-wider">
            Concierge
          </span>
          <button
            type="button"
            className="p-1 text-black dark:text-white"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-6 py-3.5 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-serif text-xl tracking-[0.2em] font-bold uppercase text-black dark:text-white">
          HANOIA
        </Link>
        <nav className="hidden lg:flex items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-600 dark:text-neutral-300">
          <span className="hover:text-[#C5A880] cursor-pointer">BỘ SƯU TẬP</span>
          <span className="hover:text-[#C5A880] cursor-pointer">HÀNG MỚI</span>
          <span className={`hover:text-[#C5A880] cursor-pointer ${activeSlug === "heritage" ? "text-[#C5A880] font-bold" : ""}`}>DI SẢN</span>
          <span className={`hover:text-[#C5A880] cursor-pointer ${activeSlug === "stores" ? "text-[#C5A880] font-bold" : ""}`}>CỬA HÀNG</span>
          <span className={`hover:text-[#C5A880] cursor-pointer ${activeSlug === "policies" ? "text-[#C5A880] font-bold" : ""}`}>CHÍNH SÁCH</span>
          <span className={`hover:text-[#C5A880] cursor-pointer ${activeSlug === "contact" ? "text-[#C5A880] font-bold" : ""}`}>LIÊN HỆ</span>
        </nav>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <span className="hidden sm:inline text-neutral-500 font-serif italic">Nghệ thuật sơn mài</span>
        <span className="rounded-full bg-[#C5A880] px-3 py-1 font-semibold text-black text-[10px] uppercase tracking-wider">
          Concierge
        </span>
      </div>
    </header>
  );
}

function StorefrontMiniFooter({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-100 px-6 py-10 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
      <div className={`mx-auto max-w-[1280px] grid gap-6 ${isMobile ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        <div className="space-y-3">
          <span className="font-serif text-lg font-bold tracking-[0.2em] uppercase text-black dark:text-white">
            HANOIA
          </span>
          <p className="text-[11px] leading-relaxed">
            Thương hiệu sơn mài thủ công cao cấp hàng đầu Việt Nam, gìn giữ di sản và tiên phong thiết kế đương đại.
          </p>
        </div>
        <div>
          <h5 className="font-semibold uppercase tracking-wider text-black dark:text-white text-[11px] mb-3">
            Hệ thống Boutique
          </h5>
          <ul className="space-y-1.5 text-[11px]">
            <li>Hà Nội: Press Club · Hàng Đào · Tràng Tiền</li>
            <li>TP. HCM: Continental Saigon · Diamond Plaza</li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold uppercase tracking-wider text-black dark:text-white text-[11px] mb-3">
            Chính sách khách hàng
          </h5>
          <ul className="space-y-1.5 text-[11px]">
            <li>Chính sách vận chuyển & bảo hiểm</li>
            <li>Bảo hành & Phục hồi bề mặt sơn mài</li>
            <li>Dịch vụ chế tác quà tặng Bespoke</li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold uppercase tracking-wider text-black dark:text-white text-[11px] mb-3">
            Dịch vụ Concierge
          </h5>
          <p className="text-[11px] font-bold text-[#C5A880]">1800 1234 (Miễn phí cước)</p>
          <p className="text-[10px] text-neutral-500 mt-1">contact@everievn.com · 08:30 - 21:00</p>
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-[10px] text-center text-neutral-500">
        © 2026 EVERIE CO., LTD. Bảo lưu mọi bản quyền. Chứng nhận Bộ Công Thương.
      </div>
    </footer>
  );
}

/**
 * ============================================================================
 * 1:1 CONTACT STOREFRONT PREVIEW (MIRRORS src/app/(storefront)/contact/page.tsx)
 * ============================================================================
 */
function ContactStorefrontPreview({
  page,
  onEditSection,
  isMobile = false,
}: {
  page: PageContent;
  onEditSection: (sectionId: string) => void;
  isMobile?: boolean;
}) {
  const headerSec = page.sections.find(
    (s) => s.id === "contact-header" || s.type === "hero",
  );
  const infoSec = page.sections.find(
    (s) => s.id === "contact-info" || s.type === "contact",
  );
  const formSec = page.sections.find(
    (s) => s.id === "contact-form" || s.type === "feature",
  );

  const defaultInfoItems: PageSectionItem[] = [
    {
      id: "phone",
      title: "Hotline chăm sóc khách hàng:",
      value: "1800 1234",
      description: "(Miễn cước, từ 08:30 - 21:00 hàng ngày)",
    },
    {
      id: "email",
      title: "Email chính thức:",
      value: "contact@everievn.com",
      description: "Hỗ trợ doanh nghiệp B2B: corporate@everievn.com",
    },
    {
      id: "address",
      title: "Văn phòng trụ sở:",
      value: "Tòa nhà Press Club, 12 Lý Đạo Thành, Hoàn Kiếm, Hà Nội",
      description: "Chi nhánh TP. HCM: 132-134 Đồng Khởi, Bến Nghé, Quận 1",
    },
    {
      id: "hours",
      title: "Giờ làm việc văn phòng:",
      value: "Thứ 2 - Thứ 6: 08:30 - 18:00",
      description: "Hệ thống boutique mở cửa: 08:30 - 21:30 cả Thứ 7 & Chủ Nhật",
    },
  ];

  const infoItems =
    infoSec?.items && infoSec.items.length > 0
      ? infoSec.items
      : defaultInfoItems;

  const defaultSubjects = [
    "Tư vấn chọn tác phẩm sơn mài",
    "Nội thất sơn mài Bespoke",
    "Quà tặng doanh nghiệp & Ngoại giao",
    "Dịch vụ bảo dưỡng & phục chế",
    "Chủ đề khác",
  ];

  const subjects =
    formSec?.items && formSec.items.length > 0
      ? formSec.items.map((it) => it.title || it.value || "Tư vấn")
      : defaultSubjects;

  return (
    <div className="relative font-sans text-stone-900 bg-white dark:bg-neutral-950 dark:text-neutral-100">
      <StorefrontMiniAnnouncement />
      <StorefrontMiniHeader activeSlug="contact" isMobile={isMobile} />

      <main className={`max-w-[1360px] mx-auto ${isMobile ? "px-3 py-5" : "px-4 md:px-8 py-8 md:py-16"}`}>
        {/* Breadcrumb */}
        <div className={`flex items-center space-x-2 text-[11px] uppercase tracking-wider text-neutral-400 ${isMobile ? "mb-4" : "mb-8"}`}>
          <Link href="/" className="hover:text-black">Trang chủ</Link>
          <span>/</span>
          <span className="text-[#C5A880] font-semibold">{page.title || "Liên hệ"}</span>
        </div>

        {/* Section 1: Editorial Header (White Luxury Style) */}
        <div className={`relative group text-center space-y-2.5 ${isMobile ? "mb-8" : "mb-12"}`}>
          {headerSec && (
            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button
                type="button"
                onClick={() => onEditSection(headerSec.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                Sửa tiêu đề & lời mở đầu ({headerSec.name})
              </button>
            </div>
          )}
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold flex items-center justify-center space-x-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{headerSec?.eyebrow || "Dịch vụ khách hàng Concierge"}</span>
          </span>
          <h1 className={`font-serif font-light uppercase tracking-wide text-black dark:text-neutral-100 ${isMobile ? "text-2xl leading-snug" : "text-3xl md:text-5xl"}`}>
            {headerSec?.title || "LIÊN HỆ VỚI HANOIA"}
          </h1>
          <div className="w-16 h-0.5 bg-[#C5A880] mx-auto" />
          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-light max-w-xl mx-auto leading-relaxed pt-2">
            {headerSec?.body ||
              "Đội ngũ tư vấn viên Hanoia luôn sẵn sàng lắng nghe, giải đáp mọi thắc mắc và đồng hành cùng quý khách trong hành trình khám phá nghệ thuật sơn mài đỉnh cao."}
          </p>
        </div>

        {/* Section 2 & 3: Info Grid + Direct Contact Form */}
        <div className={isMobile ? "flex flex-col gap-6 items-stretch mb-10" : "grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16"}>
          {/* Left Column: Contact Info Side */}
          <div className={`${isMobile ? "w-full p-4 space-y-4" : "lg:col-span-5 p-6 md:p-8 space-y-6"} bg-[#F8F7F4] border border-neutral-200 rounded-xs relative group shadow-2xs`}>
            {infoSec && (
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  type="button"
                  onClick={() => onEditSection(infoSec.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  Sửa thông tin trực tuyến ({infoSec.name})
                </button>
              </div>
            )}
            <div className="border-b border-neutral-300 pb-4">
              <h2 className="text-xl font-serif font-normal uppercase tracking-wide text-black">
                {infoSec?.title || "Thông Tin Trực Tuyến"}
              </h2>
              <p className="text-xs text-neutral-500 font-light mt-1">
                {infoSec?.body || "Kết nối với chúng tôi qua các kênh hỗ trợ chính thức"}
              </p>
            </div>

            <div className="space-y-4 text-xs text-neutral-700 font-light">
              {infoItems.map((item, index) => {
                const Icon =
                  index === 0
                    ? Phone
                    : index === 1
                      ? Mail
                      : index === 2
                        ? MapPin
                        : Clock;
                return (
                  <div key={item.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-200/70 flex items-center justify-center shrink-0 text-[#C5A880]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-black block">
                        {item.title}
                      </span>
                      <p className="font-medium text-neutral-900 mt-0.5">
                        {item.value}
                      </p>
                      {item.description && (
                        <p className="text-neutral-500 text-[11px] mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Showroom reference box */}
            <div className="pt-4 border-t border-neutral-300">
              <p className="text-xs font-semibold text-black mb-1">
                Hệ thống Boutique Hanoia
              </p>
              <p className="text-xs text-neutral-500 font-light">
                Quý khách có thể ghé thăm trực tiếp các không gian trưng bày tại Hà Nội và TP. Hồ Chí Minh để thưởng lãm và cảm nhận bề mặt tác phẩm sơn mài.
              </p>
              <span className="inline-flex items-center text-xs font-semibold text-[#C5A880] hover:underline cursor-pointer mt-2">
                Xem địa chỉ 5 showroom &gt;
              </span>
            </div>
          </div>

          {/* Right Column: Direct Contact Form */}
          <div className={`${isMobile ? "w-full p-4 space-y-4" : "lg:col-span-7 p-6 md:p-8 space-y-6"} bg-white border border-neutral-200 rounded-xs shadow-xs relative group`}>
            {formSec && (
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  type="button"
                  onClick={() => onEditSection(formSec.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  Sửa biểu mẫu lời nhắn ({formSec.name})
                </button>
              </div>
            )}
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className={`font-serif font-normal uppercase tracking-wide text-black ${isMobile ? "text-lg" : "text-xl"}`}>
                {formSec?.title || "Gửi Lời Nhắn Trực Tiếp"}
              </h2>
              <p className="text-xs text-neutral-500 font-light mt-1">
                {formSec?.body || "Vui lòng để lại thông tin để được tư vấn viên hỗ trợ chu đáo nhất"}
              </p>
            </div>

            <form className="space-y-4 text-xs" onSubmit={(e) => e.preventDefault()}>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                <div className="space-y-1">
                  <label className="block text-neutral-600 font-light">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    placeholder="Nguyễn Văn A"
                    className="w-full border border-neutral-300 px-3 py-2.5 rounded-xs bg-neutral-50 text-neutral-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-neutral-600 font-light">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    placeholder="0912 345 678"
                    className="w-full border border-neutral-300 px-3 py-2.5 rounded-xs bg-neutral-50 text-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-600 font-light">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  disabled
                  placeholder="email@example.com"
                  className="w-full border border-neutral-300 px-3 py-2.5 rounded-xs bg-neutral-50 text-neutral-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-600 font-light">
                  Chủ đề tư vấn
                </label>
                <select
                  disabled
                  className="w-full border border-neutral-300 px-3 py-2.5 rounded-xs bg-neutral-50 text-neutral-700 focus:outline-none"
                >
                  {subjects.map((sub, idx) => (
                    <option key={idx} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-600 font-light">
                  Nội dung lời nhắn <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  disabled
                  placeholder="Quý khách vui lòng chia sẻ thông tin cần hỗ trợ..."
                  className="w-full border border-neutral-300 p-3 rounded-xs bg-neutral-50 text-neutral-600 focus:outline-none resize-none"
                />
              </div>

              <button
                type="button"
                className="w-full bg-black text-white text-xs uppercase tracking-[2px] py-4 font-semibold hover:bg-[#C5A880] hover:text-black transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>GỬI LỜI NHẮN</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <StorefrontMiniFooter isMobile={isMobile} />
    </div>
  );
}

/**
 * ============================================================================
 * 1:1 STORES STOREFRONT PREVIEW (MIRRORS src/app/(storefront)/stores/page.tsx)
 * ============================================================================
 */
function StoresStorefrontPreview({
  page,
  onEditSection,
  isMobile = false,
}: {
  page: PageContent;
  onEditSection: (sectionId: string) => void;
  isMobile?: boolean;
}) {
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const heroSec = page.sections.find(
    (s) => s.id === "stores-hero" || s.type === "hero",
  );
  const storeSections = page.sections.filter(
    (s) => s.type === "stores" && s.enabled,
  );
  const bookingSec = page.sections.find(
    (s) => s.id === "stores-booking" || s.type === "contact",
  );

  const boutiques = storeSections.flatMap((sec) =>
    sec.items.map((it) => ({
      ...it,
      city: sec.eyebrow || (sec.id.includes("hanoi") ? "Hà Nội" : "TP. Hồ Chí Minh"),
      image: it.image || "/images/hanoia/hero-banner-1.webp",
    })),
  );

  const cities = Array.from(new Set(boutiques.map((b) => b.city)));
  const filteredBoutiques =
    selectedCity === "all"
      ? boutiques
      : boutiques.filter((b) => b.city === selectedCity);

  return (
    <div className="relative font-sans text-stone-900 bg-white dark:bg-neutral-950 dark:text-neutral-100">
      <StorefrontMiniAnnouncement />
      <StorefrontMiniHeader activeSlug="stores" isMobile={isMobile} />

      <main className={`max-w-[1440px] mx-auto ${isMobile ? "px-3 py-5" : "px-4 md:px-8 py-8 md:py-16"}`}>
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-[11px] uppercase tracking-wider text-neutral-400 mb-8">
          <Link href="/" className="hover:text-black">Trang chủ</Link>
          <span>/</span>
          <span className="text-[#C5A880] font-semibold">{page.title || "Hệ thống cửa hàng"}</span>
        </div>

        {/* Section Header */}
        <div className="relative group text-center space-y-3 mb-12">
          {heroSec && (
            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button
                type="button"
                onClick={() => onEditSection(heroSec.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl hover:bg-black cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                Sửa tiêu đề cửa hàng
              </button>
            </div>
          )}
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold flex items-center justify-center space-x-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{heroSec?.eyebrow || "Không gian nghệ thuật & trải nghiệm"}</span>
          </span>
          <h1 className={`font-serif font-light uppercase tracking-wide text-black dark:text-neutral-100 ${isMobile ? "text-2xl leading-snug" : "text-3xl md:text-5xl"}`}>
            {heroSec?.title || "HỆ THỐNG CỬA HÀNG HANOIA"}
          </h1>
          <div className="w-16 h-0.5 bg-[#C5A880] mx-auto" />
          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed pt-2">
            {heroSec?.body ||
              "Khám phá vẻ đẹp sơn mài thượng hạng tại các không gian boutique đắc địa bậc nhất Hà Nội và TP. Hồ Chí Minh."}
          </p>

          {/* City Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            <button
              type="button"
              onClick={() => setSelectedCity("all")}
              className={`text-xs uppercase tracking-[1.5px] px-5 py-2.5 transition-all border rounded-xs cursor-pointer ${
                selectedCity === "all"
                  ? "bg-black text-white border-black font-semibold shadow-xs"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black"
              }`}
            >
              Tất cả showroom ({boutiques.length})
            </button>
            {cities.map((city) => {
              const count = boutiques.filter((b) => b.city === city).length;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`text-xs uppercase tracking-[1.5px] px-5 py-2.5 transition-all border rounded-xs cursor-pointer ${
                    selectedCity === city
                      ? "bg-black text-white border-black font-semibold shadow-xs"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black"
                  }`}
                >
                  {city} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Boutiques Grid */}
        <div className={`grid gap-6 ${isMobile ? "grid-cols-1 mb-10" : "grid-cols-1 lg:grid-cols-2 gap-8 mb-20"}`}>
          {filteredBoutiques.map((b) => (
            <div
              key={b.id}
              className="group border border-neutral-200 rounded-xs overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between bg-white"
            >
              <div>
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                  <Image
                    src={b.image}
                    alt={b.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60" />
                  {b.badge && (
                    <span className="absolute top-4 left-4 bg-black/90 text-[#C5A880] border border-[#C5A880]/50 text-[10px] tracking-widest font-bold uppercase px-3 py-1.5 shadow-md">
                      {b.badge}
                    </span>
                  )}
                  <span className="absolute bottom-4 left-4 text-xs font-semibold uppercase tracking-wider text-white bg-black/50 px-2.5 py-1 backdrop-blur-xs">
                    {b.city}
                  </span>
                </div>

                <div className="p-6 md:p-8 space-y-4">
                  <h3 className="text-xl font-serif font-normal uppercase tracking-wide text-black">
                    {b.title}
                  </h3>
                  <div className="space-y-2 text-xs text-neutral-600 font-light">
                    <p className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                      <span>{b.description}</span>
                    </p>
                    {b.value && (
                      <p className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-[#C5A880] shrink-0" />
                        <span>Mở cửa: {b.value}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 md:px-8 pb-6 pt-2 flex items-center justify-between border-t border-neutral-100">
                <span className="inline-flex items-center text-xs font-semibold text-[#C5A880] hover:underline cursor-pointer">
                  Chỉ đường &gt;
                </span>
                <span className="rounded bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-800">
                  Đặt hẹn VIP
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Booking VIP Concierge Section */}
        {bookingSec && (
          <div className="relative group border border-neutral-200 bg-[#F8F7F4] p-8 md:p-12 rounded-xs text-center space-y-4 shadow-xs mt-12 mb-8">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button
                type="button"
                onClick={() => onEditSection(bookingSec.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl hover:bg-black cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                Sửa khối này: {bookingSec.name}
              </button>
            </div>
            <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
              {bookingSec.eyebrow || "Hanoia VIP Concierge"}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl uppercase tracking-wide text-black">
              {bookingSec.title || "Đặt Lịch Tư Vấn & Thưởng Lãm Riêng Tư"}
            </h2>
            <div className="w-12 h-0.5 bg-[#C5A880] mx-auto" />
            <p className="text-xs md:text-sm text-neutral-600 max-w-xl mx-auto leading-relaxed font-light">
              {bookingSec.body ||
                "Quý khách có thể đặt hẹn trước để được đón tiếp riêng tư cùng chuyên gia tư vấn nghệ thuật của Hanoia."}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 rounded bg-black px-6 py-2.5 text-xs font-semibold uppercase tracking-[1.5px] text-white hover:bg-neutral-800 cursor-pointer">
                {bookingSec.ctaLabel || "Đặt lịch hẹn ngay"}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        )}
      </main>

      <StorefrontMiniFooter isMobile={isMobile} />
    </div>
  );
}

/**
 * ============================================================================
 * 1:1 POLICIES STOREFRONT PREVIEW (MIRRORS src/app/(storefront)/policies/page.tsx)
 * ============================================================================
 */
function PoliciesStorefrontPreview({
  page,
  onEditSection,
  isMobile = false,
}: {
  page: PageContent;
  onEditSection: (sectionId: string) => void;
  isMobile?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<string>("shipping");
  const heroSec = page.sections.find(
    (s) => s.id === "policies-hero" || s.type === "hero",
  );
  const listSec = page.sections.find(
    (s) => s.id === "policies-list" || s.type === "policies",
  );

  const defaultTabs = [
    { id: "shipping", label: "Chính sách vận chuyển", icon: Truck },
    { id: "returns", label: "Chính sách đổi trả hàng", icon: RotateCcw },
    { id: "warranty", label: "Chính sách bảo hành", icon: ShieldCheck },
    { id: "care", label: "Hướng dẫn bảo quản sơn mài", icon: Sparkles },
    { id: "corporate", label: "Quà tặng doanh nghiệp & Bespoke", icon: Gift },
    { id: "privacy", label: "Chính sách bảo mật", icon: Lock },
  ];

  const currentItem =
    listSec?.items?.find((it) => it.id === activeTab) || listSec?.items?.[0];

  return (
    <div className="relative font-sans text-stone-900 bg-white dark:bg-neutral-950 dark:text-neutral-100">
      <StorefrontMiniAnnouncement />
      <StorefrontMiniHeader activeSlug="policies" isMobile={isMobile} />

      <main className={`max-w-[1360px] mx-auto ${isMobile ? "px-3 py-5" : "px-4 md:px-8 py-8 md:py-16"}`}>
        {/* Breadcrumb */}
        <div className={`flex items-center space-x-2 text-[11px] uppercase tracking-wider text-neutral-400 ${isMobile ? "mb-4" : "mb-8"}`}>
          <Link href="/" className="hover:text-black">Trang chủ</Link>
          <span>/</span>
          <span className="text-[#C5A880] font-semibold">{page.title || "Chính sách & Hỗ trợ"}</span>
        </div>

        {/* Section Header */}
        <div className={`relative group border-b border-neutral-200 pb-6 mb-8 space-y-2`}>
          {heroSec && (
            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button
                type="button"
                onClick={() => onEditSection(heroSec.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl hover:bg-black cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                Sửa tiêu đề chính sách
              </button>
            </div>
          )}
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
            {heroSec?.eyebrow || "Hỗ trợ khách hàng"}
          </span>
          <h1 className={`font-serif font-normal uppercase tracking-wide text-black dark:text-neutral-100 ${isMobile ? "text-xl leading-snug" : "text-2xl md:text-4xl"}`}>
            {heroSec?.title || "Trung tâm chính sách & dịch vụ"}
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-light max-w-xl">
            {heroSec?.body ||
              "Cam kết bảo đảm quyền lợi tối đa và mang đến trải nghiệm mua sắm xa xỉ trọn vẹn nhất cho khách hàng của Hanoia."}
          </p>
        </div>

        {/* Main Grid: Sidebar + Content */}
        <div className={`grid gap-6 items-start mb-16 ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"}`}>
          {/* Navigation Sidebar */}
          <div className={`${isMobile ? "w-full" : "lg:col-span-4 sticky top-24"} bg-white border border-neutral-200 rounded-xs overflow-hidden shadow-xs`}>
            <div className="p-4 bg-[#F8F7F4] border-b border-neutral-200">
              <span className="text-[11px] uppercase tracking-widest font-semibold text-neutral-600">
                Danh mục hỗ trợ
              </span>
            </div>

            <nav className="divide-y divide-neutral-100 text-xs">
              {defaultTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-5 py-4 flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? "bg-black text-white font-semibold"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-neutral-400" />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Policy Detail Card (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-xs p-6 md:p-10 shadow-xs relative group">
            {listSec && (
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  type="button"
                  onClick={() => onEditSection(listSec.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl hover:bg-black cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  Sửa nội dung điều khoản ({listSec.name})
                </button>
              </div>
            )}
            <div className="flex items-center space-x-3 border-b border-neutral-200 pb-4 mb-6">
              <ShieldCheck className="w-6 h-6 text-[#C5A880]" />
              <h2 className="text-xl md:text-2xl font-serif font-normal uppercase tracking-wide text-black">
                {currentItem?.title || "Quy định chính thức"}
              </h2>
            </div>

            <div className="text-xs md:text-sm text-neutral-700 leading-relaxed font-light space-y-4">
              <p className="whitespace-pre-line">
                {currentItem?.description ||
                  "Hanoia cam kết bảo vệ toàn diện quyền lợi khách hàng và đảm bảo trải nghiệm mua sắm xa xỉ hoàn hảo nhất."}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#F8F7F4] p-4 rounded-xs text-xs">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-[#C5A880]" />
                <span className="text-neutral-700 font-light">
                  Cần hỗ trợ giải đáp trực tiếp về chính sách?
                </span>
              </div>
              <span className="font-semibold text-black hover:text-[#C5A880] cursor-pointer">
                Hotline 1800 1234 &gt;
              </span>
            </div>
          </div>
        </div>
      </main>

      <StorefrontMiniFooter isMobile={isMobile} />
    </div>
  );
}

/**
 * ============================================================================
 * 1:1 HERITAGE STOREFRONT PREVIEW (MIRRORS src/app/(storefront)/heritage/page.tsx)
 * ============================================================================
 */
function HeritageStorefrontPreview({
  page,
  onEditSection,
  isMobile = false,
}: {
  page: PageContent;
  onEditSection: (sectionId: string) => void;
  isMobile?: boolean;
}) {
  const hero = page.sections.find((s) => s.id === "heritage-hero" || s.type === "hero");
  const story = page.sections.find((s) => s.id === "heritage-origin" || s.type === "story");
  const stats = page.sections.find((s) => s.id === "heritage-stats" || s.type === "stats");
  const process = page.sections.find((s) => s.id === "heritage-process" || s.type === "process");
  const material = page.sections.find((s) => s.id === "heritage-material" || (s.type === "feature" && s.id.includes("material")));
  const cta = page.sections.find((s) => s.id === "heritage-cta" || s.type === "cta");

  return (
    <div className="relative font-sans text-stone-900 bg-white dark:bg-neutral-950 dark:text-neutral-100">
      <StorefrontMiniAnnouncement />
      <StorefrontMiniHeader activeSlug="heritage" isMobile={isMobile} />

      {/* Hero Banner */}
      <section className={`relative group overflow-hidden ${isMobile ? "py-14 px-4" : "py-24 sm:py-36 px-6"} text-center text-white bg-neutral-900`}>
        {hero && (
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(hero.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối này: {hero.name}
            </button>
          </div>
        )}
        {hero?.image && (
          <Image
            src={hero.image}
            alt={hero.imageAlt || hero.title}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/40" />

        <div className="relative z-10 mx-auto max-w-3xl space-y-4">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A880]">
            <Sparkles className="h-4 w-4" />
            {hero?.eyebrow || "Di sản thủ công Việt Nam"}
          </p>
          <h1 className={`font-serif font-light uppercase tracking-wide leading-tight ${isMobile ? "text-2xl" : "text-3xl sm:text-5xl"}`}>
            {hero?.title || "Câu chuyện Hanoia"}
          </h1>
          <div className="mx-auto h-0.5 w-16 bg-[#C5A880]" />
          <p className="mx-auto max-w-2xl font-serif text-sm italic leading-relaxed text-neutral-200 sm:text-base">
            &ldquo;{hero?.body || "Từ cái nôi thủ công ngàn năm của người Việt đến những tuyệt tác sơn mài đương đại vang danh thế giới."}&rdquo;
          </p>
        </div>
      </section>

      {/* Story 2-Column */}
      {story && (
        <section className={`mx-auto max-w-[1280px] ${isMobile ? "px-4 py-8" : "px-6 py-16 sm:py-24"}`}>
          <div className={isMobile ? "flex flex-col gap-6" : "grid items-center gap-12 lg:grid-cols-12"}>
            <div className={`relative aspect-[4/3] overflow-hidden rounded-lg shadow-2xl bg-neutral-100 ${isMobile ? "w-full" : "lg:col-span-6"}`}>
              {story.image && (
                <Image
                  src={story.image}
                  alt={story.title}
                  fill
                  sizes="600px"
                  className="object-cover"
                />
              )}
            </div>
            <div className={`space-y-4 ${isMobile ? "w-full" : "lg:col-span-6"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880]">
                {story.eyebrow}
              </p>
              <h2 className="font-serif text-2xl uppercase tracking-wide text-foreground sm:text-3xl leading-snug">
                {story.title}
              </h2>
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {story.body.split("\n\n").map((para, pIdx) => (
                  <p key={pIdx}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Numbers */}
      {stats && stats.items.length > 0 && (
        <section className={`border-y border-neutral-200 bg-neutral-900 ${isMobile ? "px-4 py-8" : "px-6 py-12"} text-white`}>
          <div className={`mx-auto max-w-5xl grid text-center ${isMobile ? "grid-cols-1 gap-6 divide-y divide-neutral-800" : "grid-cols-1 gap-6 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800"}`}>
            {stats.items.map((stat) => (
              <div key={stat.id} className="pt-4 sm:pt-0 sm:px-4">
                <strong className="block font-serif text-3xl font-light sm:text-4xl text-[#C5A880]">
                  {stat.value}
                </strong>
                <span className="mt-1 block text-xs uppercase tracking-wider text-neutral-300 font-medium">
                  {stat.title}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lacquer Process Steps */}
      {process && (
        <section className={`bg-[#F8F7F4] ${isMobile ? "px-4 py-10" : "px-6 py-16 sm:py-24"} relative group`}>
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(process.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối này: {process.name}
            </button>
          </div>
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto mb-12 max-w-xl text-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880]">
                {process.eyebrow || "KỸ NGHỆ ĐỘC BẢN"}
              </p>
              <h2 className={`font-serif uppercase tracking-wide text-foreground ${isMobile ? "text-2xl" : "text-3xl"}`}>
                {process.title || "Quy trình tạo tác sơn mài"}
              </h2>
              <div className="w-12 h-0.5 bg-[#C5A880] mx-auto my-3" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {process.body}
              </p>
            </div>

            <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}`}>
              {process.items.map((step) => (
                <div key={step.id} className="rounded-lg border border-neutral-200/80 bg-white p-6 shadow-xs">
                  <span className="block font-serif text-3xl font-light text-[#C5A880]">
                    {step.value}
                  </span>
                  <h3 className="mt-3 font-serif text-sm font-semibold uppercase tracking-wide text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-light">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lãnh Mỹ A Material Showcase */}
      {material && (
        <section className={`mx-auto max-w-[1280px] ${isMobile ? "px-4 py-8" : "px-6 py-16 sm:py-24"} relative group`}>
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(material.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối này: {material.name}
            </button>
          </div>
          <div className={isMobile ? "flex flex-col-reverse gap-6" : "grid items-center gap-12 lg:grid-cols-12"}>
            <div className={`space-y-4 ${isMobile ? "w-full" : "lg:col-span-6"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880]">
                {material.eyebrow || "Chất liệu huyền thoại"}
              </p>
              <h2 className="font-serif text-2xl uppercase tracking-wide text-foreground sm:text-3xl leading-snug">
                {material.title || "Lãnh Mỹ A – Nữ hoàng của các loại tơ lụa"}
              </h2>
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {material.body.split("\n\n").map((para, pIdx) => (
                  <p key={pIdx}>{para}</p>
                ))}
              </div>
            </div>
            <div className={`relative aspect-[4/3] overflow-hidden rounded-lg shadow-2xl bg-neutral-100 ${isMobile ? "w-full" : "lg:col-span-6"}`}>
              {material.image && (
                <Image
                  src={material.image}
                  alt={material.title}
                  fill
                  sizes="600px"
                  className="object-cover"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {cta && (
        <section className="bg-neutral-950 text-white py-16 px-6 text-center relative group border-t border-neutral-900">
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(cta.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối này: {cta.name}
            </button>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="font-serif text-2xl md:text-3xl uppercase tracking-wide text-white">
              {cta.title || "Chiêm Ngưỡng Các Tác Phẩm Sơn Mài"}
            </h2>
            <div className="w-12 h-0.5 bg-[#C5A880] mx-auto" />
            <p className="text-xs md:text-sm text-neutral-300 font-light">
              {cta.body ||
                "Mỗi tác phẩm là một câu chuyện riêng biệt, sẵn sàng đồng hành cùng không gian sống thượng lưu của quý khách."}
            </p>
            <div className="pt-4">
              <span className="inline-flex items-center gap-2 rounded bg-[#C5A880] px-7 py-3 text-xs font-bold uppercase tracking-[1.5px] text-black shadow-lg">
                {cta.ctaLabel || "Khám phá toàn bộ bộ sưu tập"}
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </section>
      )}

      <StorefrontMiniFooter isMobile={isMobile} />
    </div>
  );
}

/**
 * ============================================================================
 * 1:1 HOME STOREFRONT PREVIEW (MIRRORS src/app/(storefront)/page.tsx)
 * ============================================================================
 */
function HomeStorefrontPreview({
  page,
  onEditSection,
  isMobile = false,
}: {
  page: PageContent;
  onEditSection: (sectionId: string) => void;
  isMobile?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const heroSlider = page.sections.find((s) => s.id === "home-hero-slider" || s.type === "hero");
  const bestSellers = page.sections.find((s) => s.id === "home-best-sellers" || s.type === "showcase");
  const toppicks = page.sections.find((s) => s.id === "home-toppicks" || s.name.toLowerCase().includes("top picks") || s.title?.includes("PRISM"));
  const lifestyle = page.sections.find((s) => s.id === "home-lifestyle" || s.name.toLowerCase().includes("lifestyle") || s.name.toLowerCase().includes("nội thất"));
  const timeline = page.sections.find((s) => s.id === "home-timeline" || s.type === "process");
  const heritage = page.sections.find((s) => s.id === "home-heritage" || (s.type === "story" && s.id !== "home-lifestyle"));
  const press = page.sections.find((s) => s.id === "home-press" || s.type === "stats" || s.name.toLowerCase().includes("báo chí"));
  const lookbook = page.sections.find((s) => s.id === "home-lookbook" || s.type === "gallery" || s.name.toLowerCase().includes("lookbook"));
  const newsletter = page.sections.find((s) => s.id === "home-newsletter" || s.type === "cta" || s.name.toLowerCase().includes("newsletter") || s.name.toLowerCase().includes("đặc quyền"));

  const categories = [
    { id: "all", name: "Tất cả" },
    { id: "Bình hoa", name: "Bình hoa" },
    { id: "Hộp sơn mài", name: "Hộp sơn mài" },
    { id: "Đèn bàn", name: "Đèn bàn" },
    { id: "Khung ảnh", name: "Khung ảnh" },
    { id: "Trang sức", name: "Trang sức" },
  ];

  const defaultBestSellers: PageSectionItem[] = [
    {
      id: "prod-1",
      title: "Bình hoa Ondine dáng giọt nước",
      description: "Sơn mài bóng gương phủ màu ngọc bích thanh tao",
      value: "4.850.000 ₫",
      badge: "Bán chạy",
      image: "/images/hanoia/pick-box-ondine.webp",
    },
    {
      id: "prod-2",
      title: "Hộp sơn mài Nocturne khảm trứng",
      description: "Kỹ thuật cẩn vỏ trứng thủ công tinh tế bậc thầy",
      value: "3.450.000 ₫",
      badge: "Mới",
      image: "/images/hanoia/product-box-nocturne.webp",
    },
    {
      id: "prod-3",
      title: "Đèn bàn Prism đa giác mạ vàng",
      description: "Cấu trúc phản chiếu ánh sáng ấm cúng cho không gian",
      value: "6.900.000 ₫",
      badge: "Giới hạn",
      image: "/images/hanoia/pick-lamp-prism.webp",
    },
    {
      id: "prod-4",
      title: "Khung ảnh Bonbon viền đồng sang trọng",
      description: "Lưu giữ ký ức thanh lịch trên bàn làm việc",
      value: "1.850.000 ₫",
      badge: "Bán chạy",
      image: "/images/hanoia/pick-photoframe-bonbon.webp",
    },
  ];

  const sellerItems =
    bestSellers?.items && bestSellers.items.length > 0
      ? bestSellers.items
      : defaultBestSellers;

  const filteredProducts = sellerItems.filter((item) => {
    if (selectedCategory === "all") return true;
    return (
      item.title?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      item.description?.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  });

  const defaultTopPicks = [
    {
      id: "prism",
      num: "01",
      name: "BỘ SƯU TẬP PRISM",
      subtitle: "Hình học quang học phản chiếu ánh sáng đa chiều",
      image: "/images/hanoia/pick-lamp-prism.webp",
      items: [
        { title: "Đèn bàn Prism S", price: "4.850.000 ₫", image: "/images/hanoia/pick-lamp-prism.webp" },
        { title: "Hộp trà Prism", price: "2.650.000 ₫", image: "/images/hanoia/pick-teabox-prism.webp" },
      ],
    },
    {
      id: "ondine",
      num: "02",
      name: "BỘ SƯU TẬP ONDINE",
      subtitle: "Những đường uốn lượn mềm mại như dòng nước",
      image: "/images/hanoia/pick-box-ondine.webp",
      items: [
        { title: "Bình hoa Ondine L", price: "5.200.000 ₫", image: "/images/hanoia/pick-box-ondine.webp" },
        { title: "Khay sơn mài Ondine", price: "3.150.000 ₫", image: "/images/hanoia/product-tray-reverie.webp" },
      ],
    },
    {
      id: "bonbon",
      num: "03",
      name: "BỘ SƯU TẬP BONBON",
      subtitle: "Ngọt ngào, tươi trẻ và rực rỡ sắc màu đương đại",
      image: "/images/hanoia/pick-photoframe-bonbon.webp",
      items: [
        { title: "Khung ảnh Bonbon M", price: "1.950.000 ₫", image: "/images/hanoia/pick-photoframe-bonbon.webp" },
        { title: "Hộp mứt Bonbon", price: "2.800.000 ₫", image: "/images/hanoia/product-box-nocturne.webp" },
      ],
    },
  ];

  const defaultTimelineItems: PageSectionItem[] = [
    {
      id: "tm-1",
      value: "01 - 05",
      title: "Cốt mộc & Hom bó",
      description: "Định hình phôi gỗ quý và bó vải màn phủ hỗn hợp đất phù sa, mùn cưa và sơn sống.",
    },
    {
      id: "tm-2",
      value: "06 - 15",
      title: "Quét sơn then & Ủ ẩm",
      description: "Hàng chục lớp sơn then được quét tay và ủ trong buồng ẩm đặc biệt kiểm soát nhiệt độ.",
    },
    {
      id: "tm-3",
      value: "16 - 25",
      title: "Dát vàng, bạc & Khảm trứng",
      description: "Nghệ nhân dùng nhíp gắp từng mảnh vỏ trứng li ti và dát lá vàng quỳ theo họa tiết tinh xảo.",
    },
    {
      id: "tm-4",
      value: "26 - 33",
      title: "Thủy mài & Đánh bóng",
      description: "Mài liên tục dưới nước để màu sắc huyền bí lộ diện, sau đó đánh bóng bằng lòng bàn tay trần.",
    },
  ];

  const timelineItems =
    timeline?.items && timeline.items.length > 0
      ? timeline.items
      : defaultTimelineItems;

  const pressReviews = [
    {
      source: "ELLE DECORATION",
      quote: "Hanoia đã đưa nghệ thuật sơn mài cổ truyền của Việt Nam vươn tầm thế giới bằng ngôn ngữ thiết kế tối giản, tinh tế và đầy triết lý đương đại.",
      author: "Biên tập viên Thiết kế",
    },
    {
      source: "HARPER'S BAZAAR",
      quote: "Mỗi sản phẩm là một tuyệt tác thủ công đòi hỏi hàng trăm giờ kiên nhẫn. Sự xa xỉ đích thực không nằm ở hào nhoáng bề ngoài mà ở chiều sâu di sản.",
      author: "Chuyên mục Nghệ thuật sống",
    },
    {
      source: "ROBB REPORT VIETNAM",
      quote: "Sự kết hợp giữa nghệ nhân sơn mài Việt Nam và các nhà thiết kế lừng danh quốc tế như Pierre Charrié đã tái định nghĩa lại khái niệm đồ xa xỉ Á Đông.",
      author: "Đặc san Phong cách sống",
    },
  ];

  const lookbookPhotos = [
    { image: "/images/hanoia/pick-lamp-prism.webp", title: "Ánh sáng tĩnh tại", collection: "Prism Lighting" },
    { image: "/images/hanoia/pick-teabox-prism.webp", title: "Hương trà thanh khiết", collection: "Monument Tea Box" },
    { image: "/images/hanoia/pick-photoframe-bonbon.webp", title: "Lưu giữ ký ức", collection: "Bonbon Photo Frame" },
    { image: "/images/hanoia/product-tray-reverie.webp", title: "Trà đạo thượng lưu", collection: "Reverie Tray" },
  ];

  const perks = [
    { icon: Truck, title: "Vận chuyển toàn quốc", desc: "Miễn phí cho đơn hàng từ 2.000.000 ₫" },
    { icon: ShieldCheck, title: "Bảo hành chính hãng", desc: "12 tháng & hỗ trợ phục chế trọn đời" },
    { icon: Gift, title: "Quà tặng Bespoke", desc: "Khắc tên, khảm logo và hộp mạ vàng" },
    { icon: Sparkles, title: "Dịch vụ Concierge", desc: "Tư vấn riêng tư 1:1 qua hotline 1800 1234" },
  ];

  return (
    <div className="relative font-sans text-stone-900 bg-white dark:bg-neutral-950 dark:text-neutral-100">
      <StorefrontMiniAnnouncement />
      <StorefrontMiniHeader activeSlug="" isMobile={isMobile} />

      {/* 1. HERO BANNER SLIDER */}
      <section className={`relative group overflow-hidden ${isMobile ? "py-16 px-4" : "py-28 sm:py-44 px-6"} text-center text-white bg-neutral-950`}>
        {heroSlider && (
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(heroSlider.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối: {heroSlider.name}
            </button>
          </div>
        )}
        <Image
          src={heroSlider?.image || "/images/hanoia/hero-fw26.webp"}
          alt={heroSlider?.title || "Hero Hanoia"}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/40" />

        <div className="relative z-10 mx-auto max-w-3xl space-y-4">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A880]">
            <Sparkles className="h-4 w-4" />
            {heroSlider?.eyebrow || "KIỆT TÁC SƠN MÀI VIỆT NAM"}
          </p>
          <h1 className={`font-serif font-light uppercase tracking-wide leading-tight ${isMobile ? "text-2xl" : "text-3xl sm:text-5xl"}`}>
            {heroSlider?.title || "HANOIA · NGHỆ THUẬT SƠN MÀI THƯỢNG HẠNG"}
          </h1>
          <div className="mx-auto h-0.5 w-16 bg-[#C5A880]" />
          <p className="mx-auto max-w-2xl font-serif text-sm italic leading-relaxed text-neutral-200 sm:text-base font-light">
            &ldquo;{heroSlider?.body || "Gìn giữ tinh hoa thủ công truyền thống, kiến tạo vẻ đẹp phong cách sống đương đại."}&rdquo;
          </p>

          <div className="pt-4 flex justify-center gap-4">
            <span className="inline-flex items-center gap-2 rounded bg-[#C5A880] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-black shadow-lg">
              {heroSlider?.ctaLabel || "Khám phá bộ sưu tập"}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </section>

      {/* 2. BEST SELLERS SHOWCASE */}
      {bestSellers && (
        <section className={`bg-neutral-50 relative group ${isMobile ? "px-4 py-12" : "px-6 py-20"}`}>
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(bestSellers.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối: {bestSellers.name}
            </button>
          </div>
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-8 text-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880]">
                {bestSellers.eyebrow || "SẢN PHẨM TIÊU BIỂU"}
              </p>
              <h2 className={`font-serif uppercase tracking-wide text-foreground ${isMobile ? "text-2xl" : "text-3xl sm:text-4xl"}`}>
                {bestSellers.title || "Tác Phẩm Bán Chạy Nhất"}
              </h2>
              <div className="w-12 h-0.5 bg-[#C5A880] mx-auto my-3" />
              <p className="mx-auto max-w-xl text-xs font-light text-muted-foreground">
                {bestSellers.body || "Tuyển chọn những tuyệt tác sơn mài được yêu chuộng nhất bởi giới mộ điệu."}
              </p>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === cat.id
                        ? "bg-black text-white shadow-xs font-semibold"
                        : "bg-white text-neutral-600 border border-neutral-200 hover:border-black hover:text-black"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={`grid gap-5 ${isMobile ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="group/card overflow-hidden rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
                    <Image
                      src={prod.image || "/images/hanoia/pick-box-ondine.webp"}
                      alt={prod.title}
                      fill
                      sizes="350px"
                      className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                    />
                    {prod.badge && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#C5A880] px-2.5 py-0.5 text-[9px] font-bold text-black uppercase tracking-wider">
                        {prod.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-3.5 space-y-1">
                    <h3 className="font-serif text-sm font-semibold uppercase tracking-wide text-foreground line-clamp-1">
                      {prod.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 font-light">
                      {prod.description}
                    </p>
                    <p className="pt-1 text-sm font-bold text-[#C5A880]">
                      {prod.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. TOP PICKS / COLLECTIONS SHOWCASE */}
      {toppicks && (
        <section className={`bg-neutral-950 text-white relative group ${isMobile ? "px-4 py-12" : "px-6 py-20"}`}>
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(toppicks.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối: {toppicks.name}
            </button>
          </div>
          <div className="mx-auto max-w-[1280px]">
            <div className="text-center space-y-2 mb-12">
              <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
                {toppicks.eyebrow || "BỘ SƯU TẬP CHỦ ĐẠO"}
              </span>
              <h2 className={`font-serif uppercase tracking-wider font-light text-white ${isMobile ? "text-2xl" : "text-3xl sm:text-4xl"}`}>
                {toppicks.title || "PRISM · ONDINE · BONBON"}
              </h2>
              <div className="w-12 h-0.5 bg-[#C5A880] mx-auto my-3" />
              <p className="text-xs md:text-sm text-neutral-400 font-light max-w-lg mx-auto">
                {toppicks.body || "Mỗi bộ sưu tập là một cuộc đối thoại giữa triết lý mỹ thuật phương Đông và hình khối tân tiến phương Tây."}
              </p>
            </div>

            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
              {defaultTopPicks.map((col) => (
                <div
                  key={col.id}
                  className="group/pick bg-[#141417] border border-neutral-800 rounded-xl overflow-hidden p-5 flex flex-col justify-between hover:border-[#C5A880]/50 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                      <span className="font-serif text-2xl font-light text-[#C5A880]">{col.num}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">{col.name}</span>
                    </div>
                    <div className="relative aspect-video my-4 rounded-lg overflow-hidden bg-neutral-900">
                      <Image
                        src={col.image}
                        alt={col.name}
                        fill
                        sizes="400px"
                        className="object-cover group-hover/pick:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <p className="text-xs text-neutral-400 font-light leading-relaxed">
                      {col.subtitle}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center justify-between text-xs text-[#C5A880] font-semibold">
                    <span>Xem tác phẩm</span>
                    <ArrowUpRight className="w-4 h-4 group-hover/pick:translate-x-0.5 group-hover/pick:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. FURNITURE & FASHION LIFESTYLE */}
      {lifestyle && (
        <section className={`bg-white relative group ${isMobile ? "px-4 py-12" : "px-6 py-20"}`}>
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(lifestyle.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối: {lifestyle.name}
            </button>
          </div>
          <div className="mx-auto max-w-[1280px] space-y-10">
            {/* Furniture Banner */}
            <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-xl bg-neutral-100 group/banner">
              <Image
                src="/images/hanoia/furniture-main.webp"
                alt="Nội thất Hanoia"
                fill
                sizes="1280px"
                className="object-cover group-hover/banner:scale-103 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 text-white max-w-xl space-y-2">
                <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
                  NGHỆ THUẬT SỐNG & NỘI THẤT
                </span>
                <h3 className={`font-serif font-light uppercase tracking-wide ${isMobile ? "text-xl" : "text-3xl"}`}>
                  BÀN CONSOLE & BÀN TRÀ SƠN MÀI
                </h3>
                <p className="text-xs md:text-sm text-neutral-200 font-light leading-relaxed">
                  Từ những chiếc bàn console phủ bóng gương sâu thẳm đến những chiếc ghế bọc lụa thượng hạng, Hanoia mang vẻ đẹp xa xỉ vào không gian sống thượng lưu.
                </p>
                <div className="pt-3">
                  <span className="inline-flex items-center gap-2 rounded bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[1.5px] text-black">
                    Khám phá nội thất
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Silk Fashion Banner */}
            <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-xl bg-neutral-100 group/banner">
              <Image
                src="/images/hanoia/heritage-creativity.webp"
                alt="Thời trang lụa Lãnh Mỹ A"
                fill
                sizes="1280px"
                className="object-cover group-hover/banner:scale-103 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 text-white max-w-xl space-y-2">
                <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
                  THỜI TRANG & LỤA LÃNH MỸ A
                </span>
                <h3 className={`font-serif font-light uppercase tracking-wide ${isMobile ? "text-xl" : "text-3xl"}`}>
                  HUYỀN THOẠI LỤA ĐEN TÂN CHÂU
                </h3>
                <p className="text-xs md:text-sm text-neutral-200 font-light leading-relaxed">
                  Sự kết hợp độc bản giữa sắc đen huyền thoại của lụa nhuộm mặc nưa thủ công và những đường nét sơn mài hiện đại.
                </p>
                <div className="pt-3">
                  <span className="inline-flex items-center gap-2 rounded bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[1.5px] text-black">
                    Khám phá thời trang
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. CRAFTSMANSHIP TIMELINE */}
      {timeline && (
        <section className={`bg-[#F8F7F4] relative group ${isMobile ? "px-4 py-12" : "px-6 py-20"}`}>
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(timeline.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối: {timeline.name}
            </button>
          </div>
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto mb-12 max-w-xl text-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880]">
                {timeline.eyebrow || "KỸ NGHỆ ĐỘC BẢN"}
              </p>
              <h2 className={`font-serif uppercase tracking-wide text-foreground ${isMobile ? "text-2xl" : "text-3xl sm:text-4xl"}`}>
                {timeline.title || "HÀNH TRÌNH 33 CÔNG ĐOẠN TẠO NÊN TUYỆT TÁC"}
              </h2>
              <div className="w-12 h-0.5 bg-[#C5A880] mx-auto my-3" />
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                {timeline.body || "Người nghệ nhân phải kiên nhẫn làm việc từ 45 đến 90 ngày với từng lớp đất phù sa, vải màn, sơn then tự nhiên và thủy mài dưới dòng nước trong vắt."}
              </p>
            </div>

            <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-4 gap-6"}`}>
              {timelineItems.map((step) => (
                <article
                  key={step.id}
                  className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-shadow"
                >
                  <span className="block font-serif text-3xl font-light text-[#C5A880]">
                    {step.value}
                  </span>
                  <h3 className="mt-3 font-serif text-sm font-semibold uppercase tracking-wide text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-light">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. HERITAGE BRAND STORY */}
      {heritage && (
        <section className={`mx-auto max-w-[1280px] relative group ${isMobile ? "px-4 py-12" : "px-6 py-20"}`}>
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(heritage.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối: {heritage.name}
            </button>
          </div>
          <div className={isMobile ? "flex flex-col gap-6" : "grid items-center gap-12 lg:grid-cols-12"}>
            <div className={`relative aspect-[4/3] overflow-hidden rounded-xl shadow-xl bg-neutral-100 ${isMobile ? "w-full" : "lg:col-span-6"}`}>
              <Image
                src={heritage.image || "/images/hanoia/heritage-craft.webp"}
                alt={heritage.title || "Di sản Hanoia"}
                fill
                sizes="600px"
                className="object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black/85 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-[#C5A880]">
                Since 1997 · Tinh hoa thủ công Việt Nam
              </div>
            </div>
            <div className={`space-y-4 ${isMobile ? "w-full" : "lg:col-span-6"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880]">
                {heritage.eyebrow || "DI SẢN NGHỆ NHÂN VIỆT"}
              </p>
              <h2 className={`font-serif uppercase tracking-wide text-foreground leading-snug ${isMobile ? "text-2xl" : "text-3xl"}`}>
                {heritage.title || "GÌN GIỮ TINH HOA SƠN MÀI TỪ NĂM 1997"}
              </h2>
              <div className="w-12 h-0.5 bg-[#C5A880]" />
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground font-light">
                {heritage.body || "Khởi đầu từ xưởng thủ công mỹ nghệ tại làng nghề Bình Dương trứ danh, Hanoia không ngừng chinh phục những tiêu chuẩn khắt khe nhất của các nhà mốt Haute Couture quốc tế trước khi trở thành biểu tượng phong cách sống cao cấp của Việt Nam."}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[1.5px] text-[#C5A880] hover:underline cursor-pointer">
                  {heritage.ctaLabel || "Đọc câu chuyện di sản"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. PRESS & MEDIA REVIEWS */}
      {press && (
        <section className={`bg-white border-t border-neutral-200 relative group ${isMobile ? "px-4 py-12" : "px-6 py-20"}`}>
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(press.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối: {press.name}
            </button>
          </div>
          <div className="mx-auto max-w-[1280px]">
            <div className="text-center space-y-2 mb-12">
              <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
                {press.eyebrow || "TIẾNG VANG QUỐC TẾ"}
              </span>
              <h2 className={`font-serif font-light uppercase tracking-wide ${isMobile ? "text-2xl" : "text-3xl"}`}>
                {press.title || "ĐƯỢC VINH DANH TRÊN TRUYỀN THÔNG QUỐC TẾ"}
              </h2>
            </div>

            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
              {pressReviews.map((rev) => (
                <div
                  key={rev.source}
                  className="bg-[#F8F7F4] border border-neutral-200 p-7 rounded-xl flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                >
                  <Quote className="w-8 h-8 text-[#C5A880]" />
                  <p className="font-serif italic text-xs md:text-sm text-neutral-800 leading-relaxed font-light">
                    &ldquo;{rev.quote}&rdquo;
                  </p>
                  <div className="pt-4 border-t border-neutral-300">
                    <p className="text-xs font-bold uppercase tracking-[2px] text-black">
                      {rev.source}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                      {rev.author}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. LOOKBOOK GALLERY */}
      {lookbook && (
        <section className={`bg-white border-t border-neutral-200 relative group ${isMobile ? "px-4 py-12" : "px-6 py-20"}`}>
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(lookbook.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối: {lookbook.name}
            </button>
          </div>
          <div className="mx-auto max-w-[1280px]">
            <div className="text-center space-y-2 mb-12">
              <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold flex items-center justify-center space-x-1.5">
                <Camera className="w-4 h-4" />
                <span>{lookbook.eyebrow || "PHONG CÁCH SỐNG THƯỢNG LƯU"}</span>
              </span>
              <h2 className={`font-serif font-light uppercase tracking-wide ${isMobile ? "text-2xl" : "text-3xl"}`}>
                {lookbook.title || "KHÔNG GIAN NGHỆ THUẬT HANOIA"}
              </h2>
              <p className="text-xs text-neutral-500 font-light max-w-md mx-auto">
                {lookbook.body || "Chiêm ngưỡng những tác phẩm sơn mài được sắp đặt hài hòa trong các biệt thự và căn hộ sang trọng bậc nhất."}
              </p>
            </div>

            <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
              {lookbookPhotos.map((photo, i) => (
                <div
                  key={i}
                  className="group/photo relative aspect-square rounded-xl overflow-hidden bg-neutral-100 shadow-xs"
                >
                  <Image
                    src={photo.image}
                    alt={photo.title}
                    fill
                    sizes="350px"
                    className="object-cover group-hover/photo:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white">
                    <span className="text-[10px] uppercase tracking-wider text-[#C5A880]">{photo.collection}</span>
                    <h4 className="font-serif text-xs font-semibold uppercase">{photo.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. VIP PRIVILEGES & NEWSLETTER */}
      {newsletter && (
        <section className={`bg-black text-white border-t border-neutral-900 relative group ${isMobile ? "px-4 py-12" : "px-6 py-20"}`}>
          <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditSection(newsletter.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl border border-stone-700 hover:bg-stone-800 cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Sửa khối: {newsletter.name}
            </button>
          </div>
          <div className="mx-auto max-w-[1280px]">
            {/* Perks Grid */}
            <div className={`grid gap-6 pb-12 border-b border-neutral-800 ${isMobile ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
              {perks.map((perk, pIdx) => {
                const Icon = perk.icon;
                return (
                  <div key={pIdx} className="flex flex-col items-center text-center space-y-2 p-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#C5A880] mb-1">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold tracking-wider uppercase font-serif text-white">
                      {perk.title}
                    </h4>
                    <p className="text-[11px] text-neutral-400 font-light max-w-xs leading-relaxed">
                      {perk.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Newsletter Input Box */}
            <div className="pt-12 text-center max-w-xl mx-auto space-y-4">
              <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
                {newsletter.eyebrow || "HANOIA CONCIERGE & PRIVILEGES"}
              </span>
              <h3 className={`font-serif uppercase tracking-wide text-white ${isMobile ? "text-xl" : "text-2xl sm:text-3xl"}`}>
                {newsletter.title || "NHẬN ĐẶC QUYỀN VÀ BỘ SƯU TẬP GIỚI HẠN"}
              </h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                {newsletter.body || "Đăng ký để là người đầu tiên thưởng lãm các bộ sưu tập độc bản và nhận lời mời tham dự các triển lãm nghệ thuật riêng tư của Hanoia."}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Nhập địa chỉ email của quý khách..."
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#C5A880]"
                />
                <button
                  type="button"
                  className="bg-[#C5A880] text-black px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#d6bc96] transition-colors"
                >
                  {newsletter.ctaLabel || "Đăng ký"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <StorefrontMiniFooter isMobile={isMobile} />
    </div>
  );
}

/**
 * ============================================================================
 * GENERIC DYNAMIC STOREFRONT PREVIEW (FOR CUSTOM CREATED PAGES)
 * ============================================================================
 */
function GenericStorefrontPreview({
  page,
  onEditSection,
  isMobile = false,
}: {
  page: PageContent;
  onEditSection: (sectionId: string) => void;
  isMobile?: boolean;
}) {
  const enabledSections = page.sections.filter((s) => s.enabled);

  return (
    <div className="relative font-sans text-stone-900 bg-white dark:bg-neutral-950 dark:text-neutral-100">
      <StorefrontMiniAnnouncement />
      <StorefrontMiniHeader activeSlug={page.slug} isMobile={isMobile} />

      <main className="space-y-0">
        {enabledSections.map((section) => (
          <div key={section.id} className="group relative">
            <div className="absolute right-4 top-4 z-40 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onEditSection(section.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-[#C5A880] shadow-xl backdrop-blur-md hover:bg-black cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                Sửa khối này: {section.name}
              </button>
            </div>

            <section className={`mx-auto max-w-[1280px] ${isMobile ? "px-4 py-10" : "px-6 py-16 sm:py-24"} text-center`}>
              {section.eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880] mb-2">
                  {section.eyebrow}
                </p>
              )}
              <h2 className={`font-serif uppercase tracking-wide mb-4 ${isMobile ? "text-2xl" : "text-3xl"}`}>
                {section.title}
              </h2>
              <div className="w-16 h-0.5 bg-[#C5A880] mx-auto mb-4" />
              <p className="max-w-2xl mx-auto text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {section.body}
              </p>
            </section>
          </div>
        ))}
      </main>

      <StorefrontMiniFooter isMobile={isMobile} />
    </div>
  );
}

/**
 * ============================================================================
 * MAIN CLIENT STOREFRONT PREVIEW CONTROLLER
 * ============================================================================
 */
export default function ClientStorefrontPreview({
  page,
  onEditSection,
  isMobile = false,
}: {
  page: PageContent;
  onEditSection: (sectionId: string) => void;
  isMobile?: boolean;
}) {
  if (page.slug === "contact") {
    return <ContactStorefrontPreview page={page} onEditSection={onEditSection} isMobile={isMobile} />;
  }
  if (page.slug === "stores") {
    return <StoresStorefrontPreview page={page} onEditSection={onEditSection} isMobile={isMobile} />;
  }
  if (page.slug === "policies") {
    return <PoliciesStorefrontPreview page={page} onEditSection={onEditSection} isMobile={isMobile} />;
  }
  if (page.slug === "heritage") {
    return <HeritageStorefrontPreview page={page} onEditSection={onEditSection} isMobile={isMobile} />;
  }
  if (page.slug === "" || page.slug === "home") {
    return <HomeStorefrontPreview page={page} onEditSection={onEditSection} isMobile={isMobile} />;
  }
  return <GenericStorefrontPreview page={page} onEditSection={onEditSection} isMobile={isMobile} />;
}
