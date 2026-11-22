import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/store";
import {
  applySessionCookie,
  isAdminRole,
  publicUser,
} from "@/lib/adminSession";
import { clientIp, rateLimit, resetRateLimit, verifyPassword } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      adminOnly?: boolean;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập email và mật khẩu." },
        { status: 400 },
      );
    }

    const limitKey = `login:${clientIp(req.headers)}:${email}`;
    const wait = rateLimit(limitKey, 8, 10 * 60 * 1000);
    if (wait) {
      return NextResponse.json(
        { success: false, error: `Đăng nhập sai quá nhiều lần. Thử lại sau ${Math.ceil(wait / 60)} phút.` },
        { status: 429, headers: { "Retry-After": String(wait) } },
      );
    }

    const db = await getDatabase();
    const user = db.users.find((u) => u.email.toLowerCase() === email);

    if (!user || !user.isActive || !(await verifyPassword(password, user.password))) {
      return NextResponse.json(
        { success: false, error: "Email hoặc mật khẩu không đúng." },
        { status: 401 },
      );
    }

    if (body.adminOnly && !isAdminRole(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tài khoản khách hàng không có quyền truy cập khu vực quản trị.",
        },
        { status: 403 },
      );
    }

    resetRateLimit(limitKey);
    const res = NextResponse.json({
      success: true,
      data: publicUser(user),
    });
    applySessionCookie(res, user);
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
