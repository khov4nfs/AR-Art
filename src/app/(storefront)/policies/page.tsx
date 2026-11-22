"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Lock,
  ChevronRight,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import StorefrontBreadcrumb from "@/components/hanoia/StorefrontBreadcrumb";
import { useSettings } from "@/context/SettingsContext";

function PoliciesContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "shipping";
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [pageTitle, setPageTitle] = useState("Chính sách & Hỗ trợ");
  const [eyebrow, setEyebrow] = useState("Hỗ trợ khách hàng");
  const [heroTitle, setHeroTitle] = useState("Trung tâm chính sách & dịch vụ");
  const [heroBody, setHeroBody] = useState(
    "Làm theo đơn, giao theo khoảng ngày chế tác, đóng gói chống vỡ cho hoa gốm EVERIE.",
  );
  const [cmsTabs, setCmsTabs] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pages", { signal: controller.signal, cache: "no-store" })
      .then((r) =>
        r.json() as Promise<{
          data?: {
            slug: string;
            title: string;
            status: string;
            sections: {
              type: string;
              enabled: boolean;
              eyebrow: string;
              title: string;
              body: string;
              items: { id: string; title: string }[];
            }[];
          }[];
        }>,
      )
      .then((result) => {
        const page = result.data?.find((item) => item.slug === "policies");
        if (page?.status !== "published") return;
        setPageTitle(page.title);
        const hero = page.sections.find((s) => s.type === "hero" && s.enabled);
        if (hero) {
          if (hero.eyebrow) setEyebrow(hero.eyebrow);
          if (hero.title) setHeroTitle(hero.title);
          if (hero.body) setHeroBody(hero.body);
        }
        const list = page.sections.find(
          (s) => s.type === "process" && s.enabled && s.items?.length,
        );
        if (list?.items?.length) {
          setCmsTabs(
            list.items.map((item) => ({ id: item.id, label: item.title })),
          );
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          console.error("Không thể tải trang chính sách", error);
      });
    return () => controller.abort();
  }, []);

  const defaultTabs = [
    { id: "shipping", label: "Giao hàng", icon: Truck },
    { id: "returns", label: "Đổi trả & hàng vỡ", icon: RotateCcw },
    { id: "warranty", label: "Bảo hành", icon: ShieldCheck },
    { id: "care", label: "Bảo quản hoa gốm", icon: Sparkles },
    { id: "privacy", label: "Bảo mật", icon: Lock },
  ];

  const tabs = defaultTabs.map((tab) => {
    const fromCms = cmsTabs.find((item) => item.id === tab.id);
    return fromCms ? { ...tab, label: fromCms.label } : tab;
  });

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-8 py-8 md:py-16">
      {/* Breadcrumb */}
      <StorefrontBreadcrumb current={pageTitle} className="mb-8" />

      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6 mb-10 space-y-2">
        <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
          {eyebrow}
        </span>
        <h1 className="text-2xl md:text-4xl font-serif font-normal uppercase tracking-wide text-black dark:text-neutral-100">
          {heroTitle}
        </h1>
        <p className="text-xs md:text-sm text-neutral-500 font-light max-w-xl">
          {heroBody}
        </p>
      </div>

      {/* Main Grid: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-xs overflow-hidden shadow-xs sticky top-24">
          <div className="p-4 bg-[#F8F7F4] border-b border-neutral-200">
            <span className="text-[11px] uppercase tracking-widest font-semibold text-neutral-600">
              Danh mục hỗ trợ
            </span>
          </div>

          <nav className="divide-y divide-neutral-100 text-xs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
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
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })}
          </nav>

          {/* Quick Contact Box */}
          <div className="p-5 bg-neutral-50 border-t border-neutral-200 space-y-2 text-xs text-neutral-600">
            <p className="font-semibold text-black uppercase tracking-wider text-[11px]">
              Cần hỗ trợ trực tiếp?
            </p>
            <p className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>
                Hotline: <strong>{settings.hotline || "0908 188 188"}</strong>{" "}
                (Miễn phí)
              </span>
            </p>
            <p className="flex items-center space-x-2">
              <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>
                Email: <strong>{settings.email || "hello@everie.vn"}</strong>
              </span>
            </p>
          </div>
        </div>

        {/* Tab Content Panel (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-xs p-6 md:p-10 shadow-xs">
          {activeTab === "shipping" && (
            <div className="space-y-6 animate-fade-in text-xs md:text-sm text-neutral-700 leading-relaxed font-light">
              <div className="border-b border-neutral-200 pb-4">
                <span className="text-[10px] uppercase tracking-[3px] text-[#C5A880] font-semibold">
                  Chế tác rồi giao
                </span>
                <h2 className="text-xl md:text-2xl font-serif font-normal uppercase tracking-wide text-black mt-1">
                  Giao hàng hoa gốm
                </h2>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-black">
                  1. Thời gian chế tác
                </h3>
                <p>
                  Hoa gốm EVERIE làm theo đơn, không giữ sẵn kho. Classic{" "}
                  <strong>14–21 ngày</strong>, Themed{" "}
                  <strong>21–28 ngày</strong>, Bespoke{" "}
                  <strong>30–45 ngày</strong> sau khi xác nhận (Bespoke: sau khi
                  duyệt thiết kế và thanh toán).
                </p>

                <h3 className="text-sm font-semibold uppercase tracking-wider text-black pt-2">
                  2. Vận chuyển
                </h3>
                <p>
                  Sau khi hoàn thiện, đơn được đóng gói và giao trong{" "}
                  <strong>2–5 ngày</strong> làm việc trên toàn quốc. Tổng thời
                  gian nhận hàng = ngày chế tác + 2–5 ngày giao.{" "}
                  <strong>Miễn phí vận chuyển toàn quốc</strong>.
                </p>

                <h3 className="text-sm font-semibold uppercase tracking-wider text-black pt-2">
                  3. Đóng gói chống vỡ
                </h3>
                <p>
                  Gốm dễ vỡ. Mỗi đóa được bọc foam, đặt hộp cứng, chèn giấy.
                  Email giao hàng nhắc quay video lúc mở hộp — video này dùng
                  khi khiếu nại hàng vỡ.
                </p>
              </div>
            </div>
          )}

          {activeTab === "returns" && (
            <div className="space-y-6 animate-fade-in text-xs md:text-sm text-neutral-700 leading-relaxed font-light">
              <div className="border-b border-neutral-200 pb-4">
                <span className="text-[10px] uppercase tracking-[3px] text-[#C5A880] font-semibold">
                  Hàng cá nhân hóa & hàng vỡ
                </span>
                <h2 className="text-xl md:text-2xl font-serif font-normal uppercase tracking-wide text-black mt-1">
                  Đổi trả và hàng vỡ khi giao
                </h2>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-black">
                  1. Hoa đã khắc chữ
                </h3>
                <p>
                  Đơn có khắc tên, chữ hoặc ký hiệu là hàng{" "}
                  <strong>cá nhân hóa</strong>. Không đổi, không trả vì đổi ý
                  sau khi đơn đã xác nhận. Vui lòng đọc lại chữ khắc trước khi
                  thanh toán.
                </p>

                <h3 className="text-sm font-semibold uppercase tracking-wider text-black pt-2">
                  2. Hàng vỡ, nứt, mẻ khi nhận
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Quay <strong>video mở hộp</strong> liên tục, thấy tem và
                    tình trạng hoa.
                  </li>
                  <li>
                    Gửi video, mã đơn và ảnh chi tiết trong{" "}
                    <strong>48 giờ</strong> qua email{" "}
                    <strong>{settings.email || "hello@everie.vn"}</strong> hoặc
                    hotline {settings.hotline || "0908 188 188"}.
                  </li>
                  <li>
                    {settings.siteName || "EVERIE"} làm lại hoặc hoàn tiền phần
                    hoa bị vỡ khi video xác nhận lỗi lúc giao.
                  </li>
                </ul>

                <h3 className="text-sm font-semibold uppercase tracking-wider text-black pt-2">
                  3. Hoa chưa khắc
                </h3>
                <p>
                  Đơn Classic/Themed chưa khắc chữ, còn nguyên hộp, chưa sử
                  dụng: liên hệ trong 7 ngày để được hướng dẫn đổi size hoặc
                  loài hoa còn làm được — tùy phôi đang có tại xưởng.
                </p>
              </div>
            </div>
          )}

          {activeTab === "warranty" && (
            <div className="space-y-6 animate-fade-in text-xs md:text-sm text-neutral-700 leading-relaxed font-light">
              <div className="border-b border-neutral-200 pb-4">
                <span className="text-[10px] uppercase tracking-[3px] text-[#C5A880] font-semibold">
                  Men và dáng hoa
                </span>
                <h2 className="text-xl md:text-2xl font-serif font-normal uppercase tracking-wide text-black mt-1">
                  Bảo hành hoa gốm
                </h2>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-black">
                  1. Thời hạn
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xs text-center space-y-1">
                    <span className="text-2xl font-serif font-bold text-[#C5A880]">
                      12 Tháng
                    </span>
                    <p className="text-[11px] font-semibold uppercase text-neutral-600">
                      Lỗi men, nứt nung
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      Lỗi kỹ thuật từ xưởng
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xs text-center space-y-1">
                    <span className="text-2xl font-serif font-bold text-black">
                      Không BH
                    </span>
                    <p className="text-[11px] font-semibold uppercase text-neutral-600">
                      Rơi, va đập, ngâm nước
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      Gốm dễ vỡ khi sử dụng sai
                    </p>
                  </div>
                </div>

                <h3 className="text-sm font-semibold uppercase tracking-wider text-black pt-3">
                  2. Phạm vi
                </h3>
                <p>
                  Bảo hành lỗi men bong, nứt do nung, lệch dáng so với mẫu đã
                  duyệt (Bespoke). Không bảo hành trầy xước, rơi vỡ sau khi nhận
                  hàng, hay đổi ý về chữ khắc.
                </p>
                <p>
                  Màu men trên màn hình gần đúng màu sau nung, không phải bản
                  khớp tuyệt đối — đây không phải lỗi bảo hành.
                </p>
              </div>
            </div>
          )}

          {activeTab === "care" && (
            <div className="space-y-6 animate-fade-in text-xs md:text-sm text-neutral-700 leading-relaxed font-light">
              <div className="border-b border-neutral-200 pb-4">
                <span className="text-[10px] uppercase tracking-[3px] text-[#C5A880] font-semibold">
                  Men đá, không sơn mài
                </span>
                <h2 className="text-xl md:text-2xl font-serif font-normal uppercase tracking-wide text-black mt-1">
                  Bảo quản hoa gốm
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  Hoa EVERIE là gốm nung, men đá. Không đánh bóng sơn mài, không
                  dầu bóng đồ gỗ, không sáp. Lau bụi và đặt chắc là đủ.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-black font-medium block">
                        Lau khô, khăn mềm:
                      </strong>
                      <span>
                        Khăn cotton hoặc microfiber. Không bùi nhùi, không hóa
                        chất tẩy, không cồn.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-black font-medium block">
                        Tránh rơi và va đập:
                      </strong>
                      <span>
                        Cánh hoa và đế dễ mẻ. Đặt trên mặt phẳng, xa mép bàn, xa
                        trẻ nhỏ và thú cưng.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-black font-medium block">
                        Không ngâm nước, không lò:
                      </strong>
                      <span>
                        Không cắm nước như hoa tươi trừ khi mô tả sản phẩm cho
                        phép. Không lò vi sóng, không máy rửa bát.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-6 animate-fade-in text-xs md:text-sm text-neutral-700 leading-relaxed font-light">
              <div className="border-b border-neutral-200 pb-4">
                <span className="text-[10px] uppercase tracking-[3px] text-[#C5A880] font-semibold">
                  An toàn thông tin
                </span>
                <h2 className="text-xl md:text-2xl font-serif font-normal uppercase tracking-wide text-black mt-1">
                  Chính Sách Bảo Mật & Quyền Riêng Tư
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  {settings.siteName || "EVERIE"} giữ thông tin đơn hàng, khắc
                  chữ và thanh toán chỉ để hoàn thành hoa gốm và chăm sóc sau
                  giao. Không bán dữ liệu cho bên thứ ba.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Mã hóa SSL 256-bit:</strong> Tất cả giao dịch thanh
                    toán trực tuyến qua thẻ tín dụng và ví điện tử đều được mã
                    hóa an toàn qua cổng thanh toán được cấp phép bởi Ngân hàng
                    Nhà nước.
                  </li>
                  <li>
                    <strong>Bảo mật danh tính:</strong> Không tiết lộ hay thương
                    mại hóa thông tin khách hàng cho bất kỳ bên thứ ba nào khi
                    chưa có sự đồng ý của quý khách.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-neutral-100 transition-colors duration-300">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="py-24 text-center text-xs uppercase tracking-widest text-neutral-400">
              Đang tải nội dung chính sách...
            </div>
          }
        >
          <PoliciesContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
