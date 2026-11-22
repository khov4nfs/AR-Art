"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import StorefrontBreadcrumb from "@/components/hanoia/StorefrontBreadcrumb";
import type { PageContent, PageSection } from "@/lib/store";

const FALLBACK_SECTIONS: PageSection[] = [
  {
    id: "hero",
    type: "hero",
    name: "Hero",
    eyebrow: "Our Story",
    title: "Vẻ đẹp ở lại cùng thời gian",
    body: "Hoa tươi tàn. Hoa gốm EVERIE giữ dáng, màu men và chữ khắc.",
    image: "/images/hanoia/hero-banner-4.webp",
    imageAlt: "Làng gốm Thanh Hà",
    enabled: true,
    items: [],
  },
  {
    id: "origin",
    type: "story",
    name: "Sứ mệnh",
    eyebrow: "Sứ mệnh",
    title: "Giữ một đóa hoa cho những dịp không muốn phai",
    body: "EVERIE làm hoa gốm tặng người, đặt bàn, và khắc tên. Mỗi tác phẩm nung một lần, không đúc hàng loạt.\n\nXưởng làm việc cùng nghệ nhân làng gốm Thanh Hà, Hội An. Đất sét địa phương, men đá, lửa củi. Classic chọn màu men có sẵn. Themed kể lễ hội Việt Nam. Bespoke là bản duy nhất.",
    image: "/images/hanoia/heritage-craft.webp",
    imageAlt: "Nghệ nhân nặn hoa gốm",
    enabled: true,
    items: [],
  },
  {
    id: "stats",
    type: "stats",
    name: "Số liệu",
    eyebrow: "",
    title: "",
    body: "",
    enabled: true,
    items: [
      { id: "stat-lines", value: "3", title: "Dòng sản phẩm", description: "" },
      { id: "stat-days", value: "14–45", title: "Ngày chế tác", description: "" },
      { id: "stat-hand", value: "100%", title: "Thủ công", description: "" },
    ],
  },
  {
    id: "process",
    type: "process",
    name: "From Clay to Flower",
    eyebrow: "Quy trình",
    title: "Từ đất sét đến đóa hoa",
    body: "Classic 14–21 ngày, Themed 21–28 ngày, Bespoke 30–45 ngày. Khắc chữ sau khi men đã ổn.",
    enabled: true,
    items: [
      {
        id: "step-1",
        value: "01",
        title: "Nặn dáng",
        description:
          "Nghệ nhân nặn cánh hoa và đế theo mẫu Classic, Themed hoặc bản vẽ Bespoke.",
      },
      {
        id: "step-2",
        value: "02",
        title: "Phơi và nung",
        description:
          "Phôi phơi, nung sơ, phủ men đá, nung lần hai trong lò củi.",
      },
      {
        id: "step-3",
        value: "03",
        title: "Khắc chữ",
        description:
          "Chữ, số hoặc ký hiệu được khắc trên vùng đế cố định sau khi men nguội.",
      },
      {
        id: "step-4",
        value: "04",
        title: "Đóng gói chống vỡ",
        description:
          "Bọc foam, hộp cứng, chèn giấy. Email giao hàng nhắc quay video lúc mở hộp.",
      },
    ],
  },
  {
    id: "cta",
    type: "cta",
    name: "Khám phá",
    eyebrow: "",
    title: "Chọn một đóa hoa gốm",
    body: "Classic thêm vào giỏ. Themed mua lẻ hoặc cả bộ. Bespoke bắt đầu bằng một yêu cầu.",
    ctaLabel: "Classic Flowers",
    ctaHref: "/classic",
    enabled: true,
    items: [],
  },
];

