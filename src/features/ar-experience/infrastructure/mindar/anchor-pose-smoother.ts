import * as THREE from "three";

/** Stabilize the visible overlay without changing MindAR recognition or pose. */
export class AnchorPoseSmoother {
  readonly pivot = new THREE.Group();
  private readonly anchor: THREE.Group;
  private initialized = false;
  private readonly rawPosition = new THREE.Vector3();
  private readonly rawRotation = new THREE.Quaternion();
  private readonly rawScale = new THREE.Vector3();
  private readonly smoothPosition = new THREE.Vector3();
  private readonly smoothRotation = new THREE.Quaternion();
  private readonly smoothScale = new THREE.Vector3();
  private readonly worldPose = new THREE.Matrix4();
  private readonly inverseAnchor = new THREE.Matrix4();

  constructor(anchor: THREE.Group) {
    this.anchor = anchor;
    this.pivot.matrixAutoUpdate = false;
    this.anchor.add(this.pivot);
  }

  reset() {
    this.initialized = false;
    this.pivot.matrix.identity();
    this.pivot.matrixWorldNeedsUpdate = true;
  }

  update(deltaSeconds: number) {
    if (!this.anchor.visible) {
      this.reset();
      return;
    }

    this.anchor.matrix.decompose(this.rawPosition, this.rawRotation, this.rawScale);

    if (!this.initialized || !Number.isFinite(deltaSeconds) || deltaSeconds > 0.3) {
      this.smoothPosition.copy(this.rawPosition);
      this.smoothRotation.copy(this.rawRotation);
      this.smoothScale.copy(this.rawScale);
      this.initialized = true;
    } else {
      const delta = Math.max(0, Math.min(deltaSeconds, 0.05));
      const positionError = this.smoothPosition.distanceTo(this.rawPosition);
      const rotationError = this.smoothRotation.angleTo(this.rawRotation);
      const scaleError = this.smoothScale.distanceTo(this.rawScale);
      const motion = Math.min(1, Math.max(
        positionError / 0.06,
        rotationError / 0.12,
        scaleError / 0.07,
      ));
      const timeConstant = 0.14 - 0.09 * motion;
      const weight = 1 - Math.exp(-delta / timeConstant);
      if (positionError > 0.002) this.smoothPosition.lerp(this.rawPosition, weight);
      if (rotationError > 0.004) this.smoothRotation.slerp(this.rawRotation, weight);
      if (scaleError > 0.003) this.smoothScale.lerp(this.rawScale, weight);
    }

    this.worldPose.compose(this.smoothPosition, this.smoothRotation, this.smoothScale);
    this.inverseAnchor.copy(this.anchor.matrix).invert();
    this.pivot.matrix.multiplyMatrices(this.inverseAnchor, this.worldPose);
    this.pivot.matrixWorldNeedsUpdate = true;
  }
}
