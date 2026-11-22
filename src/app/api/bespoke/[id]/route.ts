import { BESPOKE_FLOW, BESPOKE_MAX_REVISIONS } from "@/lib/everie";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, BespokeRequest } from "@/lib/store";
import { isAuthError, requireAdmin } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const { id } = await params;
    const db = await getDatabase();
    const item = db.bespokeRequests.find((row) => row.id === id || row.code === id);
    if (!item) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy yêu cầu" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** Allowed bespoke status transitions. */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin(req, { superAdmin: true });
  if (isAuthError(gate)) return gate;
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<BespokeRequest>;
    const db = await getDatabase();
    const index = db.bespokeRequests.findIndex(
      (row) => row.id === id || row.code === id,
    );
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy yêu cầu" },
        { status: 404 },
      );
    }

    const current = db.bespokeRequests[index];
    const maxRevisions = current.maxRevisions || BESPOKE_MAX_REVISIONS;
    let revisionCount = current.revisionCount || 0;
    const next = body.status ?? current.status;

    if (next !== current.status) {
      if (!BESPOKE_FLOW[current.status]?.includes(next as string)) {
        return NextResponse.json(
          { success: false, error: `Không thể chuyển từ "${current.status}" sang "${next}"` },
          { status: 400 },
        );
      }
      if (next === "Yêu cầu sửa") {
        if (revisionCount >= maxRevisions) {
          return NextResponse.json(
            { success: false, error: `Đã hết ${maxRevisions} lần sửa` },
            { status: 400 },
          );
        }
        revisionCount += 1;
      }
    }

    // Server owns revisionCount; only these fields are editable.
    const quote = body.quoteAmount;
    db.bespokeRequests[index] = {
      ...current,
      status: next,
      revisionCount,
      maxRevisions,
      ...(quote !== undefined ? { quoteAmount: Math.max(0, Number(quote) || 0) || undefined } : {}),
      ...(body.orderId !== undefined ? { orderId: String(body.orderId).slice(0, 60) || undefined } : {}),
      ...(body.notes !== undefined ? { notes: String(body.notes).slice(0, 2000) } : {}),
    };
    await saveDatabase(db);
    return NextResponse.json({ success: true, data: db.bespokeRequests[index] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
