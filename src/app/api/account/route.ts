import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, type CustomerAddress, type UserItem } from "@/lib/store";
import { isAuthError, publicUser, requireUser } from "@/lib/adminSession";
import { isValidVnPhone } from "@/lib/everie";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireUser(req);
  if (isAuthError(gate)) return gate;
  return NextResponse.json({ success: true, data: publicUser(gate.user) });
}

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** Self-service profile edit: name, phone, gender, birthday, addresses. */
export async function PUT(req: NextRequest) {
  const gate = await requireUser(req);
  if (isAuthError(gate)) return gate;
  const body = (await req.json().catch(() => ({}))) as Partial<UserItem>;
  const db = await getDatabase();
  const user = db.users.find((u) => u.id === gate.user.id)!;
  if (body.fullName !== undefined) {
    const name = str(body.fullName, 120);
    if (!name) return NextResponse.json({ success: false, error: "Cần họ tên." }, { status: 400 });
    user.fullName = name;
  }
  if (body.phone !== undefined) {
    const phone = str(body.phone, 30);
    if (phone && !isValidVnPhone(phone)) {
      return NextResponse.json({ success: false, error: "Số điện thoại Việt Nam không hợp lệ." }, { status: 400 });
    }
    user.phone = phone;
  }
  if (body.gender !== undefined) {
    user.gender = (["Nam", "Nữ", "Khác"] as const).includes(body.gender) ? body.gender : undefined;
  }
  if (body.birthday !== undefined) user.birthday = str(body.birthday, 20) || undefined;
  if (body.addresses !== undefined) {
    if (!Array.isArray(body.addresses) || body.addresses.length > 10) {
      return NextResponse.json({ success: false, error: "Tối đa 10 địa chỉ." }, { status: 400 });
    }
    const list: CustomerAddress[] = [];
    for (const a of body.addresses) {
      const addr: CustomerAddress = {
        id: /^addr-[\w-]{1,40}$/.test(String(a?.id)) ? String(a.id) : `addr-${Date.now()}-${list.length}`,
        name: str(a?.name, 120),
        phone: str(a?.phone, 30),
        address: str(a?.address, 200),
        ward: str(a?.ward, 80),
        district: str(a?.district, 80),
        city: str(a?.city, 80),
        isDefault: Boolean(a?.isDefault),
      };
      if (!addr.name || !addr.address || !addr.city || !isValidVnPhone(addr.phone)) {
        return NextResponse.json({ success: false, error: "Địa chỉ cần tên, SĐT hợp lệ, địa chỉ và tỉnh/thành." }, { status: 400 });
      }
      list.push(addr);
    }
    if (list.length && !list.some((a) => a.isDefault)) list[0].isDefault = true;
    let seen = false;
    for (const a of list) { if (a.isDefault) { a.isDefault = !seen; seen = true; } }
    user.addresses = list;
  }
  await saveDatabase(db);
  return NextResponse.json({ success: true, data: publicUser(user) });
}
