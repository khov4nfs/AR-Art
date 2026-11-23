import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSessionUser, publicUser } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

/** Current session user, or 401 (and the stale cookie is cleared). */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    const res = NextResponse.json({ success: false }, { status: 401 });
    return req.cookies.get("everie_session") ? clearSessionCookie(res) : res;
  }
  return NextResponse.json({ success: true, data: publicUser(user) });
}
