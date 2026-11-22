import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, copyFile, access } from "fs/promises";
import path from "path";
import { isAuthError, requireAdmin } from "@/lib/adminSession";
import { GLB_LIMITS, inspectGlb, optimizeGlb } from "@/lib/server/glbTools";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

// Only files we host: shipped /models/* (read-only) and admin uploads /uploads/models/*.
const SAFE = /^\/(models|uploads\/models)\/[A-Za-z0-9._-]+\.glb$/;

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (isAuthError(gate)) return gate;
  const body = (await req.json().catch(() => null)) as { action?: string; fileUrl?: string } | null;
  const fileUrl = body?.fileUrl ?? "";
  if (!SAFE.test(fileUrl) || fileUrl.includes("..")) {
    return NextResponse.json({ success: false, error: "Đường dẫn GLB không hợp lệ" }, { status: 400 });
  }
  const abs = path.join(process.cwd(), "public", fileUrl);
  let buf: Buffer;
  try {
    buf = await readFile(abs);
  } catch {
    return NextResponse.json({ success: false, error: "Không tìm thấy file" }, { status: 404 });
  }
  try {
    if (body?.action === "optimize") {
      if (!fileUrl.startsWith("/uploads/models/")) {
        return NextResponse.json({ success: false, error: "Chỉ tối ưu file đã tải lên" }, { status: 400 });
      }
      const { out, before, after } = await optimizeGlb(new Uint8Array(buf));
      // Keep the untouched original next to it as a backup (once).
      const backup = abs.replace(/\.glb$/, ".orig.glb");
      await access(backup).catch(() => copyFile(abs, backup));
      const optUrl = fileUrl.replace(/(\.opt)?\.glb$/, ".opt.glb");
      await writeFile(path.join(process.cwd(), "public", optUrl), out);
      return NextResponse.json({ success: true, data: { fileUrl: optUrl, backupUrl: fileUrl.replace(/\.glb$/, ".orig.glb"), before, after, limits: GLB_LIMITS } });
    }
    const stats = await inspectGlb(new Uint8Array(buf));
    return NextResponse.json({ success: true, data: { stats, limits: GLB_LIMITS } });
  } catch (e) {
    console.error("glb-tools", e);
    return NextResponse.json({ success: false, error: "Không đọc được GLB (Draco? hãy xuất không nén hoặc meshopt)" }, { status: 422 });
  }
}
