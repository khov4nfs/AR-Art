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
import { BackLink } from "@/components/atoms/back-link";
import { Button } from "@/components/atoms/button";
import { EverieBrand } from "@/components/atoms/everie-brand";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import { ArtworkCreateModal } from "@/features/artwork/presentation/components/artwork-create-modal";
import { CreatorSpatialScene } from "@/features/artwork/presentation/components/creator-spatial-scene";
import { getCurrentCollectionUser } from "@/features/collection/infrastructure/supabase/collection-repository";
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

function navClass(active: boolean) {
  return `group relative px-1 py-5 text-[0.62rem] font-semibold uppercase tracking-[0.15em] transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-center after:bg-white after:transition-transform after:duration-300 ${
    active
      ? "text-white after:scale-x-100"
      : "text-white/34 after:scale-x-0 hover:text-white/72"
  }`;
}

function productModeLabel(mode: PublishedArtwork["arMode"]) {
  if (mode === "transparent_motion") return "Transparent motion";
  if (mode === "spatial_layers") return "Layered AR";
  return "Animated artwork";
}

function ProductCard({
  product,
  onManage,
}: {
  product: PublishedArtwork;
  onManage: () => void;
}) {
  return (
    <article className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[6px] bg-black/60 shadow-[0_24px_70px_rgba(0,0,0,0.28)] ring-1 ring-inset ring-white/[0.05]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.targetImageUrl}
          alt={product.title}
          className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.035] group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className={`absolute left-4 top-4 inline-flex items-center gap-2 text-[0.56rem] font-medium uppercase tracking-[0.16em] ${product.status === "published" ? "text-emerald-100/82" : "text-white/58"}`}>
          <span className={`size-1.5 rounded-full ${product.status === "published" ? "bg-emerald-200" : "bg-white/45"}`} />
          {product.status === "published" ? "Live" : "Draft"}
        </span>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
          <p className="text-[0.56rem] uppercase tracking-[0.15em] text-white/48">
            {productModeLabel(product.arMode)}
          </p>
          {product.status === "published" ? (
            <Link
              href={`/art/${product.slug}`}
              className="flex size-8 items-center justify-center rounded-full bg-black/38 text-white/58 backdrop-blur-md transition duration-300 hover:bg-white hover:text-black"
              aria-label={`Open ${product.title}`}
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
            <p className="mt-1 truncate text-xs text-white/38">by {product.artistName}</p>
          </div>
          <button
            type="button"
            onClick={onManage}
            className="group/manage inline-flex items-center gap-2 justify-self-start pb-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-white/48 transition-colors duration-300 hover:text-white sm:justify-self-end"
          >
            <Pencil className="size-3.5" />
            Manage
            <span className="h-px w-5 bg-white/24 transition-all duration-300 group-hover/manage:w-8 group-hover/manage:bg-white/70" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4 text-[0.56rem] uppercase tracking-[0.13em] text-white/24">
          <span>{product.status === "published" ? "Published" : "Draft workspace"}</span>
          <span className="text-right text-white/34">
            {product.status === "published" ? "QR ready" : "Continue editing"}
          </span>
        </div>
      </div>
    </article>
  );
}

export function StudioApp({ view }: { view: StudioView }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    dispatch({ type: "loading" });
    const user = await getCurrentCollectionUser();
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const productsResponse = await fetch("/api/studio/products", {
      headers: { authorization: `Bearer ${sessionData.session.access_token}` },
    });

    const productsPayload = (await productsResponse.json()) as {
      products?: PublishedArtwork[];
      error?: string;
    };
    if (!productsResponse.ok || !productsPayload.products) {
      throw new Error(productsPayload.error ?? "Unable to load studio products.");
    }

    dispatch({ type: "ready", products: productsPayload.products });
  }, [pathname, router]);

  useEffect(() => {
    void load().catch((cause) => {
      dispatch({
        type: "error",
        message: cause instanceof Error ? cause.message : "Unable to load Studio.",
      });
    });
  }, [load]);

  const published = state.products.filter((product) => product.status === "published").length;
  const drafts = state.products.length - published;
  const selectedProduct = state.productEditorId
    ? state.products.find((product) => product.id === state.productEditorId) ?? null
    : null;

  return (
    <main className="creator-studio creator-studio-immersive relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-38"><CreatorSpatialScene /></div>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/66" />

      <div className="relative z-10 mx-auto min-h-screen w-full max-w-[94rem] px-5 sm:px-8 lg:px-12">
        <header className="everie-nav-surface sticky top-0 z-30 bg-[#050507]/88 backdrop-blur-xl">
          <div className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-5 sm:grid-cols-[1fr_auto_1fr]">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <BackLink href="/" className="shrink-0" />
              <span className="hidden h-4 w-px bg-white/12 md:block" aria-hidden="true" />
              <EverieBrand href="/studio" suffix="Studio" className="hidden opacity-90 md:inline-flex" />
            </div>

            <nav className="order-3 col-span-2 flex items-center justify-center gap-7 sm:order-none sm:col-span-1">
              <Link href="/studio" scroll={false} className={navClass(view === "overview")}>OVERVIEW</Link>
              <Link href="/studio/products" scroll={false} className={navClass(view === "products")}>PRODUCTS</Link>
            </nav>

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="justify-self-end inline-flex items-center gap-2 border-b border-white/45 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-white/72 transition-[border-color,color] duration-300 hover:border-white hover:text-white"
            >
              <Plus className="size-3.5" />
              Add product
            </button>
          </div>
        </header>

        {state.phase !== "ready" ? (
          <section className="flex min-h-[70vh] items-center justify-center">
            {state.phase === "error" ? (
              <div className="max-w-md rounded-[5px] bg-rose-300/[0.035] px-5 py-6 text-center">
                <p className="text-sm text-rose-200">{state.error}</p>
                <Button onClick={() => void load()} className="mt-4 bg-white text-black">Try again</Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-white/45">
                <LoaderCircle className="size-4 animate-spin" />
                Loading your studio…
              </div>
            )}
          </section>
        ) : (
          <>
            {view === "overview" && (
              <section className="studio-view-enter pb-16 pt-16 sm:pt-24">
                <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <h1 className="max-w-4xl font-serif text-6xl font-normal leading-[0.86] tracking-[-0.055em] sm:text-8xl">
                      Everything you publish,<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">in one place.</span>
                    </h1>
                  </div>

                  <div data-reveal className="lg:pl-8">
                    <div className="grid grid-cols-3">
                      {[
                        [state.products.length, "Products", Boxes],
                        [published, "Live", CircleDot],
                        [drafts, "Drafts", ImageIcon],
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
                    <h2 className="text-xl font-medium">Recent products</h2>
                    <Link href="/studio/products" scroll={false} className="text-xs text-white/50 transition-colors duration-300 hover:text-white">View all →</Link>
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
                        No products yet. Add your first AR product.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {view === "products" && (
              <section className="studio-view-enter pb-16 pt-14 sm:pt-20">
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <h1 className="font-serif text-6xl font-normal leading-none tracking-[-0.05em] sm:text-8xl">Products</h1>
                  <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 border-b border-white/45 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-white/72 transition-[border-color,color] duration-300 hover:border-white hover:text-white">
                    <Plus className="size-3.5" /> New product
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
                      <p className="mt-3 text-sm">No products yet.</p>
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
    </main>
  );
}
