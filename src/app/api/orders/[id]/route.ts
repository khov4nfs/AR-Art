import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, OrderItem } from "@/lib/store";
import { isAuthError, requireAdmin } from "@/lib/adminSession";
import { formatNowStamp } from "@/lib/everie";

export const dynamic = "force-dynamic";

const ORDER_STATUSES: OrderItem["status"][] = [
  "Chờ xác nhận",
  "Đang chế tác",
  "Đang xử lý",
  "Đang vận chuyển",
  "Đã giao hàng",
  "Hư hỏng khi vận chuyển",
  "Đã hủy",
];
const PAYMENT_STATUSES: NonNullable<OrderItem["paymentStatus"]>[] = [
  "Chưa thanh toán",
  "Đã thanh toán",
  "Đã hoàn tiền",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const { id } = await params;
    const db = await getDatabase();
    const order = db.orders.find((item) => item.id === id || item.orderNumber === id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const { id } = await params;
    const raw = (await req.json()) as Partial<OrderItem>;
    // Only these fields are editable from the admin; totals/items stay as ordered.
    const body: Partial<OrderItem> = {};
    if (raw.status !== undefined) {
      if (!ORDER_STATUSES.includes(raw.status)) {
        return NextResponse.json({ success: false, error: "Trạng thái không hợp lệ" }, { status: 400 });
      }
      body.status = raw.status;
    }
    if (raw.paymentStatus !== undefined) {
      if (!PAYMENT_STATUSES.includes(raw.paymentStatus)) {
        return NextResponse.json({ success: false, error: "Trạng thái thanh toán không hợp lệ" }, { status: 400 });
      }
      body.paymentStatus = raw.paymentStatus;
    }
    for (const key of ["trackingCode", "notes", "customerName", "phone", "email", "address"] as const) {
      if (typeof raw[key] === "string") body[key] = (raw[key] as string).trim().slice(0, 1000);
    }
    const db = await getDatabase();
    const index = db.orders.findIndex(
      (item) => item.id === id || item.orderNumber === id,
    );

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );
    }

    const current = db.orders[index];
    if (body.status === "Đang vận chuyển" && !((body.trackingCode ?? current.trackingCode)?.trim())) {
      return NextResponse.json(
        { success: false, error: "Cần mã vận đơn trước khi chuyển sang Đang vận chuyển" },
        { status: 400 },
      );
    }

    const nextPayment = body.paymentStatus ?? current.paymentStatus;
    if (
      current.hasEngraving &&
      body.status &&
      body.status !== current.status &&
      ["Đang chế tác", "Đang vận chuyển", "Đã giao hàng"].includes(body.status) &&
      nextPayment !== "Đã thanh toán"
    ) {
      return NextResponse.json(
        { success: false, error: "Đơn khắc chữ cần xác nhận đã thanh toán trước khi chế tác/giao" },
        { status: 400 },
      );
    }

    const timeline = [...(current.timeline ?? [])];
    if (body.paymentStatus && body.paymentStatus !== current.paymentStatus) {
      timeline.push({
        time: formatNowStamp(),
        title: body.paymentStatus,
        note: `Thanh toán: ${current.paymentStatus ?? "—"} → ${body.paymentStatus}`,
        actor: gate.user.fullName,
      });
    }
    if (body.status && body.status !== current.status) {
      timeline.push({
        time: formatNowStamp(),
        title: body.status,
        note: body.notes?.trim() || `Đổi trạng thái từ ${current.status}`,
        actor: gate.user.fullName,
      });
    }

    db.orders[index] = {
      ...current,
      ...body,
      id: current.id,
      orderNumber: current.orderNumber,
      timeline,
    };
    await saveDatabase(db);

    return NextResponse.json({ success: true, data: db.orders[index] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const { id } = await params;
    const db = await getDatabase();
    const index = db.orders.findIndex(
      (item) => item.id === id || item.orderNumber === id,
    );

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );
    }

    const deleted = db.orders.splice(index, 1);
    await saveDatabase(db);

    return NextResponse.json({ success: true, data: deleted[0] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
