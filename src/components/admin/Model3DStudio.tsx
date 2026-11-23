"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Camera, ChevronDown, Download, ExternalLink, Gauge, ImageIcon, Lightbulb, Loader2, Sparkles, Sun, UploadCloud, Wand2, XCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ENGRAVING_FONTS, engravingFontVariables } from "@/components/configurator/engravingFonts";
import type { ModelFit, FlowerPreset } from "@/components/configurator/flowerScene";

const FlowerConfigurator = dynamic(() => import("@/components/configurator/FlowerConfigurator"), {
  ssr: false,
  loading: () => <div className="aspect-square w-full rounded-xl bg-[#1a120d] animate-pulse" />,
});

/** Spaces verified reachable (HTTP 200) on 2026-10-28; free ZeroGPU quota applies. */
const SPACES = [
  { id: "tencent/Hunyuan3D-2", primary: true, note: { vi: "Khuyên dùng – ổn định nhất", en: "Recommended – most reliable" } },
  { id: "tencent/Hunyuan3D-2.1", primary: false, note: { vi: "PBR đẹp hơn, hay hết quota GPU miễn phí", en: "Better PBR, often exceeds free GPU quota" } },
  { id: "trellis-community/TRELLIS", primary: false, note: { vi: "Phương án dự phòng, cần đăng nhập HF để có quota", en: "Fallback; sign in to HF for quota" } },
];

type Stats = {
  bytes: number; triangles: number; vertices: number; meshes: string[]; materials: string[]; textures: number; maxTexture: number; draco: boolean;
};

const L = {
  vi: {
    title: "Tạo 3D miễn phí trên Hugging Face",
    intro: "Tạo mô hình từ ảnh sản phẩm trên Hugging Face, tải file .glb về rồi tải lên tại đây. Không cần GPU riêng.",
    steps: [
      ["Chuẩn bị ảnh", "Ảnh 1 bông, nền trơn sáng, chính diện, đủ cả bông & đế cuống (xem hướng dẫn bên dưới)."],
      ["Mở Space", "Bấm nút Hunyuan3D-2 bên dưới (mở tab mới). Đăng nhập Hugging Face để có thêm quota GPU miễn phí."],
      ["Tải ảnh lên", "Tab “Image Prompt” → kéo ảnh vào. Nếu có 3–4 góc, dùng tab “MultiView Prompt” (front / left / back / right)."],
      ["Chọn thiết lập", "Options: Generation Mode = Standard, Decoding Mode = High. Advanced Options: ✓ Remove Background, Inference Steps 30–50, Octree Resolution 380–512, Guidance 5–7.5, Number of Chunks 8000 (giữ nguyên)."],
      ["Tạo", "Bấm “Gen Shape” (chỉ khối – khuyên dùng vì men được tô lại trong web). “Gen Textured Shape” chỉ khi cần màu ảnh và Space còn quota."],
      ["Tải GLB", "Tab Export: File Type = glb, ✓ Simplify Mesh, Target Face Number 60000, Include Texture tắt (bật nếu đã Gen Textured) → “Transform” → nút tải xuống."],
      ["Tải lên đây", "Kéo file .glb vào ô bên dưới. Hệ thống kiểm tra kích thước/số tam giác và có thể tối ưu tự động."],
    ],
    open: "Mở",
    quota: "Space miễn phí có thể hết GPU quota hoặc xếp hàng; thử lại sau vài phút hoặc dùng Space khác.",
    drop: "Kéo thả file .glb vào đây hoặc bấm để chọn (tối đa 25MB)",
    uploading: "Đang tải lên…",
    checking: "Đang kiểm tra…",
    optimize: "Tối ưu tự động (weld · simplify ~60k · WebP · meshopt)",
    optimizing: "Đang tối ưu…",
    backup: "Đã giữ bản gốc:",
    size: "Dung lượng", tris: "Tam giác", mats: "Vật liệu", tex: "Texture",
    tooBig: "Vượt 3MB – nên tối ưu để tải nhanh trên di động.",
    tooMany: "Vượt 100k tam giác – nên tối ưu.",
    draco: "File nén Draco: xem được trên web nhưng máy chủ không đọc được để tối ưu.",
    noGlaze: "Không có vật liệu/mesh tên “glaze” hoặc “petal”: đổi màu men sẽ không áp dụng. Chạy scripts/ai3d-postprocess.py để tách cánh hoa.",
    ok: "Đạt yêu cầu web.",
    preview: "Xem trước (giống trang sản phẩm)",
    glaze: "Màu men thử", engr: "Chữ khắc thử",
    fit: "Đặt hoa lên đế", scale: "Tỉ lệ", rot: "Xoay (°)", offset: "Nâng/hạ", reset: "Đặt lại",
    fitHint: "Được lưu cùng sản phẩm khi bấm Lưu.",
    guide: "Hướng dẫn: ảnh đẹp cho 3D",
  },
  en: {
    title: "Create 3D for free on Hugging Face",
    intro: "Generate a model from a product photo on Hugging Face, download the .glb and upload it here. No GPU needed.",
    steps: [
      ["Prepare a photo", "One flower, plain light background, front view, whole bloom & stem in frame (see guide below)."],
      ["Open the Space", "Click Hunyuan3D-2 below (new tab). Sign in to Hugging Face for more free GPU quota."],
      ["Upload", "“Image Prompt” tab → drop the photo. With 3–4 angles use “MultiView Prompt” (front / left / back / right)."],
      ["Settings", "Options: Generation Mode = Standard, Decoding Mode = High. Advanced Options: ✓ Remove Background, Inference Steps 30–50, Octree Resolution 380–512, Guidance 5–7.5, Number of Chunks 8000 (default)."],
      ["Generate", "Click “Gen Shape” (shape only – recommended, the glaze is re-coloured on the web). Use “Gen Textured Shape” only if you need photo colours and quota remains."],
      ["Download GLB", "Export tab: File Type = glb, ✓ Simplify Mesh, Target Face Number 60000, Include Texture off (on if textured) → “Transform” → download."],
      ["Upload here", "Drop the .glb below. Size/triangles are checked and it can be optimized automatically."],
    ],
    open: "Open",
    quota: "Free Spaces may run out of GPU quota or queue; retry in a few minutes or use another Space.",
    drop: "Drop a .glb here or click to choose (max 25MB)",
    uploading: "Uploading…",
    checking: "Checking…",
    optimize: "Auto-optimize (weld · simplify ~60k · WebP · meshopt)",
    optimizing: "Optimizing…",
    backup: "Original kept:",
    size: "Size", tris: "Triangles", mats: "Materials", tex: "Textures",
    tooBig: "Over 3MB – optimize for fast mobile loading.",
    tooMany: "Over 100k triangles – optimize.",
    draco: "Draco-compressed: viewable on the web but the server can't read it to optimize.",
    noGlaze: "No material/mesh named “glaze” or “petal”: glaze recolouring won't apply. Run scripts/ai3d-postprocess.py to split petals.",
    ok: "Web-ready.",
    preview: "Preview (same as product page)",
    glaze: "Test glaze", engr: "Test engraving",
    fit: "Seat flower on base", scale: "Scale", rot: "Rotate (°)", offset: "Raise/lower", reset: "Reset",
    fitHint: "Saved with the product when you click Save.",
    guide: "Guide: great photos for 3D",
  },
};

