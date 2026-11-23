import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/adminSession";
import { isTrustedEverieOrigin } from "@/features/auth/domain/everie-request-origin";

/**
 * One identity for both EVERIE commerce and AR. The signed everie_session
 * cookie is the only credential; External bearer tokens are not accepted.
 */
export async function getRequestUser(request: Request) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    if (!isTrustedEverieOrigin(request.headers.get("origin"), siteUrl)) return null;
  }

  const nextRequest = request instanceof NextRequest ? request : new NextRequest(request.url, { headers: request.headers });
  const user = await getSessionUser(nextRequest);
  if (!user) return null;
  return { id: user.id, email: user.email, role: user.role };
}
