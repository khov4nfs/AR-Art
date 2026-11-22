import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/store";
import { isAuthError, requireUser } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireUser(req);
  if (isAuthError(gate)) return gate;
  return NextResponse.json({ success: true, data: gate.user.wishlist || [] });
}

/** Body: { ids: string[], merge?: boolean } — merge unions with the saved list (login merge). */
export async function PUT(req: NextRequest) {
  const gate = await requireUser(req);
  if (isAuthError(gate)) return gate;
  const body = (await req.json().catch(() => ({}))) as { ids?: unknown; merge?: boolean };
  if (!Array.isArray(body.ids)) return NextResponse.json({ success: false, error: "ids[]" }, { status: 400 });
  const db = await getDatabase();
  const known = new Set(db.products.map((p) => p.id));
  const incoming = body.ids.map(String).filter((id) => known.has(id));
  const user = db.users.find((u) => u.id === gate.user.id)!;
  const next = body.merge ? [...(user.wishlist || []), ...incoming] : incoming;
  user.wishlist = Array.from(new Set(next)).slice(0, 200);
  await saveDatabase(db);
  return NextResponse.json({ success: true, data: user.wishlist });
}
