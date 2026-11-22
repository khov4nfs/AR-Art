import { NextRequest, NextResponse } from "next/server";
import { formatNowStamp } from "@/lib/everie";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getDatabase, saveDatabase, MediaAsset } from "@/lib/store";
import { getAdminUser, isAuthError, requireAdmin } from "@/lib/adminSession";
import { clientIp, rateLimit } from "@/lib/server/security";

/** Real image type from magic bytes; never trust the browser-sent MIME. */
function sniffImage(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.toString("hex", 0, 8) === "89504e470d0a1a0a") return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 0, 4) === "GIF8") return "gif";
  return null;
}

const GLB_MAX_BYTES = 25 * 1024 * 1024;

/** Admin-only 3D model upload. Validates the binary glTF header, not just the extension. */
async function handleGlb(req: NextRequest, file: File) {
  const gate = await requireAdmin(req);
  if (isAuthError(gate)) return gate;
  if (file.size > GLB_MAX_BYTES) {
    return NextResponse.json({ success: false, error: "File GLB tối đa 25MB" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  // GLB header: magic "glTF" + version 2
  if (buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "glTF" || buffer.readUInt32LE(4) !== 2) {
    return NextResponse.json({ success: false, error: "Không phải file GLB (glTF 2.0) hợp lệ" }, { status: 400 });
  }
  const dir = path.join(process.cwd(), "public", "uploads", "models");
  await mkdir(dir, { recursive: true });
  const base = file.name.toLowerCase().replace(/\.glb$/, "").replace(/[^a-z0-9]+/g, "-").slice(0, 60);
  const name = `${Date.now()}-${base || "model"}.glb`;
  await writeFile(path.join(dir, name), buffer);
  return NextResponse.json({
    success: true,
    data: { id: `glb-${Date.now()}`, fileName: file.name, fileUrl: `/uploads/models/${name}`, fileSize: file.size },
  });
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "Vui lòng chọn tệp để tải lên" }, { status: 400 });
    }

    if (file.name.toLowerCase().endsWith(".glb")) {
      return handleGlb(req, file);
    }

    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (!allowed.has(file.type)) {
      return NextResponse.json(
        { success: false, error: "Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF" },
        { status: 400 },
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Ảnh tối đa 5MB" },
        { status: 400 },
      );
    }

    const admin = await getAdminUser(req);
    if (!admin) {
      // Public uploads are only bespoke reference photos: throttled, kept apart from the media library.
      const wait = rateLimit(`upload:${clientIp(req.headers)}`, 20, 60 * 60 * 1000);
      if (wait) {
        return NextResponse.json({ success: false, error: "Tải lên quá nhiều, thử lại sau." }, { status: 429 });
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = sniffImage(buffer);
    if (!ext) {
      return NextResponse.json({ success: false, error: "Tệp không phải ảnh hợp lệ" }, { status: 400 });
    }

    const subDir = admin ? "" : "bespoke";
    const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
    await mkdir(uploadDir, { recursive: true });

    // Tạo tên file an toàn
    const base = file.name.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${base || "image"}.${ext}`;
    await writeFile(path.join(uploadDir, uniqueFileName), buffer);

    const fileUrl = subDir ? `/uploads/${subDir}/${uniqueFileName}` : `/uploads/${uniqueFileName}`;
    if (!admin) {
      return NextResponse.json({
        success: true,
        data: { id: `att-${Date.now()}`, fileName: file.name, fileUrl, fileSize: file.size },
      });
    }
    const now = new Date();
    const uploadedAt = formatNowStamp(now).slice(0, 10);

    // Lưu vào danh sách media trong CSDL
    const db = await getDatabase();
    const newMedia: MediaAsset = {
      id: `med-${Date.now()}`,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      uploadedAt,
    };

    db.media.unshift(newMedia);
    await saveDatabase(db);

    return NextResponse.json({
      success: true,
      data: newMedia,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
