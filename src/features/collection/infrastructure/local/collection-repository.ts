"use client";

import { normalizeCollectionArtworkIds } from "@/features/collection/domain/collection";

type EverieIdentity = { id: string; email?: string; role?: string };

export async function getCurrentCollectionUser(): Promise<EverieIdentity | null> {
  const response = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) return null;
  const payload = (await response.json()) as { success?: boolean; data?: EverieIdentity };
  return payload.success && payload.data?.id ? payload.data : null;
}

export async function listCollectedArtworkIds(): Promise<string[]> {
  const response = await fetch("/api/ar/collection", { cache: "no-store", credentials: "same-origin" });
  if (response.status === 401) return [];
  const payload = (await response.json()) as { artworkIds?: string[]; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Unable to load collection.");
  return normalizeCollectionArtworkIds((payload.artworkIds ?? []).map((artwork_id) => ({ artwork_id })));
}

export async function collectArtwork(artworkId: string) {
  const response = await fetch("/api/ar/collection", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ artworkId }),
  });
  if (response.status === 401) {
    return { collected: false, reason: "unauthenticated" as const };
  }
  const payload = (await response.json()) as { collected?: boolean; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Unable to save collection item.");
  return { collected: payload.collected === true, reason: null };
}

export async function removeCollectedArtwork(artworkId: string) {
  const response = await fetch("/api/ar/collection", {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ artworkId }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Unable to remove collection item.");
  }
}
