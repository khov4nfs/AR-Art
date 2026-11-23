import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/store";
import { phonesMatch } from "@/lib/everie";
import { clientIp, rateLimit } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const wait = rateLimit(`lookup:${clientIp(req.headers)}`, 15, 10 * 60 * 1000);
    if (wait) {
      return NextResponse.json(
        { success: false, error: "Tra cứu quá nhiều lần, vui lòng thử lại sau ít phút." },
        { status: 429, headers: { "Retry-After": String(wait) } },
      );
    }
    const body = (await req.json()) as {
      orderNumber?: string;
      email?: string;
      phone?: string;
    };
    const orderNumber = body.orderNumber?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();

    if (!orderNumber || (!email && !phone)) {
      return NextResponse.json(
        { success: false, error: "Nhập mã đơn và email hoặc số điện thoại" },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const order = db.orders.find((item) => {
      if (item.orderNumber.toLowerCase() !== orderNumber.toLowerCase()) return false;
      const emailOk = Boolean(email && item.email?.toLowerCase() === email);
      const phoneOk = Boolean(phone && phonesMatch(item.phone, phone));
      return emailOk || phoneOk;
    });

    const request = db.bespokeRequests.find((item) => {
      if (item.code.toLowerCase() !== orderNumber.toLowerCase()) return false;
      const emailOk = Boolean(email && item.email.toLowerCase() === email);
      const phoneOk = Boolean(phone && phonesMatch(item.phone, phone));
      return emailOk || phoneOk;
    });

    if (!order && !request) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn hoặc yêu cầu Bespoke" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: { order, request } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
