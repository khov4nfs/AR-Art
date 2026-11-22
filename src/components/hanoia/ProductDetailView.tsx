"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Box,
  Gift,
  Truck,
} from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { useProducts } from "@/hooks/useProducts";
import {
  ENGRAVING_MAX_CHARS,
  craftDaysForLine,
  formatDayRange,
  productHref,
} from "@/lib/everie";
import { productReceiveRange } from "@/lib/orderRange";
import type { ProductItem } from "@/lib/store";
import type { ConfiguratorHandle } from "@/components/configurator/FlowerConfigurator";
import {
  ENGRAVING_FONTS,
  engravingFontById,
  engravingFontVariables,
} from "@/components/configurator/engravingFonts";
import {
  ENGRAVE_SYMBOLS,
  engravingCharCount,
  engravingFits,
  hasInvalidEngravingChars,
  normalizeEngraving,
  ENGRAVE_SPOT_MAX_CHARS,
  placementDegrees,
  placementFromAngle,
  placementLabel,
  type EngraveSpot,
  type EngravingFontId,
  type EngravingPlacement,
} from "@/lib/engraving";

// three.js (~600KB) is only fetched on the client, after the page is interactive.
const FlowerConfigurator = dynamic(
  () => import("@/components/configurator/FlowerConfigurator"),
  { ssr: false },
);

const GIFT_MAX = 200;
const FALLBACK_GLAZE = "#E8B4A2";

