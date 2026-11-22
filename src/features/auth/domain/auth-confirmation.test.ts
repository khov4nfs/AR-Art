import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAuthRedirectUrl,
  parseAuthCallbackHash,
  sanitizeNextPath,
} from "./auth-confirmation.ts";

test("classifies an expired Supabase email confirmation link", () => {
  const result = parseAuthCallbackHash(
    "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
  );

  assert.equal(result.kind, "expired");
  if (result.kind === "expired") {
    assert.equal(result.code, "otp_expired");
    assert.match(result.description, /expired/i);
  }
});

test("classifies a generic auth callback error", () => {
  const result = parseAuthCallbackHash(
    "#error=access_denied&error_code=bad_code&error_description=Invalid+link",
  );

  assert.equal(result.kind, "error");
  if (result.kind === "error") {
    assert.equal(result.code, "bad_code");
  }
});

test("classifies an implicit-flow success callback", () => {
  const result = parseAuthCallbackHash(
    "#access_token=token&refresh_token=refresh&type=signup",
  );

  assert.deepEqual(result, { kind: "success", type: "signup" });
});

test("rejects unsafe next paths", () => {
  assert.equal(sanitizeNextPath("//evil.example"), "/collection");
  assert.equal(sanitizeNextPath("https://evil.example"), "/collection");
  assert.equal(sanitizeNextPath("/create"), "/create");
});

test("builds an auth redirect from the supplied request origin", () => {
  assert.equal(
    buildAuthRedirectUrl("https://request-origin.example/", "/create"),
    "https://request-origin.example/ar-login?next=%2Fcreate",
  );
});
