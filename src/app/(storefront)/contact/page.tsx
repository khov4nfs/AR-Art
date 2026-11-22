"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import StorefrontBreadcrumb from "@/components/hanoia/StorefrontBreadcrumb";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";

import type { PageContent, PageSectionItem } from "@/lib/store";

export default function ContactPage() {
  const { showToast } = useCart();
  const { settings } = useSettings();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Tư vấn Classic Flowers");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState("Liên hệ");
  const [eyebrow, setEyebrow] = useState("Liên hệ");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroBody, setHeroBody] = useState("");
  const [infoTitle, setInfoTitle] = useState("Thông Tin Trực Tuyến");
  const [infoSubtitle, setInfoSubtitle] = useState("Kết nối với chúng tôi qua các kênh hỗ trợ chính thức");
  const [infoItems, setInfoItems] = useState<PageSectionItem[]>([]);
  const [formTitle, setFormTitle] = useState("Gửi Lời Nhắn Trực Tiếp");
  const [formSubtitle, setFormSubtitle] = useState("Vui lòng để lại thông tin để được tư vấn viên hỗ trợ chu đáo nhất");
  const [subjectsList, setSubjectsList] = useState<string[]>([
    "Tư vấn Classic Flowers",
    "Themed Collection",
    "Bespoke Flowers",
    "Theo dõi đơn hàng",
    "Hàng vỡ khi giao",
    "Chủ đề khác",
  ]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pages", { signal: controller.signal, cache: "no-store" })
      .then((r) => r.json() as Promise<{ data?: PageContent[] }>)
      .then((result) => {
        const page = result.data?.find((item) => item.slug === "contact");
        if (page?.status !== "published") return;
        setPageTitle(page.title);

        const headerSec = page.sections.find((s) => s.id === "contact-header" || s.type === "hero");
        if (headerSec && headerSec.enabled) {
          if (headerSec.eyebrow) setEyebrow(headerSec.eyebrow);
          if (headerSec.title) setHeroTitle(headerSec.title);
          if (headerSec.body) setHeroBody(headerSec.body);
        }

        const infoSec = page.sections.find((s) => s.id === "contact-info" || s.type === "contact");
        if (infoSec && infoSec.enabled) {
          if (infoSec.title) setInfoTitle(infoSec.title);
          if (infoSec.body) setInfoSubtitle(infoSec.body);
          if (infoSec.items?.length) setInfoItems(infoSec.items);
        }

        const formSec = page.sections.find((s) => s.id === "contact-form" || s.type === "feature");
        if (formSec && formSec.enabled) {
          if (formSec.title) setFormTitle(formSec.title);
          if (formSec.body) setFormSubtitle(formSec.body);
          if (formSec.items?.length) {
            setSubjectsList(formSec.items.map((it) => it.title || it.value || "Tư vấn"));
          }
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          console.error("Không thể tải trang liên hệ", error);
      });
    return () => controller.abort();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      showToast("Vui lòng điền đủ họ tên, email và nội dung tin nhắn");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      showToast("Tin nhắn của quý khách đã được gửi thành công!");
    }, 800);
  };

  const brandName = settings.siteName || "EVERIE";

  const defaultInfoItems: PageSectionItem[] = [
    {
      id: "phone",
      title: "Điện thoại",
      value: settings.hotline || "0908 188 188",
      description: `(${settings.workingHours || "9:00 - 18:00"})`,
    },
    {
      id: "email",
      title: "Email",
      value: settings.email || "hello@everie.vn",
      description: "Classic, Themed, Bespoke và tra cứu đơn",
    },
    {
      id: "address",
      title: "Xưởng Thanh Hà",
      value: "Làng gốm Thanh Hà, Hội An",
      description: "Không chuỗi showroom. Đặt hàng trên website.",
    },
    {
      id: "hours",
      title: "Giờ làm việc",
      value: settings.workingHours || "9:00 - 18:00",
      description: "Thứ 2 – Thứ 7",
    },
  ];

  const activeItems = infoItems.length > 0 ? infoItems : defaultInfoItems;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-neutral-100 transition-colors duration-300">
      <Header />

      <main className="flex-1 py-8 md:py-16 px-4 md:px-8 max-w-[1360px] mx-auto w-full">
        {/* Breadcrumb */}
        <StorefrontBreadcrumb current={pageTitle} className="mb-8" />

        {/* Section Header */}
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold flex items-center justify-center space-x-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{eyebrow}</span>
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-light uppercase tracking-wide text-black dark:text-neutral-100">
            {heroTitle || `LIÊN HỆ VỚI ${brandName.toUpperCase()}`}
          </h1>
          <div className="w-16 h-0.5 bg-[#C5A880] mx-auto" />
          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-light max-w-xl mx-auto leading-relaxed pt-2">
            {heroBody ||
              `Tư vấn Classic, Themed, Bespoke hoặc tra cứu đơn ${brandName}.`}
          </p>
        </div>

        {/* Contact Layout Grid: Info (5 cols) + Form (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">
          {/* Left: Contact Info Side */}
          <div className="lg:col-span-5 bg-[#F8F7F4] border border-neutral-200 rounded-xs p-6 md:p-8 space-y-6">
            <div className="border-b border-neutral-300 pb-4">
              <h2 className="text-xl font-serif font-normal uppercase tracking-wide text-black">
                {infoTitle}
              </h2>
              <p className="text-xs text-neutral-500 font-light mt-1">
                {infoSubtitle}
              </p>
            </div>

            <div className="space-y-4 text-xs text-neutral-700 font-light">
              {activeItems.map((item, index) => {
                const id = item.id.toLowerCase();
                const Icon =
                  id.includes("phone") || id.includes("c-phone")
                    ? Phone
                    : id.includes("mail") || id.includes("c-mail") || id.includes("email")
                      ? Mail
                      : id.includes("hour") || id.includes("clock")
                        ? Clock
                        : MapPin;

                return (
                  <div key={item.id} className="flex items-start space-x-3.5">
                    <Icon className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-black block font-medium">
                        {item.title}
                      </strong>
                      {index === 0 ? (
                        <a
                          href={`tel:${(item.value || "").replace(/\s+/g, "")}`}
                          className="text-sm font-semibold hover:text-[#C5A880] transition-colors"
                        >
                          {item.value}
                        </a>
                      ) : index === 1 ? (
                        <a
                          href={`mailto:${item.value || ""}`}
                          className="hover:underline font-medium"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-medium text-black">{item.value}</p>
                      )}
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

            {(settings.facebookUrl ||
              settings.instagramUrl ||
              settings.tiktokUrl) && (
              <div className="pt-2 border-t border-neutral-300 space-y-3">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-black">
                  Facebook · Instagram · TikTok
                </p>
                <div className="flex flex-wrap gap-3">
                  {settings.facebookUrl && (
                    <a
                      href={settings.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium hover:text-[#C5A880] transition-colors"
                    >
                      Facebook
                    </a>
                  )}
                  {settings.instagramUrl && (
                    <a
                      href={settings.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium hover:text-[#C5A880] transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                  {settings.tiktokUrl && (
                    <a
                      href={settings.tiktokUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium hover:text-[#C5A880] transition-colors"
                    >
                      TikTok
                    </a>
                  )}
                </div>
                <Link
                  href="/lookup"
                  className="text-xs uppercase tracking-wider font-semibold text-black hover:text-[#C5A880] transition-colors inline-block"
                >
                  Tra cứu đơn
                </Link>
              </div>
            )}
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xs p-6 md:p-10 shadow-xs">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-serif font-normal uppercase tracking-wide text-black">
                  Cảm Ơn Quý Khách!
                </h3>
                <p className="text-xs md:text-sm text-neutral-600 font-light max-w-md mx-auto leading-relaxed">
                  Thông điệp đã gửi tới {brandName}. Chúng tôi phản hồi trong
                  giờ làm việc. Bespoke vui lòng dùng form riêng trên /bespoke.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setEmail("");
                      setPhone("");
                      setMessage("");
                    }}
                    className="px-6 py-2.5 bg-black text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#C5A880] transition-colors"
                  >
                    Gửi tin nhắn khác
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-serif font-normal uppercase tracking-wide text-black">
                    {formTitle}
                  </h2>
                  <p className="text-xs text-neutral-500 font-light mt-1">
                    {formSubtitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1.5">
                        Họ và tên của quý khách *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nguyễn Văn An"
                        required
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xs focus:outline-hidden focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1.5">
                        Số điện thoại liên hệ *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0908 123 456"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xs focus:outline-hidden focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1.5">
                        Địa chỉ Email *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xs focus:outline-hidden focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1.5">
                        Chủ đề cần tư vấn
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xs focus:outline-hidden focus:border-black"
                      >
                        {subjectsList.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1.5">
                      Nội dung tin nhắn hoặc yêu cầu cụ thể *
                    </label>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Mô tả loài hoa, màu men, chữ khắc, hoặc mã đơn cần tra cứu..."
                      required
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xs focus:outline-hidden focus:border-black"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto px-8 py-3.5 bg-black text-white text-xs uppercase tracking-[2px] font-semibold hover:bg-[#C5A880] transition-colors rounded-xs shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{loading ? "Đang gửi đi..." : "Gửi lời nhắn"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
