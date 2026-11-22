import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/store";
import { isAuthError, requireUser } from "@/lib/adminSession";
import { customerOrderView, ordersOf } from "@/lib/server/customer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireUser(req);
  if (isAuthError(gate)) return gate;
  const { id } = await params;
  const db = await getDatabase();
  const order = ordersOf(db, gate.user).find((o) => o.id === id || o.orderNumber === id);
  // 404 (not 403) so other customers' order ids are not confirmed.
  if (!order) return NextResponse.json({ success: false, error: "Không tìm thấy đơn hàng" }, { status: 404 });
  return NextResponse.json({ success: true, data: customerOrderView(order) });
}
