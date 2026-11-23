"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import QRCode from "qrcode";
import {
  Check,
  Copy,
  Download,
  LoaderCircle,
  Trash2,
  Upload,
  ImageIcon,
  Video,
} from "lucide-react";

import { BackLink } from "@/components/atoms/back-link";
import { useLanguage } from "@/context/LanguageContext";
import { localizedArFormError } from "@/lib/i18n/ar-form-errors";
import { ArLanguageSwitcher } from "@/components/everie-ar/ar-language-switcher";
import { ARTWORK_VIDEO_PLANE_DEPTH } from "@/features/ar-experience/domain/video-plane-fit";
import { Button } from "@/components/atoms/button";
import { EverieBrand } from "@/components/atoms/everie-brand";
import { Input } from "@/components/atoms/input";
import type { ArtworkUploadSession } from "@/features/artwork/domain/artwork";
import {
  ARTWORK_UPLOAD_MAX_FILE_SIZE,
  artworkCreateFormSchema,
  type ArtworkCreateFormValues,
} from "@/features/artwork/domain/artwork-create-form-schema";
import { isPackedAlphaVideoName, validateOriginalVideo, videoNeedsConversion } from "@/features/artwork/domain/original-video";
import { convertVideoForAr } from "@/features/artwork/presentation/lib/convert-video-for-ar";
import { ArCompositionPreview } from "@/features/artwork/presentation/components/ar-composition-preview";
import { compileMindTarget } from "@/features/artwork/presentation/lib/compile-mind-target";
import { extractImageTarget } from "@/features/artwork/presentation/lib/extract-image-target";
import { readImageAspectRatio } from "@/features/artwork/presentation/lib/read-image-aspect-ratio";
import { readVideoAspectRatio } from "@/features/artwork/presentation/lib/read-video-aspect-ratio";
import { uploadArtworkAssets } from "@/features/artwork/presentation/lib/upload-artwork-assets";

type PublishResult = {
  status: "draft" | "published";
  productId: string;
  shareUrl: string | null;
  arUrl: string | null;
  qrDataUrl: string | null;
};

type WorkflowState = {
  compilerProgress: number;
  uploadStep: number;
  message: string | null;
  result: PublishResult | null;
  copied: boolean;
};

type WorkflowAction =
  | { type: "start" }
  | { type: "message"; message: string }
  | { type: "compiler-progress"; value: number }
  | { type: "upload-step"; value: number }
  | { type: "success"; result: PublishResult }
  | { type: "error"; message: string }
  | { type: "copied"; value: boolean };

const initialWorkflowState: WorkflowState = {
  compilerProgress: 0,
  uploadStep: 0,
  message: null,
  result: null,
  copied: false,
};

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case "start":
      return initialWorkflowState;
    case "message":
      return { ...state, message: action.message };
    case "compiler-progress":
      return { ...state, compilerProgress: action.value };
    case "upload-step":
      return { ...state, uploadStep: action.value };
    case "success":
      return { ...state, message: null, result: action.result };
    case "error":
      return { ...state, message: action.message };
    case "copied":
      return { ...state, copied: action.value };
  }
}

function fileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function formatMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ArtworkCreateForm({
  embedded = false,
  adminLayout = false,
  onCreated,
  onDone,
}: {
  embedded?: boolean;
  adminLayout?: boolean;
  onCreated?: (productId: string) => void;
  onDone?: () => void;
}) {
  const { t, language } = useLanguage();
  const [workflow, dispatch] = useReducer(workflowReducer, initialWorkflowState);
  const [submitIntent, setSubmitIntent] = useState<"draft" | "publish" | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [trackingReference, setTrackingReference] = useState<File | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [conversionMessage, setConversionMessage] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    clearErrors,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ArtworkCreateFormValues>({
    resolver: zodResolver(artworkCreateFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      title: "",
      artistName: "",
      arMode: "spatial_layers",
      spatialLayers: [],
    },
  });

  const {
    fields: spatialFields,
    replace: replaceSpatialLayers,
    remove: removeSpatialLayer,
  } = useFieldArray({ control, name: "spatialLayers" });

  const title = useWatch({ control, name: "title" });
  const artistName = useWatch({ control, name: "artistName" });
  const targetImage = useWatch({ control, name: "targetImage" });
  const spatialLayers = useWatch({ control, name: "spatialLayers" }) ?? [];

  const firstVideo = spatialLayers[0]?.file;
  const canExtractTarget = Boolean(
    trackingReference &&
    ["image/png", "image/jpeg", "image/webp"].includes(trackingReference.type) &&
    trackingReference.size > 0 &&
    trackingReference.size <= ARTWORK_UPLOAD_MAX_FILE_SIZE
  );
  const targetPreparing = canExtractTarget && !targetImage && !targetError;
  const detailsReady = Boolean(title?.trim() && artistName?.trim());
  const arReady = Boolean(firstVideo && trackingReference && targetImage && !targetPreparing && !targetError);
  const publishReady = detailsReady && arReady;
  const canSubmit = !isSubmitting && !targetPreparing && !converting;

  useEffect(() => {
    let active = true;
    setValue("targetImage", undefined as unknown as File, { shouldValidate: false });
    if (!canExtractTarget || !trackingReference) {
      return () => { active = false; };
    }

    // Tracking comes only from the uploaded artwork image, never from a video frame.
    void extractImageTarget(trackingReference)
      .then((image) => {
        if (!active) return;
        setValue("targetImage", image, { shouldDirty: true, shouldValidate: false });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setTargetError(error instanceof Error ? error.message : "Unable to prepare the artwork image for tracking.");
      });
    return () => { active = false; };
  }, [trackingReference, canExtractTarget, setValue]);

  // The server uses the shared HttpOnly EVERIE session cookie.
  async function getAuthHeaders() { return {}; }

  async function createSession(
    values: ArtworkCreateFormValues,
    targetAspectRatio: number,
    layerAspectRatios: Array<number | undefined>,
  ) {
    const authHeaders = await getAuthHeaders();
    const response = await fetch("/api/artworks/drafts", {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders },
      body: JSON.stringify({
        title: values.title,
        artistName: values.artistName,
        description: "",
        targetImageExtension: fileExtension(values.targetImage),
        targetAspectRatio,
        arMode: "spatial_layers",
        creationFlow: "image-video",
        spatialLayers: values.spatialLayers.map((layer, index) => ({
          extension: fileExtension(layer.file),
          mimeType: layer.file.type,
          alphaPacking: isPackedAlphaVideoName(layer.file.name) ? "side-by-side" : undefined,
          fitToTarget: true,
          aspectRatio: layerAspectRatios[index],
          x: layer.x,
          y: layer.y,
          depth: layer.depth,
          scale: layer.scale,
          animation: layer.animation,
          blendMode: layer.blendMode,
        })),
      }),
    });

    const data = (await response.json()) as ArtworkUploadSession & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Unable to prepare uploads.");
    return data;
  }

  async function publishArtwork(session: ArtworkUploadSession) {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`/api/artworks/${session.artworkId}/publish`, {
      method: "POST",
      headers: authHeaders,
    });
    const data = (await response.json()) as {
      sharePath?: string;
      arPath?: string;
      error?: string;
    };

    if (!response.ok || !data.sharePath || !data.arPath) {
      throw new Error(data.error ?? "Unable to publish artwork.");
    }

    const shareUrl = new URL(data.sharePath, window.location.origin).toString();
    const arUrl = new URL(data.arPath, window.location.origin).toString();
    const qrDataUrl = await QRCode.toDataURL(arUrl, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    return {
      status: "published" as const,
      productId: session.artworkId,
      shareUrl,
      arUrl,
      qrDataUrl,
    };
  }

  async function runWorkflow(values: ArtworkCreateFormValues, intent: "draft" | "publish") {
    dispatch({ type: "start" });

    try {
      dispatch({ type: "message", message: "ar.create.workflowCheck" });
      const targetAspectRatio = await readImageAspectRatio(values.targetImage);
      const layerAspectRatios = await Promise.all(values.spatialLayers.map((layer) => readVideoAspectRatio(layer.file)));

      dispatch({ type: "message", message: "ar.create.workflowArtwork" });
      const targetMind = await compileMindTarget(values.targetImage, (value) =>
        dispatch({ type: "compiler-progress", value }),
      );

      if (targetMind.size > ARTWORK_UPLOAD_MAX_FILE_SIZE) {
        throw new Error("The compiled tracking file is larger than the 6 MB MVP limit.");
      }

      dispatch({ type: "message", message: "ar.create.workflowUploadPrep" });
      const session = await createSession(
        values,
        targetAspectRatio,
        layerAspectRatios,
      );

      dispatch({ type: "message", message: "ar.create.workflowUploading" });
      await uploadArtworkAssets(
        session,
        {
          targetImage: values.targetImage,
          targetMind,
          spatialLayers: values.spatialLayers.map((layer) => layer.file),
        },
        (value) => dispatch({ type: "upload-step", value }),
      );

      if (intent === "draft") {
        const result: PublishResult = {
          status: "draft",
          productId: session.artworkId,
          shareUrl: null,
          arUrl: null,
          qrDataUrl: null,
        };
        dispatch({ type: "success", result });
        onCreated?.(result.productId);
        return;
      }

      dispatch({ type: "message", message: "ar.create.workflowPublishing" });
      const result = await publishArtwork(session);
      dispatch({ type: "success", result });
      onCreated?.(result.productId);
    } catch (cause) {
      dispatch({
        type: "error",
        message: cause instanceof Error ? cause.message : "Unable to publish artwork.",
      });
    }
  }

  async function submitArtwork(intent: "draft" | "publish") {
    if (converting || isSubmitting) return;
    setSubmitIntent(intent);
    setSubmitAttempted(true);
    setConversionError(null);
    clearErrors(["spatialLayers", "targetImage"]);
    const source = spatialLayers[0]?.file;

    try {
      // Compatible small files use the established save/publish workflow.
      if (!source || !videoNeedsConversion(source)) {
        await handleSubmit((values) => runWorkflow(values, intent))();
        return;
      }

      // Validate only after Save/Publish, before transferring the original.
      if (!(await trigger(["title", "artistName", "targetImage"]))) return;
      const validationError = validateOriginalVideo(source);
      if (validationError) {
        setConversionError(validationError);
        return;
      }

      setConverting(true);
      const auth = await getAuthHeaders();
      const converted = await convertVideoForAr(source, auth, setConversionMessage);
      setConversionMessage("Preparing the animation for your artwork image…");
      const target = getValues().targetImage;
      if (!target) throw new Error("Upload the artwork image visitors will scan.");
      const current = getValues();
      if (current.spatialLayers[0]?.file !== source) {
        throw new Error("The selected video changed. Please save again.");
      }
      const prepared = artworkCreateFormSchema.safeParse({
        ...current,
        targetImage: target,
        spatialLayers: [{ ...current.spatialLayers[0], file: converted }],
      });
      if (!prepared.success) {
        throw new Error(prepared.error.issues[0]?.message ?? "Converted video is invalid.");
      }
      await runWorkflow(prepared.data, intent);
    } catch (error) {
      setConversionError(error instanceof Error ? error.message : "Unable to convert this video.");
    } finally {
      setConverting(false);
      setConversionMessage(null);
      setSubmitIntent(null);
    }
  }

  async function copyShareUrl() {
    if (!workflow.result?.shareUrl) return;
    await navigator.clipboard.writeText(workflow.result.shareUrl);
    dispatch({ type: "copied", value: true });
    window.setTimeout(() => dispatch({ type: "copied", value: false }), 1600);
  }

  function selectVideo(files: FileList | null) {
    const file = files?.item(0);
    if (!file) return;
    // Changing the animation cannot repair a failed artwork-image tracking target.
    setConversionError(null);
    setSubmitAttempted(false);
    clearErrors(["spatialLayers"]);
    replaceSpatialLayers([{
      file,
      animation: "none",
      blendMode: "normal",
      x: 0,
      y: 0,
      depth: ARTWORK_VIDEO_PLANE_DEPTH,
      scale: 1,
    }]);
  }

  function selectTrackingImage(files: FileList | null) {
    const image = files?.item(0);
    if (!image) return;
    setTargetError(null);
    setSubmitAttempted(false);
    clearErrors(["targetImage"]);
    setTrackingReference(image);
  }

  if (workflow.result) {
    const isPublished = workflow.result.status === "published";

    return (
      <main className={embedded ? (adminLayout ? "admin-ar-create relative text-stone-200" : "relative text-white") : "relative min-h-screen overflow-hidden bg-[#050507] text-white"}>
        <div className={embedded ? "hidden" : "pointer-events-none absolute right-[8%] top-24 size-80 rounded-full bg-amber-900/7 blur-[130px]"} />
        <header className={embedded ? "hidden" : "relative mx-auto grid w-full max-w-[94rem] grid-cols-[1fr_auto_1fr] items-center everie-nav-surface px-5 py-5 sm:px-8 lg:px-12"}>
          <BackLink href="/admin/ar" label={t("ar.studio.products")} />
          <EverieBrand />
          <div className="justify-self-end"><ArLanguageSwitcher /></div>
        </header>

        <section className={embedded ? `creator-success relative mx-auto grid w-full items-center gap-10 ${isPublished ? "lg:grid-cols-[1.05fr_0.95fr]" : ""}` : `creator-success relative mx-auto grid min-h-[calc(100svh-4.8rem)] w-full max-w-[94rem] items-center gap-12 px-5 py-14 sm:px-8 lg:px-12 lg:py-20 ${isPublished ? "lg:grid-cols-[1.05fr_0.95fr]" : ""}`}>
          <div className="creator-success-copy">
            <div className="creator-success-mark" aria-hidden="true">
              <Check className="size-5" />
            </div>

            <h1 className={embedded ? "mt-8 max-w-3xl font-serif text-5xl leading-[0.9] tracking-[-0.05em] sm:text-6xl" : "mt-8 max-w-4xl font-serif text-6xl leading-[0.88] tracking-[-0.055em] sm:text-8xl"}>
              {isPublished ? (
                <>{t("ar.create.successPublished")} <span className="bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-clip-text italic text-transparent">Everie.</span></>
              ) : (
                <>{t("ar.create.successDraft")} <span className="bg-gradient-to-r from-amber-200 to-amber-200 bg-clip-text italic text-transparent">{t("ar.create.successDraftEmphasis")}</span></>
              )}
            </h1>

            {!adminLayout && (
              <p className="mt-6 max-w-xl text-sm leading-7 text-white/46 sm:text-base">
                {isPublished ? t("ar.create.successDesc") : t("ar.create.draftDesc")}
              </p>
            )}

            {workflow.result.shareUrl ? (
              <p className="mt-5 max-w-xl break-all text-xs leading-5 text-white/28">{workflow.result.shareUrl}</p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-2">
              {workflow.result.shareUrl ? (
                <>
                  <button type="button" onClick={copyShareUrl} className="inline-flex h-12 items-center gap-2 rounded-[4px] bg-white px-5 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-amber-100">
                    {workflow.copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {workflow.copied ? t("ar.create.copied") : t("ar.create.copy")}
                  </button>
                  {workflow.result.qrDataUrl ? (
                    <a href={workflow.result.qrDataUrl} download="everie-qr.png" className="inline-flex h-12 items-center gap-2 rounded-[4px] px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/58 transition hover:bg-white/[0.04] hover:text-white">
                      <Download className="size-4" /> {t("ar.create.downloadQR")}
                    </a>
                  ) : null}
                  <a href={workflow.result.shareUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-[4px] px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/58 transition hover:bg-white/[0.04] hover:text-white">
                    {t("ar.create.openWork")}
                  </a>
                  {embedded && onDone ? (
                    <button type="button" onClick={onDone} className="inline-flex h-12 items-center rounded-[4px] px-4 text-xs font-medium uppercase tracking-[0.12em] text-white/42 transition hover:text-white">
                      {t("ar.common.done")}
                    </button>
                  ) : null}
                </>
              ) : embedded && onDone ? (
                <button type="button" onClick={onDone} className="inline-flex h-12 items-center rounded-[4px] bg-white px-5 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-amber-100">
                  {t("ar.create.backStudio")}
                </button>
              ) : (
                <Link href="/admin/ar" className="inline-flex h-12 items-center rounded-[4px] bg-white px-5 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-amber-100">
                  {t("ar.create.backStudio")}
                </Link>
              )}
            </div>
          </div>

          {isPublished && workflow.result.qrDataUrl ? (
            <div className={adminLayout ? "creator-success-qr relative w-full max-w-[12rem]" : "creator-success-qr relative mx-auto w-full max-w-sm"}>
              <div className="creator-success-qr-glow" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={workflow.result.qrDataUrl} alt={t("ar.create.qrAlt")} className="relative aspect-square w-full rounded-[6px] bg-white p-3 shadow-[0_35px_120px_rgba(0,0,0,0.48)]" />
              <div className="relative mt-5 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.15em] text-white/38">
                <EverieBrand href={null} className="opacity-65" textClassName="text-[0.58rem]" iconClassName="size-3.5" />
                <span>{t("ar.common.scan")}</span>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className={embedded ? (adminLayout ? "admin-ar-create relative text-stone-200" : "relative text-white") : "relative min-h-screen overflow-hidden bg-[#050507] text-white"}>
      <div className={embedded ? "hidden" : "pointer-events-none absolute right-[12%] top-28 size-80 rounded-full bg-amber-900/7 blur-[130px]"} />
      <header className={embedded ? "hidden" : "relative mx-auto grid w-full max-w-[94rem] grid-cols-[1fr_auto_1fr] items-center everie-nav-surface px-5 py-5 sm:px-8 lg:px-12"}>
        <BackLink href="/admin/ar" label={t("ar.create.backStudio")} />
        <EverieBrand />
        <div className="justify-self-end"><ArLanguageSwitcher /></div>
      </header>

      <section className={embedded ? "relative mx-auto w-full max-w-none p-0" : "relative mx-auto w-full max-w-[94rem] px-5 py-14 sm:px-8 lg:px-12 lg:py-20"}>
        <h1 className={embedded ? "hidden" : "max-w-5xl font-serif text-6xl leading-[0.86] tracking-[-0.055em] sm:text-8xl lg:text-9xl"}>
          {t("ar.create.headline")}<br /><span className="bg-gradient-to-r from-amber-200 to-amber-200 bg-clip-text italic text-transparent">{t("ar.create.headlineEmphasis")}</span>
        </h1>

        {!adminLayout && (
        <div className={`${embedded ? "mt-0" : "mt-12"} grid grid-cols-3 gap-5 pt-2`}>
          {[
            ["01", t("ar.create.details"), detailsReady],
            ["02", t("ar.create.imageVideo"), arReady],
            ["03", t("ar.create.publish"), publishReady],
          ].map(([number, label, ready]) => (
            <div
              key={String(label)}
              className={`min-w-0 py-2 ${ready ? "text-white" : "text-white/28"}`}
            >
              <p className="text-[0.55rem] tabular-nums tracking-[0.14em] opacity-55">{String(number)}</p>
              <p className="mt-1 truncate text-[0.58rem] font-medium uppercase tracking-[0.1em] sm:text-[0.62rem]">
                {String(label)}
              </p>
              <div className="mt-2 h-px bg-white/10">
                <div className={`h-px transition-all duration-500 ${ready ? "w-full bg-amber-200" : "w-0"}`} />
              </div>
            </div>
          ))}
        </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitArtwork("publish");
          }}
          noValidate
          className={adminLayout ? "mt-0 overflow-hidden rounded-xl border border-stone-800 bg-[#141417]" : "mt-6 grid overflow-hidden rounded-[8px] bg-[#07070a]/68 shadow-[0_36px_120px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-white/[0.06] lg:grid-cols-[1.05fr_0.95fr]"}
        >
          <div className={adminLayout ? "space-y-5 p-4 sm:p-5" : "space-y-9 p-5 sm:p-7 lg:p-8"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-[0.62rem] uppercase tracking-[0.16em] text-white/34 transition-colors focus-within:text-amber-100/70">{t("ar.create.title")}</label>
                <div className={`rounded-[6px] bg-white/[0.028] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] ring-1 ring-inset transition duration-300 focus-within:bg-white/[0.045] ${errors.title ? "ring-rose-300/24" : "ring-white/[0.06] focus-within:ring-amber-200/24"}`}>
                  <Input id="title" maxLength={120} aria-invalid={Boolean(errors.title)} placeholder={t("ar.create.titlePlaceholder")} {...register("title")} className="h-13 rounded-[6px] border-0 bg-transparent px-4 text-[0.98rem] text-white shadow-none placeholder:text-white/20 focus-visible:ring-0" />
                </div>
                {errors.title?.message ? <p className="px-1 text-xs text-rose-200/80">{localizedArFormError(errors.title.message, language, t, "ar.create.errorPublish")}</p> : null}
              </div>

              <div className="grid gap-2">
                <label htmlFor="artistName" className="text-[0.62rem] uppercase tracking-[0.16em] text-white/34">{t("ar.create.artist")}</label>
                <div className={`rounded-[6px] bg-white/[0.028] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] ring-1 ring-inset transition duration-300 focus-within:bg-white/[0.045] ${errors.artistName ? "ring-rose-300/24" : "ring-white/[0.06] focus-within:ring-amber-200/24"}`}>
                  <Input id="artistName" maxLength={120} aria-invalid={Boolean(errors.artistName)} placeholder={t("ar.create.artistPlaceholder")} {...register("artistName")} className="h-13 rounded-[6px] border-0 bg-transparent px-4 text-[0.98rem] text-white shadow-none placeholder:text-white/20 focus-visible:ring-0" />
                </div>
                {errors.artistName?.message ? <p className="px-1 text-xs text-rose-200/80">{localizedArFormError(errors.artistName.message, language, t, "ar.create.errorPublish")}</p> : null}
              </div>
            </div>

            <div className={adminLayout ? "space-y-5" : "space-y-7"}>
              <div className="space-y-3">
                <p className="text-[0.62rem] uppercase tracking-[0.19em] text-amber-100/65">{t("ar.create.imageRequired")}</p>
                {!trackingReference ? (
                <label className="flex cursor-pointer items-center gap-4 border border-dashed border-white/18 bg-[#09090d] p-5 transition hover:border-amber-100/45 hover:bg-white/[0.04]">
                  <ImageIcon className="size-5 shrink-0 text-amber-100/75" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block font-serif text-2xl">{t("ar.create.uploadImage")}</span>
                    {!adminLayout && (<span className="mt-1 block text-xs leading-5 text-white/40">{t("ar.create.imageHint")}</span>)}
                  </span>
                  <input type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" aria-label={t("ar.create.imageAria")} className="sr-only"
                    onChange={(event) => { selectTrackingImage(event.currentTarget.files); event.currentTarget.value = ""; }} />
                </label>
                ) : null}
                {trackingReference ? (
                  <div className="flex items-center justify-between gap-3 border border-white/10 bg-[#09090d] p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white/75">{trackingReference.name}</p>
                      <p className="mt-1 text-xs text-white/35">{formatMb(trackingReference.size)} · {t("ar.create.trackingImage")}</p>
                    </div>
                    <button type="button" aria-label={t("ar.create.removeFile", { file: trackingReference.name })}
                      onClick={() => { setTrackingReference(null); setTargetError(null); setSubmitAttempted(false); clearErrors(["targetImage"]); setValue("targetImage", undefined as unknown as File, { shouldValidate: false }); }}
                      className="p-2 text-white/35 transition hover:text-rose-200"><Trash2 className="size-4" /></button>
                  </div>
                ) : null}
                {targetPreparing ? <p role="status" className="text-xs text-amber-200/75">{t("ar.create.preparingTarget")}</p> : null}
                {submitAttempted && targetError ? <p role="alert" className="text-xs text-rose-200/80">{localizedArFormError(targetError, language, t, "ar.create.errorImage")}</p> : null}
                {submitAttempted && errors.targetImage?.message && !targetPreparing && !targetError ?
                  <p role="alert" className="text-xs text-rose-200/80">{localizedArFormError(errors.targetImage.message, language, t, "ar.create.errorImage")}</p> : null}
              </div>

              <div className="space-y-3">
                <p className="text-[0.62rem] uppercase tracking-[0.19em] text-amber-200/65">{t("ar.create.videoRequired")}</p>
                {!firstVideo ? (
                <label className="flex cursor-pointer items-center gap-4 border border-dashed border-white/18 bg-[#09090d] p-5 transition hover:border-amber-200/45 hover:bg-white/[0.04]">
                  <Video className="size-5 shrink-0 text-amber-200/80" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block font-serif text-2xl">{t("ar.create.uploadVideo")}</span>
                    {!adminLayout && (<span className="mt-1 block text-xs leading-5 text-white/40">{t("ar.create.videoHint")}</span>)}
                  </span>
                  <input type="file" accept="video/quicktime,video/mp4,video/webm,.mov,.mp4,.webm" aria-label={t("ar.create.videoAria")} className="sr-only"
                    onChange={(event) => { selectVideo(event.currentTarget.files); event.currentTarget.value = ""; }} />
                </label>
                ) : null}
                {spatialFields.map((field, index) => {
                  const layer = spatialLayers[index];
                  if (!layer) return null;
                  return (
                    <div key={field.id} className="flex items-center justify-between gap-3 border border-white/10 bg-[#09090d] p-4">
                      <Controller name="spatialLayers.0.file" control={control} render={() => <></>} />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white/75">{layer.file.name}</p>
                        <p className="mt-1 text-xs text-white/35">{formatMb(layer.file.size)} · {t("ar.create.videoLabel")}</p>
                      </div>
                      <button type="button" aria-label={t("ar.create.removeFile", { file: layer.file.name })}
                        onClick={() => { setConversionError(null); setSubmitAttempted(false); clearErrors(["spatialLayers"]); removeSpatialLayer(index); }}
                        className="p-2 text-white/35 transition hover:text-rose-200"><Trash2 className="size-4" /></button>
                    </div>
                  );
                })}
                {conversionMessage ? <p role="status" className="text-xs text-amber-200/75">{language === "vi" ? t("ar.create.preparing") : conversionMessage}</p> : null}
                {submitAttempted && conversionError ? <p role="alert" className="text-xs text-rose-200/80">{localizedArFormError(conversionError, language, t, "ar.create.errorVideo")}</p> : null}
                {submitAttempted && errors.spatialLayers?.message ?
                  <p role="alert" className="text-xs text-rose-200/80">{localizedArFormError(errors.spatialLayers.message, language, t, "ar.create.errorVideo")}</p> : null}
                {submitAttempted && errors.spatialLayers?.[0]?.file?.message ?
                  <p role="alert" className="text-xs text-rose-200/80">{localizedArFormError(errors.spatialLayers[0].file.message, language, t, "ar.create.errorVideo")}</p> : null}
              </div>


              {!adminLayout && (
                <p className="text-xs leading-6 text-white/45">{t("ar.create.helpText")}</p>
              )}
            </div>

            <div className={adminLayout ? "flex flex-wrap items-center justify-end gap-3 border-t border-stone-800 pt-4" : "flex flex-wrap items-center justify-between gap-5 rounded-[5px] bg-white/[0.018] px-4 py-4"}>
              {!adminLayout && (
                <p className="max-w-sm text-xs leading-5 text-white/32">
                  {t("ar.create.publishHint")}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canSubmit}
                  onClick={() => {
                    setSubmitIntent("draft");
                    void submitArtwork("draft");
                  }}
                  className="h-12 border-white/12 bg-transparent px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/55 hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
                >
                  {submitIntent === "draft" && (isSubmitting || converting) ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {submitIntent === "draft" && (isSubmitting || converting) ? t("ar.create.preparing") : t("ar.create.saveDraft")}
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  onClick={() => setSubmitIntent("publish")}
                  className="h-12 bg-white px-6 text-xs font-medium uppercase tracking-[0.12em] text-black hover:bg-amber-100 disabled:bg-white/10 disabled:text-white/25"
                >
                  {submitIntent === "publish" && (isSubmitting || converting) ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {submitIntent === "publish" && (isSubmitting || converting) ? t("ar.create.preparing") : t("ar.create.publishQR")}
                </Button>
              </div>
            </div>

            {adminLayout && isSubmitting && workflow.compilerProgress > 0 && workflow.compilerProgress < 100 ? (
              <div role="status" className="text-xs text-amber-200">
                {t("ar.create.preparingLabel")} · {workflow.compilerProgress}%
                <div className="mt-2 h-1 overflow-hidden rounded bg-white/15">
                  <div className="h-full bg-[#C5A880]" style={{ width: workflow.compilerProgress + "%" }} />
                </div>
              </div>
            ) : null}
            {workflow.message ? <p className={`text-sm ${isSubmitting ? "text-white/40" : "text-rose-200/80"}`} role="status">{workflow.message.startsWith("ar.create.") ? t(workflow.message) : localizedArFormError(workflow.message, language, t, "ar.create.errorPublish")}</p> : null}
          </div>

          {!adminLayout && (
          <aside className="relative min-h-[34rem] overflow-hidden bg-[#09090d] text-white">
            {targetImage ? (
              <ArCompositionPreview
                targetImage={targetImage}
                arMode="spatial_layers"
                spatialLayers={spatialLayers}
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_32%,rgba(124,58,237,0.12),transparent_30%),radial-gradient(circle_at_30%_72%,rgba(34,211,238,0.06),transparent_26%),linear-gradient(180deg,#09090d,#050507)]" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/78 via-black/5 to-black/20" />
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8">
              {isSubmitting && workflow.compilerProgress > 0 && workflow.compilerProgress < 100 ? (
                <div className="mt-6 pt-2">
                  <div className="flex justify-between text-[0.62rem] uppercase tracking-[0.12em] text-white/45"><span>{t("ar.create.preparingLabel")}</span><span>{workflow.compilerProgress}%</span></div>
                  <div className="mt-2 h-px bg-white/15"><div className="h-px bg-amber-100 transition-[width]" style={{ width: `${workflow.compilerProgress}%` }} /></div>
                </div>
              ) : null}
            </div>
          </aside>
          )}
        </form>
      </section>
    </main>
  );
}
