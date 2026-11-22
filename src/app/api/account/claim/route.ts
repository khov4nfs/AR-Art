import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/store";
import { isAuthError, requireUser } from "@/lib/adminSession";
import { rateLimit } from "@/lib/server/security";
import { customerOrderView } from "@/lib/server/customer";
import { phonesMatch } from "@/lib/everie";

export const dynamic = "force-dynamic";

/**
 * Links a past guest order to the account. Ownership is proven with the order
 * code plus the phone used on it (same proof as order lookup), so knowing an
 * email address alone is never enough.
 */
export async function POST(req: NextRequest) {
  const gate = await requireUser(req);
  if (isAuthError(gate)) return gate;
  if (rateLimit(`claim:${gate.user.id}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Quá nhiều lần thử, thử lại sau." }, { status: 429 });
  }
  const { orderNumber, phone } = (await req.json().catch(() => ({}))) as { orderNumber?: string; phone?: string };
  const code = String(orderNumber || "").trim().toUpperCase();
  const db = await getDatabase();
  const order = (db.orders || []).find((o) => o.orderNumber.toUpperCase() === code);
  if (!order || !phone || !phonesMatch(order.phone, String(phone))) {
    return NextResponse.json({ success: false, error: "Mã đơn hoặc số điện thoại không khớp." }, { status: 404 });
  }
  if (order.customerId && order.customerId !== gate.user.id) {
    return NextResponse.json({ success: false, error: "Đơn này đã thuộc tài khoản khác." }, { status: 409 });
  }
  order.customerId = gate.user.id;
  await saveDatabase(db);
  return NextResponse.json({ success: true, data: customerOrderView(order) });
}
