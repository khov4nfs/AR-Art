import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".usdz": "model/vnd.usdz+zip",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await context.params;
    if (!segments || segments.length === 0) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    // Sanitize path to prevent path traversal
    const relativePath = path.normalize(path.join(...segments)).replace(/^(\.\.[\/\\])+/, "");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, relativePath);

    // Verify target file is strictly within uploadDir
    if (!filePath.startsWith(uploadDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        return new NextResponse("File Not Found", { status: 404 });
      }

      const fileBuffer = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": fileStat.size.toString(),
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    } catch {
      return new NextResponse("File Not Found", { status: 404 });
    }
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
