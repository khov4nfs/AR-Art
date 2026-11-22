import { clientIp, rateLimit } from "@/lib/server/security";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, BespokeRequest } from "@/lib/store";
import { getSessionUser, isAuthError, requireAdmin } from "@/lib/adminSession";
import {
  BESPOKE_MAX_REVISIONS,
  formatNowStamp,
  isValidEmail,
  nextUniqueCode,
  isValidVnPhone,
} from "@/lib/everie";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const db = await getDatabase();
    return NextResponse.json({ success: true, data: db.bespokeRequests });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (rateLimit(`bespoke:${clientIp(req.headers)}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Quá nhiều yêu cầu, thử lại sau." }, { status: 429 });
    }
    const body = (await req.json()) as Partial<BespokeRequest>;
    const customerName = body.customerName?.trim() || "";
    const phone = body.phone?.trim() || "";
    const email = body.email?.trim() || "";

    if (!customerName || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Cần họ tên, điện thoại và email" },
        { status: 400 },
      );
    }
    if (!isValidVnPhone(phone) || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Email hoặc số điện thoại không hợp lệ" },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const created: BespokeRequest = {
      id: `bsp-${Date.now()}`,
      code: nextUniqueCode(
        db.bespokeRequests.map((item) => item.code),
        "EVB",
      ),
      createdAt: formatNowStamp(),
      customerName,
      phone,
      email,
      occasion: body.occasion?.trim().slice(0, 1000) || "",
      flowerPreference: body.flowerPreference?.trim().slice(0, 1000) || "",
      colorPreference: body.colorPreference?.trim().slice(0, 1000) || "",
      engravingText: body.engravingText?.trim().slice(0, 1000) || "",
      notes: body.notes?.trim().slice(0, 1000) || "",
      attachments: (Array.isArray(body.attachments) ? body.attachments : [])
        .filter((url): url is string => typeof url === "string" && /^\/uploads\/(bespoke\/)?[\w.-]+$/.test(url))
        .slice(0, 8),
      revisionCount: 0,
      maxRevisions: BESPOKE_MAX_REVISIONS,
      status: "Mới",
      customerId: await (async () => {
        const me = await getSessionUser(req);
        return me?.role === "CUSTOMER" ? me.id : undefined;
      })(),
    };

    db.bespokeRequests.unshift(created);
    await saveDatabase(db);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
