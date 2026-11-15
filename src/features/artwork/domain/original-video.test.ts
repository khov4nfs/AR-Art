import assert from "node:assert/strict";
import test from "node:test";

import {
  AR_VIDEO_CHUNK_SIZE,
  AR_VIDEO_MAX_SOURCE_SIZE,
  conversionChunkCount,
  validateOriginalVideo,
  videoNeedsConversion,
} from "./original-video.ts";

function original(name: string, type: string, size: number): File {
  return { name, type, size } as File;
}

test("accepts VER 1 and VER 2 original alpha MOV files for conversion on save", () => {
  const version1 = original("VER 1.mov", "video/quicktime", 174257812);
  const version2 = original("VER 2.mov", "video/quicktime", 215041348);
  assert.equal(validateOriginalVideo(version1), null);
  assert.equal(validateOriginalVideo(version2), null);
  assert.equal(videoNeedsConversion(version1), true);
  assert.equal(videoNeedsConversion(version2), true);
  assert.equal(conversionChunkCount(version1.size), 21);
  assert.equal(conversionChunkCount(version2.size), 26);
});

test("converts large MP4 but does not reencode WebM/MP4 at or below 6 MB", () => {
  assert.equal(videoNeedsConversion(original("clip.mp4", "video/mp4", 7 * 1024 * 1024)), true);
  assert.equal(videoNeedsConversion(original("clip.mp4", "video/mp4", 5 * 1024 * 1024)), false);
  assert.equal(videoNeedsConversion(original("clip.webm", "video/webm", 5 * 1024 * 1024)), false);
  assert.equal(videoNeedsConversion(original("clip.mov", "video/quicktime", 5 * 1024 * 1024)), true);
});

test("rejects unsupported files and raw videos above the protected upload limit", () => {
  assert.match(validateOriginalVideo(original("photo.png", "image/png", 4000)) ?? "", /MOV/);
  assert.match(validateOriginalVideo(original("video.mov", "video/quicktime", 0)) ?? "", /empty/);
  assert.match(validateOriginalVideo(original("large.mov", "video/quicktime", AR_VIDEO_MAX_SOURCE_SIZE + 1)) ?? "", /240 MB/);
  assert.equal(AR_VIDEO_CHUNK_SIZE, 8 * 1024 * 1024);
});