const GUIDE = {
  vi: {
    rules: [
      [Camera, "Một đối tượng, chính giữa khung, thấy trọn bông + cuống, chừa lề ~10%."],
      [ImageIcon, "Nền trơn sáng (trắng/xám nhạt), không hoa văn, không vật khác."],
      [Sun, "Ánh sáng mềm, khuếch tán (hộp chụp/softbox, trời râm). Tránh bóng gắt và điểm loá trên men bóng."],
      [Gauge, "Ảnh ≥ 1024px cạnh ngắn, nét, không filter, không chữ/watermark."],
      [Sparkles, "Multi-view: 3–4 ảnh cùng ánh sáng – chính diện, 45°, ngang, từ trên xuống (giữ nguyên khoảng cách)."],
    ],
    bad: "AI làm kém: cánh rất mỏng/xuyên sáng, chi tiết trong suốt (kính, men trong), nhị hoa li ti, phần bị che khuất. Kết quả mặt sau là AI đoán.",
    fix: "Sửa nhanh trong Blender (miễn phí): Decimate để giảm tam giác, Smooth/Remesh để mịn, tách cánh hoa đặt vật liệu tên “glaze”, xuất glTF Binary (.glb).",
    targets: "Mục tiêu file: .glb ≤ 3MB, ≤ 60–100k tam giác, texture ≤ 2048px WebP/KTX2, trục Y hướng lên, gốc ở chân cuống.",
    blender: "Hướng dẫn xuất glTF trong Blender",
  },
  en: {
    rules: [
      [Camera, "Single object, centred, whole bloom + stem in frame, ~10% margin."],
      [ImageIcon, "Plain light background (white/light grey), no pattern or other objects."],
      [Sun, "Soft, diffuse light (light box, overcast). Avoid harsh shadows and glossy hotspots."],
      [Gauge, "≥ 1024px short side, sharp, no filters, no text/watermarks."],
      [Sparkles, "Multi-view: 3–4 shots, same light – front, 45°, side, top (same distance)."],
    ],
    bad: "AI struggles with: very thin/translucent petals, transparent parts (glass, clear glaze), tiny stamens, hidden areas. The back side is guessed.",
    fix: "Quick fixes in Blender (free): Decimate to cut triangles, Smooth/Remesh, split petals into a material named “glaze”, export glTF Binary (.glb).",
    targets: "File targets: .glb ≤ 3MB, ≤ 60–100k triangles, textures ≤ 2048px WebP/KTX2, Y-up, origin at the stem foot.",
    blender: "Blender glTF export docs",
  },
} as const;

