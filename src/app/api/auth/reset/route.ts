import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/store";
import { applySessionCookie, publicUser } from "@/lib/adminSession";
import { clientIp, hashPassword, passwordProblem, rateLimit, sha256 } from "@/lib/server/security";
import { claimByVerifiedEmail } from "@/lib/server/customer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (rateLimit(`reset:${clientIp(req.headers)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Quá nhiều yêu cầu, thử lại sau." }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as { email?: string; token?: string; password?: string };
  const email = String(body.email || "").trim().toLowerCase();
  const token = String(body.token || "");
  const password = String(body.password || "");
  const pwError = passwordProblem(password);
  if (pwError) return NextResponse.json({ success: false, error: pwError }, { status: 400 });
  const db = await getDatabase();
  const user = db.users.find((u) => u.email.toLowerCase() === email && u.isActive);
  const ok =
    user?.resetTokenHash &&
    (user.resetTokenExp || 0) > Date.now() &&
    crypto.timingSafeEqual(Buffer.from(user.resetTokenHash), Buffer.from(sha256(token)));
  if (!user || !ok) {
    return NextResponse.json({ success: false, error: "Liên kết đã hết hạn hoặc không hợp lệ." }, { status: 400 });
  }
  user.password = hashPassword(password);
  user.resetTokenHash = undefined;
  user.resetTokenExp = undefined;
  // Receiving the reset email proves the address.
  user.emailVerified = true;
  claimByVerifiedEmail(db, user);
  await saveDatabase(db);
  return applySessionCookie(NextResponse.json({ success: true, data: publicUser(user) }), user);
}
