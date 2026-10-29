import test from "node:test";
import assert from "node:assert/strict";
import { selectScannerArtworks, UNIVERSAL_SCANNER_MAX_TARGETS } from "./scanner-targets.ts";

function item(id: string, path = id, status: "published" | "draft" = "published") {
  return { id, status, targetImagePath: path, targetImageUrl: "https://assets.test/" + path, targetFileUrl: "https://assets.test/" + path + ".mind" };
}

test("scanner keeps only published artworks with distinct image targets", () => {
  assert.deepEqual(selectScannerArtworks([
    item("a", "same"), item("b", "same"), item("draft", "other", "draft"), item("c"),
  ]).map((work) => work.id), ["a", "c"]);
});

test("scanner caps the number of targets on mobile", () => {
  const results = selectScannerArtworks(Array.from({ length: 12 }, (_, index) => item(String(index))));
  assert.equal(results.length, UNIVERSAL_SCANNER_MAX_TARGETS);
});

test("scanner ignores missing image assets and permits an empty catalog", () => {
  assert.deepEqual(selectScannerArtworks([]), []);
  assert.deepEqual(selectScannerArtworks([{ ...item("missing"), targetImageUrl: "" }]), []);
});
