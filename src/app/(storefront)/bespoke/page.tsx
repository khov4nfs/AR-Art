"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import StorefrontBreadcrumb from "@/components/hanoia/StorefrontBreadcrumb";
import { useLanguage } from "@/context/LanguageContext";
import { CRAFT_DAYS, BESPOKE_MAX_REVISIONS } from "@/lib/everie";

const STEPS = [
  {
    value: "01",
    title: "Gửi yêu cầu",
    description:
      "Chia sẻ dịp tặng, loài hoa, màu men và hình tham khảo. Đội ngũ EVERIE tiếp nhận trong ngày làm việc.",
  },
  {
    value: "02",
    title: "Tư vấn",
    description:
      "Nhà thiết kế trao đổi kích thước, bố cục cánh hoa và chữ khắc để bản vẽ khớp ý quý khách.",
  },
  {
    value: "03",
    title: "Duyệt thiết kế",
    description: `Quý khách duyệt bản vẽ và được sửa tối đa ${BESPOKE_MAX_REVISIONS} lần trước khi khóa mẫu.`,
  },
  {
    value: "04",
    title: "Thanh toán",
    description:
      "Sau khi duyệt, EVERIE gửi hướng dẫn chuyển khoản. Xưởng bắt đầu nặn, men và nung khi đã xác nhận.",
  },
] as const;

export default function BespokeLandingPage() {
  const { t } = useLanguage();
  const days = `${CRAFT_DAYS.bespoke.min}–${CRAFT_DAYS.bespoke.max}`;

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-neutral-950 dark:text-neutral-100">
      <Header />
      <main>
        <div className="mx-auto max-w-[1440px] px-4 pt-8 md:px-8">
          <StorefrontBreadcrumb current={t("nav.bespoke")} />
        </div>

        <section className="relative mt-6 overflow-hidden px-4 py-20 text-center text-white md:px-8 md:py-32">
          <Image
            src="/images/hanoia/hero-banner-1.webp"
            alt="Hoa gốm Bespoke EVERIE"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/65" />
          <div className="relative z-10 mx-auto max-w-3xl space-y-4">
            <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[4px] text-[#C5A880]">
              <Sparkles className="h-4 w-4" />
              EVERIE Concierge
            </p>
            <h1 className="font-serif text-3xl font-light uppercase leading-tight tracking-wide md:text-6xl">
              Bespoke Flowers
            </h1>
            <div className="mx-auto h-0.5 w-16 bg-[#C5A880]" />
            <p className="pt-2 font-serif text-sm italic leading-relaxed text-neutral-200 md:text-lg">
              “Một đóa hoa gốm độc bản — làm theo yêu cầu, nung một lần, không đúc hàng loạt.”
            </p>
            <div className="pt-6">
              <Link
                href="/bespoke/request"
                className="inline-flex items-center gap-2 bg-[#C5A880] px-8 py-3.5 text-xs font-semibold uppercase tracking-[2px] text-black transition-colors hover:bg-white"
              >
                {t("bespoke.begin")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xs shadow-2xl lg:col-span-6">
              <Image
                src="/images/hanoia/heritage-craft.webp"
                alt="Nghệ nhân EVERIE nặn hoa gốm Bespoke"
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover"
              />
            </div>
            <div className="space-y-5 lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[3px] text-[#C5A880]">
                Dịch vụ độc bản
              </p>
              <h2 className="font-serif text-2xl uppercase leading-snug tracking-wide text-foreground md:text-4xl">
                Hoa gốm viết riêng cho một dịp
              </h2>
              <div className="space-y-4 text-xs font-light leading-relaxed text-muted-foreground md:text-sm">
                <p>
                  Bespoke là dòng hoa gốm EVERIE làm theo yêu cầu: dịp cưới, kỷ niệm,
                  quà doanh nghiệp hoặc một loài hoa gia đình muốn giữ lại. Nghệ nhân
                  làng gốm Thanh Hà nặn cánh, chọn men và khắc chữ sau khi men đã ổn.
                </p>
                <p>
                  Thời gian chế tác {days} ngày, chưa gồm vận chuyển. Mỗi bản vẽ được
                  duyệt trước khi vào lò. Quý khách được sửa tối đa {BESPOKE_MAX_REVISIONS}{" "}
                  lần. Sau khi khóa mẫu và thanh toán, xưởng bắt đầu nặn — không hoàn
                  tác hình dáng khi đã nung.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-neutral-200 bg-neutral-50 px-4 py-8 dark:border-neutral-800 dark:bg-neutral-900 md:px-8">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 text-center sm:grid-cols-3">
            <div>
              <strong className="block font-serif text-3xl text-foreground">
                {days}
              </strong>
              <span className="mt-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                Ngày chế tác
              </span>
            </div>
            <div>
              <strong className="block font-serif text-3xl text-foreground">
                {BESPOKE_MAX_REVISIONS}
              </strong>
              <span className="mt-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                Lần sửa thiết kế
              </span>
            </div>
            <div>
              <strong className="block font-serif text-3xl text-foreground">
                100%
              </strong>
              <span className="mt-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                Độc bản theo yêu cầu
              </span>
            </div>
          </div>
        </section>

        <section className="border-y border-neutral-200 bg-[#F8F7F4] py-16 dark:border-neutral-800 dark:bg-neutral-900 md:py-24">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            <div className="mx-auto mb-14 max-w-xl space-y-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[3px] text-[#C5A880]">
                {t("bespoke.steps")}
              </p>
              <h2 className="font-serif text-2xl font-light uppercase tracking-wide text-foreground md:text-4xl">
                Bốn bước đến đóa hoa riêng
              </h2>
              <p className="text-xs font-light leading-relaxed text-muted-foreground md:text-sm">
                Gửi yêu cầu → Tư vấn → Duyệt thiết kế, sửa tối đa {BESPOKE_MAX_REVISIONS} lần →
                Thanh toán. Chế tác {days} ngày.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <article
                  key={step.value}
                  className="bg-white p-8 shadow-xs transition-colors hover:outline hover:outline-[#C5A880] dark:bg-neutral-950"
                >
                  <span className="block font-serif text-3xl font-bold text-[#C5A880]/50">
                    {step.value}
                  </span>
                  <h3 className="mt-3 font-serif text-base font-medium uppercase tracking-wide text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-xs font-light leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6 bg-neutral-900 px-4 py-16 text-center text-white md:px-8">
          <div className="mx-auto max-w-xl space-y-3">
            <h2 className="font-serif text-2xl font-light uppercase tracking-wide md:text-3xl">
              Bắt đầu bản vẽ của quý khách
            </h2>
            <p className="text-xs font-light text-neutral-300 md:text-sm">
              Điền form yêu cầu — không qua giỏ hàng. EVERIE liên hệ để tư vấn và
              gửi bản vẽ trong vài ngày làm việc.
            </p>
          </div>
          <Link
            href="/bespoke/request"
            className="inline-flex items-center gap-2 bg-[#C5A880] px-8 py-3.5 text-xs font-semibold uppercase tracking-[2px] text-black transition-colors hover:bg-white"
          >
            {t("bespoke.begin")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
