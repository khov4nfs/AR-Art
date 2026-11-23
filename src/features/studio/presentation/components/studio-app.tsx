"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ExternalLink,
  ImageIcon,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
} from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";
import { ArtworkCreateModal } from "@/features/artwork/presentation/components/artwork-create-modal";
import { getCurrentCollectionUser } from "@/features/collection/infrastructure/local/collection-repository";
import { ProductManagerModal } from "@/features/studio/presentation/components/product-manager-modal";

type StatusFilter = "all" | "published" | "draft";
type StudioState = {
  phase: "loading" | "ready" | "error";
  products: PublishedArtwork[];
  error: string | null;
  productEditorId: string | null;
};
type StudioAction =
  | { type: "loading" }
  | { type: "ready"; products: PublishedArtwork[] }
  | { type: "product-saved"; product: PublishedArtwork }
  | { type: "product-deleted"; productId: string }
  | { type: "open-product"; productId: string }
  | { type: "close-product" }
  | { type: "error"; message: string };

const PAGE_SIZE = 10;
const initialState: StudioState = {
  phase: "loading",
  products: [],
  error: null,
  productEditorId: null,
};

function reducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "loading":
      return { ...state, phase: "loading", error: null };
    case "ready":
      return { ...state, phase: "ready", products: action.products, error: null };
    case "product-saved":
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.product.id ? action.product : product,
        ),
      };
    case "product-deleted":
      return {
        ...state,
        products: state.products.filter((product) => product.id !== action.productId),
        productEditorId: null,
      };
    case "open-product":
      return { ...state, productEditorId: action.productId };
    case "close-product":
      return { ...state, productEditorId: null };
    case "error":
      return { ...state, phase: "error", error: action.message };
  }
}

function modeLabel(mode: PublishedArtwork["arMode"], t: (key: string) => string) {
  if (mode === "transparent_motion") return t("ar.studio.modeTransparent");
  if (mode === "spatial_layers") return t("ar.studio.modeLayers");
  return t("ar.studio.modeAnimated");
}

