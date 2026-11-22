import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { isAuthError, requireAdmin } from "@/lib/adminSession";

/**
 * Optional "Generate 3D from photo" for admins.
 * Off unless HUNYUAN3D_API_URL points at a self-hosted Hunyuan3D-2 `api_server.py`
 * (POST /generate {image: base64, texture} -> GLB). See docs/3d-configurator.md.
 */
const API_URL = process.env.HUNYUAN3D_API_URL?.replace(/\/+$/, "");
const API_KEY = process.env.HUNYUAN3D_API_KEY;
const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const GLB_MAX_BYTES = 40 * 1024 * 1024;
const TIMEOUT_MS = 10 * 60 * 1000;

export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (isAuthError(gate)) return gate;
  return NextResponse.json({ success: true, data: { enabled: Boolean(API_URL) } });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (isAuthError(gate)) return gate;
  if (!API_URL) {
    return NextResponse.json({ success: false, error: "Chưa cấu hình HUNYUAN3D_API_URL" }, { status: 503 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Vui lòng chọn ảnh" }, { status: 400 });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > IMAGE_MAX_BYTES) {
    return NextResponse.json({ success: false, error: "Ảnh JPG/PNG/WEBP tối đa 8MB" }, { status: 400 });
  }
  const image = Buffer.from(await file.arrayBuffer()).toString("base64");
  let glb: Buffer;
  try {
    const res = await fetch(`${API_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}) },
      body: JSON.stringify({ image, texture: form.get("texture") === "1", remove_background: true, octree_resolution: 256 }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    glb = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.error("generate-3d failed", e);
    return NextResponse.json({ success: false, error: "Máy chủ 3D không phản hồi hoặc lỗi" }, { status: 502 });
  }
  if (glb.length > GLB_MAX_BYTES || glb.length < 12 || glb.toString("ascii", 0, 4) !== "glTF" || glb.readUInt32LE(4) !== 2) {
    return NextResponse.json({ success: false, error: "Kết quả không phải GLB hợp lệ" }, { status: 502 });
  }
  const dir = path.join(process.cwd(), "public", "uploads", "models");
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-ai.glb`;
  await writeFile(path.join(dir, name), glb);
  return NextResponse.json({ success: true, data: { fileUrl: `/uploads/models/${name}`, fileSize: glb.length } });
}
