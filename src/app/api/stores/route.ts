import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDatabase();
    return NextResponse.json({ success: true, data: db.stores });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
