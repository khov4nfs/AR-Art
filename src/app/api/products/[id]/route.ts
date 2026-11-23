import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, ProductItem } from "@/lib/store";
import { revalidatePath } from "next/cache";
import { isAuthError, requireAdmin } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const product = db.products.find((p) => p.id === id || p.slug === id);

    if (!product) {
      return NextResponse.json({ success: false, error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin(req);
  if (isAuthError(gate)) return gate;
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<ProductItem>;
    const db = await getDatabase();
    const index = db.products.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    db.products[index] = {
      ...db.products[index],
      ...body,
    };

    await saveDatabase(db);
    revalidatePath("/collections/all");
    revalidatePath("/");

    return NextResponse.json({ success: true, data: db.products[index] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin(req);
  if (isAuthError(gate)) return gate;
  try {
    const { id } = await params;
    const db = await getDatabase();
    const index = db.products.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    const deleted = db.products.splice(index, 1);
    await saveDatabase(db);
    revalidatePath("/collections/all");
    revalidatePath("/");

    return NextResponse.json({ success: true, data: deleted[0] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
