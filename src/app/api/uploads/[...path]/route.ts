import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Runtime uploads are served through the same /uploads route as EVERIE CMS. */
const ROOT = path.join(process.cwd(), "public", "uploads");
const TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif",
  ".svg": "image/svg+xml", ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json", ".bin": "application/octet-stream",
  ".mind": "application/octet-stream",
  ".mp4": "video/mp4", ".webm": "video/webm",
};

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path || [];
  if (!parts.length || parts.some(p => !p || p === ".." || p.includes("/") ||
      p.includes("\\") || p.startsWith(".") || p.includes("%"))) {
    return new NextResponse("Not found", { status: 404 });
  }
  const file = path.join(ROOT, ...parts);
  if (!file.startsWith(ROOT + path.sep)) return new NextResponse("Not found", { status: 404 });
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return new NextResponse("Not found", { status: 404 });

  try {
    const data = await fs.readFile(file);
    const size = data.byteLength;
    const headers: Record<string, string> = {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
      ...(type === "image/svg+xml" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
    };

    const range = req.headers.get("range");
    if (range) {
      // Single HTTP byte-range for Safari/Chrome video seeking and streaming.
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        return new NextResponse(null, { status: 416, headers: { "Content-Range": "bytes */" + size } });
      }
      const suffix = !match[1];
      const start = suffix
        ? Math.max(0, size - Number(match[2]))
        : Number(match[1]);
      const end = suffix ? size - 1 : (match[2] ? Math.min(size - 1, Number(match[2])) : size - 1);
      if (!size || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
        return new NextResponse(null, { status: 416, headers: { "Content-Range": "bytes */" + size } });
      }
      headers["Content-Range"] = "bytes " + start + "-" + end + "/" + size;
      headers["Content-Length"] = String(end - start + 1);
      return new NextResponse(new Uint8Array(data.subarray(start, end + 1)), { status: 206, headers });
    }
    headers["Content-Length"] = String(size);
    return new NextResponse(new Uint8Array(data), { headers });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
