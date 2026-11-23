import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/store";
import { isAuthError, requireUser } from "@/lib/adminSession";
import { hashPassword, passwordProblem, rateLimit, verifyPassword } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = await requireUser(req);
  if (isAuthError(gate)) return gate;
  if (rateLimit(`chpw:${gate.user.id}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Quá nhiều lần thử, thử lại sau." }, { status: 429 });
  }
  const { currentPassword, newPassword } = (await req.json().catch(() => ({}))) as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!(await verifyPassword(String(currentPassword || ""), gate.user.password))) {
    return NextResponse.json({ success: false, error: "Mật khẩu hiện tại không đúng." }, { status: 400 });
  }
  const pwError = passwordProblem(String(newPassword || ""));
  if (pwError) return NextResponse.json({ success: false, error: pwError }, { status: 400 });
  const db = await getDatabase();
  const user = db.users.find((u) => u.id === gate.user.id)!;
  user.password = hashPassword(String(newPassword));
  await saveDatabase(db);
  return NextResponse.json({ success: true });
}
