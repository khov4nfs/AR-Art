import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, UserItem } from "@/lib/store";
import { isAuthError, publicUser, requireAdmin } from "@/lib/adminSession";
import { hashPassword, passwordProblem } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const { id } = await params;
    const db = await getDatabase();
    if (!db.users) db.users = [];
    const user = db.users.find((u) => u.id === id);

    if (!user) {
      return NextResponse.json({ success: false, error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: publicUser(user),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<UserItem>;
    const db = await getDatabase();
    if (!db.users) db.users = [];

    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    // Only these fields are editable from Admin → Users (never tokens/hashes).
    const rest: Partial<UserItem> = {};
    for (const k of ["fullName", "email", "phone", "role", "tier", "points", "avatar", "isActive", "emailVerified"] as const) {
      if (body[k] !== undefined) (rest as Record<string, unknown>)[k] = body[k];
    }
    const password = body.password;
    const pwError = password ? passwordProblem(String(password)) : null;
    if (pwError) {
      return NextResponse.json({ success: false, error: pwError }, { status: 400 });
    }
    if (id === gate.user.id && (rest.role && rest.role !== "SUPER_ADMIN" || rest.isActive === false)) {
      return NextResponse.json({ success: false, error: "Không thể tự hạ quyền hoặc khoá chính mình." }, { status: 400 });
    }
    db.users[index] = {
      ...db.users[index],
      ...rest,
      ...(password
        ? { password: hashPassword(String(password)), resetTokenHash: undefined, resetTokenExp: undefined }
        : {}),
    };

    await saveDatabase(db);
    return NextResponse.json({ success: true, data: publicUser(db.users[index]) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const { id } = await params;
    const db = await getDatabase();
    if (!db.users) db.users = [];

    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    if (db.users[index].id === gate.user.id) {
      return NextResponse.json({ success: false, error: "Không thể xoá chính mình." }, { status: 400 });
    }
    const deleted = db.users.splice(index, 1);
    await saveDatabase(db);

    return NextResponse.json({ success: true, data: publicUser(deleted[0]) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
