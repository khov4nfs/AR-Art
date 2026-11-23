import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

// Run after npm run build while npm run start is serving port 3199.
// Uses only anonymous requests and an isolated temporary fixture; no real users.
const base = process.env.AR_E2E_URL || "http://127.0.0.1:3199";
const request = async (route, options = {}) => {
  const res = await fetch(base + route, { redirect: "manual", ...options });
  await res.arrayBuffer();
  return res;
};

for (const route of ["/", "/gallery", "/ar", "/create", "/studio/products", "/collection"]) {
  const res = await request(route);
  assert.equal(res.status, 200, route);
  console.log("GET", route, res.status);
}
for (const route of ["/api/auth/me", "/api/ar/collection", "/api/studio/products"]) {
  const res = await request(route);
  assert.equal(res.status, 401, route);
  console.log("UNAUTHENTICATED", route, res.status);
}
const unauthorizedUpload = await request("/api/artworks/uploads", {
  method: "POST", headers: { origin: base, "content-type": "image/png" },
  body: Buffer.from("bad upload"),
});
assert.equal(unauthorizedUpload.status, 401);

const missingView = await request("/api/gallery/views/unknown-artwork-123", {
  method: "POST", headers: { origin: base },
});
assert.equal(missingView.status, 404);

// Files created after Next's build must be served by its existing fallback,
// and browser media seeking must receive 206 Partial Content.
const id = randomUUID();
const dir = path.join(process.cwd(), "public", "uploads", "ar", id, "layers");
const name = "01-deadbeef.mp4";
await fs.mkdir(dir, { recursive: true });
const media = Buffer.alloc(2048, 0);
media.write("ftyp", 4);
await fs.writeFile(path.join(dir, name), media, { flag: "wx" });
try {
  const url = "/uploads/ar/" + id + "/layers/" + name;
  const res = await fetch(base + url, { headers: { range: "bytes=0-1023" } });
  assert.equal(res.status, 206);
  assert.equal(res.headers.get("content-type"), "video/mp4");
  assert.equal(res.headers.get("content-range"), "bytes 0-1023/2048");
  assert.equal((await res.arrayBuffer()).byteLength, 1024);
  const missing = await request("/uploads/ar/" + id + "/missing.mind");
  assert.equal(missing.status, 404);
  console.log("BYTE_RANGE", res.status);
} finally {
  await fs.rm(path.dirname(dir), { recursive: true, force: true });
}
console.log("AR_E2E_PASSED");
