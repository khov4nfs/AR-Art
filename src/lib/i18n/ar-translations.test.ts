import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { arTranslations } from "./ar-translations.ts";
import { localizedArFormError } from "./ar-form-errors.ts";

const vi = arTranslations.vi;
const en = arTranslations.en;

test("every AR copy key has nonempty VN and EN variants", () => {
  assert.deepEqual(Object.keys(vi).sort(), Object.keys(en).sort());
  for (const key of Object.keys(vi)) {
    assert.match(key, /^ar\.[a-zA-Z]+\./);
    assert.ok(vi[key].trim(), key);
    assert.ok(en[key].trim(), key);
    const vars = (value: string) => [...value.matchAll(/\{([a-zA-Z]+)\}/g)].map(x => x[1]).sort();
    assert.deepEqual(vars(vi[key]), vars(en[key]), key + " has mismatched placeholders");
  }
});

test("AR main buttons, navigation and scanner react to global language", () => {
  const keys = [
    "ar.nav.experience", "ar.nav.scan", "ar.nav.gallery",
    "ar.gallery.openCamera", "ar.scanner.title", "ar.scanner.openCamera",
    "ar.collection.headingPrefix", "ar.studio.products", "ar.create.uploadImage",
  ];
  for (const key of keys) {
    assert.ok(vi[key]);
    assert.ok(en[key]);
    assert.notEqual(vi[key], en[key], key);
  }
  assert.equal(en["ar.scanner.preparing"].replace("{progress}", "42"), "Getting images ready to scan · 42%");
  assert.equal(vi["ar.scanner.preparing"].replace("{progress}", "42"), "Đang chuẩn bị ảnh để quét · 42%");
});

test("latest gallery shelf describes products, not an internal studio", () => {
  assert.equal(vi["ar.gallery.newShelf"], "01 / Sản phẩm mới nhất");
  assert.equal(en["ar.gallery.newShelf"], "01 / Latest products");
  assert.doesNotMatch(vi["ar.gallery.newShelf"], /studio/i);
  assert.doesNotMatch(en["ar.gallery.newShelf"], /studio/i);
  assert.match(vi["ar.gallery.newDesc"], /sản phẩm/);
  assert.match(en["ar.gallery.newDesc"], /products/);
});

test("friendly AR instructions preserve scan-based collection and required media constraints", () => {
  for (const locale of [vi, en]) {
    const help = locale["ar.create.helpText"];
    const collection = locale["ar.collection.description"];
    assert.match(help, /video/);
    assert.match(collection, /camera/);
    assert.match(locale["ar.create.imageHint"], /6 MB/);
    assert.match(locale["ar.create.videoHint"], /240 MB/);
    assert.ok(locale["ar.create.publishHint"].includes(locale === vi ? "đăng nhập" : "Signed-in"));
  }
});

test("AR field errors are friendly in VN/EN without changing validation contracts", () => {
  const tVi = (key: string) => vi[key];
  const tEn = (key: string) => en[key];

  assert.equal(
    localizedArFormError("Artwork title is required.", "vi", tVi, "ar.create.errorPublish"),
    "Hãy đặt tên cho sản phẩm nhé.",
  );
  assert.equal(
    localizedArFormError("Upload the animation video.", "en", tEn, "ar.create.errorVideo"),
    "Please add an animation video.",
  );
  assert.equal(
    localizedArFormError("Unexpected processing error", "vi", tVi, "ar.create.errorVideo"),
    vi["ar.create.errorVideo"],
  );
  assert.equal(
    localizedArFormError("Unexpected processing error", "en", tEn, "ar.create.errorVideo"),
    "Unexpected processing error",
  );
  assert.equal(localizedArFormError(undefined, "vi", tVi, "ar.create.errorVideo"), undefined);
});

test("all AR translation keys referenced directly by UI are defined", () => {
  const files = [
    "src/app/(storefront)/page.tsx",
    "src/app/gallery/page.tsx",
    "src/app/art/[slug]/page.tsx",
    "src/app/collection/page.tsx",
    "src/app/admin/ar/page.tsx",
    "src/components/everie-ar/everie-ar-header.tsx",
    "src/components/everie-ar/ar-language-switcher.tsx",
    "src/components/hanoia/Header.tsx",
    "src/components/hanoia/MobileMenu.tsx",
    "src/components/hanoia/ProductDetailView.tsx",
    "src/features/ar-experience/presentation/components/universal-ar-viewer.tsx",
    "src/features/ar-experience/presentation/components/ar-viewer.tsx",
    "src/features/gallery/presentation/components/gallery-explorer.tsx",
    "src/features/collection/presentation/components/collection-grid.tsx",
    "src/features/studio/presentation/components/studio-app.tsx",
    "src/features/studio/presentation/components/product-manager-modal.tsx",
    "src/features/artwork/presentation/components/artwork-create-form.tsx",
    "src/features/artwork/presentation/components/artwork-create-modal.tsx",
    "src/features/auth/presentation/components/protected-create-page.tsx",
    "src/features/artwork/presentation/components/artwork-ar-qr-code.tsx",
    "src/features/artwork/presentation/components/ar-composition-preview.tsx",
    "src/features/artwork/presentation/components/edit-artwork-button.tsx",
    "src/features/artwork/presentation/components/share-artwork-button.tsx",
  ];
  for (const relative of files) {
    const source = readFileSync(path.resolve(process.cwd(), relative), "utf8");
    const keys = source.matchAll(/["'](ar\.[a-zA-Z][a-zA-Z0-9.]*[a-zA-Z0-9])["']/g);
    for (const [, key] of keys) {
      assert.ok(key in vi, relative + ": " + key + " missing vi");
      assert.ok(key in en, relative + ": " + key + " missing en");
    }
  }
});

test("AR management stays in EVERIE admin without standalone studio navigation", () => {
  const read = (file: string) => readFileSync(path.resolve(process.cwd(), file), "utf8");
  const admin = read("src/app/admin/ar/page.tsx");
  const manager = read("src/features/studio/presentation/components/studio-app.tsx");
  assert.match(admin, /<StudioApp \/>/);
  assert.doesNotMatch(admin, /href="\/(?:studio|create)"/);
  assert.doesNotMatch(manager, /href="\/(?:studio|create)"/);
  for (const route of ["src/app/studio/page.tsx", "src/app/studio/products/page.tsx"]) {
    assert.match(read(route), /redirect\("\/admin\/ar"\)/);
  }
  assert.match(read("src/app/api/studio/products/route.ts"), /isAdminRole\(user\.role\)/);
  assert.match(read("src/app/api/studio/products/[id]/route.ts"), /isAdminRole\(user\.role\)/);
});
