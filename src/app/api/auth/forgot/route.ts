import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/store";
import { clientIp, randomToken, rateLimit, sha256 } from "@/lib/server/security";
import { mailEnabled, sendMail, siteUrl } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";
const TTL_MS = 30 * 60 * 1000;

/**
 * Starts a password reset. Always answers the same way (no account
 * enumeration). Without SMTP it reports `emailEnabled: false` so the UI tells
 * the customer to contact the shop; staff reset it in Admin → Users.
 */
export async function POST(req: NextRequest) {
  const { email: raw } = (await req.json().catch(() => ({}))) as { email?: string };
  const email = String(raw || "").trim().toLowerCase();
  if (!mailEnabled()) return NextResponse.json({ success: true, emailEnabled: false });
  if (rateLimit(`forgot:${clientIp(req.headers)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Quá nhiều yêu cầu, thử lại sau." }, { status: 429 });
  }
  const db = await getDatabase();
  const user = db.users.find((u) => u.email.toLowerCase() === email && u.isActive);
  if (user) {
    const token = randomToken();
    user.resetTokenHash = sha256(token);
    user.resetTokenExp = Date.now() + TTL_MS;
    await saveDatabase(db);
    const link = `${siteUrl(req)}/reset-password?email=${encodeURIComponent(user.email)}&token=${token}`;
    await sendMail(
      user.email,
      "EVERIE — Đặt lại mật khẩu / Reset your password",
      `Chào ${user.fullName},\n\nĐặt lại mật khẩu (hiệu lực 30 phút):\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.\n\nEVERIE`,
    );
  }
  return NextResponse.json({ success: true, emailEnabled: true });
}