export default function ProductDetailView({
  idOrSlug,
}: {
  idOrSlug: string;
}) {
  const { addToCart, formatPrice } = useCart();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { products: allProducts } = useProducts();

  const [loaded, setLoaded] = useState<{ key: string; product: ProductItem | null } | null>(null);
  const fetchDone = loaded?.key === idOrSlug;
  const product = fetchDone ? loaded.product : null;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [engraveOn, setEngraveOn] = useState(false);
  const [engravingText, setEngravingText] = useState("");
  const [fontId, setFontId] = useState<EngravingFontId>("serif");
  const [placement, setPlacement] = useState<EngravingPlacement>("front");
  const [spot, setSpot] = useState<EngraveSpot | null>(null);
  const [picking, setPicking] = useState(false);
  const [giftOn, setGiftOn] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [show3d, setShow3d] = useState(true);
  const stickyBarRef = useRef<HTMLDivElement>(null);

  // Publish the mobile sticky bar height so floating support buttons sit above it.
  useEffect(() => {
    const el = stickyBarRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const root = document.documentElement;
    const sync = () => root.style.setProperty("--sticky-bar-h", `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--sticky-bar-h");
    };
  }, [product]);
  const [viewerFailed, setViewerFailed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const configuratorRef = useRef<ConfiguratorHandle | null>(null);
  const router = useRouter();
  const handleViewerFail = useCallback(() => setViewerFailed(true), []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/products/${encodeURIComponent(idOrSlug)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((res: { success?: boolean; data?: ProductItem }) => {
        if (cancelled) return;
        setLoaded({ key: idOrSlug, product: res.success && res.data ? res.data : null });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key: idOrSlug, product: null });
      });
    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  const [formFor, setFormFor] = useState<ProductItem | null>(null);
  if (product && formFor !== product) {
    setFormFor(product);
    setSelectedColor(product.colors?.[0]?.name ?? "");
    setActiveImageIndex(0);
    setQuantity(1);
    setEngraveOn(false);
    setEngravingText("");
    setGiftOn(false);
    setGiftMessage("");
    setShow3d(true);
    setViewerFailed(false);
    setAttempted(false);
  }

  const baseMaxChars = product?.maxEngravingChars ?? ENGRAVING_MAX_CHARS;
  const maxChars = placement === "spot" ? Math.min(baseMaxChars, ENGRAVE_SPOT_MAX_CHARS) : baseMaxChars;
  const trimmedEngraving = engravingText.trim();
  const engravingChars = engravingCharCount(engravingText);
  const remainingChars = Math.max(0, maxChars - engravingChars);
  const activeFont = engravingFontById(fontId);
  const engravingError = !engraveOn || !trimmedEngraving
    ? null
    : hasInvalidEngravingChars(engravingText)
      ? t("cfg.badChars")
      : engravingChars > maxChars
        ? t("cfg.tooLong", { n: maxChars })
        : !engravingFits(trimmedEngraving, activeFont.family, fontId)
          ? t("cfg.noFit")
          : placement === "spot" && !spot
            ? t("cfg.place.needSpot")
            : null;
  const has3d = Boolean(product?.model3dGlb || product?.model3dPreset);
  const viewing3d = has3d && show3d && !viewerFailed;
  const glazeHex =
    product?.colors?.find((c) => c.name === selectedColor)?.hex ??
    product?.colors?.[0]?.hex ??
    FALLBACK_GLAZE;

  const gallery = useMemo(() => {
    if (!product) return [];
    if (product.galleryImages && product.galleryImages.length > 0) {
      return product.galleryImages;
    }
    return [product.image, product.hoverImage].filter(
      (src): src is string => Boolean(src),
    );
  }, [product]);

  const craft = product
    ? craftDaysForLine(product.line, settings)
    : { min: 0, max: 0 };
  const craftMin = craft.min;
  const craftMax = craft.max;
  const receive = product
    ? productReceiveRange(product, settings)
    : { min: 0, max: 0 };
  const allowColorPick =
    product?.line === "classic" && (product.colors?.length ?? 0) > 1;
  const setMembers = allProducts.filter((item) =>
    product?.setProductIds?.includes(item.id),
  );

  const catalogHref =
    product?.line === "themed"
      ? "/themed"
      : product?.line === "classic"
        ? "/classic"
        : "/classic";
  const catalogLabel =
    product?.line === "themed" ? t("line.themed") : t("line.classic");

  const relatedProducts = allProducts
    .filter((item) => item.id !== product?.id)
    .sort((a, b) => {
      const aSame = a.line === product?.line ? 0 : 1;
      const bSame = b.line === product?.line ? 0 : 1;
      return aSame - bSame;
    })
    .slice(0, 4);

  const handleAddToCart = (buyNow = false) => {
    if (!product) return;
    setAttempted(true);
    if (engravingError) return;
    const engraving = engraveOn && trimmedEngraving ? normalizeEngraving(trimmedEngraving) : undefined;
    const preview = viewing3d ? configuratorRef.current?.snapshot() ?? undefined : undefined;
    addToCart(product, quantity, selectedColor || undefined, engraving, {
      engravingFont: engraving ? fontId : undefined,
      engravingPlacement: engraving ? placement : undefined,
      engravingSpot: engraving && placement === "spot" && spot ? spot : undefined,
      giftMessage: giftOn && giftMessage.trim() ? giftMessage.trim() : undefined,
      previewImage: preview,
    });
    if (buyNow) router.push("/checkout");
  };

  if (!fetchDone) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-black">
        <Header />
        <main className="flex-1 flex items-center justify-center text-xs uppercase tracking-widest text-neutral-400">
          {t("product.loading")}
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-black">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-sm text-neutral-600">{t("product.notFound")}</p>
          <Link
            href="/classic"
            className="text-xs uppercase tracking-wider font-semibold underline"
          >
            {t("product.backToCatalog")}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Header />

      <main className="flex-1 pb-24">
        <div className="border-b border-neutral-200 bg-[#FBFBFA]">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 flex items-center space-x-2 text-xs text-neutral-600 font-medium truncate">
            <Link href="/" className="hover:text-black transition-colors shrink-0">
              {t("product.home")}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <Link
              href={catalogHref}
              className="hover:text-black transition-colors shrink-0"
            >
              {catalogLabel}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span className="text-black font-semibold truncate">
              {product.name}
            </span>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-8 md:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-24 lg:self-start">
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible shrink-0 pb-2 md:pb-0">
                {has3d && !viewerFailed && (
                  <button
                    type="button"
                    onClick={() => setShow3d(true)}
                    aria-pressed={viewing3d}
                    className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 flex flex-col items-center justify-center gap-1 border bg-[#2a1d15] text-[#E9D8B4] transition-all ${
                      viewing3d ? "border-[#C5A880] ring-1 ring-[#C5A880]" : "border-neutral-200 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Box className="w-5 h-5" />
                    <span className="text-[10px] tracking-[2px] font-semibold">{t("cfg.view3d")}</span>
                  </button>
                )}
                {gallery.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(i);
                      setShow3d(false);
                    }}
                    className={`relative w-16 h-16 md:w-20 md:h-20 overflow-hidden border transition-all shrink-0 bg-neutral-50 ${
                      !viewing3d && activeImageIndex === i
                        ? "border-black ring-1 ring-black"
                        : "border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>

              <div className={`relative flex-1 aspect-[4/5] md:aspect-square border overflow-hidden ${viewing3d ? "border-neutral-200 bg-[#FAF8F5]" : "bg-[#F8F7F4] border-neutral-200"}`}>
                {viewing3d ? (
                  <FlowerConfigurator
                    preset={product.model3dPreset}
                    glbUrl={product.model3dGlb || undefined}
                    fit={product.model3dFit}
                    poster={product.image}
                    alt={`${product.name} 3D`}
                    glazeHex={glazeHex}
                    engravingText={engraveOn && !hasInvalidEngravingChars(engravingText) ? trimmedEngraving : ""}
                    fontFamily={activeFont.family}
                    fontId={fontId}
                    placement={placement}
                    spot={spot}
                    onPickSpot={engraveOn && picking ? (sp) => {
                      setSpot((prev) => ({ ...sp, rot: prev?.rot ?? 0, scale: prev?.scale ?? 1 }));
                      setPlacement("spot");
                    } : undefined}
                    handleRef={configuratorRef}
                    onFail={handleViewerFail}
                  />
                ) : (
                  <Image
                    src={gallery[activeImageIndex] || product.image}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover object-center"
                  />
                )}
                {product.tag && (
                  <span
                    className={`absolute z-10 bg-black text-white tracking-widest font-semibold uppercase ${
                      viewing3d
                        ? "top-12 left-3 text-[9px] px-2 py-0.5 border border-black/20 bg-neutral-900"
                        : "top-4 left-4 text-[11px] px-3 py-1"
                    }`}
                  >
                    {product.tag}
                  </span>
                )}
                {has3d && viewerFailed && (
                  <span className="absolute bottom-3 left-3 right-3 bg-white/90 text-[11px] text-neutral-700 px-3 py-2">
                    {t("cfg.photoFallback")}
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 uppercase tracking-widest">
                  <span>{product.collection || catalogLabel}</span>
                  {product.sku && (
                    <span>
                      {t("product.skuLabel")}: {product.sku}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light tracking-wide leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-baseline space-x-3">
                  <span className="text-2xl md:text-3xl font-semibold">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-neutral-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {product.arArtworkSlug && (
                  <Link href={`/ar/${encodeURIComponent(product.arArtworkSlug)}`}
                    className="inline-flex min-h-12 items-center gap-3 self-start border border-[#C5A880] px-5 text-xs font-semibold uppercase tracking-widest text-[#8C6D46] transition hover:bg-[#C5A880] hover:text-black dark:text-[#C5A880]">
                    <Box className="size-4" aria-hidden="true" /> Trải nghiệm AR của sản phẩm
                  </Link>
                )}

                {product.colors && product.colors.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="uppercase tracking-wider font-semibold text-neutral-700">
                        {t("pdp.color")}
                      </span>
                      <span className="text-neutral-900 font-medium">
                        {selectedColor}
                      </span>
                    </div>
                    {allowColorPick ? (
                      <div className="flex items-center flex-wrap gap-2.5">
                        {product.colors.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setSelectedColor(color.name)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${
                              selectedColor === color.name
                                ? "border-[#C5A880] ring-2 ring-[#C5A880]/40 ring-offset-2 scale-110"
                                : "border-neutral-300 hover:scale-105"
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                            aria-label={color.name}
                            aria-pressed={selectedColor === color.name}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center flex-wrap gap-2.5">
                        {product.colors.map((color) => (
                          <span
                            key={color.name}
                            className="w-8 h-8 rounded-full border border-neutral-300"
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      {product.line === "classic"
                        ? t("pdp.colorNote")
                        : t("pdp.fixedColor")}
                    </p>
                  </div>
                )}

                {product.isSet && setMembers.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                      {t("pdp.setIncludes")}
                    </p>
                    <ul className="text-sm text-neutral-700 space-y-1">
                      {setMembers.map((item) => (
                        <li key={item.id}>
                          <Link href={productHref(item)} className="underline hover:text-black">
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-neutral-500">{t("pdp.setEngrave")}</p>
                  </div>
                )}

                {product.engravingEnabled !== false && (
                  <div className="space-y-3 pt-2 border-t border-neutral-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                        {t("pdp.engrave")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEngraveOn((prev) => {
                            if (prev) setEngravingText("");
                            return !prev;
                          });
                        }}
                        className={`text-[11px] uppercase tracking-wider px-3 py-1.5 border cursor-pointer ${
                          engraveOn
                            ? "bg-black text-white border-black"
                            : "bg-white text-neutral-700 border-neutral-300 hover:border-black"
                        }`}
                      >
                        {engraveOn ? t("pdp.engraveOn") : t("pdp.engraveOff")}
                      </button>
                    </div>
                    {engraveOn && (
                      <div className={`space-y-3 ${engravingFontVariables}`}>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">{t("cfg.engraveSub")}</p>
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-neutral-500">{t("cfg.font")}</span>
                          <div className="grid grid-cols-3 gap-2">
                            {ENGRAVING_FONTS.map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setFontId(f.id)}
                                aria-pressed={fontId === f.id}
                                className={`h-11 border text-base truncate px-1 cursor-pointer transition-colors ${f.className} ${
                                  fontId === f.id
                                    ? "border-[#C5A880] bg-[#C5A880]/10 text-black"
                                    : "border-neutral-300 text-neutral-600 hover:border-neutral-500"
                                }`}
                              >
                                {trimmedEngraving ? trimmedEngraving.slice(0, 10) : f.id === "classic" ? "EVERIE" : "Everie"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5" data-testid="engrave-placement">
                          <span className="text-[10px] uppercase tracking-wider text-neutral-500">{t("cfg.place")}</span>
                          <div className="grid grid-cols-4 gap-2">
                            {(["front", "back", "both"] as const).map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => {
                                  setPlacement(v);
                                  setPicking(false);
                                }}
                                aria-pressed={placement === v}
                                className={`h-9 border text-[11px] cursor-pointer transition-colors ${
                                  placement === v ? "border-[#C5A880] bg-[#C5A880]/10 text-black" : "border-neutral-300 text-neutral-600 hover:border-neutral-500"
                                }`}
                              >
                                {t(`cfg.place.${v}`)}
                              </button>
                            ))}
                            <button
                              type="button"
                              disabled={!viewing3d}
                              onClick={() => {
                                setPicking(true);
                                if (spot) setPlacement("spot");
                              }}
                              aria-pressed={placement === "spot" || picking}
                              className={`h-9 border text-[11px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                placement === "spot" || picking ? "border-[#C5A880] bg-[#C5A880]/10 text-black" : "border-neutral-300 text-neutral-600 hover:border-neutral-500"
                              }`}
                            >
                              {t("cfg.place.spot")}
                            </button>
                          </div>
                          {placement !== "spot" && !picking && (
                            <label className="block text-[11px] text-neutral-600">
                              {t("cfg.place.angle", { n: placementDegrees(placement) })}
                              <input
                                type="range"
                                min={0}
                                max={359}
                                step={1}
                                value={placementDegrees(placement)}
                                disabled={placement === "both"}
                                onChange={(e) => setPlacement(placementFromAngle(Number(e.target.value)))}
                                className="w-full accent-[#C5A880]"
                                aria-label={t("cfg.place")}
                              />
                              <span className="text-neutral-400">{t("cfg.place.hint")}</span>
                            </label>
                          )}
                          {(placement === "spot" || picking) && (
                            <div className="space-y-2 border border-[#C5A880]/40 bg-[#C5A880]/5 p-3 text-[11px] text-neutral-700">
                              <p className="font-medium">{picking ? t("cfg.place.picking") : t("cfg.place.pick")}</p>
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => setPicking((v) => !v)} className="border border-neutral-400 px-2 py-1 cursor-pointer hover:border-black">
                                  {picking ? t("cfg.place.done") : t("cfg.place.repick")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPicking(false);
                                    setSpot(null);
                                    setPlacement("front");
                                  }}
                                  className="border border-neutral-400 px-2 py-1 cursor-pointer hover:border-black"
                                >
                                  {t("cfg.place.reset")}
                                </button>
                              </div>
                              {spot && (
                                <>
                                  <label className="block">
                                    {t("cfg.place.rot", { n: spot.rot })}
                                    <input type="range" min={-180} max={180} value={spot.rot} onChange={(e) => setSpot({ ...spot, rot: Number(e.target.value) })} className="w-full accent-[#C5A880]" />
                                  </label>
                                  <label className="block">
                                    {t("cfg.place.size", { n: Math.round(spot.scale * 100) })}
                                    <input type="range" min={50} max={150} value={Math.round(spot.scale * 100)} onChange={(e) => setSpot({ ...spot, scale: Number(e.target.value) / 100 })} className="w-full accent-[#C5A880]" />
                                  </label>
                                </>
                              )}
                              <p className="text-neutral-500">{t("cfg.place.spotHint", { n: ENGRAVE_SPOT_MAX_CHARS })}</p>
                            </div>
                          )}
                        </div>
                        <div className={`border ${engravingError ? "border-red-500" : "border-neutral-300 focus-within:border-black"}`}>
                          <input
                            type="text"
                            value={engravingText}
                            onChange={(e) => setEngravingText(e.target.value.slice(0, maxChars + 8))}
                            placeholder={t("cfg.engravePlaceholder")}
                            aria-invalid={Boolean(engravingError)}
                            aria-describedby="engrave-msg"
                            lang="vi"
                            className={`w-full px-3 py-3 text-lg bg-transparent focus:outline-hidden ${activeFont.className}`}
                          />
                          <div className="flex items-center gap-1 border-t border-neutral-200 px-2 py-1.5">
                            {ENGRAVE_SYMBOLS.map((sym) => (
                              <button
                                key={sym}
                                type="button"
                                onClick={() => setEngravingText((v) => `${v}${sym}`)}
                                className="w-8 h-8 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                                aria-label={sym}
                              >
                                {sym}
                              </button>
                            ))}
                            <span className="ml-auto text-[11px] text-neutral-500">
                              {t("pdp.engraveLeft", { n: remainingChars })}
                            </span>
                          </div>
                        </div>
                        <p id="engrave-msg" role="status" className={`text-[11px] leading-relaxed ${engravingError ? "text-red-600" : "text-[#8B6E44]"}`}>
                          {engravingError ?? (product.isSet ? t("pdp.setEngrave") : t("pdp.engraveWarning"))}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setGiftOn((v) => !v)}
                    aria-expanded={giftOn}
                    className="w-full flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-neutral-700 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#C5A880]" />
                      {t("cfg.gift")}
                    </span>
                    {giftOn ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                  {giftOn && (
                    <div className="space-y-1">
                      <textarea
                        rows={3}
                        value={giftMessage}
                        maxLength={GIFT_MAX}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder={t("cfg.giftPlaceholder")}
                        className="w-full px-3 py-2.5 border border-neutral-300 text-sm focus:outline-hidden focus:border-black resize-none"
                      />
                      <p className="text-right text-[11px] text-neutral-500">
                        {t("cfg.giftLeft", { n: GIFT_MAX - giftMessage.length })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="border border-[#C5A880]/50 bg-[#F8F7F4] p-4 space-y-2 text-xs">
                  <p className="uppercase tracking-wider font-semibold text-neutral-700">
                    {t("cfg.summary")}
                  </p>
                  <div className="flex justify-between text-neutral-600">
                    <span>{t("pdp.color")}</span>
                    <span className="font-medium text-black">
                      {selectedColor || t("pdp.none")}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>{t("pdp.engrave")}</span>
                    <span className={`font-medium text-black text-right max-w-[60%] truncate ${engraveOn && trimmedEngraving ? activeFont.className : ""}`}>
                      {engraveOn && trimmedEngraving
                        ? trimmedEngraving
                        : t("pdp.none")}
                    </span>
                  </div>
                  {engraveOn && trimmedEngraving && (
                    <div className="flex justify-between text-neutral-600">
                      <span>{t("cfg.font")}</span>
                      <span className="font-medium text-black">{activeFont.label}</span>
                    </div>
                  )}
                  {engraveOn && trimmedEngraving && (
                    <div className="flex justify-between gap-4 text-neutral-600">
                      <span className="shrink-0">{t("cfg.place")}</span>
                      <span className="font-medium text-black text-right">{placementLabel(placement, language === "en" ? "en" : "vi")}</span>
                    </div>
                  )}
                  {giftOn && giftMessage.trim() && (
                    <div className="flex justify-between gap-4 text-neutral-600">
                      <span className="shrink-0">{t("cfg.gift")}</span>
                      <span className="font-medium text-black truncate">“{giftMessage.trim()}”</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-600">
                    <span>{t("label.price")}</span>
                    <span className="font-medium text-black">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>{t("pdp.expected")}</span>
                    <span className="font-medium text-black">
                      {formatDayRange(receive.min, receive.max, language)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center border border-neutral-300 h-12">
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        className="px-3.5 text-neutral-600 hover:text-black h-full cursor-pointer"
                        aria-label={t("label.quantity")}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm font-semibold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => prev + 1)}
                        className="px-3.5 text-neutral-600 hover:text-black h-full cursor-pointer"
                        aria-label={t("label.quantity")}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToCart()}
                      disabled={!product.inStock || (attempted && Boolean(engravingError))}
                      className="flex-1 h-12 bg-black text-white text-xs uppercase tracking-[2px] font-semibold hover:bg-[#C5A880] transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{t("pdp.addToCart")}</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-neutral-600">
                    <Truck className="w-4 h-4 text-[#C5A880] shrink-0" />
                    <span>
                      {t("pdp.craftTime")}:{" "}
                      {formatDayRange(craftMin, craftMax, language)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 md:mt-24 border-t border-neutral-200 pt-10 max-w-3xl">
            <h2 className="text-xl font-serif uppercase tracking-wider mb-6">
              {t("product.specs")}
            </h2>
            <div className="divide-y divide-neutral-200 border border-neutral-200 bg-[#FBFBFA] text-sm">
              <div className="p-4 text-neutral-700 leading-relaxed font-light">
                {product.description}
              </div>
              <div className="flex justify-between p-4 text-xs">
                <span className="font-medium text-neutral-500 uppercase tracking-wider">
                  {t("pdp.dimensions")}
                </span>
                <span className="font-semibold text-black">
                  {product.dimensions || "—"}
                </span>
              </div>
              <div className="flex justify-between p-4 text-xs">
                <span className="font-medium text-neutral-500 uppercase tracking-wider">
                  {t("pdp.material")}
                </span>
                <span className="font-semibold text-black">
                  {product.material || "Gốm"}
                </span>
              </div>
              {product.meaning && (
                <div className="p-4 text-xs space-y-1">
                  <span className="font-medium text-neutral-500 uppercase tracking-wider">
                    {t("pdp.meaning")}
                  </span>
                  <p className="text-neutral-800 leading-relaxed">{product.meaning}</p>
                </div>
              )}
              {product.inspiration && (
                <div className="p-4 text-xs space-y-1">
                  <span className="font-medium text-neutral-500 uppercase tracking-wider">
                    {t("pdp.inspiration")}
                  </span>
                  <p className="text-neutral-800 leading-relaxed">
                    {product.inspiration}
                  </p>
                </div>
              )}
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-20 border-t border-neutral-200 pt-16">
              <div className="text-center space-y-2 mb-10">
                <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
                  EVERIE
                </span>
                <h2 className="text-2xl md:text-3xl font-serif uppercase tracking-wide">
                  {t("product.related")}
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((rel) => (
                  <Link
                    key={rel.id}
                    href={productHref(rel)}
                    className="group border border-neutral-100 hover:border-neutral-300 transition-colors"
                  >
                    <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                      <Image
                        src={rel.image}
                        alt={rel.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <h3 className="font-serif text-sm line-clamp-1 group-hover:underline">
                        {rel.name}
                      </h3>
                      <p className="text-xs font-semibold">
                        {formatPrice(rel.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <div ref={stickyBarRef} className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#3a2a20] bg-[#1a120d]/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[2px] text-[#C5A880] truncate">{product.name}</p>
          <p className="text-sm font-semibold text-[#F3EDE2]">{formatPrice(product.price * quantity)}</p>
        </div>
        <button
          type="button"
          onClick={() => handleAddToCart()}
          disabled={!product.inStock}
          className="h-11 px-4 border border-[#C5A880]/70 text-[#E9D8B4] text-[10px] uppercase tracking-[2px] font-semibold disabled:opacity-50 cursor-pointer"
        >
          {t("pdp.addToCart")}
        </button>
        <button
          type="button"
          onClick={() => handleAddToCart(true)}
          disabled={!product.inStock}
          className="h-11 px-4 bg-[#C5A880] text-black text-[10px] uppercase tracking-[2px] font-semibold disabled:opacity-50 cursor-pointer"
        >
          {t("cfg.buyNow")}
        </button>
      </div>

      <Footer />
    </div>
  );
}
