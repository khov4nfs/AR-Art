"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, ImageDown, LoaderCircle, Share2, TriangleAlert } from "lucide-react";

interface ShareArtworkButtonProps {
  title: string;
  text?: string;
  imageUrl: string;
}

type ActionFeedback = {
  action: "link" | "page" | "image";
  state: "success" | "saved" | "error";
} | null;

function imageExtension(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

function safeFileName(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "everie-item";
}

const actionClass =
  "inline-flex h-10 items-center gap-2 border-b border-white/18 px-0 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-white/42 transition hover:border-amber-200/65 hover:text-white disabled:cursor-wait disabled:opacity-45";

export function ShareArtworkButton({
  title,
  text,
  imageUrl,
}: ShareArtworkButtonProps) {
  const [feedback, setFeedback] = useState<ActionFeedback>(null);
  const [sharingImage, setSharingImage] = useState(false);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    };
  }, []);

  function showFeedback(value: ActionFeedback) {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    setFeedback(value);
    feedbackTimer.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimer.current = null;
    }, 1800);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showFeedback({ action: "link", state: "success" });
    } catch {
      showFeedback({ action: "link", state: "error" });
    }
  }

  async function sharePage() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        showFeedback({ action: "page", state: "success" });
        return;
      }
      await navigator.clipboard.writeText(url);
      showFeedback({ action: "page", state: "saved" });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      showFeedback({ action: "page", state: "error" });
    }
  }

  async function shareImage() {
    if (sharingImage) return;
    setSharingImage(true);

    try {
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Unable to load share image.");

      const blob = await response.blob();
      const extension = imageExtension(blob.type);
      const file = new File([blob], `${safeFileName(title)}.${extension}`, {
        type: blob.type || "image/jpeg",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, files: [file] });
        showFeedback({ action: "image", state: "success" });
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.name;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      showFeedback({ action: "image", state: "saved" });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      showFeedback({ action: "image", state: "error" });
    } finally {
      setSharingImage(false);
    }
  }

  const linkFeedback = feedback?.action === "link" ? feedback : null;
  const pageFeedback = feedback?.action === "page" ? feedback : null;
  const imageFeedback = feedback?.action === "image" ? feedback : null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      <button type="button" onClick={() => void copyLink()} className={actionClass}>
        {linkFeedback?.state === "success" ? <Check className="size-3.5" /> : linkFeedback?.state === "error" ? <TriangleAlert className="size-3.5" /> : <Copy className="size-3.5" />}
        {linkFeedback?.state === "success" ? "Copied" : linkFeedback?.state === "error" ? "Try again" : "Copy link"}
      </button>

      <button type="button" onClick={() => void sharePage()} className={actionClass}>
        {pageFeedback?.state === "success" || pageFeedback?.state === "saved" ? <Check className="size-3.5" /> : pageFeedback?.state === "error" ? <TriangleAlert className="size-3.5" /> : <Share2 className="size-3.5" />}
        {pageFeedback?.state === "success" ? "Shared" : pageFeedback?.state === "saved" ? "Link copied" : pageFeedback?.state === "error" ? "Try again" : "Share page"}
      </button>

      <button type="button" disabled={sharingImage} onClick={() => void shareImage()} className={actionClass}>
        {sharingImage ? <LoaderCircle className="size-3.5 animate-spin" /> : imageFeedback?.state === "success" || imageFeedback?.state === "saved" ? <Check className="size-3.5" /> : imageFeedback?.state === "error" ? <TriangleAlert className="size-3.5" /> : <ImageDown className="size-3.5" />}
        {sharingImage ? "Preparing…" : imageFeedback?.state === "success" ? "Shared" : imageFeedback?.state === "saved" ? "Image saved" : imageFeedback?.state === "error" ? "Try again" : "Share image"}
      </button>
    </div>
  );
}
