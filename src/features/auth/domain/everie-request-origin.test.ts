import assert from "node:assert/strict";
import test from "node:test";
import { isTrustedEverieOrigin } from "./everie-request-origin.ts";

test("permits the exact EVERIE origin", () => {
  assert.equal(isTrustedEverieOrigin("https://everievn.com", "https://everievn.com"), true);
});
test("rejects cross-origin and subdomain CSRF", () => {
  assert.equal(isTrustedEverieOrigin("https://evil.example", "https://everievn.com"), false);
  assert.equal(isTrustedEverieOrigin("https://everievn.com.evil.example", "https://everievn.com"), false);
  assert.equal(isTrustedEverieOrigin("http://everievn.com", "https://everievn.com"), false);
});
test("rejects missing or invalid origins", () => {
  assert.equal(isTrustedEverieOrigin(null, "https://everievn.com"), false);
  assert.equal(isTrustedEverieOrigin("not-a-url", "https://everievn.com"), false);
});
