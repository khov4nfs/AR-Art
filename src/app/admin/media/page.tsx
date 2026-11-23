"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  UploadCloud,
  Copy,
  Check,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";
import { MediaAsset } from "@/lib/store";
import ImageUploadWithPreview from "@/components/admin/ImageUploadWithPreview";

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/media");
      const data = await res.json();
      if (data.success) {
        setMedia(data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMedia = media.filter((m) =>
    m.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            Thư Viện Media & Tệp Tải Lên
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Lưu trữ trực tiếp trên ổ đĩa máy chủ cục bộ (<span className="text-[#C5A880] font-mono">public/uploads/</span>), không phụ thuộc Cloud
          </p>
        </div>
        <button
          onClick={fetchMedia}
          className="px-3.5 py-2 bg-stone-800/80 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700/60 flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới thư viện
        </button>
      </div>

      {/* Upload Zone */}
      <div className="bg-[#141417] border border-stone-800 rounded-xl p-6">
        <h2 className="text-xs font-semibold text-stone-300 uppercase tracking-wide mb-3 flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-[#C5A880]" /> Tải Tệp Mới Lên Máy Chủ
        </h2>
        <ImageUploadWithPreview
          value=""
          onChange={(newUrl) => {
            if (newUrl) fetchMedia();
          }}
          placeholderText="Bấm để tải tệp ảnh từ máy tính hoặc kéo thả vào đây"
          aspectRatio="wide"
        />
      </div>

      {/* Search and Media Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên tệp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#141417] border border-stone-800 rounded-lg pl-10 pr-4 py-2 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-[#C5A880]"
            />
          </div>
          <div className="text-xs text-stone-400 font-mono">
            {filteredMedia.length} tệp
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-stone-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#C5A880] mb-3" />
            Đang tải tài sản hình ảnh...
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="p-16 text-center text-stone-500 bg-[#141417] border border-stone-800 rounded-xl">
            Chưa có hình ảnh nào trong thư viện tải lên.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMedia.map((asset) => (
              <div
                key={asset.id}
                className="bg-[#141417] border border-stone-800 rounded-xl overflow-hidden group hover:border-[#C5A880]/50 transition-all flex flex-col"
              >
                <div className="relative aspect-square bg-[#0E0E10]">
                  <Image
                    src={asset.fileUrl}
                    alt={asset.fileName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="200px"
                    unoptimized
                  />
                </div>
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <p className="font-mono text-stone-200 truncate text-[11px]" title={asset.fileName}>
                      {asset.fileName}
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5 font-mono">
                      {(asset.fileSize / 1024).toFixed(1)} KB · {asset.uploadedAt}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-stone-800/80">
                    <button
                      type="button"
                      onClick={() => handleCopy(asset.fileUrl, asset.id)}
                      className="flex-1 py-1 px-2 rounded bg-stone-800 hover:bg-[#C5A880] text-stone-300 hover:text-black text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                      {copiedId === asset.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Chép Link
                        </>
                      )}
                    </button>
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
                      title="Mở trong tab mới"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
