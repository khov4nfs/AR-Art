import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getDatabase, saveDatabase, OrderItem } from "@/lib/store";
import { getSessionUser, isAuthError, requireAdmin } from "@/lib/adminSession";

/** Customer placing the order owns it; staff creating an order (e.g. from a bespoke
 * request) may pass the customer's id explicitly. */
async function orderOwnerId(req: NextRequest, body: { customerId?: unknown }): Promise<string | undefined> {
  const me = await getSessionUser(req);
  if (!me) return undefined;
  if (me.role === "CUSTOMER") return me.id;
  return typeof body.customerId === "string" && body.customerId ? body.customerId : undefined;
}
import {
  formatNowStamp,
  isCodMethod,
  isValidEmail,
  nextUniqueCode,
  ENGRAVING_MAX_CHARS,
  isValidVnPhone,
  PROMO_CODES,
} from "@/lib/everie";
import { cartReceiveRange } from "@/lib/orderRange";
import { ENGRAVE_SPOT_MAX_CHARS, engravingCharCount, hasInvalidEngravingChars, isValidPlacement, normalizeEngraving, sanitizeSpot } from "@/lib/engraving";
import { clientIp, rateLimit } from "@/lib/server/security";

export const dynamic = "force-dynamic";

type IncomingLine = {
  productId?: string;
  sku?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
  color?: string;
  engravingText?: string;
  engravingFont?: string;
  engravingPlacement?: string;
  engravingSpot?: unknown;
  giftMessage?: string;
  previewImage?: string;
};

const PREVIEW_MAX_BYTES = 400 * 1024;
const FONT_IDS = new Set(["serif", "script", "classic"]);

/** Persists a client-captured 3D snapshot (JPEG data URL) and returns its public URL. */
async function savePreview(dataUrl: string | undefined, key: string) {
  if (!dataUrl) return undefined;
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return undefined;
  const buf = Buffer.from(match[1], "base64");
  // JPEG magic bytes + size cap: never trust the client blob.
  if (buf.length > PREVIEW_MAX_BYTES || buf[0] !== 0xff || buf[1] !== 0xd8) return undefined;
  const dir = path.join(process.cwd(), "public", "uploads", "previews");
  await mkdir(dir, { recursive: true });
  const name = `${key.replace(/[^a-z0-9-]/gi, "")}.jpg`;
  await writeFile(path.join(dir, name), buf);
  return `/uploads/previews/${name}`;
}

