import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { AnchorPoseSmoother } from "./anchor-pose-smoother.ts";

function target(x: number, rotation = 0) {
  const group = new THREE.Group();
  group.matrixAutoUpdate = false;
  group.visible = true;
  group.matrix.compose(
    new THREE.Vector3(x, 0, 0),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotation),
    new THREE.Vector3(1, 1, 1),
  );
  return group;
}

function actualPose(group: THREE.Group, smoother: AnchorPoseSmoother) {
  const world = group.matrix.clone().multiply(smoother.pivot.matrix);
  const position = new THREE.Vector3();
  const orientation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  world.decompose(position, orientation, scale);
  return { position, orientation, scale };
}

test("initial recognition matches the tracked image exactly", () => {
  const anchor = target(0.25);
  const smoother = new AnchorPoseSmoother(anchor);
  smoother.update(1 / 60);
  assert.ok(Math.abs(actualPose(anchor, smoother).position.x - 0.25) < 1e-8);
});

test("small tracking fluctuations move overlay much less than raw target", () => {
  const anchor = target(0);
  const smoother = new AnchorPoseSmoother(anchor);
  smoother.update(1 / 60);
  anchor.matrix.copy(target(0.014).matrix);
  smoother.update(1 / 60);
  const moved = actualPose(anchor, smoother).position.x;
  assert.ok(moved > 0 && moved < 0.006);
});

test("large camera movements are followed faster to avoid visible lag", () => {
  const anchor = target(0);
  const smoother = new AnchorPoseSmoother(anchor);
  smoother.update(1 / 60);
  anchor.matrix.copy(target(0.45).matrix);
  smoother.update(1 / 60);
  const moved = actualPose(anchor, smoother).position.x;
  assert.ok(moved > 0.09 && moved < 0.45);
});

test("rotation jitter is smoothed without mutating MindAR tracking", () => {
  const anchor = target(0);
  const smoother = new AnchorPoseSmoother(anchor);
  smoother.update(1 / 60);
  anchor.matrix.copy(target(0, 0.05).matrix);
  smoother.update(1 / 60);
  assert.ok(actualPose(anchor, smoother).orientation.angleTo(new THREE.Quaternion()) < 0.035);
  assert.ok(Math.abs(new THREE.Quaternion().setFromRotationMatrix(anchor.matrix).angleTo(new THREE.Quaternion()) - 0.05) < 1e-8);
});

test("reacquisition resets to the new anchor, no ghost position", () => {
  const anchor = target(0);
  const smoother = new AnchorPoseSmoother(anchor);
  smoother.update(1 / 60);
  anchor.matrix.copy(target(0.65).matrix);
  smoother.update(1 / 60);
  anchor.visible = false;
  smoother.update(1 / 60);
  anchor.visible = true;
  anchor.matrix.copy(target(-0.25).matrix);
  smoother.update(1 / 60);
  assert.ok(Math.abs(actualPose(anchor, smoother).position.x + 0.25) < 1e-8);
});

test("resuming after a long tab pause snaps to the current pose", () => {
  const anchor = target(0);
  const smoother = new AnchorPoseSmoother(anchor);
  smoother.update(1 / 60);
  anchor.matrix.copy(target(1).matrix);
  smoother.update(0.5);
  assert.ok(Math.abs(actualPose(anchor, smoother).position.x - 1) < 1e-8);
});
