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

for (const route of ["/", "/gallery", "/ar", "/create", "/collection"]) {
  const res = await request(route);
  assert.equal(res.status, 200, route);
  console.log("GET", route, res.status);
}
// The EVERIE admin is staff-only, even for users who have created public works.
const protectedArAdmin = await request("/admin/ar");
assert.equal(protectedArAdmin.status, 307);
const adminLogin = new URL(protectedArAdmin.headers.get("location"), base);
assert.equal(adminLogin.pathname, "/login");
assert.equal(adminLogin.searchParams.get("next"), "/admin/ar");
console.log("STAFF_PROTECTED_AR_ADMIN", protectedArAdmin.status);
// Old studio bookmarks now land in the unified EVERIE admin page.
for (const route of ["/studio", "/studio/products"]) {
  const res = await request(route);
  assert.equal(res.status, 307, route);
  assert.equal(new URL(res.headers.get("location"), base).pathname, "/admin/ar");
  console.log("REDIRECT_TO_EVERIE_AR_ADMIN", route);
}
// AR has no standalone login route, including old bookmarked deep links.
const removedArLogin = await request("/ar-login?next=%2Far");
assert.equal(removedArLogin.status, 404, "/ar-login must not exist");
const everieLogin = await request("/login?next=%2Far");
assert.equal(everieLogin.status, 200, "EVERIE is the only login page");
console.log("AR_LOGIN_REMOVED", removedArLogin.status);

// The server receives the same language cookie as the storefront; public AR
// views and both homepage AR buttons render the matching locale.
for (const [locale, homeText, scannerText, galleryText] of [
  ["vi", "Mở camera AR", "Quét ảnh để xem AR.", "Thư viện"],
  ["en", "Open AR camera", "Scan an image to see AR.", "Gallery"],
]) {
  for (const [route, text] of [["/", homeText], ["/ar", scannerText], ["/gallery", galleryText]]) {
    const res = await fetch(base + route, { headers: { cookie: `hanoia_language=${locale}` } });
    assert.equal(res.status, 200, `${route}: ${locale}`);
    const html = await res.text();
    assert.ok(html.includes(text), `Expected ${text} on ${route} for ${locale}`);
    if (route === "/gallery") {
      // Gallery must reuse the SAME header/menu/footer as the EVERIE homepage.
      for (const href of ["/classic", "/themed", "/bespoke", "/heritage"]) {
        assert.ok(html.includes('href="' + href + '"'), "Missing shared EVERIE navigation link " + href);
      }
      assert.ok(html.includes('storefront-shell'), "Gallery must live inside the storefront container");
      const shelf = locale === "vi" ? "01 / Sản phẩm mới nhất" : "01 / Latest products";
      assert.ok(html.includes(shelf), `Expected newest-product shelf ${shelf} for ${locale}`);
    }
    console.log("AR_LOCALE", locale, route, res.status);
  }
}

const health = await request("/api/health");
assert.equal(health.status, 200, "Runtime must see readable data and writable uploads.");
console.log("HEALTH", health.status);

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
