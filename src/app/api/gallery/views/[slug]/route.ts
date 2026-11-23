import { NextResponse } from "next/server";

import { updateArData } from "@/features/artwork/infrastructure/local/ar-data";

export const runtime = "nodejs";

const VIEW_COOKIE_AGE = 12 * 60 * 60;

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{3,120}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid artwork." }, { status: 400 });
  }

  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  // Next.js may see an internal upstream URL behind Caddy; the browser still
  // sends Sec-Fetch-Site: same-origin. Trust that browser-owned signal, or
  // compare Origin against the public forwarded/Host header for other clients.
  const publicHost = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host
  ).split(",")[0].trim();
  let samePublicOrigin = false;
  try {
    samePublicOrigin = !!origin && new URL(origin).host === publicHost;
  } catch {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (
    fetchSite === "cross-site" ||
    (origin && !samePublicOrigin && fetchSite !== "same-origin")
  ) {
    return NextResponse.json({ error: "Cross-origin view not allowed." }, { status: 403 });
  }

  const cookieName = `everie_view_${slug}`;
  const cookies = request.headers.get("cookie") ?? "";
  if (cookies.split(";").some((part) => part.trim().startsWith(`${cookieName}=`))) {
    return NextResponse.json({ counted: false }, { headers: { "cache-control": "no-store" } });
  }

  const found = await updateArData(data => {
    const artwork = data.artworks.find(x => x.slug === slug && x.status === "published");
    if (!artwork) return false;
    artwork.viewCount = Math.max(0, Number(artwork.viewCount ?? 0)) + 1;
    return true;
  }).catch((cause) => {
    console.error("Gallery view count could not be updated:", cause);
    return null;
  });
  if (found === null) return NextResponse.json({ error: "View count unavailable." }, { status: 503 });
  if (!found) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });

  const response = NextResponse.json({ counted: true }, { headers: { "cache-control": "no-store" } });
  response.cookies.set(cookieName, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VIEW_COOKIE_AGE,
  });
  return response;
}
