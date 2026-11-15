import {
  isPackedAlphaVideoName,
  trackingSampleTime,
} from "@/features/artwork/domain/original-video";

/**
 * MindAR needs a printed still that resembles the physical artwork.
 * Prefer a settled late frame, and composite packed AR video against white.
 * The physical print still must match this target; video alone cannot prove that.
 */
export async function extractVideoTarget(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  const packed = isPackedAlphaVideoName(file.name);
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  try {
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Video loading timed out.")), 15000);
      video.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        if (video.videoWidth < 2 || video.videoHeight < 2 ||
            (packed && video.videoWidth % 2 !== 0)) {
          reject(new Error("Video dimensions are not valid for AR tracking."));
        } else {
          resolve({ width: video.videoWidth, height: video.videoHeight });
        }
      };
      video.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Cannot decode the video for AR tracking."));
      };
      video.src = url;
      video.load();
    });

    const seekTime = trackingSampleTime(video.duration);
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Could not read the video frame.")), 15000);
      const complete = () => { window.clearTimeout(timeout); resolve(); };
      video.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Unable to decode a video frame."));
      };
      if (seekTime <= 0.01) {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) complete();
        else video.onloadeddata = complete;
      } else {
        video.onseeked = complete;
        video.currentTime = seekTime;
      }
    });

    const frameWidth = packed ? width / 2 : width;
    const ratio = Math.min(1, 1024 / Math.max(frameWidth, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(frameWidth * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const ctx = canvas.getContext("2d", { willReadFrequently: packed });
    if (!ctx) throw new Error("Your browser cannot create a tracking image.");

    if (packed) {
      // The MP4 contains RGB (left) and alpha luminance (right).
      const colorCanvas = document.createElement("canvas");
      const maskCanvas = document.createElement("canvas");
      for (const item of [colorCanvas, maskCanvas]) {
        item.width = canvas.width;
        item.height = canvas.height;
      }
      const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
      const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!colorContext || !maskContext) throw new Error("Unable to decode transparent video.");
      colorContext.drawImage(video, 0, 0, frameWidth, height, 0, 0, canvas.width, canvas.height);
      maskContext.drawImage(video, frameWidth, 0, frameWidth, height, 0, 0, canvas.width, canvas.height);
      const color = colorContext.getImageData(0, 0, canvas.width, canvas.height);
      const mask = maskContext.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < color.data.length; i += 4) {
        const opacity = Math.min(1, Math.max(0,
          ((mask.data[i] + mask.data[i + 1] + mask.data[i + 2]) / 3 - 6) / 243,
        ));
        const backdrop = 255 * (1 - opacity);
        color.data[i] = color.data[i] * opacity + backdrop;
        color.data[i + 1] = color.data[i + 1] * opacity + backdrop;
        color.data[i + 2] = color.data[i + 2] * opacity + backdrop;
        color.data[i + 3] = 255;
      }
      ctx.putImageData(color, 0, 0);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Unable to export the tracking image.")), "image/png");
    });
    if (blob.size > 6 * 1024 * 1024) throw new Error("Generated tracking image exceeds the 6 MB limit.");
    return new File([blob], "tracking-from-video.png", { type: "image/png" });
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
