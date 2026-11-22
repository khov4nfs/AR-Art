import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, ProductItem } from "@/lib/store";
import { revalidatePath } from "next/cache";
import { isAuthError, requireAdmin } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const line = searchParams.get("line");
    const search = searchParams.get("q")?.toLowerCase();

    const db = await getDatabase();
    let products = db.products;

    if (line) {
      products = products.filter((p) => p.line === line);
    }
    if (category) {
      products = products.filter((p) => p.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (tag) {
      products = products.filter((p) => p.tag?.toLowerCase() === tag.toLowerCase());
    }
    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, data: products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (isAuthError(gate)) return gate;
  try {
    const body = (await req.json()) as Omit<ProductItem, "id">;
    const db = await getDatabase();

    const newProduct: ProductItem = {
      ...body,
      id: `prod-${Date.now()}`,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      inStock: body.inStock ?? true,
      colors: body.colors || [],
      galleryImages: body.galleryImages || [body.image],
    };

    db.products.unshift(newProduct);
    await saveDatabase(db);
    revalidatePath("/collections/all");
    revalidatePath("/");

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
