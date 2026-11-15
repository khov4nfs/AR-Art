import assert from "node:assert/strict";
import test from "node:test";

import { ARTWORK_UPLOAD_MAX_FILE_SIZE, artworkCreateFormSchema } from "./artwork-create-form-schema.ts";

function makeFile(name: string, type: string, size = 16) {
  return new File([new Uint8Array(size)], name, { type });
}

function layer(name: string, type: string, size = 16) {
  return { file: makeFile(name, type, size), animation: "none", blendMode: "normal", x: 0, y: 0, depth: 0.05, scale: 1 };
}

function values() {
  return {
    title: "  Calla Lily  ",
    artistName: "  Studio  ",
    targetImage: makeFile("tracking.png", "image/png"),
    arMode: "spatial_layers",
    spatialLayers: [layer("video.mp4", "video/mp4")],
  };
}

test("supports a single MP4 or WebM video, trimming title and artist", () => {
  for (const [name, mime] of [["sample.mp4", "video/mp4"], ["sample.webm", "video/webm"]]) {
    const result = artworkCreateFormSchema.parse({ ...values(), spatialLayers: [layer(name, mime)] });
    assert.equal(result.title, "Calla Lily");
    assert.equal(result.artistName, "Studio");
    assert.equal(result.spatialLayers.length, 1);
  }
});

test("supports a transparent PNG AR image like Calla Lily.png", () => {
  const result = artworkCreateFormSchema.safeParse({
    ...values(), spatialLayers: [layer("Calla Lily.png", "image/png", 184304)],
  });
  assert.equal(result.success, true);
});

test("supports standalone JPG and WebP image overlays", () => {
  for (const [name, mime] of [["flower.jpg", "image/jpeg"], ["flower.webp", "image/webp"]]) {
    assert.equal(artworkCreateFormSchema.safeParse({
      ...values(), spatialLayers: [layer(name, mime)],
    }).success, true);
  }
});

test("requires one AR image or video, not multiple assets", () => {
  const empty = artworkCreateFormSchema.safeParse({ ...values(), spatialLayers: [] });
  assert.equal(empty.success, false);
  if (!empty.success) assert.ok(empty.error.issues.some((issue) => issue.message === "Please upload a video or image."));
  const extra = artworkCreateFormSchema.safeParse({
    ...values(), spatialLayers: [layer("flower.png", "image/png"), layer("motion.mp4", "video/mp4")],
  });
  assert.equal(extra.success, false);
  if (!extra.success) assert.ok(extra.error.issues.some((issue) => issue.message === "Only one AR video or image is allowed."));
});

test("rejects unsupported models, MOV originals before conversion, and PDFs", () => {
  for (const [name, mime] of [["model.glb", "model/gltf-binary"], ["clip.mov", "video/quicktime"], ["document.pdf", "application/pdf"]]) {
    assert.equal(artworkCreateFormSchema.safeParse({ ...values(), spatialLayers: [layer(name, mime)] }).success, false, name);
  }
});

test("rejects empty or oversized media", () => {
  for (const size of [0, ARTWORK_UPLOAD_MAX_FILE_SIZE + 1]) {
    for (const [name, mime] of [["flower.png", "image/png"], ["video.mp4", "video/mp4"]]) {
      assert.equal(artworkCreateFormSchema.safeParse({ ...values(), spatialLayers: [layer(name, mime, size)] }).success, false, name);
    }
  }
});

test("requires a separately compiled tracking target and spatial AR mode", () => {
  assert.equal(artworkCreateFormSchema.safeParse({ ...values(), targetImage: undefined }).success, false);
  assert.equal(artworkCreateFormSchema.safeParse({ ...values(), arMode: "motion_extract" }).success, false);
});
