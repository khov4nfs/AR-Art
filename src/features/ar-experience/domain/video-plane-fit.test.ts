import assert from "node:assert/strict";
import test from "node:test";
import { fitVideoPlaneInTarget } from "./video-plane-fit.ts";

test("same-aspect video covers the tracked artwork exactly", () => {
  assert.deepEqual(fitVideoPlaneInTarget(0.5, 0.5), { width: 1, height: 2 });
});

test("wider video fits artwork width without extending past top and bottom", () => {
  const fit = fitVideoPlaneInTarget(0.562, 0.4945);
  assert.equal(fit.width, 1);
  assert.ok(fit.height < 1 / 0.4945);
});

test("taller video fits artwork height without extending beyond its width", () => {
  const fit = fitVideoPlaneInTarget(0.45, 0.562);
  assert.ok(fit.width < 1);
  assert.ok(Math.abs(fit.height - 1 / 0.562) < 0.000001);
});

test("bad ratios are rejected", () => {
  assert.throws(() => fitVideoPlaneInTarget(0, 0.5));
  assert.throws(() => fitVideoPlaneInTarget(0.5, Infinity));
});