type IncomingOrder = {
  promoCode?: string;
  paymentMethod?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  items?: IncomingLine[];
};

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const db = await getDatabase();
    return NextResponse.json({ success: true, data: db.orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (rateLimit(`order:${clientIp(req.headers)}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Quá nhiều đơn trong thời gian ngắn, vui lòng thử lại sau." },
        { status: 429 },
      );
    }
    const body = (await req.json()) as IncomingOrder;
    const customerName = body.customerName?.trim().slice(0, 120) || "";
    const phone = body.phone?.trim().slice(0, 30) || "";
    const email = body.email?.trim().slice(0, 160) || "";
    const address = body.address?.trim().slice(0, 400) || "";

    if (!customerName || !phone || !email || !address) {
      return NextResponse.json(
        { success: false, error: "Cần họ tên, điện thoại, email và địa chỉ" },
        { status: 400 },
      );
    }
    if (!isValidVnPhone(phone)) {
      return NextResponse.json(
        { success: false, error: "Số điện thoại không hợp lệ" },
        { status: 400 },
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Email không hợp lệ" },
        { status: 400 },
      );
    }

    const db = await getDatabase();

    // Prices, names and images always come from the catalogue, never the client.
    const items: OrderItem["items"] = [];
    for (const line of (body.items ?? []).slice(0, 30)) {
      const product = db.products.find(
        (p) => p.id === line.productId || (line.sku && p.sku === line.sku),
      );
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Sản phẩm không còn tồn tại: ${line.name ?? line.productId ?? ""}` },
          { status: 400 },
        );
      }
      if (product.inStock === false) {
        return NextResponse.json(
          { success: false, error: `Sản phẩm tạm hết hàng: ${product.name}` },
          { status: 409 },
        );
      }
      const color =
        product.colors?.length && line.color
          ? product.colors.find((c) => c.name === line.color)?.name
          : product.colors?.length
            ? undefined
            : line.color?.slice(0, 60);
      if (product.colors?.length && line.color && !color) {
        return NextResponse.json(
          { success: false, error: `Màu men không hợp lệ cho ${product.name}` },
          { status: 400 },
        );
      }
      const engravingText = line.engravingText ? normalizeEngraving(line.engravingText).trim() : "";
      const placement = line.engravingPlacement ?? "front";
      const spot = placement === "spot" ? sanitizeSpot(line.engravingSpot) : null;
      if (engravingText && (!isValidPlacement(placement) || (placement === "spot" && !spot))) {
        return NextResponse.json(
          { success: false, error: `Vị trí khắc không hợp lệ cho ${product.name}` },
          { status: 400 },
        );
      }
      if (engravingText) {
        const max = Math.min(
          product.maxEngravingChars ?? ENGRAVING_MAX_CHARS,
          placement === "spot" ? ENGRAVE_SPOT_MAX_CHARS : Infinity,
        );
        if (
          product.engravingEnabled === false ||
          engravingCharCount(engravingText) > max ||
          hasInvalidEngravingChars(engravingText)
        ) {
          return NextResponse.json(
            { success: false, error: `Chữ khắc không hợp lệ cho ${product.name}` },
            { status: 400 },
          );
        }
      }
      items.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: Math.min(20, Math.max(1, Math.floor(Number(line.quantity) || 1))),
        image: product.image,
        color,
        engravingText: engravingText || undefined,
        engravingFont:
          engravingText && line.engravingFont && FONT_IDS.has(line.engravingFont)
            ? line.engravingFont
            : undefined,
        engravingPlacement: engravingText ? placement : undefined,
        engravingSpot: engravingText && spot ? spot : undefined,
        giftMessage: line.giftMessage?.trim().slice(0, 240) || undefined,
        previewImage: line.previewImage,
      });
    }

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Đơn hàng cần ít nhất một sản phẩm" },
        { status: 400 },
      );
    }

    const hasEngraving = items.some((item) => Boolean(item.engravingText));
    const paymentMethod = isCodMethod(body.paymentMethod)
      ? "Thanh toán khi nhận hàng (COD)"
      : "Chuyển khoản";

    if (hasEngraving && isCodMethod(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          error: "Đơn khắc chữ cần thanh toán chuyển khoản trước khi chế tác",
        },
        { status: 400 },
      );
    }

    const stamp = formatNowStamp();
    const computedTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const discountPercent = PROMO_CODES[body.promoCode?.trim().toUpperCase() ?? ""] ?? 0;
    const discountAmount = Math.round((computedTotal * discountPercent) / 100);
    const shippingFee = 0;
    const receive = cartReceiveRange(
      items.map((item) => ({
        product: db.products.find((p) => p.id === item.productId) ?? {},
      })),
      db.settings,
    );

    const orderId = `ord-${Date.now()}`;
    const storedItems = await Promise.all(
      items.map(async (item, index) => ({
        ...item,
        previewImage: await savePreview(item.previewImage, `${orderId}-${index}`),
      })),
    );

    const newOrder: OrderItem = {
      id: orderId,
      orderNumber: nextUniqueCode(
        db.orders.map((item) => item.orderNumber),
        "EVR",
      ),
      date: stamp,
      total: Math.max(0, computedTotal - discountAmount) + shippingFee,
      shippingFee,
      discountAmount: discountAmount || undefined,
      status: "Chờ xác nhận",
      paymentMethod,
      paymentStatus: "Chưa thanh toán",
      customerName,
      phone,
      email,
      address,
      notes: body.notes?.trim().slice(0, 1000) || undefined,
      items: storedItems,
      expectedMinDays: receive.min,
      expectedMaxDays: receive.max,
      hasEngraving,
      customerId: await orderOwnerId(req, body as { customerId?: unknown }),
      timeline: [
        {
          time: stamp,
          title: "Đặt hàng",
          note: "Đơn hàng được tạo",
          actor: "Khách",
        },
      ],
    };

    db.orders.unshift(newOrder);
    await saveDatabase(db);

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