export default function HeritagePage() {
  const [pageTitle, setPageTitle] = useState("Our Story");
  const [sections, setSections] = useState(FALLBACK_SECTIONS);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pages", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.json())
      .then((result: { data?: PageContent[] }) => {
        const page = result.data?.find((item) => item.slug === "heritage");
        if (page?.status === "published") {
          setPageTitle(page.title);
          if (page.sections.length > 0) setSections(page.sections);
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          console.error("Không thể tải nội dung Heritage", error);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-neutral-950 dark:text-neutral-100">
      <Header />
      <main>
        <div className="mx-auto max-w-[1440px] px-4 pt-8 md:px-8">
          <StorefrontBreadcrumb current={pageTitle} />
        </div>
        {sections
          .filter((section) => section.enabled)
          .map((section) => (
            <HeritageSection key={section.id} section={section} />
          ))}
      </main>
      <Footer />
    </div>
  );
}

function HeritageSection({ section }: { section: PageSection }) {
  const paragraphs = section.body.split("\n\n").filter(Boolean);
  if (section.type === "hero")
    return (
      <section className="relative mt-6 overflow-hidden px-4 py-20 text-center text-white md:px-8 md:py-32">
        {section.image && (
          <Image
            src={section.image}
            alt={section.imageAlt || section.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 mx-auto max-w-3xl space-y-4">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[4px] text-[#C5A880]">
            <Sparkles className="h-4 w-4" />
            {section.eyebrow}
          </p>
          <h1 className="font-serif text-3xl font-light uppercase leading-tight tracking-wide md:text-6xl">
            {section.title}
          </h1>
          <div className="mx-auto h-0.5 w-16 bg-[#C5A880]" />
          <p className="pt-2 font-serif text-sm italic leading-relaxed text-neutral-200 md:text-lg">
            “{section.body}”
          </p>
        </div>
      </section>
    );
  if (section.type === "story" || section.type === "feature") {
    const imageFirst = section.type === "story";
    return (
      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div
            className={`relative aspect-[4/3] overflow-hidden rounded-xs shadow-2xl lg:col-span-6 ${imageFirst ? "" : "lg:order-2"}`}
          >
            {section.image && (
              <Image
                src={section.image}
                alt={section.imageAlt || section.title}
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover"
              />
            )}
          </div>
          <div
            className={`space-y-5 lg:col-span-6 ${imageFirst ? "" : "lg:order-1"}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[3px] text-[#C5A880]">
              {section.eyebrow}
            </p>
            <h2 className="font-serif text-2xl uppercase leading-snug tracking-wide text-foreground md:text-4xl">
              {section.title}
            </h2>
            <div className="space-y-4 text-xs font-light leading-relaxed text-muted-foreground md:text-sm">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
  if (section.type === "stats")
    return (
      <section className="border-y border-neutral-200 bg-neutral-50 px-4 py-8 dark:border-neutral-800 dark:bg-neutral-900 md:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 text-center sm:grid-cols-3">
          {section.items.map((item) => (
            <div key={item.id}>
              <strong className="block font-serif text-3xl text-foreground">
                {item.value}
              </strong>
              <span className="mt-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  if (section.type === "process")
    return (
      <section className="border-y border-neutral-200 bg-[#F8F7F4] py-16 dark:border-neutral-800 dark:bg-neutral-900 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-8">
          <div className="mx-auto mb-14 max-w-xl space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[3px] text-[#C5A880]">
              {section.eyebrow}
            </p>
            <h2 className="font-serif text-2xl font-light uppercase tracking-wide text-foreground md:text-4xl">
              {section.title}
            </h2>
            <p className="text-xs font-light leading-relaxed text-muted-foreground md:text-sm">
              {section.body}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <article
                key={item.id}
                className="bg-white p-8 shadow-xs transition-colors hover:outline hover:outline-[#C5A880] dark:bg-neutral-950"
              >
                <span className="block font-serif text-3xl font-bold text-[#C5A880]/50">
                  {item.value}
                </span>
                <h3 className="mt-3 font-serif text-base font-medium uppercase tracking-wide text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-xs font-light leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  return (
    <section className="space-y-6 bg-neutral-900 px-4 py-16 text-center text-white md:px-8">
      <div className="mx-auto max-w-xl space-y-3">
        <h2 className="font-serif text-2xl font-light uppercase tracking-wide md:text-3xl">
          {section.title}
        </h2>
        <p className="text-xs font-light text-neutral-300 md:text-sm">
          {section.body}
        </p>
      </div>
      {section.ctaLabel && (
        <Link
          href={section.ctaHref || "/"}
          className="inline-flex items-center gap-2 bg-[#C5A880] px-8 py-3.5 text-xs font-semibold uppercase tracking-[2px] text-black transition-colors hover:bg-white"
        >
          {section.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}
