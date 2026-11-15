import assert from "node:assert/strict";
import test from "node:test";

import { ARTWORK_UPLOAD_MAX_FILE_SIZE, artworkCreateFormSchema } from "./artwork-create-form-schema.ts";

function makeFile(name: string, type: string, size = 16) {
  return new File([new Uint8Array(size)], name, { type });
}

function videoLayer(name: string, type = "video/webm", size = 16) {
  return { file: makeFile(name, type, size), animation: "none", blendMode: "normal", x: 0, y: 0, depth: 0.05, scale: 0.8 };
}

function values() {
  return {
    title: "  Calla Lily  ",
    artistName: "  Studio  ",
    targetImage: makeFile("generated-tracking.png", "image/png"),
    arMode: "spatial_layers",
    spatialLayers: [videoLayer("version-1.webm")],
  };
}

test("accepts a video-only artwork and trims labels", () => {
  const result = artworkCreateFormSchema.parse(values());
  assert.equal(result.title, "Calla Lily");
  assert.equal(result.artistName, "Studio");
  assert.equal(result.spatialLayers.length, 1);
});

test("accepts a single MP4 video", () => {
  assert.equal(artworkCreateFormSchema.safeParse({
    ...values(), spatialLayers: [videoLayer("one.mp4", "video/mp4")],
  }).success, true);
});

test("rejects two videos for one artwork", () => {
  const result = artworkCreateFormSchema.safeParse({
    ...values(), spatialLayers: [videoLayer("one.mp4", "video/mp4"), videoLayer("two.webm")],
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((issue) => issue.message === "Only one video is allowed."));
  }
});

test("rejects non-video uploads and MOV", () => {
  for (const [name, mime] of [["image.png", "image/png"], ["model.glb", "model/gltf-binary"], ["clip.mov", "video/quicktime"]]) {
    const result = artworkCreateFormSchema.safeParse({ ...values(), spatialLayers: [videoLayer(name, mime)] });
    assert.equal(result.success, false, name);
  }
});

test("requires exactly one video", () => {
  const empty = artworkCreateFormSchema.safeParse({ ...values(), spatialLayers: [] });
  assert.equal(empty.success, false);
  if (!empty.success) assert.ok(empty.error.issues.some((issue) => issue.message === "Please upload a video."));
  assert.equal(artworkCreateFormSchema.safeParse({ ...values(), spatialLayers: [videoLayer("1.webm"), videoLayer("2.webm"), videoLayer("3.webm")] }).success, false);
});

test("rejects empty and oversized videos", () => {
  for (const size of [0, ARTWORK_UPLOAD_MAX_FILE_SIZE + 1]) {
    assert.equal(artworkCreateFormSchema.safeParse({ ...values(), spatialLayers: [videoLayer("one.webm", "video/webm", size)] }).success, false);
  }
});

test("requires generated target image and video-only mode", () => {
  assert.equal(artworkCreateFormSchema.safeParse({ ...values(), targetImage: undefined }).success, false);
  assert.equal(artworkCreateFormSchema.safeParse({ ...values(), arMode: "motion_extract" }).success, false);
});
