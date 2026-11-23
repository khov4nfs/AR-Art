"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  CircleDot,
  ImageIcon,
  LoaderCircle,
  Pencil,
  Plus,
} from "lucide-react";

import { AmbientDivider } from "@/components/atoms/ambient-divider";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/atoms/button";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";
import { ArtworkCreateModal } from "@/features/artwork/presentation/components/artwork-create-modal";
import { getCurrentCollectionUser } from "@/features/collection/infrastructure/local/collection-repository";
import { ProductManagerModal } from "@/features/studio/presentation/components/product-manager-modal";

type StudioView = "overview" | "products";

type StudioState = {
  phase: "checking" | "loading" | "ready" | "error";
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

const initialState: StudioState = {
  phase: "checking",
  products: [],
  error: null,
  productEditorId: null,
};

function reducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "loading":
      return { ...state, phase: "loading", error: null };
    case "ready":
      return {
        phase: "ready",
        products: action.products,
        error: null,
        productEditorId: state.productEditorId,
      };
    case "product-saved":
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.product.id ? action.product : product,
        ),
        productEditorId: action.product.id,
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

function productModeLabel(mode: PublishedArtwork["arMode"], t: (key: string) => string) {
  if (mode === "transparent_motion") return t("ar.studio.modeTransparent");
  if (mode === "spatial_layers") return t("ar.studio.modeLayers");
  return t("ar.studio.modeAnimated");
}

