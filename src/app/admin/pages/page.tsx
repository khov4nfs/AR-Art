"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  Home,
  Layers,
  Lock,
  Mail,
  Monitor,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { PageContent, PageSection, PageSectionItem, PageSectionType } from "@/lib/store";
import ImageUploadWithPreview from "@/components/admin/ImageUploadWithPreview";
import ClientStorefrontPreview from "@/components/admin/StorefrontPreview";

type ViewMode = "content" | "preview" | "seo";
type PreviewDevice = "desktop" | "mobile";

const SECTION_TYPE_CONFIG: Record<
  PageSectionType,
  { label: string; description: string; badgeColor: string }
> = {
  hero: {
    label: "Banner Hero",
    description: "Khối banner lớn đầu trang với ảnh toàn cảnh, khẩu hiệu và nút bấm.",
    badgeColor: "bg-stone-800 text-stone-300 border-stone-700/60",
  },
  showcase: {
    label: "Tuyệt tác bán chạy",
    description: "Trưng bày danh sách sản phẩm sơn mài tiêu biểu kèm giá và huy hiệu.",
    badgeColor: "bg-stone-800 text-stone-300 border-stone-700/60",
  },
  story: {
    label: "Câu chuyện di sản",
    description: "Bố cục đối xứng ảnh - chữ kể về hành trình thương hiệu và nghệ nhân.",
    badgeColor: "bg-stone-800 text-stone-300 border-stone-700/60",
  },
  feature: {
    label: "Bộ sưu tập đặc trưng",
    description: "Làm nổi bật các dòng tác phẩm, chất liệu độc bản hoặc chiến dịch mới.",
    badgeColor: "bg-stone-800 text-stone-300 border-stone-700/60",
  },
  stats: {
    label: "Số liệu thành tựu",
    description: "Các con số ấn tượng khẳng định vị thế và uy tín thương hiệu.",
    badgeColor: "bg-stone-800 text-stone-300 border-stone-700/60",
  },
  process: {
    label: "Quy trình chế tác",
    description: "Các bước thủ công công phu minh chứng cho sự tỉ mỉ của nghệ nhân.",
    badgeColor: "bg-stone-800 text-stone-300 border-stone-700/60",
  },
  stores: {
    label: "Hệ thống Boutique",
    description: "Danh sách cửa hàng kèm địa chỉ, hotline, giờ mở cửa và bản đồ.",
    badgeColor: "bg-stone-800 text-stone-300 border-stone-700/60",
  },
  policies: {
    label: "Trung tâm chính sách",
    description: "Bộ tab chính sách dịch vụ bảo đảm quyền lợi khách hàng VIP.",
    badgeColor: "bg-stone-800 text-stone-300 border-stone-700/60",
  },
  contact: {
    label: "Liên hệ & Concierge",
    description: "Thông tin hỗ trợ trực tiếp và biểu mẫu đặt lịch tư vấn riêng.",
    badgeColor: "bg-stone-800 text-stone-300 border-stone-700/60",
  },
  gallery: {
    label: "Lookbook nghệ thuật",
    description: "Thư viện hình ảnh nghệ thuật tôn vinh không gian sống thượng lưu.",
    badgeColor: "bg-stone-800 text-stone-300 border-stone-700/60",
  },
  cta: {
    label: "Kêu gọi hành động (CTA)",
    description: "Khối kết trang ấn tượng dẫn dắt khách hàng tiếp tục khám phá.",
    badgeColor: "bg-stone-800 text-stone-300 border-stone-700/60",
  },
};

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [draft, setDraft] = useState<PageContent | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("content");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newPageModalOpen, setNewPageModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageNav, setNewPageNav] = useState("");
  const [creatingPage, setCreatingPage] = useState(false);

  const loadPages = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pages", { cache: "no-store" });
      const result = (await response.json()) as {
        success: boolean;
        data?: PageContent[];
        error?: string;
      };
      if (!response.ok || !result.data) {
        throw new Error(result.error || "Không thể tải nội dung trang");
      }
      setPages(result.data);
      const next =
        result.data.find((page) => page.id === draft?.id) ??
        result.data[0] ??
        null;
      setDraft(next ? structuredClone(next) : null);
      setSelectedSectionId(next?.sections[0]?.id ?? "");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Không thể tải nội dung trang",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choosePage = (page: PageContent) => {
    setDraft(structuredClone(page));
    setSelectedSectionId(page.sections[0]?.id ?? "");
    setMessage("");
  };

  const updatePage = <Key extends keyof PageContent>(
    key: Key,
    value: PageContent[Key],
  ) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateSection = <Key extends keyof PageSection>(
    sectionId: string,
    key: Key,
    value: PageSection[Key],
  ) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((section) =>
              section.id === sectionId ? { ...section, [key]: value } : section,
            ),
          }
        : current,
    );
  };

  const updateItem = (
    sectionId: string,
    itemId: string,
    patch: Partial<PageSectionItem>,
  ) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    items: section.items.map((item) =>
                      item.id === itemId ? { ...item, ...patch } : item,
                    ),
                  }
                : section,
            ),
          }
        : current,
    );
  };

  const addItem = (section: PageSection) => {
    const newItem: PageSectionItem = {
      id: `item-${Date.now()}`,
      value: String(section.items.length + 1).padStart(2, "0"),
      title: "Mục nội dung mới",
      description: "Nhập thông số hoặc mô tả chi tiết cho mục này.",
    };
    if (section.type === "stats") {
      newItem.value = "100%";
      newItem.title = "Tiêu chí chất lượng";
    } else if (section.type === "showcase") {
      newItem.title = "Tác phẩm sơn mài mới";
      newItem.value = "4.500.000 ₫";
      newItem.description = "Sơn mài thủ công dát lá vàng cao cấp.";
      newItem.image = "/images/hanoia/product-tray-reverie.webp";
      newItem.badge = "Mới";
    } else if (section.type === "stores") {
      newItem.title = "Hanoia Boutique";
      newItem.description = "Địa chỉ boutique · Hotline liên hệ";
      newItem.value = "09:00 - 21:30";
      newItem.image = "/images/hanoia/hero-banner-1.webp";
    }
    updateSection(section.id, "items", [...section.items, newItem]);
  };

  const removeItem = (section: PageSection, itemId: string) => {
    updateSection(
      section.id,
      "items",
      section.items.filter((item) => item.id !== itemId),
    );
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    if (!draft) return;
    const index = draft.sections.findIndex((s) => s.id === sectionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= draft.sections.length) return;
    const next = [...draft.sections];
    [next[index], next[target]] = [next[target], next[index]];
    updatePage("sections", next);
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;
    setCreatingPage(true);
    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPageTitle.trim(),
          slug: newPageSlug.trim() || newPageTitle.trim().toLowerCase().replace(/\s+/g, "-"),
          navigationLabel: newPageNav.trim() || newPageTitle.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Không thể tạo trang");
      }
      setPages((curr) => [...curr, result.data]);
      setDraft(result.data);
      setSelectedSectionId(result.data.sections[0]?.id || "");
      setNewPageModalOpen(false);
      setNewPageTitle("");
      setNewPageSlug("");
      setNewPageNav("");
      setMessage("Đã tạo trang mới thành công.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi khi tạo trang");
    } finally {
      setCreatingPage(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (
      ["page-home", "page-heritage", "page-stores", "page-policies", "page-contact"].includes(
        pageId,
      )
    ) {
      alert("Không thể xóa trang hệ thống cốt lõi.");
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn trang này?")) return;
    try {
      const response = await fetch(`/api/pages?id=${encodeURIComponent(pageId)}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Không thể xóa trang");
      }
      const remain = pages.filter((p) => p.id !== pageId);
      setPages(remain);
      if (draft?.id === pageId) {
        const next = remain[0] || null;
        setDraft(next ? structuredClone(next) : null);
        setSelectedSectionId(next?.sections[0]?.id || "");
      }
      setMessage("Đã xóa trang.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi khi xóa trang");
    }
  };

  const savePage = async () => {
    if (!draft) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as {
        success: boolean;
        data?: PageContent;
        error?: string;
      };
      if (!response.ok || !result.data) {
        throw new Error(result.error || "Không thể lưu nội dung trang");
      }
      setDraft(structuredClone(result.data));
      setPages((current) =>
        current.map((page) =>
          page.id === result.data?.id ? result.data : page,
        ),
      );
      setMessage("Đã lưu toàn bộ nội dung và các khối giao diện thành công.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Không thể lưu nội dung trang",
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredPages = pages.filter((page) =>
    `${page.title} ${page.slug}`.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedSection =
    draft?.sections.find((section) => section.id === selectedSectionId) ?? null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-stone-400">
        <RefreshCw className="h-6 w-6 animate-spin text-[#C5A880]" />
        <span>Đang tải hệ thống quản lý trang...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="flex flex-col gap-4 border-b border-stone-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C5A880]">
            <Layers className="h-4 w-4" />
            <span>Quản trị nội dung website</span>
            <span className="rounded bg-stone-800 px-2 py-0.5 text-[10px] text-stone-300">
              {pages.length} trang hoạt động
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-white">
            Trình quản lý & Thiết kế trang
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            Biên tập toàn diện thông số, cấu trúc khối và xem trước giao diện 1:1 chuẩn xác như trên website client.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "content", label: "Nội dung & Khối", icon: FileText },
              { id: "preview", label: "Preview trực tiếp (1:1)", icon: Eye },
              { id: "seo", label: "SEO & Xuất bản", icon: Globe2 },
            ] as const
          ).map((mode) => {
            const Icon = mode.icon;
            const active = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-[#C5A880] text-black shadow-lg shadow-[#C5A880]/20"
                    : "border border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Left Sidebar: Pages List */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-stone-800 bg-[#141417] p-3.5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Danh sách trang
              </span>
              <button
                type="button"
                onClick={() => setNewPageModalOpen(true)}
                className="inline-flex items-center gap-1 rounded bg-[#C5A880]/10 px-2 py-1 text-[11px] font-semibold text-[#C5A880] transition-colors hover:bg-[#C5A880]/20"
              >
                <Plus className="h-3 w-3" />
                Thêm trang
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm trang..."
                className="w-full rounded-lg border border-stone-800 bg-[#0C0C0E] py-2 pl-9 pr-3 text-xs text-stone-200 outline-none transition-colors focus:border-[#C5A880]"
              />
            </div>

            {/* Pages Navigation */}
            <nav className="mt-3 max-h-[calc(100vh-20rem)] space-y-1 overflow-y-auto pr-1">
              {filteredPages.map((page) => {
                const active = draft?.id === page.id;
                const isCore = [
                  "page-home",
                  "page-heritage",
                  "page-stores",
                  "page-policies",
                  "page-contact",
                ].includes(page.id);

                return (
                  <div
                    key={page.id}
                    className={`group relative flex items-center justify-between rounded-lg transition-colors ${
                      active
                        ? "bg-[#C5A880] text-black"
                        : "text-stone-300 hover:bg-stone-800/80"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => choosePage(page)}
                      className="flex-1 p-2.5 text-left"
                    >
                      <div className="flex items-center gap-2">
                        {page.slug === "" || page.slug === "home" ? (
                          <Home className="h-3.5 w-3.5 shrink-0" />
                        ) : page.slug === "heritage" ? (
                          <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        ) : page.slug === "stores" ? (
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                        ) : page.slug === "policies" ? (
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        ) : page.slug === "contact" ? (
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span className="truncate text-xs font-semibold">
                          {page.title}
                        </span>
                      </div>
                      <div
                        className={`mt-1 flex items-center gap-2 text-[10px] ${
                          active ? "text-stone-900" : "text-stone-500"
                        }`}
                      >
                        <span>
                          {page.slug === "" ? "/" : `/${page.slug}`} ·{" "}
                          {page.sections.length} khối
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
                            active
                              ? "bg-black/20 text-stone-900"
                              : page.status === "published"
                                ? "bg-stone-800 text-stone-300 border border-stone-700/60"
                                : "bg-stone-900 text-stone-500 border border-stone-800"
                          }`}
                        >
                          {page.status === "published" ? "Xuất bản" : "Nháp"}
                        </span>
                      </div>
                    </button>

                    {!isCore && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeletePage(page.id);
                        }}
                        className={`mr-2 rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100 ${
                          active
                            ? "text-red-900 hover:bg-black/10"
                            : "text-stone-500 hover:text-red-400"
                        }`}
                        title="Xóa trang tùy chỉnh"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Work Area: Active Page */}
        {draft && (
          <main className="min-w-0 space-y-5">
            {/* Page Header Bar */}
            <div className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-[#141417] p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xl font-semibold text-white">
                    {draft.title}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-700 bg-stone-800/70 px-2.5 py-0.5 text-[10px] font-medium text-stone-300">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        draft.status === "published" ? "bg-stone-300" : "bg-stone-500"
                      }`}
                    />
                    {draft.status === "published" ? "Đang xuất bản" : "Bản nháp"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-stone-400">
                  Đường dẫn:{" "}
                  <code className="rounded bg-black/40 px-1.5 py-0.5 text-[#C5A880]">
                    {draft.slug === "" ? "/" : `/${draft.slug}`}
                  </code>{" "}
                  · Cập nhật lần cuối: {draft.updatedAt}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={draft.slug === "" ? "/" : `/${draft.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-medium text-stone-300 transition-colors hover:border-[#C5A880] hover:text-[#C5A880]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Mở trang thật
                </Link>

                <button
                  type="button"
                  onClick={() => void savePage()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#C5A880] px-4 py-2 text-xs font-bold text-black shadow-md shadow-[#C5A880]/10 transition-colors hover:bg-[#d6bc96] disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>

            {/* Notification message */}
            {message && (
              <div className="flex items-center justify-between rounded-lg border border-stone-800 bg-[#141417] px-4 py-3 text-xs text-stone-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-[#C5A880]" />
                  <span>{message}</span>
                </div>
                <button
                  onClick={() => setMessage("")}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* VIEW MODE 1: CONTENT & SECTIONS */}
            {viewMode === "content" && (
              <div className="grid gap-6 2xl:grid-cols-[20rem_minmax(0,1fr)]">
                {/* Sections List Column */}
                <div className="h-fit rounded-xl border border-stone-800 bg-[#141417] p-3.5">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                      Cấu trúc trang ({draft.sections.length} khối)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {draft.sections.map((section, index) => {
                      const active = selectedSectionId === section.id;
                      const typeConfig =
                        SECTION_TYPE_CONFIG[section.type] || {
                          label: section.type,
                          badgeColor: "bg-stone-800 text-stone-300",
                        };

                      return (
                        <div
                          key={section.id}
                          className={`group flex items-center gap-2 rounded-lg border p-2.5 transition-colors ${
                            active
                              ? "border-[#C5A880]/60 bg-stone-800 text-white shadow-sm"
                              : "border-stone-800/80 bg-[#0C0C0E] text-stone-400 hover:border-stone-700 hover:text-stone-200"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedSectionId(section.id)}
                            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                          >
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${
                                section.enabled ? "bg-[#C5A880]" : "bg-stone-600"
                              }`}
                              title={section.enabled ? "Hiển thị" : "Đang ẩn"}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-stone-200">
                                {section.name || "Khối chưa đặt tên"}
                              </span>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span
                                  className={`rounded border px-1.5 py-0.2 text-[9px] uppercase font-medium ${typeConfig.badgeColor}`}
                                >
                                  {typeConfig.label}
                                </span>
                                {section.items && section.items.length > 0 && (
                                  <span className="text-[10px] text-stone-500">
                                    {section.items.length} mục
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Quick Actions */}
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveSection(section.id, -1)}
                              disabled={index === 0}
                              className="rounded p-1 text-stone-500 hover:bg-stone-700 hover:text-stone-200 disabled:opacity-20"
                              title="Di chuyển lên"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSection(section.id, 1)}
                              disabled={index === draft.sections.length - 1}
                              className="rounded p-1 text-stone-500 hover:bg-stone-700 hover:text-stone-200 disabled:opacity-20"
                              title="Di chuyển xuống"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section Editor Column */}
                {selectedSection ? (
                  <SectionEditor
                    section={selectedSection}
                    updateSection={updateSection}
                    updateItem={updateItem}
                    addItem={addItem}
                    removeItem={removeItem}
                    moveSection={moveSection}
                    onPreviewClick={() => setViewMode("preview")}
                  />
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-stone-800 bg-[#141417] text-center text-stone-400">
                    <Layers className="h-8 w-8 text-stone-600 mb-2" />
                    <p className="text-sm font-semibold">Chưa chọn khối giao diện nào</p>
                    <p className="text-xs text-stone-500 mt-1">
                      Hãy nhấp vào một khối ở danh sách bên trái để chỉnh sửa nội dung.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE 2: LIVE PREVIEW (1:1 CLIENT STOREFRONT) */}
            {viewMode === "preview" && (
              <div className="space-y-4 rounded-xl border border-stone-800 bg-[#141417] p-4 sm:p-6 shadow-sm">
                {/* Preview Toolbar */}
                <div className="flex flex-col gap-3 border-b border-stone-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Sparkles className="h-4 w-4 text-[#C5A880]" />
                      Giao diện thực tế Storefront (Xem trước trực tiếp)
                    </h3>
                    <p className="text-xs text-stone-400">
                      Mô phỏng 100% typography, màu sắc, header/footer thương hiệu Hanoia và các khối tương tác.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Device Selector */}
                    <div className="flex rounded-lg border border-stone-700 bg-stone-900 p-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          previewDevice === "desktop"
                            ? "bg-[#C5A880] text-black font-semibold shadow-xs"
                            : "text-stone-400 hover:text-white"
                        }`}
                        title="Xem trên máy tính (Desktop)"
                      >
                        <Monitor className="h-4 w-4" />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          previewDevice === "mobile"
                            ? "bg-[#C5A880] text-black font-semibold shadow-xs"
                            : "text-stone-400 hover:text-white"
                        }`}
                        title="Xem trên điện thoại (iPhone)"
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>iPhone</span>
                      </button>
                    </div>

                    <Link
                      href={draft.slug === "" ? "/" : `/${draft.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-700 px-3 py-1.5 text-xs text-stone-300 hover:text-[#C5A880]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Mở cửa sổ mới
                    </Link>
                  </div>
                </div>

                {/* Preview Canvas Container */}
                <div className="storefront-preview-canvas flex justify-center overflow-x-auto rounded-xl bg-stone-950 p-4 sm:p-8">
                  {previewDevice === "mobile" ? (
                    /* iPhone Realistic Frame Mockup */
                    <div className="relative mx-auto w-[390px] rounded-[48px] border-[10px] border-stone-800 bg-neutral-900 p-1 shadow-2xl ring-1 ring-stone-700">
                      {/* Dynamic Island Notch */}
                      <div className="absolute left-1/2 top-4 z-50 h-5 w-28 -translate-x-1/2 rounded-full bg-black flex items-center justify-between px-2">
                        <span className="h-2 w-2 rounded-full bg-neutral-900" />
                        <span className="h-2.5 w-2.5 rounded-full bg-neutral-800" />
                      </div>

                      {/* Screen Content */}
                      <div className="max-h-[820px] overflow-y-auto rounded-[38px] bg-white text-black dark:bg-neutral-950 dark:text-white">
                        <ClientStorefrontPreview
                          page={draft}
                          isMobile={true}
                          onEditSection={(sectionId) => {
                            setSelectedSectionId(sectionId);
                            setViewMode("content");
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Desktop Mac Browser Mockup */
                    <div className="w-full max-w-[1400px] overflow-hidden rounded-xl border border-stone-800 bg-white text-black shadow-2xl dark:bg-neutral-950 dark:text-neutral-100">
                      {/* Browser Window Header */}
                      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-100 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-stone-600" />
                          <span className="h-2.5 w-2.5 rounded-full bg-stone-600" />
                          <span className="h-2.5 w-2.5 rounded-full bg-stone-600" />
                        </div>
                        <div className="flex items-center gap-2 rounded-md bg-white px-5 py-1 text-[11px] text-stone-500 shadow-xs dark:bg-neutral-800 dark:text-stone-300">
                          <Lock className="h-3 w-3 text-stone-400" />
                          <span>https://everievn.com{draft.slug === "" ? "" : `/${draft.slug}`}</span>
                        </div>
                        <div className="w-12" />
                      </div>

                      {/* Screen Content */}
                      <div className="min-h-[600px]">
                        <ClientStorefrontPreview
                          page={draft}
                          isMobile={false}
                          onEditSection={(sectionId) => {
                            setSelectedSectionId(sectionId);
                            setViewMode("content");
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW MODE 3: SEO & METADATA */}
            {viewMode === "seo" && (
              <div className="space-y-6 rounded-xl border border-stone-800 bg-[#141417] p-6 shadow-sm">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-white">
                    Cấu hình SEO & Thẻ chia sẻ mạng xã hội
                  </h3>
                  <p className="text-xs text-stone-400">
                    Tối ưu hóa khả năng hiển thị trên Google và các nền tảng mạng xã hội Facebook, Zalo.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Tiêu đề trang (Title)">
                    <input
                      className="admin-input"
                      value={draft.title}
                      onChange={(e) => updatePage("title", e.target.value)}
                    />
                  </Field>

                  <Field label="Nhãn menu điều hướng (Navigation Label)">
                    <input
                      className="admin-input"
                      value={draft.navigationLabel}
                      onChange={(e) => updatePage("navigationLabel", e.target.value)}
                    />
                  </Field>

                  <Field label="Đường dẫn tĩnh (Slug URL)">
                    <div className="flex items-center rounded-lg border border-stone-800 bg-[#0C0C0E] px-3">
                      <span className="text-xs text-stone-500">/</span>
                      <input
                        className="w-full bg-transparent py-2.5 pl-1 pr-2 text-xs text-stone-200 outline-none"
                        value={draft.slug}
                        onChange={(e) => updatePage("slug", e.target.value)}
                        placeholder="Để trống nếu là trang chủ"
                      />
                    </div>
                  </Field>

                  <Field label="Trạng thái xuất bản">
                    <select
                      className="admin-input"
                      value={draft.status}
                      onChange={(e) =>
                        updatePage("status", e.target.value as PageContent["status"])
                      }
                    >
                      <option value="published">Đã xuất bản (Công khai)</option>
                      <option value="draft">Bản nháp (Nội bộ)</option>
                    </select>
                  </Field>
                </div>

                <div className="space-y-5 border-t border-stone-800 pt-5">
                  <Field
                    label={`Tiêu đề SEO (${draft.seoTitle?.length || 0}/60 ký tự khuyến nghị)`}
                  >
                    <input
                      className="admin-input"
                      value={draft.seoTitle || ""}
                      onChange={(e) => updatePage("seoTitle", e.target.value)}
                      placeholder="VD: Hanoia | Nghệ Thuật Sơn Mài Thủ Công Cao Cấp"
                    />
                  </Field>

                  <Field
                    label={`Mô tả SEO (${draft.seoDescription?.length || 0}/160 ký tự khuyến nghị)`}
                  >
                    <textarea
                      rows={3}
                      className="admin-input resize-y"
                      value={draft.seoDescription || ""}
                      onChange={(e) => updatePage("seoDescription", e.target.value)}
                      placeholder="VD: Khám phá các tuyệt tác sơn mài thủ công Hanoia chế tác tinh xảo bởi nghệ nhân bậc thầy Việt Nam..."
                    />
                  </Field>

                  {/* Google Search Snippet Preview */}
                  <div className="rounded-xl border border-stone-800 bg-[#0C0C0E] p-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                      Mô phỏng kết quả tìm kiếm Google
                    </p>
                    <div className="max-w-xl space-y-1">
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <span className="font-medium text-emerald-400">https://everievn.com</span>
                        <span>› {draft.slug || "trang-chu"}</span>
                      </div>
                      <h4 className="cursor-pointer text-base font-medium text-blue-400 hover:underline">
                        {draft.seoTitle || draft.title}
                      </h4>
                      <p className="text-xs text-stone-400 leading-relaxed">
                        {draft.seoDescription ||
                          "EVERIE - Thương hiệu hoa gốm thủ công mỹ nghệ cao cấp từ làng gốm Thanh Hà..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
      </div>

      {/* MODAL: TẠO TRANG MỚI */}
      {newPageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-stone-800 bg-[#141417] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-serif text-lg font-semibold text-white">Thêm trang mới</h3>
              <button
                onClick={() => setNewPageModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePage} className="mt-4 space-y-4">
              <Field label="Tiêu đề trang">
                <input
                  required
                  className="admin-input"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="VD: Triển lãm Sơn mài 2026"
                />
              </Field>
              <Field label="Đường dẫn tĩnh (Slug)">
                <input
                  className="admin-input"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  placeholder="VD: trien-lam-son-mai-2026"
                />
              </Field>
              <Field label="Nhãn menu điều hướng">
                <input
                  className="admin-input"
                  value={newPageNav}
                  onChange={(e) => setNewPageNav(e.target.value)}
                  placeholder="VD: Triển lãm"
                />
              </Field>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewPageModalOpen(false)}
                  className="rounded-lg border border-stone-700 px-4 py-2 text-xs font-semibold text-stone-300 hover:bg-stone-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingPage}
                  className="rounded-lg bg-[#C5A880] px-4 py-2 text-xs font-bold text-black hover:bg-[#d6bc96] disabled:opacity-50"
                >
                  {creatingPage ? "Đang tạo..." : "Tạo trang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * ============================================================================
 * SECTION EDITOR COMPONENT
 * ============================================================================
 */
function SectionEditor({
  section,
  updateSection,
  updateItem,
  addItem,
  removeItem,
  onPreviewClick,
}: {
  section: PageSection;
  updateSection: <Key extends keyof PageSection>(
    id: string,
    key: Key,
    value: PageSection[Key],
  ) => void;
  updateItem: (
    sectionId: string,
    itemId: string,
    patch: Partial<PageSectionItem>,
  ) => void;
  addItem: (section: PageSection) => void;
  removeItem: (section: PageSection, itemId: string) => void;
  moveSection?: (id: string, direction: -1 | 1) => void;
  onPreviewClick: () => void;
}) {
  const typeConfig =
    SECTION_TYPE_CONFIG[section.type] || {
      label: section.type,
      description: "",
      badgeColor: "bg-stone-800 text-stone-200",
    };

  const isContactHeader = section.id === "contact-header";
  const isContactInfo =
    section.id === "contact-info" ||
    (section.type === "contact" && section.name.toLowerCase().includes("thông tin"));
  const isContactForm =
    section.id === "contact-form" ||
    (section.type === "feature" && section.name.toLowerCase().includes("biểu mẫu"));

  return (
    <div className="space-y-6 rounded-xl border border-stone-800 bg-[#141417] p-5 sm:p-6 shadow-sm">
      {/* Section Toolbar */}
      <div className="flex flex-col gap-3 border-b border-stone-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${typeConfig.badgeColor}`}
          >
            {typeConfig.label}
          </span>
          <h3 className="font-serif text-lg font-semibold text-white truncate">
            {section.name}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onPreviewClick}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-300 hover:text-white"
            title="Xem trong Preview"
          >
            <Eye className="h-3.5 w-3.5 text-[#C5A880]" />
            Preview 1:1
          </button>
          <div className="mx-1 h-4 w-px bg-stone-700" />
          <label className="flex items-center gap-2 text-xs font-medium text-stone-300">
            <input
              type="checkbox"
              checked={section.enabled}
              onChange={(e) =>
                updateSection(section.id, "enabled", e.target.checked)
              }
              className="rounded accent-[#C5A880]"
            />
            Hiển thị khối
          </label>
        </div>
      </div>

      {/* Contextual Guidance Banners */}
      {isContactHeader && (
        <div className="rounded-lg border border-stone-800 bg-[#0C0C0E] p-3.5 text-xs text-stone-300">
          <p className="font-medium flex items-center gap-1.5 text-stone-200">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A880]" /> Khối Tiêu đề & Lời mở đầu trang Liên hệ
          </p>
          <p className="mt-1 text-stone-400 text-[11px] leading-relaxed">
            Khối này hiển thị phần mở đầu trang trọng theo chuẩn nhận diện Hanoia (Huy hiệu Concierge, tiêu đề lớn &apos;LIÊN HỆ VỚI HANOIA&apos;, đường phân cách vàng và thông điệp mở đầu).
          </p>
        </div>
      )}

      {isContactInfo && (
        <div className="rounded-lg border border-stone-800 bg-[#0C0C0E] p-3.5 text-xs text-stone-300">
          <p className="font-medium flex items-center gap-1.5 text-stone-200">
            <Phone className="h-3.5 w-3.5 text-stone-400" /> Cột trái: Thông tin trực tuyến & Trụ sở
          </p>
          <p className="mt-1 text-stone-400 text-[11px] leading-relaxed">
            Quản lý 4 kênh thông tin hỗ trợ trực tiếp hiển thị tại cột bên trái: Hotline, Email, Văn phòng trụ sở và Giờ làm việc.
          </p>
        </div>
      )}

      {isContactForm && (
        <div className="rounded-lg border border-stone-800 bg-[#0C0C0E] p-3.5 text-xs text-stone-300">
          <p className="font-medium flex items-center gap-1.5 text-stone-200">
            <Send className="h-3.5 w-3.5 text-stone-400" /> Cột phải: Biểu mẫu gửi lời nhắn & Chủ đề tư vấn
          </p>
          <p className="mt-1 text-stone-400 text-[11px] leading-relaxed">
            Quản lý tiêu đề biểu mẫu bên phải trang Liên hệ và các tùy chọn chủ đề tư vấn trong menu chọn (dropdown) của khách hàng.
          </p>
        </div>
      )}

      {/* Main Parameters Form */}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tên quản trị nội bộ">
          <input
            className="admin-input"
            value={section.name}
            onChange={(e) => updateSection(section.id, "name", e.target.value)}
          />
        </Field>

        <Field label="Loại khối giao diện">
          <div className="admin-input flex items-center justify-between select-none">
            <span className="font-medium text-stone-200">
              {SECTION_TYPE_CONFIG[section.type]?.label || section.type}
            </span>
            <span className="rounded border border-stone-700 bg-stone-800 px-2 py-0.5 text-[10px] font-mono text-stone-300 uppercase">
              {section.type}
            </span>
          </div>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nhãn phụ (Eyebrow / Subtitle)">
          <input
            className="admin-input"
            value={section.eyebrow}
            onChange={(e) =>
              updateSection(section.id, "eyebrow", e.target.value)
            }
            placeholder="VD: DI SẢN THỦ CÔNG VIỆT NAM"
          />
        </Field>

        <Field label="Huy hiệu / Badge (nếu có)">
          <input
            className="admin-input"
            value={section.badge || ""}
            onChange={(e) => updateSection(section.id, "badge", e.target.value)}
            placeholder="VD: FLAGSHIP BOUTIQUE, BST 2026..."
          />
        </Field>
      </div>

      <Field label="Tiêu đề chính (Title)">
        <input
          className="admin-input font-serif text-sm"
          value={section.title}
          onChange={(e) => updateSection(section.id, "title", e.target.value)}
          placeholder="Nhập tiêu đề khối..."
        />
      </Field>

      <Field label="Nội dung chi tiết (Body - Hỗ trợ nhiều đoạn văn)">
        <textarea
          rows={5}
          className="admin-input resize-y leading-relaxed text-xs"
          value={section.body}
          onChange={(e) => updateSection(section.id, "body", e.target.value)}
          placeholder="Nhập nội dung, xuống dòng 2 lần để tạo đoạn mới..."
        />
      </Field>

      {/* Image Upload Area (Hidden for contact sections) */}
      {!isContactHeader && !isContactInfo && !isContactForm && (
        <div className="rounded-xl border border-stone-800 bg-[#0C0C0E] p-4 space-y-4">
          <ImageUploadWithPreview
            label="Hình ảnh minh họa khối giao diện"
            value={section.image || ""}
            onChange={(url) => updateSection(section.id, "image", url)}
            aspectRatio={section.type === "hero" ? "wide" : "video"}
            helperText="Tải ảnh lên từ máy tính hoặc nhập đường dẫn URL ảnh. Ảnh sẽ hiển thị ngay lập tức trong Preview."
          />
          <Field label="Mô tả ảnh dành cho SEO và trợ năng (Alt text)">
            <input
              className="admin-input"
              value={section.imageAlt || ""}
              onChange={(e) =>
                updateSection(section.id, "imageAlt", e.target.value)
              }
              placeholder="Mô tả ngắn gọn nội dung của ảnh..."
            />
          </Field>
        </div>
      )}

      {/* CTA Buttons Configuration (Hidden for contact header/info) */}
      {!isContactHeader && !isContactInfo && (
        <div className="rounded-xl border border-stone-800 bg-[#0C0C0E] p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Nút kêu gọi hành động (Call To Action)
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nhãn nút chính (CTA Label)">
              <input
                className="admin-input"
                value={section.ctaLabel || ""}
                onChange={(e) =>
                  updateSection(section.id, "ctaLabel", e.target.value)
                }
                placeholder="VD: Khám phá bộ sưu tập"
              />
            </Field>
            <Field label="Liên kết nút chính (CTA Link)">
              <input
                className="admin-input"
                value={section.ctaHref || ""}
                onChange={(e) =>
                  updateSection(section.id, "ctaHref", e.target.value)
                }
                placeholder="VD: /collections/all hoặc /stores"
              />
            </Field>
          </div>
        </div>
      )}

      {/* Sub-Items List (Stats, Process steps, Boutiques, Policies, Contact channels, Form subjects) */}
      <div className="space-y-4 border-t border-stone-800 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-white">
              {isContactInfo
                ? `Danh sách kênh thông tin liên hệ (${section.items.length} kênh)`
                : isContactForm
                  ? `Danh sách chủ đề tư vấn trong Dropdown (${section.items.length} chủ đề)`
                  : `Danh sách mục con (${section.items.length} mục)`}
            </h4>
            <p className="text-[11px] text-stone-400">
              {isContactInfo
                ? "Quản lý 4 kênh hỗ trợ chính thức: Hotline, Email, Trụ sở văn phòng và Giờ làm việc."
                : isContactForm
                  ? "Khách hàng sẽ chọn một trong các chủ đề này khi gửi lời nhắn trực tiếp trên trang liên hệ."
                  : "Quản lý các thẻ số liệu, bước chế tác, danh sách cửa hàng hoặc sản phẩm nổi bật."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => addItem(section)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#C5A880]/10 border border-[#C5A880]/30 px-3 py-1.5 text-xs font-semibold text-[#C5A880] hover:bg-[#C5A880]/20"
          >
            <Plus className="h-3.5 w-3.5" />
            {isContactForm ? "Thêm chủ đề" : isContactInfo ? "Thêm kênh liên hệ" : "Thêm mục con"}
          </button>
        </div>

        {section.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-800 p-6 text-center text-xs text-stone-500">
            Khối này hiện chưa có mục con nào. Bấm &ldquo;Thêm mục con&rdquo; nếu bạn muốn hiển thị dạng danh sách / thẻ.
          </div>
        ) : (
          <div className="space-y-3">
            {section.items.map((item, index) => (
              <div
                key={item.id}
                className="space-y-3 rounded-lg border border-stone-800 bg-[#0C0C0E] p-3.5"
              >
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                  <span className="text-[10px] font-semibold uppercase text-[#C5A880]">
                    {isContactInfo
                      ? `Kênh liên hệ #${index + 1}`
                      : isContactForm
                        ? `Chủ đề tư vấn #${index + 1}`
                        : `Mục #${index + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(section, item.id)}
                    className="text-stone-500 hover:text-red-400"
                    title="Xóa mục này"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label={
                      isContactInfo
                        ? "Giá trị nổi bật (Số hotline, Email, Địa chỉ, Giờ mở cửa)"
                        : isContactForm
                          ? "Mã chủ đề (vd: tu-van, bespoke, qua-tang...)"
                          : section.type === "stats"
                            ? "Số liệu hiển thị (vd: 28+, 32, 100%)"
                            : section.type === "process"
                              ? "Số thứ tự bước (vd: 01, 02)"
                              : section.type === "showcase"
                                ? "Giá bán sản phẩm (vd: 5.650.000 ₫)"
                                : section.type === "stores"
                                  ? "Giờ mở cửa (vd: 08:30 - 21:00)"
                                  : "Giá trị / Số / Tag"
                    }
                  >
                    <input
                      className="admin-input"
                      value={item.value || ""}
                      onChange={(e) =>
                        updateItem(section.id, item.id, { value: e.target.value })
                      }
                      placeholder={
                        isContactInfo
                          ? "VD: 1800 1234 hoặc contact@everievn.com"
                          : isContactForm
                            ? "VD: tu-van-son-mai"
                            : ""
                      }
                    />
                  </Field>

                  <Field
                    label={
                      isContactInfo
                        ? "Tên kênh liên hệ (vd: Hotline chăm sóc khách hàng:)"
                        : isContactForm
                          ? "Tên chủ đề hiển thị trong Dropdown"
                          : section.type === "stores"
                            ? "Tên cửa hàng / Boutique"
                            : section.type === "showcase"
                              ? "Tên tác phẩm / sản phẩm"
                              : section.type === "process"
                                ? "Tên công đoạn chế tác"
                                : "Tiêu đề mục con"
                    }
                  >
                    <input
                      className="admin-input"
                      value={item.title}
                      onChange={(e) =>
                        updateItem(section.id, item.id, { title: e.target.value })
                      }
                      placeholder={
                        isContactInfo
                          ? "VD: Hotline chăm sóc khách hàng:"
                          : isContactForm
                            ? "VD: Tư vấn chọn tác phẩm sơn mài"
                            : ""
                      }
                    />
                  </Field>
                </div>

                {!isContactForm && (
                  <Field
                    label={
                      isContactInfo
                        ? "Ghi chú phụ (vd: (Miễn cước, từ 08:30 - 21:00 hàng ngày) hoặc địa chỉ chi nhánh)"
                        : section.type === "stores"
                          ? "Địa chỉ & Số điện thoại hotline"
                          : "Mô tả chi tiết"
                    }
                  >
                    <textarea
                      rows={2}
                      className="admin-input resize-y"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(section.id, item.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder={
                        isContactInfo
                          ? "VD: (Miễn cước, từ 08:30 - 21:00 hàng ngày)"
                          : ""
                      }
                    />
                  </Field>
                )}

                {/* Optional Image for Item (Showcase, Boutique, etc) */}
                {(section.type === "showcase" ||
                  section.type === "stores" ||
                  (!isContactInfo && !isContactForm && section.type === "hero") ||
                  (!isContactInfo && !isContactForm && item.image)) && (
                  <div className="grid gap-3 sm:grid-cols-2 pt-2">
                    <Field label="Đường dẫn ảnh mục con">
                      <input
                        className="admin-input text-xs"
                        value={item.image || ""}
                        onChange={(e) =>
                          updateItem(section.id, item.id, {
                            image: e.target.value,
                          })
                        }
                        placeholder="/images/hanoia/... hoặc https://..."
                      />
                    </Field>
                    <Field label="Huy hiệu / Badge (vd: Best Seller, Flagship)">
                      <input
                        className="admin-input text-xs"
                        value={item.badge || ""}
                        onChange={(e) =>
                          updateItem(section.id, item.id, {
                            badge: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </span>
      {children}
    </label>
  );
}
