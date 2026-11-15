import {
  AR_VIDEO_CHUNK_SIZE,
  conversionChunkCount,
  validateOriginalVideo,
} from "@/features/artwork/domain/original-video";

type AuthHeaders = { authorization: string };

async function messageFromResponse(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "Video conversion failed.";
  } catch {
    return "Video conversion failed. Please try again.";
  }
}

/** Upload as 8 MB authenticated chunks so 166–215 MB MOV files pass Cloudflare. */
export async function convertVideoForAr(
  original: File,
  authHeaders: AuthHeaders,
  onProgress: (message: string) => void,
): Promise<File> {
  const validationError = validateOriginalVideo(original);
  if (validationError) throw new Error(validationError);

  const init = await fetch("/api/videos/convert?stage=init", {
    method: "POST",
    headers: { ...authHeaders, "content-type": "application/json" },
    body: JSON.stringify({ size: original.size }),
  });
  if (!init.ok) throw new Error(await messageFromResponse(init));

  const session = (await init.json()) as { id: string; chunkSize: number };
  if (!session.id || session.chunkSize !== AR_VIDEO_CHUNK_SIZE) {
    throw new Error("Video conversion session is invalid.");
  }

  try {
    const chunks = conversionChunkCount(original.size);
    for (let index = 0; index < chunks; index += 1) {
      onProgress(`Uploading original video (${index + 1}/${chunks})…`);
      const start = index * AR_VIDEO_CHUNK_SIZE;
      const slice = original.slice(start, Math.min(start + AR_VIDEO_CHUNK_SIZE, original.size));
      const response = await fetch(
        `/api/videos/convert?stage=chunk&id=${encodeURIComponent(session.id)}&index=${index}`,
        {
          method: "POST",
          headers: { ...authHeaders, "content-type": "application/octet-stream" },
          body: slice,
        },
      );
      if (!response.ok) throw new Error(await messageFromResponse(response));
    }

    onProgress("Converting your video to transparent AR MP4…");
    const completed = await fetch(
      `/api/videos/convert?stage=finish&id=${encodeURIComponent(session.id)}`,
      { method: "POST", headers: authHeaders },
    );
    if (!completed.ok) throw new Error(await messageFromResponse(completed));
    const blob = await completed.blob();
    if (!blob.size || blob.size > 6 * 1024 * 1024) {
      throw new Error("Converted video exceeds the 6 MB AR limit.");
    }
    const baseName = original.name.replace(/\.[^/.]+$/, "");
    return new File([blob], `${baseName}.alpha.mp4`, { type: "video/mp4" });
  } catch (error) {
    void fetch(
      `/api/videos/convert?stage=cancel&id=${encodeURIComponent(session.id)}`,
      { method: "POST", headers: authHeaders },
    ).catch(() => {});
    throw error;
  }
}