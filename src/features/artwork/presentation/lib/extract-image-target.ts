/** Turn a transparent AR image into a white-backed image-tracking reference.
 * The original File is never modified, so the AR overlay retains its alpha.
 */
export async function extractImageTarget(file: File): Promise<File> {
  if (file.size <= 0 || file.size > 6 * 1024 * 1024) {
    throw new Error("Tracking image must be between 1 byte and 6 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("The image took too long to open.")), 15000);
      image.onload = () => {
        window.clearTimeout(timeout);
        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error("The tracking image has invalid dimensions."));
        } else {
          resolve();
        }
      };
      image.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Unable to read this AR image."));
      };
      image.src = url;
    });

    const factor = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * factor));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * factor));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser cannot prepare an image for AR scanning.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => value ? resolve(value) : reject(new Error("Unable to export the tracking image.")),
        "image/png",
      );
    });
    if (blob.size > 6 * 1024 * 1024) {
      throw new Error("Tracking image exceeds 6 MB. Choose a smaller reference image.");
    }
    return new File([blob], "tracking-from-image.png", { type: "image/png" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