function ProductCard({
  product,
  onManage,
}: {
  product: PublishedArtwork;
  onManage: () => void;
}) {
  const { t } = useLanguage();
  return (
    <article className="group relative">
      <div className="ar-admin-artwork-image relative aspect-[4/5] overflow-hidden rounded-[6px] bg-black/60 shadow-[0_24px_70px_rgba(0,0,0,0.28)] ring-1 ring-inset ring-white/[0.05]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.targetImageUrl}
          alt={product.title}
          className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.035] group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className={`absolute left-4 top-4 inline-flex items-center gap-2 text-[0.56rem] font-medium uppercase tracking-[0.16em] ${product.status === "published" ? "text-emerald-100/82" : "text-white/58"}`}>
          <span className={`size-1.5 rounded-full ${product.status === "published" ? "bg-emerald-200" : "bg-white/45"}`} />
          {t(product.status === "published" ? "ar.studio.live" : "ar.common.draft")}
        </span>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
          <p className="text-[0.56rem] uppercase tracking-[0.15em] text-white/48">
            {productModeLabel(product.arMode, t)}
          </p>
          {product.status === "published" ? (
            <Link
              href={`/art/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-8 items-center justify-center rounded-full bg-black/38 text-white/58 backdrop-blur-md transition duration-300 hover:bg-white hover:text-black"
              aria-label={t("ar.studio.open", { title: product.title })}
            >
              <ArrowUpRight className="size-4" />
            </Link>
          ) : null}
        </div>
      </div>
      <div className="py-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="min-w-0">
            <h3 className="truncate text-base font-medium text-white">{product.title}</h3>
            <p className="mt-1 truncate text-xs text-white/38">{t("ar.common.by", { name: product.artistName })}</p>
          </div>
          <button
            type="button"
            onClick={onManage}
            className="group/manage inline-flex items-center gap-2 justify-self-start pb-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-white/48 transition-colors duration-300 hover:text-white sm:justify-self-end"
          >
            <Pencil className="size-3.5" />
            {t("ar.studio.manage")}
            <span className="h-px w-5 bg-white/24 transition-all duration-300 group-hover/manage:w-8 group-hover/manage:bg-white/70" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4 text-[0.56rem] uppercase tracking-[0.13em] text-white/24">
          <span>{t(product.status === "published" ? "ar.studio.statusPublished" : "ar.studio.statusDraft")}</span>
          <span className="text-right text-white/34">
            {t(product.status === "published" ? "ar.studio.qrReady" : "ar.studio.continueEditing")}
          </span>
        </div>
      </div>
    </article>
  );
}

export function StudioApp() {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [createOpen, setCreateOpen] = useState(false);
  const [adminView, setAdminView] = useState<StudioView>("overview");

  const load = useCallback(async () => {
    dispatch({ type: "loading" });
    const user = await getCurrentCollectionUser();
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const productsResponse = await fetch("/api/studio/products", { credentials: "same-origin" });

    const productsPayload = (await productsResponse.json()) as {
      products?: PublishedArtwork[];
      error?: string;
    };
    if (!productsResponse.ok || !productsPayload.products) {
      throw new Error(productsPayload.error ?? "ar.studio.loadProductsError");
    }

    dispatch({ type: "ready", products: productsPayload.products });
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

  return (
    <section className="ar-admin-manager relative min-w-0">
      <div className="relative w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <nav className="flex items-center gap-2" aria-label={t("ar.admin.manager")}>
              <button type="button" onClick={() => setAdminView("overview")} aria-pressed={adminView === "overview"} className={adminView === "overview" ? "rounded-md bg-[#C5A880] px-4 py-2.5 text-sm text-black" : "rounded-md bg-stone-900 px-4 py-2.5 text-sm text-stone-300 transition hover:text-white"}>{t("ar.studio.overview")}</button>
              <button type="button" onClick={() => setAdminView("products")} aria-pressed={adminView === "products"} className={adminView === "products" ? "rounded-md bg-[#C5A880] px-4 py-2.5 text-sm text-black" : "rounded-md bg-stone-900 px-4 py-2.5 text-sm text-stone-300 transition hover:text-white"}>{t("ar.studio.products")}</button>
            </nav>
            <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-[#C5A880] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#E3C89D]"><Plus className="size-4" />{t("ar.admin.publish")}</button>
          </div>

        {state.phase !== "ready" ? (
          <section className="flex min-h-[70vh] items-center justify-center">
            {state.phase === "error" ? (
              <div className="max-w-md rounded-[5px] bg-rose-300/[0.035] px-5 py-6 text-center">
                <p className="text-sm text-rose-200">{state.error?.startsWith("ar.") ? t(state.error) : state.error}</p>
                <Button onClick={() => void load()} className="mt-4 bg-white text-black">{t("ar.common.retry")}</Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-white/45">
                <LoaderCircle className="size-4 animate-spin" />
                {t("ar.studio.loading")}
              </div>
            )}
          </section>
        ) : (
          <>
            {adminView === "overview" && (
              <section className="studio-view-enter pb-10 pt-8">
                <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <h2 className="max-w-4xl font-serif text-4xl font-normal leading-tight tracking-[-0.04em] sm:text-5xl">
                      {t("ar.studio.allPublished")}<br /><span className="bg-gradient-to-r from-amber-200 to-amber-200 bg-clip-text italic text-transparent">{t("ar.studio.onePlace")}</span>
                    </h2>
                  </div>

                  <div data-reveal className="lg:pl-8">
                    <div className="grid grid-cols-3">
                      {[
                        [state.products.length, t("ar.studio.products"), Boxes],
                        [published, t("ar.studio.live"), CircleDot],
                        [drafts, t("ar.studio.drafts"), ImageIcon],
                      ].map(([value, label, Icon], index) => {
                        const MetricIcon = Icon as typeof Boxes;
                        return (
                          <div
                            key={String(label)}
                            className={`py-5 ${index > 0 ? "pl-5 sm:pl-7" : ""}`}
                          >
                            <div className="flex items-center gap-2 text-white/30">
                              <MetricIcon className="size-3.5" />
                              <span className="text-[0.56rem] uppercase tracking-[0.16em]">
                                {String(label)}
                              </span>
                            </div>
                            <p className="mt-8 font-serif text-4xl leading-none tracking-[-0.04em] text-white sm:text-5xl">
                              {String(value).padStart(2, "0")}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <AmbientDivider className="mt-10" />
                <div className="pt-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-medium">{t("ar.studio.recent")}</h2>
                    <button type="button" onClick={() => setAdminView("products")} className="text-xs text-stone-400 transition-colors duration-300 hover:text-[#C5A880]">{t("ar.studio.viewAll")}</button>
                  </div>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {state.products.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onManage={() => dispatch({ type: "open-product", productId: product.id })}
                      />
                    ))}
                    {state.products.length === 0 && (
                      <p className="col-span-full p-8 text-center text-sm text-white/35">
                        {t("ar.studio.empty")}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {adminView === "products" && (
              <section className="studio-view-enter pb-10 pt-8">
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <h2 className="font-serif text-4xl font-normal tracking-[-0.04em] sm:text-5xl">{t("ar.studio.products")}</h2>
                  <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 border-b border-white/45 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-white/72 transition-[border-color,color] duration-300 hover:border-white hover:text-white">
                    <Plus className="size-3.5" /> {t("ar.studio.new")}
                  </button>
                </div>
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {state.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onManage={() => dispatch({ type: "open-product", productId: product.id })}
                    />
                  ))}
                  {state.products.length === 0 && (
                    <div className="p-12 text-center text-white/35 sm:col-span-2 lg:col-span-3">
                      <ImageIcon className="mx-auto size-6" />
                      <p className="mt-3 text-sm">{t("ar.studio.noProducts")}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            <ProductManagerModal
              key={selectedProduct?.id ?? "no-product"}
              product={selectedProduct}
              onClose={() => dispatch({ type: "close-product" })}
              onSaved={(product) => dispatch({ type: "product-saved", product })}
              onDeleted={(productId) => dispatch({ type: "product-deleted", productId })}
            />
          </>
        )}
      </div>

      <ArtworkCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void load()}
      />
    </section>
  );
}
