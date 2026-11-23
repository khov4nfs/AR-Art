import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/server/security";

/**
 * Server-side gate for /admin pages: requires a valid signed session whose
 * role is staff. APIs still re-check the user in the DB (role changes,
 * deactivation) via requireAdmin.
 */
export function proxy(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get("everie_session")?.value);
  if (session && (session.role === "SUPER_ADMIN" || session.role === "CONTENT_EDITOR")) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