const fmtMB = (b: number) => `${(b / 1024 / 1024).toFixed(2)} MB`;

export interface Model3DStudioProps {
  glbUrl?: string;
  preset?: FlowerPreset;
  fit?: ModelFit;
  colors?: { name: string; hex: string }[];
  poster: string;
  onGlbChange: (url: string | undefined) => void;
  onFitChange: (fit: ModelFit | undefined) => void;
}

export default function Model3DStudio(props: Model3DStudioProps) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "vi";
  const tx = L[lang];
  const g = GUIDE[lang];
  const { glbUrl, onGlbChange, onFitChange } = props;
  const [busy, setBusy] = useState<"" | "upload" | "check" | "optimize">("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [backup, setBackup] = useState("");
  const [drag, setDrag] = useState(false);
  const [glazeHex, setGlazeHex] = useState(props.colors?.[0]?.hex ?? "#E8B4A8");
  const [engr, setEngr] = useState("Minh ♥ Thư");
  const fit = props.fit ?? {};
  const font = ENGRAVING_FONTS[0];

  const inspect = useCallback(async (url: string) => {
    if (!/^\/(models|uploads\/models)\//.test(url)) {
      setStats(null);
      return;
    }
    setBusy("check");
    try {
      const res = await fetch("/api/admin/glb-tools", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "inspect", fileUrl: url }),
      });
      const j = (await res.json()) as { success: boolean; data?: { stats: Stats }; error?: string };
      if (j.success && j.data) setStats(j.data.stats);
      else setError(j.error || "");
    } catch {
      setStats(null);
    } finally {
      setBusy("");
    }
  }, []);

  useEffect(() => {
    if (!glbUrl) return;
    const id = window.setTimeout(() => void inspect(glbUrl), 0);
    return () => window.clearTimeout(id);
  }, [glbUrl, inspect]);

  const upload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".glb")) {
      setError(lang === "vi" ? "Chỉ nhận file .glb" : "Only .glb files");
      return;
    }
    setBusy("upload");
    setError("");
    setBackup("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = (await res.json()) as { success: boolean; data?: { fileUrl: string }; error?: string };
      if (j.success && j.data) onGlbChange(j.data.fileUrl);
      else setError(j.error || "Upload failed");
    } catch {
      setError("Upload failed");
    } finally {
      setBusy("");
    }
  };

  const optimize = async () => {
    if (!glbUrl) return;
    setBusy("optimize");
    setError("");
    try {
      const res = await fetch("/api/admin/glb-tools", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "optimize", fileUrl: glbUrl }),
      });
      const j = (await res.json()) as { success: boolean; data?: { fileUrl: string; backupUrl: string; after: Stats }; error?: string };
      if (j.success && j.data) {
        setBackup(j.data.backupUrl);
        setStats(j.data.after);
        onGlbChange(j.data.fileUrl);
      } else setError(j.error || "Optimize failed");
    } catch {
      setError("Optimize failed");
    } finally {
      setBusy("");
    }
  };

  const hasGlaze = stats ? [...stats.meshes, ...stats.materials].some((n) => /glaze|petal/i.test(n)) : true;
  const warnings = stats
    ? [
        stats.bytes > 3 * 1024 * 1024 && tx.tooBig,
        stats.triangles > 100_000 && tx.tooMany,
        stats.draco && tx.draco,
        !hasGlaze && tx.noGlaze,
      ].filter(Boolean)
    : [];
  const canOptimize = Boolean(glbUrl?.startsWith("/uploads/models/")) && !stats?.draco;
  const setFit = (patch: ModelFit) => onFitChange({ ...fit, ...patch });

  return (
    <div className={`space-y-5 ${engravingFontVariables}`} data-testid="model3d-studio">
      {/* Hugging Face workflow */}
      <section className="storefront-preview-canvas rounded-xl border border-[#C5A880]/30 bg-gradient-to-br from-[#211812] to-[#141012] p-5">
        <div className="flex items-center gap-2 text-[#E9D8B4]">
          <Wand2 className="w-4 h-4" />
          <h4 className="text-sm font-semibold">{tx.title}</h4>
        </div>
        <p className="text-xs text-stone-400 mt-1">{tx.intro}</p>
        <ol className="mt-4 space-y-2.5">
          {tx.steps.map(([h, d], i) => (
            <li key={h} className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#C5A880] text-black text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
              <p className="text-xs text-stone-300 leading-relaxed"><b className="text-stone-100">{h}.</b> {d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          {SPACES.map((s) => (
            <a
              key={s.id}
              href={`https://huggingface.co/spaces/${s.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`group inline-flex flex-col rounded-lg border px-3 py-2 text-xs transition ${
                s.primary ? "border-[#C5A880] bg-[#C5A880] text-black hover:bg-[#d8bd93]" : "border-stone-700 text-stone-200 hover:border-[#C5A880]"
              }`}
            >
              <span className="inline-flex items-center gap-1.5 font-semibold">{tx.open} {s.id.split("/")[1]} <ExternalLink className="w-3 h-3" /></span>
              <span className={`text-[10px] ${s.primary ? "text-black/70" : "text-stone-500"}`}>{s.note[lang]}</span>
            </a>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-amber-300/80">{tx.quota}</p>
      </section>

      {/* Dropzone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) void upload(f); }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center cursor-pointer transition ${
          drag ? "border-[#C5A880] bg-[#C5A880]/10" : "border-stone-700 hover:border-stone-500"
        }`}
      >
        {busy === "upload" ? <Loader2 className="w-6 h-6 animate-spin text-[#C5A880]" /> : <UploadCloud className="w-6 h-6 text-[#C5A880]" />}
        <span className="text-xs text-stone-300">{busy === "upload" ? tx.uploading : tx.drop}</span>
        <input type="file" accept=".glb,model/gltf-binary" className="hidden" disabled={Boolean(busy)}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
      </label>
      {error && <p className="text-[11px] text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{error}</p>}

      {/* Stats + optimize */}
      {glbUrl && (
        <div className="rounded-xl border border-stone-800 bg-[#1A1A1D] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <code className="text-[11px] text-stone-400 truncate">{glbUrl}</code>
            {busy === "check" && <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />}
          </div>
          {stats && (
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                [tx.size, fmtMB(stats.bytes), stats.bytes > 3 * 1024 * 1024],
                [tx.tris, stats.triangles < 0 ? "?" : stats.triangles.toLocaleString(), stats.triangles > 100_000],
                [tx.mats, String(stats.materials.length), false],
                [tx.tex, stats.textures ? `${stats.textures} · ${stats.maxTexture}px` : "0", stats.maxTexture > 2048],
              ].map(([k, v, bad]) => (
                <div key={String(k)} className={`rounded-lg px-2 py-2 ${bad ? "bg-red-500/10 text-red-300" : "bg-stone-900 text-stone-200"}`}>
                  <div className="text-[10px] uppercase tracking-wider text-stone-500">{k}</div>
                  <div className="text-sm font-semibold">{v}</div>
                </div>
              ))}
            </div>
          )}
          {stats && (warnings.length ? (
            <ul className="space-y-1">{warnings.map((w) => <li key={String(w)} className="text-[11px] text-amber-300">• {w}</li>)}</ul>
          ) : <p className="text-[11px] text-emerald-400">✓ {tx.ok}</p>)}
          {canOptimize && (
            <button type="button" onClick={optimize} disabled={Boolean(busy)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-100 disabled:opacity-50">
              {busy === "optimize" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gauge className="w-3.5 h-3.5" />}
              {busy === "optimize" ? tx.optimizing : tx.optimize}
            </button>
          )}
          {backup && (
            <p className="text-[11px] text-stone-400 flex items-center gap-1">
              <Download className="w-3 h-3" />{tx.backup} <a className="underline" href={backup} download>{backup}</a>
            </p>
          )}
        </div>
      )}

      {/* Live preview + fit */}
      {(glbUrl || props.preset) && (
        <div className="grid md:grid-cols-[minmax(0,1fr)_220px] gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-2">{tx.preview}</p>
            <div className="relative aspect-square w-full overflow-hidden rounded-xl">
              <FlowerConfigurator
                key={glbUrl || props.preset}
                preset={props.preset}
                glbUrl={glbUrl}
                fit={fit}
                poster={props.poster}
                alt="preview"
                glazeHex={glazeHex}
                engravingText={engr}
                fontFamily={font.family}
                fontId={font.id}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-stone-400 mb-1.5">{tx.glaze}</p>
              <div className="flex flex-wrap gap-2">
                {(props.colors?.length ? props.colors : [{ name: "Hồng", hex: "#E8B4A8" }]).map((c) => (
                  <button key={c.hex + c.name} type="button" title={c.name} onClick={() => setGlazeHex(c.hex)}
                    className={`w-7 h-7 rounded-full border-2 ${glazeHex === c.hex ? "border-[#C5A880]" : "border-stone-700"}`}
                    style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-[11px] text-stone-400">{tx.engr}</span>
              <input value={engr} maxLength={24} onChange={(e) => setEngr(e.target.value)}
                className="mt-1 w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2 text-xs text-stone-200" />
            </label>
            {glbUrl && (
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-wider text-stone-500">{tx.fit}</p>
                {([
                  ["scale", tx.scale, 0.5, 1.5, 0.01, 1],
                  ["rotY", tx.rot, -180, 180, 1, 0],
                  ["offsetY", tx.offset, -1, 1, 0.01, 0],
                ] as const).map(([k, label, min, max, step, def]) => (
                  <label key={k} className="block">
                    <span className="flex justify-between text-[11px] text-stone-400">{label}<span className="text-stone-200">{(fit[k] ?? def).toFixed(k === "rotY" ? 0 : 2)}</span></span>
                    <input type="range" min={min} max={max} step={step} value={fit[k] ?? def}
                      onChange={(e) => setFit({ [k]: Number(e.target.value) })} className="w-full accent-[#C5A880]" aria-label={label} />
                  </label>
                ))}
                <button type="button" onClick={() => onFitChange(undefined)} className="text-[11px] text-stone-400 underline">{tx.reset}</button>
                <p className="text-[10px] text-stone-500">{tx.fitHint}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo guide */}
      <details className="storefront-preview-canvas group rounded-xl border border-stone-800 bg-[#151517]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm text-stone-100">
          <span className="inline-flex items-center gap-2"><Lightbulb className="w-4 h-4 text-[#C5A880]" />{tx.guide}</span>
          <ChevronDown className="w-4 h-4 text-stone-500 transition group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-4 gap-2" aria-hidden>
            {[["✓", "Chính diện", "Front"], ["✓", "45°", "45°"], ["✓", "Ngang", "Side"], ["✓", "Trên xuống", "Top"]].map(([m, vi, en], i) => (
              <div key={vi} className="rounded-lg bg-stone-900 p-2 text-center">
                <svg viewBox="0 0 40 40" className="mx-auto h-10 w-10">
                  <ellipse cx="20" cy="36" rx="9" ry="2" fill="#3a2a20" />
                  <path d="M20 35 V18" stroke="#9fb29a" strokeWidth="2" />
                  <g transform={`translate(20 14) scale(${[1, 0.85, 0.65, 1][i]} ${[1, 1, 1, 0.55][i]})`}>
                    <circle r="7" fill="#E8B4A8" /><circle r="3.5" fill="#c98f86" />
                  </g>
                </svg>
                <p className="text-[10px] text-stone-300">{m} {lang === "vi" ? vi : en}</p>
              </div>
            ))}
          </div>
          <ul className="space-y-2">
            {g.rules.map(([Icon, text]) => (
              <li key={text} className="flex gap-2 text-xs text-stone-300"><Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#C5A880]" />{text}</li>
            ))}
          </ul>
          <p className="text-xs text-amber-300/90">⚠ {g.bad}</p>
          <p className="text-xs text-stone-300">🛠 {g.fix}{" "}
            <a className="underline text-[#C5A880]" href="https://docs.blender.org/manual/en/4.2/addons/import_export/scene_gltf2.html" target="_blank" rel="noopener noreferrer">{g.blender}</a>{" · "}
            <a className="underline text-[#C5A880]" href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html" target="_blank" rel="noopener noreferrer">Decimate</a>
          </p>
          <p className="text-xs text-stone-400">🎯 {g.targets}</p>
        </div>
      </details>
    </div>
  );
}
