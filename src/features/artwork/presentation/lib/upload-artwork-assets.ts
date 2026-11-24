import type { ArtworkUploadSession, SignedUploadSlot } from "@/features/artwork/domain/artwork";

/** Upload directly to EVERIE local storage. */
async function upload(slot: SignedUploadSlot, body: File | Blob, contentType: string) {
  const response = await fetch("/api/artworks/uploads", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": contentType,
      "x-everie-ar-path": slot.path,
      "x-everie-ar-upload-token": slot.token,
    },
    body,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Upload failed.");
  }
}

export async function uploadArtworkAssets(
  session: ArtworkUploadSession,
  input: { targetImage: File; targetMind: Blob; overlay?: File; spatialLayers: File[] },
  onStep: (step: number) => void,
) {
  let step = 1;
  onStep(step);
  await upload(session.uploads.targetImage, input.targetImage, input.targetImage.type);

  onStep(++step);
  await upload(session.uploads.targetMind, input.targetMind, "application/octet-stream");

  if (session.uploads.overlay) {
    if (!input.overlay) throw new Error("AR motion video is missing.");
    onStep(++step);
    await upload(session.uploads.overlay, input.overlay, input.overlay.type);
  }

  if (session.uploads.spatialLayers.length !== input.spatialLayers.length)
    throw new Error("AR layer upload plan no longer matches the selected files.");

  for (let i = 0; i < session.uploads.spatialLayers.length; i++) {
    const layer = session.uploads.spatialLayers[i];
    const file = input.spatialLayers[i];
    if (!layer || !file) throw new Error("An AR layer is missing.");
    onStep(++step);
    await upload(layer.slot, file, file.type || "application/octet-stream");
  }
  onStep(step + 1);
}
