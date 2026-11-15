/** Fit an animation inside the recognized image without stretching the video. */
export function fitVideoPlaneInTarget(videoAspectRatio: number, targetAspectRatio: number) {
  if (!Number.isFinite(videoAspectRatio) || videoAspectRatio <= 0 ||
      !Number.isFinite(targetAspectRatio) || targetAspectRatio <= 0) {
    throw new Error("Invalid image or animation aspect ratio.");
  }
  // MindAR image plane uses width 1 and height 1 / targetAspectRatio.
  const width = Math.min(1, videoAspectRatio / targetAspectRatio);
  return { width, height: width / videoAspectRatio };
}
