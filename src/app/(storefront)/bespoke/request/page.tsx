"use client";

import { FormEvent, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ImagePlus, Send, Sparkles, X } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import StorefrontBreadcrumb from "@/components/hanoia/StorefrontBreadcrumb";
import { useLanguage } from "@/context/LanguageContext";
import { BESPOKE_MAX_REVISIONS, ENGRAVING_MAX_CHARS } from "@/lib/everie";
import type { BespokeRequest } from "@/lib/store";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_CLASS =
  "w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xs focus:outline-hidden focus:border-black dark:bg-neutral-900 dark:border-neutral-700 dark:focus:border-[#C5A880]";

interface UploadApiResponse {
  success: boolean;
  data?: { fileUrl: string };
  error?: string;
}

interface BespokeApiResponse {
  success: boolean;
  data?: BespokeRequest;
  error?: string;
}

export default function BespokeRequestPage() {
  const { t } = useLanguage();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [occasion, setOccasion] = useState("");
  const [flowerPreference, setFlowerPreference] = useState("");
  const [colorPreference, setColorPreference] = useState("");
  const [engravingText, setEngravingText] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<BespokeRequest | null>(null);

  const engravingLeft = ENGRAVING_MAX_CHARS - engravingText.length;

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setError(null);

    const remaining = MAX_FILES - attachments.length;
    if (remaining <= 0) {
      setError(`Tối đa ${MAX_FILES} ảnh tham khảo.`);
      return;
    }

    const selected = Array.from(fileList).slice(0, remaining);
    const invalidType = selected.find((file) => !file.type.startsWith("image/"));
    if (invalidType) {
      setError("Chỉ nhận tệp ảnh (JPG, PNG, WEBP…).");
      return;
    }
    const tooLarge = selected.find((file) => file.size > MAX_FILE_BYTES);
    if (tooLarge) {
      setError("Mỗi ảnh tối đa 5MB.");
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = (await res.json()) as UploadApiResponse;
        if (!res.ok || !json.success || !json.data?.fileUrl) {
          throw new Error(json.error || "Tải ảnh thất bại");
        }
        uploaded.push(json.data.fileUrl);
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi khi tải ảnh lên";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const name = customerName.trim();
    const phoneValue = phone.trim();
    const emailValue = email.trim();

    if (!name || !phoneValue || !emailValue) {
      setError("Vui lòng nhập họ tên, điện thoại và email.");
      return;
    }
    if (!EMAIL_PATTERN.test(emailValue)) {
      setError("Email không hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bespoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone: phoneValue,
          email: emailValue,
          occasion: occasion.trim(),
          flowerPreference: flowerPreference.trim(),
          colorPreference: colorPreference.trim(),
          engravingText: engravingText.trim(),
          notes: notes.trim(),
          attachments,
        }),
      });
      const json = (await res.json()) as BespokeApiResponse;
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Không gửi được yêu cầu");
      }
      setCreated(json.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi khi gửi yêu cầu";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-neutral-950 dark:text-neutral-100">
      <Header />
      <main>
        <div className="mx-auto max-w-[1440px] px-4 pt-8 md:px-8">
          <StorefrontBreadcrumb current="Gửi yêu cầu Bespoke" />
        </div>

        <section className="mx-auto max-w-[880px] px-4 py-12 md:px-8 md:py-20">
          <div className="mb-10 space-y-3 text-center">
            <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[4px] text-[#C5A880]">
              <Sparkles className="h-4 w-4" />
              {t("nav.bespoke")}
            </p>
            <h1 className="font-serif text-3xl font-light uppercase tracking-wide md:text-5xl">
              Begin your Bespoke
            </h1>
            <div className="mx-auto h-0.5 w-16 bg-[#C5A880]" />
            <p className="mx-auto max-w-lg pt-2 text-xs font-light leading-relaxed text-muted-foreground md:text-sm">
              Form này không qua giỏ hàng. EVERIE nhận yêu cầu, tư vấn bản vẽ, cho phép
              sửa tối đa {BESPOKE_MAX_REVISIONS} lần, rồi mới thanh toán.
            </p>
          </div>

          {created ? (
            <div className="space-y-6 border border-neutral-200 bg-[#F8F7F4] p-8 text-center dark:border-neutral-800 dark:bg-neutral-900 md:p-12">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#C5A880]" />
              <h2 className="font-serif text-2xl uppercase tracking-wide">
                Đã nhận yêu cầu
              </h2>
              <p className="text-xs font-light text-muted-foreground md:text-sm">
                Mã yêu cầu của quý khách. Giữ mã này để tra cứu cùng email hoặc số điện
                thoại.
              </p>
              <p className="font-mono text-2xl font-semibold tracking-[0.2em] text-[#C5A880] md:text-3xl">
                {created.code}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Link
                  href="/lookup"
                  className="inline-flex items-center gap-2 bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[2px] text-white transition-colors hover:bg-[#C5A880] hover:text-black"
                >
                  Tra cứu yêu cầu
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/bespoke"
                  className="inline-flex items-center gap-2 border border-neutral-300 px-6 py-3 text-xs font-semibold uppercase tracking-[2px] transition-colors hover:border-[#C5A880] dark:border-neutral-700"
                >
                  Về Bespoke
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {error && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Họ và tên *" htmlFor="bsp-name">
                  <input
                    id="bsp-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn An"
                    required
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field label="Số điện thoại *" htmlFor="bsp-phone">
                  <input
                    id="bsp-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0908 123 456"
                    required
                    className={FIELD_CLASS}
                  />
                </Field>
              </div>

              <Field label="Email *" htmlFor="bsp-email">
                <input
                  id="bsp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className={FIELD_CLASS}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Dịp tặng / sử dụng" htmlFor="bsp-occasion">
                  <input
                    id="bsp-occasion"
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="Cưới, kỷ niệm, quà doanh nghiệp…"
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field label="Loài hoa mong muốn" htmlFor="bsp-flower">
                  <input
                    id="bsp-flower"
                    type="text"
                    value={flowerPreference}
                    onChange={(e) => setFlowerPreference(e.target.value)}
                    placeholder="Sen, tulip, hồng, hoặc loài khác"
                    className={FIELD_CLASS}
                  />
                </Field>
              </div>

              <Field label="Màu men ưa thích" htmlFor="bsp-color">
                <input
                  id="bsp-color"
                  type="text"
                  value={colorPreference}
                  onChange={(e) => setColorPreference(e.target.value)}
                  placeholder="Trắng ngà, hồng đào, celadon…"
                  className={FIELD_CLASS}
                />
              </Field>

              <Field
                label={`Chữ khắc (tuỳ chọn, tối đa ${ENGRAVING_MAX_CHARS} ký tự)`}
                htmlFor="bsp-engrave"
              >
                <input
                  id="bsp-engrave"
                  type="text"
                  maxLength={ENGRAVING_MAX_CHARS}
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value.slice(0, ENGRAVING_MAX_CHARS))}
                  placeholder="Tên, chữ, số hoặc ký hiệu"
                  className={FIELD_CLASS}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Còn {engravingLeft} ký tự. Không đổi sau khi khóa mẫu.
                </p>
              </Field>

              <Field label="Ghi chú thêm" htmlFor="bsp-notes">
                <textarea
                  id="bsp-notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Kích thước, số lượng, ý nghĩa muốn kể…"
                  className={`${FIELD_CLASS} resize-y`}
                />
              </Field>

              <div>
                <p className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Ảnh tham khảo
                </p>
                <p className="mb-3 text-[11px] text-muted-foreground">
                  Ảnh hoa, không gian hoặc phác thảo. Tối đa {MAX_FILES} tệp, mỗi tệp 5MB,
                  chỉ nhận ảnh.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {attachments.map((url) => (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden border border-neutral-200 dark:border-neutral-800"
                    >
                      <Image
                        src={url}
                        alt="Ảnh tham khảo"
                        fill
                        className="object-cover"
                        sizes="160px"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAttachments((prev) => prev.filter((item) => item !== url))
                        }
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white"
                        aria-label="Xóa ảnh"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {attachments.length < MAX_FILES && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-neutral-300 text-neutral-500 transition-colors hover:border-[#C5A880] hover:text-[#C5A880] dark:border-neutral-700">
                      <ImagePlus className="h-5 w-5" />
                      <span className="px-2 text-center text-[10px] uppercase tracking-wider">
                        {uploading ? "Đang tải…" : "Thêm ảnh"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploading}
                        className="hidden"
                        onChange={(e) => {
                          void handleFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="inline-flex w-full items-center justify-center gap-2 bg-black px-8 py-3.5 text-xs font-semibold uppercase tracking-[2px] text-white transition-colors hover:bg-[#C5A880] hover:text-black disabled:opacity-50 sm:w-auto"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Đang gửi…" : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
