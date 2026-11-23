import assert from "node:assert/strict";
import test from "node:test";
import { ARTWORK_UPLOAD_MAX_FILE_SIZE, artworkCreateFormSchema } from "./artwork-create-form-schema.ts";

function makeFile(name: string, mime: string, size = 16) {
  return new File([new Uint8Array(size)], name, { type: mime });
}
function videoLayer(name: string, mime = "video/mp4", size = 16) {
  return { file: makeFile(name, mime, size), animation: "none", blendMode: "normal", x: 0, y: 0, depth: 0.05, scale: 1 };
}
function pairedValues() {
  return {
    title: "  Calla Lily  ",
    artistName: "  Studio  ",
    targetImage: makeFile("tracking-from-image.png", "image/png", 184304),
    arMode: "spatial_layers",
    spatialLayers: [videoLayer("animation.mp4")],
  };
}
test("one image tracking target and one video form one published AR artwork", () => {
  const values = artworkCreateFormSchema.parse(pairedValues());
  assert.equal(values.title, "Calla Lily");
  assert.equal(values.artistName, "Studio");
  assert.equal(values.spatialLayers.length, 1);
  assert.equal(values.spatialLayers[0].file.type, "video/mp4");
  assert.equal(values.targetImage.type, "image/png");
});
test("accepts either converted MP4 or WebM animation", () => {
  for (const [name, type] of [["animation.mp4", "video/mp4"], ["animation.webm", "video/webm"]]) {
    assert.equal(artworkCreateFormSchema.safeParse({
      ...pairedValues(), spatialLayers: [videoLayer(name, type)],
    }).success, true);
  }
});
test("rejects missing artwork image even if animation exists", () => {
  const parsed = artworkCreateFormSchema.safeParse({ ...pairedValues(), targetImage: undefined });
  assert.equal(parsed.success, false);
});
test("rejects missing animation even if artwork image exists", () => {
  const parsed = artworkCreateFormSchema.safeParse({ ...pairedValues(), spatialLayers: [] });
  assert.equal(parsed.success, false);
  if (!parsed.success) assert.ok(parsed.error.issues.some(issue => issue.message === "Upload the animation video."));
});
test("a static image alone cannot replace an animation", () => {
  for (const [name, type] of [["Calla Lily.png","image/png"], ["printed.jpg","image/jpeg"], ["art.webp","image/webp"]]) {
    assert.equal(artworkCreateFormSchema.safeParse({
      ...pairedValues(), spatialLayers: [videoLayer(name, type)],
    }).success, false, name);
  }
});
test("only one animation video can be paired with the image", () => {
  const parsed = artworkCreateFormSchema.safeParse({
    ...pairedValues(), spatialLayers: [videoLayer("one.mp4"), videoLayer("two.webm", "video/webm")],
  });
  assert.equal(parsed.success, false);
});
test("MOV originals require conversion first and unsupported models are rejected", () => {
  for (const [name,type] of [["animation.mov", "video/quicktime"],["model.glb","model/gltf-binary"],["print.pdf","application/pdf"]]) {
    assert.equal(artworkCreateFormSchema.safeParse({
      ...pairedValues(), spatialLayers: [videoLayer(name,type)],
    }).success, false, name);
  }
});
test("rejects empty or oversized finished media and tracking image", () => {
  for (const size of [0,ARTWORK_UPLOAD_MAX_FILE_SIZE+1]) {
    assert.equal(artworkCreateFormSchema.safeParse({
      ...pairedValues(), spatialLayers:[videoLayer("animation.mp4","video/mp4",size)],
    }).success,false);
  }
  assert.equal(artworkCreateFormSchema.safeParse({
    ...pairedValues(),targetImage:makeFile("tracking.png","image/png",ARTWORK_UPLOAD_MAX_FILE_SIZE+1),
  }).success,false);
});
test("non-spatial AR publishing is not permitted in paired workflow", () => {
  assert.equal(artworkCreateFormSchema.safeParse({
    ...pairedValues(), arMode:"motion_extract",
  }).success,false);
});
