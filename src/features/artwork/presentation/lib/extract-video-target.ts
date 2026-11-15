/**
 * Extract a still tracking target from a user-supplied video. MindAR tracks
 * this derived frame; customers don't need to upload a separate image.
 * The frame still needs to resemble the actual physical artwork.
 */
export async function extractVideoTarget(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";

  try {
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Video loading timed out.")), 15000);
      video.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        if (!video.videoWidth || !video.videoHeight) {
          reject(new Error("Cannot read this video. Try MP4 or WebM supported by your browser."));
        } else {
          resolve({ width: video.videoWidth, height: video.videoHeight });
        }
      };
      video.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Cannot decode this video. Convert MOV to MP4 or WebM first."));
      };
      video.src = url;
      video.load();
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const seekTime = Math.min(0.5, Math.max(0.05, duration * 0.1));
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Could not extract a video frame.")), 15000);
      const finish = () => {
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
        window.clearTimeout(timeout);
        resolve();
      };
      video.onseeked = finish;
      video.onloadeddata = finish;
      video.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Unable to decode a video frame."));
      };
      video.currentTime = duration > 0 ? Math.min(seekTime, Math.max(0, duration - 0.01)) : 0;
      finish();
    });

    const ratio = Math.min(1, 1024 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to create a tracking image.");
    // Flatten transparent video against white for an opaque PNG tracking image.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Unable to export tracking image.")), "image/png");
    });
    if (blob.size > 6 * 1024 * 1024) throw new Error("Generated tracking image is too large.");
    return new File([blob], "tracking-from-video.png", { type: "image/png" });
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
