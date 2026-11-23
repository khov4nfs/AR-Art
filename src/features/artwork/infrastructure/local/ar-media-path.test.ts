import assert from "node:assert/strict";
import test from "node:test";
import { arMediaMimeType, arPublicMediaUrl, matchesArMediaHeader, validArMediaPath } from "./ar-media-path.ts";

const id = "4b93fe6a-0807-4d93-a89a-61a6aa2d005d";
test("accepts exactly the managed AR object structure", () => {
  assert.equal(validArMediaPath(id + "/target.mind"), true);
  assert.equal(validArMediaPath(id + "/target.png"), true);
  assert.equal(validArMediaPath(id + "/layers/01-e67e8c1a.mp4"), true);
  assert.equal(arPublicMediaUrl(id + "/target.png"), "/uploads/ar/" + id + "/target.png");
  assert.equal(arMediaMimeType(id + "/target.mind"), "application/octet-stream");
});
test("rejects traversal, disguised executables and unrelated uploads", () => {
  for (const file of [
    "../secret", id + "/../data/cms-store.json", id + "/target.svg",
    id + "/target.png.exe", id + "/layers/.env", id + "/layers/01-abc.htm",
    id + "/layers%2Ffile.mp4", id + "/foo.jpg", id + "/target\\evil.jpg",
  ]) assert.equal(validArMediaPath(file), false, file);
});
test("rejects masquerading SVG/HTML as a PNG upload", () => {
  const png = id + "/target.png";
  assert.equal(matchesArMediaHeader(png, Buffer.from("<script>alert(1)</script>")), false);
  assert.equal(matchesArMediaHeader(png, Buffer.from("89504e470d0a1a0a0000", "hex")), true);
});
