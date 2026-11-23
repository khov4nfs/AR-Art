import { NextRequest, NextResponse } from "next/server";
import { getDatabase, UserItem } from "@/lib/store";
import { cookieSecure, signSession, verifySession } from "@/lib/server/security";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** One signed session cookie for every role (role is in the token for the /admin proxy). */
export const ADMIN_COOKIE = "everie_session";
export const SESSION_COOKIE = ADMIN_COOKIE;

export function isAdminRole(role?: string) {
  return role === "SUPER_ADMIN" || role === "CONTENT_EDITOR";
}

export function applySessionCookie(res: NextResponse, user: Pick<UserItem, "id" | "role">) {
  res.cookies.set(ADMIN_COOKIE, signSession(user.id, SESSION_MAX_AGE, user.role), {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

/** Any signed-in, active user (customer or staff). */
export async function getSessionUser(req: NextRequest): Promise<UserItem | null> {
  const userId = verifySession(req.cookies.get(ADMIN_COOKIE)?.value);
  if (!userId) return null;
  const db = await getDatabase();
  return db.users.find((item) => item.id === userId && item.isActive) ?? null;
}

export async function getAdminUser(req: NextRequest): Promise<UserItem | null> {
  const user = await getSessionUser(req);
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

export async function requireUser(req: NextRequest): Promise<{ user: UserItem } | NextResponse> {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Vui lòng đăng nhập" }, { status: 401 });
  }
  return { user };
}

export async function requireAdmin(
  req: NextRequest,
  options?: { superAdmin?: boolean },
): Promise<{ user: UserItem } | NextResponse> {
  const user = await getAdminUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Cần đăng nhập quản trị" },
      { status: 401 },
    );
  }
  if (options?.superAdmin && user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Không đủ quyền" },
      { status: 403 },
    );
  }
  return { user };
}

export function isAuthError(
  result: { user: UserItem } | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

/** Strips every secret field before a user leaves the server. */
export function publicUser(user: UserItem) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, resetTokenHash, resetTokenExp, verifyTokenHash, wishlist, ...safe } = user;
  return safe;
}
