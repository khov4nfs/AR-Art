import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireAdmin } from "@/lib/adminSession";
import { getDatabase, saveDatabase } from "@/lib/store";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDatabase();
    return NextResponse.json({ success: true, data: db.heroSlides });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (isAuthError(gate)) return gate;
  try {
    const body = await req.json();
    if (!Array.isArray(body?.heroSlides)) {
      return NextResponse.json({ success: false, error: "Danh sách slide không hợp lệ" }, { status: 400 });
    }
    const db = await getDatabase();
    db.heroSlides = body.heroSlides;
    await saveDatabase(db);
    revalidatePath("/");
    return NextResponse.json({ success: true, data: db.heroSlides });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
