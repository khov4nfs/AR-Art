"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  UploadCloud,
  X,
  Link as LinkIcon,
  Check,
  Loader2,
} from "lucide-react";

interface ImageUploadWithPreviewProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
  aspectRatio?: "square" | "video" | "wide" | "auto";
  placeholderText?: string;
  className?: string;
}

export default function ImageUploadWithPreview({
  label,
  value,
  onChange,
  helperText,
  aspectRatio = "video",
  placeholderText = "Chọn hoặc tải ảnh lên",
  className = "",
}: ImageUploadWithPreviewProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewSrc = localPreview || value;

  const aspectClass = {
    square: "aspect-square max-h-48",
    video: "aspect-[16/9] max-h-48",
    wide: "aspect-[21/9] max-h-40",
    auto: "h-40",
  }[aspectRatio];

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setError(null);
    setIsUploading(true);

    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Tải ảnh thất bại");
      }

      onChange(data.data.fileUrl);
      setLocalPreview(null);
      URL.revokeObjectURL(blobUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi tải ảnh lên";
      setError(msg);
      setLocalPreview(null);
      URL.revokeObjectURL(blobUrl);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (tempUrl.trim()) {
      onChange(tempUrl.trim());
      setShowUrlInput(false);
      setTempUrl("");
      setLocalPreview(null);
    }
  };

  const clearImage = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    onChange("");
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <label className="text-xs font-medium uppercase tracking-wide text-stone-300">
            {label}
          </label>
        ) : (
          <span className="text-xs font-medium uppercase tracking-wide text-stone-300">
            Hình ảnh
          </span>
        )}
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex items-center gap-1 text-[11px] text-[#C5A880] transition-colors hover:text-[#d8be99]"
        >
          <LinkIcon className="h-3 w-3" />
          {showUrlInput ? "Ẩn URL" : "Hoặc nhập URL"}
        </button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2 rounded-lg border border-stone-800 bg-[#18181A] p-2">
          <input
            type="text"
            placeholder="https://... hoặc /images/..."
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            className="flex-1 rounded border border-stone-800 bg-[#121214] px-3 py-1.5 text-xs text-stone-200 focus:border-[#C5A880] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="flex items-center gap-1 rounded bg-[#C5A880] px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-[#b59870]"
          >
            <Check className="h-3.5 w-3.5" /> Áp dụng
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {previewSrc ? (
        <div className="group relative overflow-hidden rounded-xl border border-stone-800 bg-[#141416]">
          <div
            className={`relative flex w-full items-center justify-center bg-stone-950/60 ${aspectClass}`}
          >
            <Image
              src={previewSrc}
              alt={label || "Preview"}
              fill
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 400px"
              unoptimized
            />
            {isUploading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-[#C5A880]" />
                <span className="text-xs text-stone-300">
                  Đang tải ảnh lên máy chủ...
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-stone-800 bg-[#18181B] p-2 text-xs sm:p-2.5">
            <div
              className="min-w-0 flex-1 truncate font-mono text-[11px] text-stone-400"
              title={value || "Đang tải..."}
            >
              {value || "Đang tải..."}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 rounded bg-stone-800 px-2.5 py-1 text-xs font-medium text-stone-200 transition-colors hover:bg-stone-700"
              >
                <UploadCloud className="h-3.5 w-3.5 text-[#C5A880]" /> Thay đổi
              </button>
              <button
                type="button"
                onClick={clearImage}
                className="rounded p-1 text-stone-400 transition-colors hover:bg-red-950/50 hover:text-red-400"
                title="Xóa ảnh"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-stone-600 bg-stone-900/40 p-6 transition-all hover:border-[#C5A880]/60 hover:bg-stone-900/70 ${
            isUploading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#C5A880]" />
              <span className="text-xs">Đang xử lý tải lên...</span>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-600 bg-stone-800 text-stone-300 transition-colors group-hover:border-[#C5A880]/40 group-hover:text-[#C5A880]">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-stone-200 transition-colors group-hover:text-white">
                  {placeholderText}
                </p>
                <p className="mt-0.5 text-[11px] text-stone-400">
                  Kéo thả tệp vào đây hoặc{" "}
                  <span className="text-[#C5A880] underline">duyệt từ máy</span>
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {helperText && !error && (
        <p className="text-[11px] text-stone-500">{helperText}</p>
      )}
    </div>
  );
}