export function StudioApp() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    dispatch({ type: "loading" });
    const user = await getCurrentCollectionUser();
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const response = await fetch("/api/studio/products", {
      credentials: "same-origin",
    });
    const payload = (await response.json()) as {
      products?: PublishedArtwork[];
      error?: string;
    };
    if (!response.ok || !payload.products) {
      throw new Error(payload.error ?? "ar.studio.loadProductsError");
    }
    dispatch({ type: "ready", products: payload.products });
  }, [pathname, router]);

  useEffect(() => {
    void load().catch((cause) => {
      dispatch({
        type: "error",
        message: cause instanceof Error ? cause.message : "ar.studio.loadError",
      });
    });
  }, [load]);

  const published = state.products.filter((product) => product.status === "published").length;
  const drafts = state.products.length - published;
  const selectedProduct = state.productEditorId
    ? state.products.find((product) => product.id === state.productEditorId) ?? null
    : null;

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    return state.products
      .filter((product) =>
        (statusFilter === "all" || product.status === statusFilter) &&
        (!query ||
          product.title.toLocaleLowerCase().includes(query) ||
          product.artistName.toLocaleLowerCase().includes(query)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [searchTerm, state.products, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const firstRowIndex = (safePage - 1) * PAGE_SIZE;
  const rows = filteredProducts.slice(firstRowIndex, firstRowIndex + PAGE_SIZE);

  function updateStatus(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <div className="ar-admin-manager w-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* The same heading scale, page gutter and action hierarchy as /admin/products. */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold tracking-wide text-white">
            {t("ar.admin.manager")}
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-stone-400">
            {t("ar.admin.managerDesc")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/gallery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-700/60 bg-stone-800/80 px-3.5 py-2 text-xs font-medium text-stone-200 transition-colors hover:bg-stone-700"
          >
            <ExternalLink className="size-3.5" />
            {t("ar.nav.gallery")}
          </Link>
          <Link
            href="/ar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-700/60 bg-stone-800/80 px-3.5 py-2 text-xs font-medium text-stone-200 transition-colors hover:bg-stone-700"
          >
            <ScanLine className="size-3.5" />
            {t("ar.nav.scan")}
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            disabled={state.phase === "loading"}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-700/60 bg-stone-800/80 px-3.5 py-2 text-xs font-medium text-stone-200 transition-colors hover:bg-stone-700 disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${state.phase === "loading" ? "animate-spin" : ""}`} />
            {t("ar.admin.refresh")}
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#C5A880] px-4 py-2 text-xs font-semibold text-black shadow-md shadow-[#C5A880]/20 transition-colors hover:bg-[#b59870]"
          >
            <Plus className="size-4" />
            {t("ar.admin.publish")}
          </button>
        </div>
      </div>

      {/* Dashboard KPIs reuse the existing EVERIE card surfaces. */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: t("ar.admin.totalProducts"), value: state.products.length, Icon: Boxes },
          { label: t("ar.studio.statusPublished"), value: published, Icon: CircleDot },
          { label: t("ar.studio.drafts"), value: drafts, Icon: ImageIcon },
        ].map(({ label, value, Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-stone-800 bg-[#141417] p-5 shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                {label}
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-stone-700/50 bg-stone-800/80 text-[#C5A880]">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Search and status filters follow the admin catalog rather than a second Studio navigation. */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-stone-800/80 bg-[#141417] p-4 md:flex-row md:items-center">
        <div className="relative w-full max-w-md flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder={t("ar.admin.searchPlaceholder")}
            aria-label={t("ar.admin.searchPlaceholder")}
            className="w-full rounded-lg border border-stone-800 bg-[#1A1A1D] py-2 pl-10 pr-4 text-xs text-stone-200 outline-none transition-colors placeholder:text-stone-500 focus:border-[#C5A880]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("ar.admin.statusFilter")}>
          {([
            ["all", t("ar.admin.all"), state.products.length],
            ["published", t("ar.studio.statusPublished"), published],
            ["draft", t("ar.studio.drafts"), drafts],
          ] as const).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              aria-pressed={statusFilter === value}
              onClick={() => updateStatus(value)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${statusFilter === value
                ? "border-[#C5A880]/50 bg-[#C5A880]/15 text-[#C5A880]"
                : "border-stone-800 bg-stone-800/60 text-stone-400 hover:bg-stone-700 hover:text-white"
              }`}
            >
              {label} <span className="ml-1 font-mono tabular-nums opacity-70">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-stone-800/80 bg-[#141417] shadow-xl" aria-label={t("ar.studio.products")}>
        <div className="flex items-center justify-between gap-3 border-b border-stone-800/80 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-white">{t("ar.studio.products")}</h2>
            <p className="mt-1 text-[11px] text-stone-400">
              {t("ar.admin.showing", { count: String(filteredProducts.length) })}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-800/80 bg-[#17171A] text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                <th scope="col" className="w-20 px-4 py-3.5">{t("ar.admin.image")}</th>
                <th scope="col" className="px-4 py-3.5">{t("ar.admin.productAndCreator")}</th>
                <th scope="col" className="px-4 py-3.5">{t("ar.admin.arMode")}</th>
                <th scope="col" className="px-4 py-3.5">{t("ar.admin.statusFilter")}</th>
                <th scope="col" className="px-4 py-3.5">{t("ar.admin.created")}</th>
                <th scope="col" className="px-4 py-3.5 text-right">{t("ar.admin.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/40 text-xs">
              {state.phase === "loading" ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-stone-400">
                    <LoaderCircle className="mx-auto mb-2 size-5 animate-spin text-[#C5A880]" />
                    {t("ar.studio.loading")}
                  </td>
                </tr>
              ) : state.phase === "error" ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p role="alert" className="text-sm text-rose-400">
                      {state.error?.startsWith("ar.") ? t(state.error) : state.error}
                    </p>
                    <button
                      type="button"
                      onClick={() => void load()}
                      className="mt-4 rounded-lg border border-stone-700 bg-stone-800 px-4 py-2 text-xs text-stone-200 hover:bg-stone-700"
                    >
                      {t("ar.common.retry")}
                    </button>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-stone-400">
                    <ImageIcon className="mx-auto mb-3 size-6 text-stone-500" />
                    {state.products.length === 0 ? t("ar.studio.noProducts") : t("ar.admin.noMatches")}
                  </td>
                </tr>
              ) : (
                rows.map((product) => (
                  <tr key={product.id} className="group transition-colors hover:bg-stone-800/30">
                    <td className="px-4 py-3">
                      <div className="size-12 overflow-hidden rounded-lg border border-stone-800 bg-stone-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.targetImageUrl}
                          alt={product.title}
                          className="size-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td className="max-w-[310px] px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "open-product", productId: product.id })}
                        className="block max-w-full truncate text-left text-sm font-medium text-stone-200 transition-colors hover:text-[#C5A880]"
                      >
                        {product.title}
                      </button>
                      <p className="mt-1 truncate text-[11px] text-stone-400">{product.artistName}</p>
                    </td>
                    <td className="px-4 py-3.5 text-stone-300">{modeLabel(product.arMode, t)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${product.status === "published"
                        ? "border-emerald-800/60 bg-emerald-950/60 text-emerald-400"
                        : "border-stone-700 bg-stone-800 text-stone-300"
                      }`}>
                        <span className={`size-1.5 rounded-full ${product.status === "published" ? "bg-emerald-400" : "bg-stone-500"}`} />
                        {t(product.status === "published" ? "ar.studio.statusPublished" : "ar.studio.statusDraft")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-stone-400">
                      {new Date(product.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "open-product", productId: product.id })}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-2.5 py-2 text-xs font-medium text-stone-300 transition-colors hover:bg-[#C5A880] hover:text-black"
                          title={t("ar.studio.manage")}
                        >
                          <Pencil className="size-3.5" /> {t("ar.studio.manage")}
                        </button>
                        {product.status === "published" ? (
                          <Link
                            href={`/art/${product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-stone-700 bg-stone-800 p-2 text-stone-400 transition-colors hover:bg-stone-700 hover:text-white"
                            aria-label={t("ar.studio.open", { title: product.title })}
                          >
                            <ArrowUpRight className="size-3.5" />
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {state.phase === "ready" && filteredProducts.length > PAGE_SIZE ? (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-800/80 px-4 py-3 text-xs text-stone-400 sm:px-5">
            <span>{firstRowIndex + 1}–{Math.min(firstRowIndex + PAGE_SIZE, filteredProducts.length)} / {filteredProducts.length}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)}
                className="rounded-lg border border-stone-700 bg-stone-800 p-2 text-stone-300 transition hover:bg-stone-700 disabled:opacity-30"
                aria-label={t("ar.admin.previousPage")}
              ><ChevronLeft className="size-4" /></button>
              <span className="font-mono tabular-nums">{safePage} / {pageCount}</span>
              <button
                type="button"
                disabled={safePage === pageCount}
                onClick={() => setPage(safePage + 1)}
                className="rounded-lg border border-stone-700 bg-stone-800 p-2 text-stone-300 transition hover:bg-stone-700 disabled:opacity-30"
                aria-label={t("ar.admin.nextPage")}
              ><ChevronRight className="size-4" /></button>
            </div>
          </div>
        ) : null}
      </section>

      <ProductManagerModal
        key={selectedProduct?.id ?? "no-product"}
        product={selectedProduct}
        onClose={() => dispatch({ type: "close-product" })}
        onSaved={(product) => dispatch({ type: "product-saved", product })}
        onDeleted={(productId) => dispatch({ type: "product-deleted", productId })}
      />
      <ArtworkCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void load()}
      />
    </div>
  );
}
