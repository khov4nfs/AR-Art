import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

/**
 * `next start` only serves files that were in /public at build time, so files
 * uploaded later (admin media, 3D models, bespoke references) 404. A fallback
 * rewrite in next.config sends /uploads/* here when no static file matched.
 */
const ROOT = path.join(process.cwd(), "public", "uploads");
const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path || [];
  if (parts.some((p) => !p || p === ".." || p.includes("/") || p.includes("\\") || p.startsWith("."))) {
    return new NextResponse("Not found", { status: 404 });
  }
  const file = path.join(ROOT, ...parts);
  if (!file.startsWith(ROOT + path.sep)) return new NextResponse("Not found", { status: 404 });
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return new NextResponse("Not found", { status: 404 });
  try {
    const data = await fs.readFile(file);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        ...(type === "image/svg+xml" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
