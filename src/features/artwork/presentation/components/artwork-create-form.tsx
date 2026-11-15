"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  LoaderCircle,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import type { ArtworkUploadSession } from "@/features/artwork/domain/artwork";
import {
  ARTWORK_UPLOAD_MAX_FILE_SIZE,
  artworkCreateFormSchema,
  type ArtworkCreateFormValues,
} from "@/features/artwork/domain/artwork-create-form-schema";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import { validateOriginalVideo, videoNeedsConversion } from "@/features/artwork/domain/original-video";
import { convertVideoForAr } from "@/features/artwork/presentation/lib/convert-video-for-ar";
import { ArCompositionPreview } from "@/features/artwork/presentation/components/ar-composition-preview";
import { CreatorSpatialScene } from "@/features/artwork/presentation/components/creator-spatial-scene";
import { compileMindTarget } from "@/features/artwork/presentation/lib/compile-mind-target";
import { extractVideoTarget } from "@/features/artwork/presentation/lib/extract-video-target";
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

export function ArtworkCreateForm() {
  const [workflow, dispatch] = useReducer(workflowReducer, initialWorkflowState);
  const [targetError, setTargetError] = useState<string | null>(null);
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
    firstVideo &&
    ["video/mp4", "video/webm"].includes(firstVideo.type) &&
    firstVideo.size > 0 &&
    firstVideo.size <= ARTWORK_UPLOAD_MAX_FILE_SIZE,
  );
  const targetPreparing = canExtractTarget && !targetImage && !targetError;
  const detailsReady = Boolean(title?.trim() && artistName?.trim());
  const arReady = Boolean(firstVideo && targetImage && !targetPreparing && !targetError);
  // Keep submit enabled for incomplete forms so validation appears only after a click.
  const canPublish = !isSubmitting && !targetPreparing && !converting;

  useEffect(() => {
    let active = true;
    setValue("targetImage", undefined as unknown as File, { shouldValidate: false });
    if (!firstVideo || !canExtractTarget) {
      return () => { active = false; };
    }

    void extractVideoTarget(firstVideo)
      .then((image) => {
        if (!active) return;
        setValue("targetImage", image, { shouldDirty: true, shouldValidate: false });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setTargetError(error instanceof Error ? error.message : "Unable to prepare the video frame.");
      });
    return () => { active = false; };
  }, [firstVideo, canExtractTarget, setValue]);

  async function getAuthHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    return { authorization: `Bearer ${data.session.access_token}` };
  }

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
        spatialLayers: values.spatialLayers.map((layer, index) => ({
          extension: fileExtension(layer.file),
          mimeType: layer.file.type,
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
      dispatch({ type: "message", message: "Checking your AR assets…" });
      const targetAspectRatio = await readImageAspectRatio(values.targetImage);
      const layerAspectRatios = await Promise.all(values.spatialLayers.map((layer) => readVideoAspectRatio(layer.file)));

      dispatch({ type: "message", message: "Preparing your artwork…" });
      const targetMind = await compileMindTarget(values.targetImage, (value) =>
        dispatch({ type: "compiler-progress", value }),
      );

      if (targetMind.size > ARTWORK_UPLOAD_MAX_FILE_SIZE) {
        throw new Error("The compiled tracking file is larger than the 6 MB MVP limit.");
      }

      dispatch({ type: "message", message: "Getting things ready…" });
      const session = await createSession(
        values,
        targetAspectRatio,
        layerAspectRatios,
      );

      dispatch({ type: "message", message: "Uploading your files…" });
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
        dispatch({
          type: "success",
          result: {
            status: "draft",
            productId: session.artworkId,
            shareUrl: null,
            arUrl: null,
            qrDataUrl: null,
          },
        });
        return;
      }

      dispatch({ type: "message", message: "Finishing up…" });
      dispatch({ type: "success", result: await publishArtwork(session) });
    } catch (cause) {
      dispatch({
        type: "error",
        message: cause instanceof Error ? cause.message : "Unable to publish artwork.",
      });
    }
  }

  async function submitArtwork(intent: "draft" | "publish") {
    if (converting || isSubmitting) return;
    setSubmitAttempted(true);
    setConversionError(null);
    clearErrors(["spatialLayers", "targetImage"]);
    const source = spatialLayers[0]?.file;

    // Small, already-compatible MP4/WebM files keep the normal browser flow.
    if (!source || !videoNeedsConversion(source)) {
      await handleSubmit((values) => runWorkflow(values, intent))();
      return;
    }

    // Validate details only on Save / Publish, before sending a large MOV.
    if (!(await trigger(["title", "artistName"]))) return;
    const originalError = validateOriginalVideo(source);
    if (originalError) {
      setConversionError(originalError);
      return;
    }

    setConverting(true);
    try {
      const auth = await getAuthHeaders();
      const converted = await convertVideoForAr(source, auth, setConversionMessage);
      setConversionMessage("Preparing AR tracking from the converted video…");
      const target = await extractVideoTarget(converted);
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
    setTargetError(null);
    setConversionError(null);
    setSubmitAttempted(false);
    clearErrors(["spatialLayers", "targetImage"]);
    setValue("targetImage", undefined as unknown as File, { shouldValidate: false });
    replaceSpatialLayers([{
      file,
      animation: "none",
      blendMode: "normal",
      x: 0,
      y: 0,
      depth: 0.05,
      scale: 0.8,
    }]);
  }

  if (workflow.result) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
        <div className="pointer-events-none absolute right-[8%] top-24 size-80 rounded-full bg-violet-700/7 blur-[130px]" />
        <header className="relative mx-auto flex w-full max-w-[94rem] items-center justify-between border-b border-white/12 px-5 py-5 sm:px-8 lg:px-12">
          <Link href="/studio/products" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/50 transition hover:text-white">
            <ArrowLeft className="size-3.5" /> Products
          </Link>
          <span className="text-lg font-semibold tracking-[-0.045em]">EVERIE</span>
          <span className="text-[0.62rem] uppercase tracking-[0.18em] text-cyan-100/45">
            {workflow.result.status === "published" ? "Published" : "Draft saved"}
          </span>
        </header>

        <section className="relative mx-auto grid min-h-[calc(100svh-4.8rem)] w-full max-w-[94rem] items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-20">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-violet-200/45">
              {workflow.result.status === "published" ? "Work is live" : "Saved privately"}
            </p>
            <h1 className="mt-6 max-w-3xl font-serif text-6xl leading-[0.88] tracking-[-0.055em] sm:text-8xl">
              {workflow.result.status === "published" ? (
                <>Ready for<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">the wall.</span></>
              ) : (
                <>Ready when<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">you are.</span></>
              )}
            </h1>

            {workflow.result.shareUrl ? (
              <div className="mt-10 border-y border-white/12 py-4">
                <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/28">Artwork link</p>
                <p className="mt-2 break-all text-sm text-white/58">{workflow.result.shareUrl}</p>
              </div>
            ) : (
              <p className="mt-8 max-w-xl text-sm leading-6 text-white/45">
                Your artwork and AR experience are uploaded and kept private. Open the product in Studio whenever you are ready to publish it.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {workflow.result.shareUrl ? (
                <>
                  <button type="button" onClick={copyShareUrl} className="inline-flex h-12 items-center gap-2 bg-white px-5 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-violet-100">
                    {workflow.copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {workflow.copied ? "Copied" : "Copy link"}
                  </button>
                  {workflow.result.qrDataUrl ? (
                    <a href={workflow.result.qrDataUrl} download="everie-qr.png" className="inline-flex h-12 items-center gap-2 border border-white/18 px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/58 transition hover:border-white/45 hover:text-white">
                      <Download className="size-4" /> Download QR
                    </a>
                  ) : null}
                  <a href={workflow.result.shareUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center border border-white/18 px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/58 transition hover:border-white/45 hover:text-white">
                    Open work
                  </a>
                </>
              ) : (
                <Link href="/studio/products" className="inline-flex h-12 items-center bg-white px-5 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-violet-100">
                  Manage draft
                </Link>
              )}
            </div>
          </div>

          <div className="border border-white/10 bg-[#09090d] p-8 shadow-[0_35px_120px_rgba(0,0,0,0.35)] sm:p-12">
            {workflow.result.qrDataUrl ? (
              <div className="mx-auto max-w-sm border border-white/12 p-7">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={workflow.result.qrDataUrl} alt="QR code for the published AR artwork" className="aspect-square w-full bg-white p-3" />
                <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4 text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                  <span>Everie</span><span>Scan to enter AR</span>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[24rem] flex-col items-center justify-center border border-white/12 px-8 text-center">
                <Check className="size-7 text-cyan-100/65" />
                <p className="mt-5 font-serif text-3xl">Saved privately.</p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-white/35">QR and public sharing become available when you publish this product from Studio.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none absolute right-[12%] top-28 size-80 rounded-full bg-violet-700/7 blur-[130px]" />
      <header className="relative mx-auto flex w-full max-w-[94rem] items-center justify-between border-b border-white/12 px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/studio/products" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/50 transition hover:text-white">
          <ArrowLeft className="size-3.5" /> Studio
        </Link>
        <span className="text-lg font-semibold tracking-[-0.045em]">EVERIE</span>
        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-white/28">New work</span>
      </header>

      <section className="relative mx-auto w-full max-w-[94rem] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.38fr_1.62fr]">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-violet-200/45">Publish / 01</p>
          <div>
            <h1 className="max-w-5xl font-serif text-6xl leading-[0.86] tracking-[-0.055em] sm:text-8xl lg:text-9xl">
              Bring your video<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">into AR.</span>
            </h1>
          </div>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void submitArtwork("publish"); }} noValidate className="mt-16 grid gap-10 border-t border-white/12 pt-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-9">
            <div className="grid gap-8 sm:grid-cols-2">
              <label className="block">
                <span className="text-[0.65rem] uppercase tracking-[0.17em] text-white/35">Artwork title</span>
                <Input id="title" maxLength={120} aria-invalid={Boolean(errors.title)} placeholder="e.g. Neon Saigon" {...register("title")} className="mt-3 h-12 rounded-none border-0 border-b border-white/18 bg-transparent px-0 text-base text-white shadow-none placeholder:text-white/18 focus-visible:border-cyan-200/70 focus-visible:ring-0" />
                {errors.title?.message ? <p className="mt-2 text-xs text-rose-200/80">{errors.title.message}</p> : null}
              </label>

              <label className="block">
                <span className="text-[0.65rem] uppercase tracking-[0.17em] text-white/35">Artist / creator</span>
                <Input id="artistName" maxLength={120} aria-invalid={Boolean(errors.artistName)} placeholder="Artist name" {...register("artistName")} className="mt-3 h-12 rounded-none border-0 border-b border-white/18 bg-transparent px-0 text-base text-white shadow-none placeholder:text-white/18 focus-visible:border-cyan-200/70 focus-visible:ring-0" />
                {errors.artistName?.message ? <p className="mt-2 text-xs text-rose-200/80">{errors.artistName.message}</p> : null}
              </label>
            </div>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-6 border border-dashed border-white/18 bg-[#09090d] p-5 transition hover:border-white/35 hover:bg-white/[0.04]">
                <div className="flex items-center gap-4">
                  <Video className="size-5 shrink-0" />
                  <div>
                    <p className="font-serif text-2xl">Upload AR video</p>
                    <p className="mt-1 text-xs text-white/36">MOV, MP4 or WebM · originals up to 240 MB · auto-convert on save</p>
                  </div>
                </div>
                <input type="file" accept="video/quicktime,video/mp4,video/webm,.mov,.mp4,.webm" className="sr-only" onChange={(event) => { selectVideo(event.target.files); event.currentTarget.value = ""; }} />
              </label>
              <p className="text-xs leading-5 text-white/40">
                We automatically create a tracking image from your video. For AR scanning to work, the video needs a recognizable frame matching the physical artwork. Transparent motion alone may not be trackable.
              </p>
              {targetPreparing ? <p className="text-xs text-violet-200/75" role="status">Preparing tracking from video…</p> : null}
              {conversionMessage ? <p className="text-xs text-violet-200/75" role="status">{conversionMessage}</p> : null}
              {submitAttempted && conversionError ? <p className="text-xs text-rose-200/80" role="alert">{conversionError}</p> : null}
              {submitAttempted && targetError ? <p className="text-xs text-rose-200/80" role="alert">{targetError}</p> : null}
              {spatialFields.map((field, index) => {
                const layer = spatialLayers[index];
                if (!layer) return null;
                return (
                  <div key={field.id} className="flex items-center justify-between gap-3 border border-white/10 bg-[#09090d] p-4">
                    <Controller name={`spatialLayers.${index}.file`} control={control} render={() => <></>} />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white/75">{layer.file.name}</p>
                      <p className="mt-1 text-xs text-white/35">{formatMb(layer.file.size)} · Video</p>
                    </div>
                    <button type="button" aria-label={`Remove ${layer.file.name}`} onClick={() => { setTargetError(null); clearErrors(["spatialLayers", "targetImage"]); setValue("targetImage", undefined as unknown as File, { shouldValidate: false }); removeSpatialLayer(index); }} className="p-2 text-white/35 transition hover:text-rose-200"><Trash2 className="size-4" /></button>
                  </div>
                );
              })}
              {submitAttempted && errors.spatialLayers?.message ? <p className="text-xs text-rose-200/80" role="alert">{errors.spatialLayers.message}</p> : null}
              {submitAttempted && errors.spatialLayers?.[0]?.file?.message ? <p className="text-xs text-rose-200/80" role="alert">{errors.spatialLayers[0].file.message}</p> : null}
              {submitAttempted && firstVideo && errors.targetImage?.message && !errors.spatialLayers?.[0]?.file?.message && !targetPreparing && !targetError ? <p className="text-xs text-rose-200/80" role="alert">Unable to prepare tracking from this video. Try another video.</p> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-5 border-y border-white/12 py-4">
              <div className="flex items-center gap-5 text-[0.62rem] uppercase tracking-[0.13em] text-white/28">
                <span className={detailsReady ? "text-white" : ""}>Details</span>
                <span className={arReady ? "text-white" : ""}>Video</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" disabled={!canPublish} onClick={() => void submitArtwork("draft")} className="h-12 rounded-none border-white/15 bg-transparent px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/55 hover:bg-white/[0.05] hover:text-white disabled:opacity-30">
                  {isSubmitting || converting ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Save draft
                </Button>
                <Button type="submit" disabled={!canPublish} className="h-12 rounded-none bg-white px-6 text-xs font-medium uppercase tracking-[0.12em] text-black hover:bg-violet-100 disabled:bg-white/10 disabled:text-white/25">
                  {isSubmitting || converting ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {isSubmitting || converting ? "Preparing…" : "Publish and get QR"}
                </Button>
              </div>
            </div>

            {workflow.message ? <p className={`text-sm ${isSubmitting ? "text-white/40" : "text-rose-200/80"}`} role="status">{workflow.message}</p> : null}
          </div>

          <aside className="relative min-h-[34rem] overflow-hidden border border-white/10 bg-[#09090d] text-white">
            {targetImage ? (
              <ArCompositionPreview
                targetImage={targetImage}
                arMode="spatial_layers"
                spatialLayers={spatialLayers}
              />
            ) : (
              <CreatorSpatialScene />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/78 via-black/5 to-black/20" />
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-white/45">From video to AR</p>
              <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/20 pt-4 text-xs uppercase tracking-[0.11em] text-white/58">
                <span>01 · Video</span><span>02 · Prepare</span><span>03 · Publish</span>
              </div>
              {isSubmitting && workflow.compilerProgress > 0 && workflow.compilerProgress < 100 ? (
                <div className="mt-6 border-t border-white/15 pt-4">
                  <div className="flex justify-between text-[0.62rem] uppercase tracking-[0.12em] text-white/45"><span>Preparing</span><span>{workflow.compilerProgress}%</span></div>
                  <div className="mt-2 h-px bg-white/15"><div className="h-px bg-cyan-100 transition-[width]" style={{ width: `${workflow.compilerProgress}%` }} /></div>
                </div>
              ) : null}
            </div>
          </aside>
        </form>
      </section>
    </main>
  );
}