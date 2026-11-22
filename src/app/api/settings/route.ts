import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, SiteSettings } from "@/lib/store";
import { revalidatePath } from "next/cache";
import { isAuthError, requireAdmin } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDatabase();
    return NextResponse.json(
      { success: true, data: db.settings },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const body = (await req.json()) as Partial<SiteSettings>;
    const db = await getDatabase();
    db.settings = {
      ...db.settings,
      ...body,
    };
    await saveDatabase(db);
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, data: db.settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
