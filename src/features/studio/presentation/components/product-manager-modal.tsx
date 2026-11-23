"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  LoaderCircle,
  QrCode,
  ScanLine,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useReducer, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/atoms/button";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import { Modal } from "@/components/molecules/modal";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";
import {
  studioProductSchema,
  type StudioProductFormValues,
} from "@/features/studio/domain/studio-product-schema";

type DeleteState = { confirming: boolean; deleting: boolean };
type DeleteAction = "ask" | "cancel" | "deleting" | "reset";

function deleteReducer(_state: DeleteState, action: DeleteAction): DeleteState {
  if (action === "ask") return { confirming: true, deleting: false };
  if (action === "deleting") return { confirming: true, deleting: true };
  return { confirming: false, deleting: false };
}

function arModeLabel(mode: PublishedArtwork["arMode"], t: (key: string) => string) {
  if (mode === "transparent_motion") return t("ar.studio.modeTransparent");
  if (mode === "spatial_layers") return t("ar.studio.modeLayers");
  return t("ar.studio.modeAnimated");
}

async function authHeaders() {
  // Both EVERIE storefront and AR Studio use everie_session.
  return {};
}

export function ProductManagerModal({
  product,
  onClose,
  onSaved,
  onDeleted,
}: {
  product: PublishedArtwork | null;
  onClose: () => void;
  onSaved: (product: PublishedArtwork) => void;
  onDeleted: (productId: string) => void;
}) {
  const { t } = useLanguage();
  const [deleteState, dispatchDelete] = useReducer(deleteReducer, {
    confirming: false,
    deleting: false,
  });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<StudioProductFormValues>({
    resolver: zodResolver(studioProductSchema),
    mode: "onChange",
    defaultValues: {
      title: product?.title ?? "",
      artistName: product?.artistName ?? "",
      description: product?.description ?? "",
      status: product?.status ?? "draft",
    },
  });

  const currentStatus = useWatch({ control, name: "status" });

  useEffect(() => {
    if (!product) return;
    reset({
      title: product.title,
      artistName: product.artistName,
      description: product.description,
      status: product.status,
    });
    dispatchDelete("reset");
  }, [product, reset]);

  const publicPath = product ? `/art/${product.slug}` : null;
  const arPath = product ? `/ar/${product.slug}` : null;

  useEffect(() => {
    let active = true;
    if (!arPath || product?.status !== "published") return;

    const scanUrl = new URL(arPath, window.location.origin);
    void QRCode.toDataURL(scanUrl.toString(), {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "M",
    }).then((value) => {
      if (active) setQrDataUrl(value);
    });

    return () => {
      active = false;
    };
  }, [product?.status, arPath]);

  const submit = handleSubmit(async (values) => {
    if (!product) return;
    try {
      const headers = await authHeaders();
      const response = await fetch(`/api/studio/products/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        product?: PublishedArtwork;
        error?: string;
      };
      if (!response.ok || !payload.product) {
        throw new Error(payload.error ?? "Unable to update product.");
      }
      onSaved(payload.product);
    } catch (cause) {
      setError("root", {
        message: cause instanceof Error ? cause.message : "Unable to update product.",
      });
    }
  });

  async function removeProduct() {
    if (!product) return;
    if (!deleteState.confirming) {
      dispatchDelete("ask");
      return;
    }

    dispatchDelete("deleting");
    try {
      const headers = await authHeaders();
      const response = await fetch(`/api/studio/products/${product.id}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to delete product.");
      }
      onDeleted(product.id);
    } catch (cause) {
      dispatchDelete("reset");
      setError("root", {
        message: cause instanceof Error ? cause.message : "Unable to delete product.",
      });
    }
  }

  async function copyLink() {
    if (!publicPath) return;
    const absoluteUrl = new URL(publicPath, window.location.origin).toString();
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (!product) return null;

  return (
    <Modal
      open
      variant="admin"
      onClose={onClose}
      title={product.title}
      maxWidthClassName="max-w-5xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={deleteState.deleting || isSubmitting}
              onClick={() => void removeProduct()}
              className={
                deleteState.confirming
                  ? "h-9 px-2 text-rose-400 hover:bg-red-950/40 hover:text-rose-300"
                  : "h-9 px-2 text-stone-400 hover:bg-stone-800 hover:text-rose-400"
              }
            >
              {deleteState.deleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {t(deleteState.confirming ? "ar.manager.confirm" : "ar.manager.delete")}
            </Button>
            {deleteState.confirming && !deleteState.deleting ? (
              <button
                type="button"
                onClick={() => dispatchDelete("cancel")}
                className="text-xs text-stone-400 transition hover:text-white"
              >
                {t("ar.common.cancel")}
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-lg border border-stone-700 bg-stone-800 px-3 text-stone-300 hover:bg-stone-700 hover:text-white"
            >
              {t("ar.common.close")}
            </Button>
            <Button
              type="submit"
              form="studio-product-manager-form"
              disabled={!isValid || isSubmitting || deleteState.deleting}
              className="rounded-lg bg-[#C5A880] text-black hover:bg-[#b59870]"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {t("ar.manager.save")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.75fr)]">
        <form id="studio-product-manager-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="manage-product-title" className="text-xs font-medium text-stone-300">
              {t("ar.manager.productName")}
            </Label>
            <Input
              id="manage-product-title"
              className="h-10 rounded-lg border border-stone-700 bg-[#1A1A1D] px-3 text-sm text-stone-200 focus-visible:border-[#C5A880] focus-visible:ring-0"
              {...register("title")}
            />
            {errors.title ? <p className="text-xs text-rose-300">{errors.title.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="manage-product-artist" className="text-xs font-medium text-stone-300">
              {t("ar.manager.creator")}
            </Label>
            <Input
              id="manage-product-artist"
              className="h-10 rounded-lg border border-stone-700 bg-[#1A1A1D] px-3 text-sm text-stone-200 focus-visible:border-[#C5A880] focus-visible:ring-0"
              {...register("artistName")}
            />
            {errors.artistName ? (
              <p className="text-xs text-rose-300">{errors.artistName.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="manage-product-description" className="text-xs font-medium text-stone-300">
              {t("ar.manager.description")}
            </Label>
            <Textarea
              id="manage-product-description"
              rows={5}
              className="rounded-lg border border-stone-700 bg-[#1A1A1D] px-3 py-2 text-sm text-stone-200 focus-visible:border-[#C5A880] focus-visible:ring-0"
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-xs text-rose-300">{errors.description.message}</p>
            ) : null}
          </div>

          <div>
            <Label className="text-xs font-medium text-stone-300">{t("ar.manager.visibility")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setValue("status", "draft", { shouldValidate: true, shouldDirty: true })
                }
                className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
                  currentStatus === "draft"
                    ? "border-[#C5A880]/50 bg-[#C5A880]/15 text-[#C5A880]"
                    : "border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white"
                }`}
              >
                {t("ar.manager.draft")}
              </button>
              <button
                type="button"
                onClick={() =>
                  setValue("status", "published", { shouldValidate: true, shouldDirty: true })
                }
                className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
                  currentStatus === "published"
                    ? "border-[#C5A880]/50 bg-[#C5A880]/15 text-[#C5A880]"
                    : "border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white"
                }`}
              >
                {t("ar.studio.live")}
              </button>
            </div>
          </div>

          {errors.root?.message ? (
            <p className="text-sm text-rose-200">{errors.root.message}</p>
          ) : null}
        </form>

        <aside className="rounded-xl border border-stone-800 bg-[#17171A] p-4">
          <div className="flex items-center justify-between gap-4 pb-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                {t("ar.manager.distribution")}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {t(product.status === "published" ? "ar.manager.public" : "ar.manager.private")} · {arModeLabel(product.arMode, t)}
              </p>
            </div>
            <span className={`inline-flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.16em] ${product.status === "published" ? "text-emerald-100/75" : "text-white/42"}`}>
              <span className={`size-1.5 rounded-full ${product.status === "published" ? "bg-emerald-200" : "bg-white/35"}`} />
              {t(product.status === "published" ? "ar.studio.live" : "ar.manager.draft")}
            </span>
          </div>

          {product.status === "published" && publicPath ? (
            <div className="pt-6">
              <p className="mb-5 max-w-md text-xs leading-5 text-stone-400">
                {t("ar.manager.qrHelp")}
              </p>
              {qrDataUrl ? (
                <div className="mx-auto max-w-[13rem] rounded-[5px] bg-white p-3 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${product.title}`}
                    className="aspect-square w-full"
                  />
                </div>
              ) : (
                <div className="mx-auto flex aspect-square max-w-[13rem] items-center justify-center rounded-[5px] bg-white/[0.035] text-white/25">
                  <QrCode className="size-7" />
                </div>
              )}

              <div className="mt-5 space-y-3 rounded-lg border border-stone-800 bg-[#141417] p-4">
                <p className="text-[0.55rem] uppercase tracking-[0.15em] text-white/24">{t("ar.manager.publicLink")}</p>
                <p className="mt-1 break-all text-xs leading-5 text-white/42">{publicPath}</p>
                <p className="mt-3 text-[0.55rem] uppercase tracking-[0.15em] text-amber-100/38">{t("ar.manager.destination")}</p>
                <p className="mt-1 break-all text-xs leading-5 text-white/42">{arPath}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void copyLink()}
                  className="h-9 px-0 text-xs uppercase tracking-[0.12em] text-white/52 hover:bg-transparent hover:text-white"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? t("ar.create.copied") : t("ar.create.copy")}
                </Button>
                {qrDataUrl ? (
                  <a
                    href={qrDataUrl}
                    download={`everie-${product.slug}-qr.png`}
                    className="inline-flex h-9 items-center justify-center gap-2 text-xs uppercase tracking-[0.12em] text-white/52 transition hover:text-white"
                  >
                    <Download className="size-4" /> {t("ar.create.downloadQR")}
                  </a>
                ) : null}
                <a
                  href={`/art/${product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 text-xs uppercase tracking-[0.12em] text-white/52 transition hover:text-white"
                >
                  <ExternalLink className="size-4" /> {t("ar.create.openWork")}
                </a>
                <a
                  href={`/ar/${product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 text-xs uppercase tracking-[0.12em] text-white/52 transition hover:text-white"
                >
                  <ScanLine className="size-4" /> {t("ar.manager.openAr")}
                </a>
              </div>
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <QrCode className="size-6 text-white/22" />
              <p className="mt-4 text-sm font-medium text-white/68">
                {t("ar.manager.distLocked")}
              </p>
              <p className="mt-2 max-w-xs text-xs leading-5 text-white/32">
                {t("ar.manager.distHelp")}
              </p>
            </div>
          )}
        </aside>
      </div>
    </Modal>
  );
}
