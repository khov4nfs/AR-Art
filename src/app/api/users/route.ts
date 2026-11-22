import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, UserItem } from "@/lib/store";
import { applySessionCookie, getAdminUser, isAuthError, publicUser, requireAdmin } from "@/lib/adminSession";
import { clientIp, hashPassword, passwordProblem, randomToken, rateLimit, sha256 } from "@/lib/server/security";
import { mailEnabled, sendMail, siteUrl } from "@/lib/server/mailer";
import { formatNowStamp, isValidEmail, isValidVnPhone } from "@/lib/everie";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.toLowerCase();
    const role = searchParams.get("role");
    const tier = searchParams.get("tier");

    const db = await getDatabase();
    // Fallback if users array not present in existing json file
    if (!db.users) {
      db.users = [];
      await saveDatabase(db);
    }

    let users = db.users;

    if (search) {
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.phone.includes(search)
      );
    }
    if (role && role !== "all") {
      users = users.filter((u) => u.role === role);
    }
    if (tier && tier !== "all") {
      users = users.filter((u) => u.tier === tier);
    }

    return NextResponse.json({
      success: true,
      data: users.map(publicUser),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<UserItem>;
    const admin = await getAdminUser(req);
    const isSuperAdmin = admin?.role === "SUPER_ADMIN";
    if (!isSuperAdmin && rateLimit(`register:${clientIp(req.headers)}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Quá nhiều yêu cầu, thử lại sau." }, { status: 429 });
    }
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = String(body.fullName ?? "").trim().slice(0, 120);
    const password = String(body.password ?? "");
    if (!fullName || !isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "Cần họ tên và email hợp lệ." }, { status: 400 });
    }
    const pwError = passwordProblem(password);
    if (pwError) {
      return NextResponse.json({ success: false, error: pwError }, { status: 400 });
    }
    const phone = String(body.phone ?? "").trim().slice(0, 30);
    if (phone && !isValidVnPhone(phone)) {
      return NextResponse.json({ success: false, error: "Số điện thoại Việt Nam không hợp lệ." }, { status: 400 });
    }
    const db = await getDatabase();
    if (!db.users) db.users = [];

    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return NextResponse.json(
        { success: false, error: "Email đã được đăng ký." },
        { status: 409 },
      );
    }

    const now = new Date();
    const dateFormatted = formatNowStamp(now).slice(0, 10);

    const newUser: UserItem = {
      id: `usr-${Date.now()}`,
      fullName,
      email,
      phone,
      password: hashPassword(password),
      createdAt: dateFormatted,
      // Public sign-up can never pick a role, tier or points.
      tier: isSuperAdmin && body.tier ? body.tier : "Silver",
      points: isSuperAdmin ? Math.max(0, Number(body.points) || 0) : 0,
      role: isSuperAdmin && body.role ? body.role : "CUSTOMER",
      isActive: isSuperAdmin ? (body.isActive ?? true) : true,
      avatar: (isSuperAdmin && body.avatar) || "/images/hanoia/logo-circle-h.png",
    };

    let verifyToken = "";
    if (!isSuperAdmin && mailEnabled()) {
      verifyToken = randomToken();
      newUser.verifyTokenHash = sha256(verifyToken);
    }
    db.users.unshift(newUser);
    await saveDatabase(db);

    if (verifyToken) {
      const link = `${siteUrl(req)}/api/auth/verify-email?uid=${encodeURIComponent(newUser.id)}&token=${verifyToken}`;
      void sendMail(
        email,
        "EVERIE — Xác nhận email / Confirm your email",
        `Chào ${fullName},\n\nBấm vào liên kết sau để xác nhận email và liên kết các đơn hàng đã đặt trước đây:\n${link}\n\nEVERIE`,
      );
    }

    const res = NextResponse.json({ success: true, data: publicUser(newUser) }, { status: 201 });
    // Public sign-up signs the new customer in right away.
    if (!isSuperAdmin) applySessionCookie(res, newUser);
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
