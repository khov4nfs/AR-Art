import { isPackedAlphaVideoName } from "@/features/artwork/domain/original-video";

export async function readVideoAspectRatio(file: File) {
  const videoUrl = URL.createObjectURL(file);

  try {
    return await new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        if (!video.videoWidth || !video.videoHeight) {
          reject(new Error("Unable to read the AR video's dimensions."));
          return;
        }
        resolve((isPackedAlphaVideoName(file.name) ? video.videoWidth / 2 : video.videoWidth) / video.videoHeight);
      };
      video.onerror = () => reject(new Error("Unable to read the AR video."));
      video.src = videoUrl;
    });
  } finally {
    URL.revokeObjectURL(videoUrl);
  }
}
