export async function computeBrowserFileSha256(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function validateTargetImageUniqueness(
  hash: string,
  excludeId?: string,
): Promise<{ unique: boolean; error?: string }> {
  try {
    const response = await fetch("/api/artworks/validate-target", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hash, excludeId }),
    });

    if (response.status === 409) {
      const data = (await response.json()) as { error?: string };
      return {
        unique: false,
        error: data.error || "This target image is already used by another AR artwork. Each AR product requires a unique scan image.",
      };
    }

    if (!response.ok) {
      // Non-blocking on network/server errors during initial preview check
      return { unique: true };
    }

    return { unique: true };
  } catch {
    return { unique: true };
  }
}
