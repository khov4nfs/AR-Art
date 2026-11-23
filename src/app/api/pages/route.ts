import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireAdmin } from "@/lib/adminSession";
import { getDatabase, PageContent, saveDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDatabase();
    return NextResponse.json(
      { success: true, data: db.pages },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Không thể tải nội dung trang";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (isAuthError(gate)) return gate;
  try {
    const body = (await request.json()) as Partial<PageContent>;
    if (!body.id || body.slug === undefined || !body.title) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã trang, đường dẫn hoặc tiêu đề" },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const index = db.pages.findIndex((page) => page.id === body.id);
    if (index < 0) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy trang" },
        { status: 404 },
      );
    }

    const cleanSlug = body.slug.trim().replace(/^\/+|\/+$/g, "");
    const updatedPage: PageContent = {
      ...db.pages[index],
      ...body,
      id: db.pages[index].id,
      slug: cleanSlug,
      title: body.title.trim(),
      status: body.status === "draft" ? "draft" : "published",
      updatedAt: new Intl.DateTimeFormat("vi-VN").format(new Date()),
    };
    db.pages[index] = updatedPage;
    await saveDatabase(db);
    revalidatePath(`/${updatedPage.slug}`);
    if (updatedPage.slug === "" || updatedPage.slug === "home") {
      revalidatePath("/");
    }

    return NextResponse.json({ success: true, data: updatedPage });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Không thể lưu nội dung trang";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (isAuthError(gate)) return gate;
  try {
    const body = (await request.json()) as Partial<PageContent>;
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề trang không được để trống" },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const cleanSlug = (body.slug || "")
      .trim()
      .replace(/^\/+|\/+$/g, "")
      .toLowerCase()
      .replace(/\s+/g, "-");

    const newId = `page-${Date.now()}`;
    const newPage: PageContent = {
      id: newId,
      slug: cleanSlug || `trang-${Date.now().toString().slice(-4)}`,
      title: body.title.trim(),
      navigationLabel: body.navigationLabel?.trim() || body.title.trim(),
      excerpt: body.excerpt || "Mô tả ngắn trang nội dung.",
      content: body.content || "",
      status: body.status === "draft" ? "draft" : "published",
      seoTitle: body.seoTitle || `${body.title.trim()} | Hanoia`,
      seoDescription: body.seoDescription || body.excerpt || "",
      updatedAt: new Intl.DateTimeFormat("vi-VN").format(new Date()),
      sections: body.sections || [
        {
          id: `hero-${Date.now()}`,
          type: "hero",
          name: "Banner đầu trang",
          eyebrow: "Hanoia Luxury Lacquerware",
          title: body.title.trim(),
          body: "Khám phá nét tinh hoa nghệ thuật sơn mài truyền thống kết hợp thiết kế đương đại.",
          image: "/images/hanoia/hero-banner-1.webp",
          imageAlt: body.title.trim(),
          enabled: true,
          items: [],
        },
      ],
    };

    db.pages.push(newPage);
    await saveDatabase(db);
    revalidatePath(`/${newPage.slug}`);

    return NextResponse.json({ success: true, data: newPage }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Không thể tạo trang mới";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (isAuthError(gate)) return gate;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã trang cần xóa" },
        { status: 400 },
      );
    }

    // Protect core system pages
    const protectedIds = ["page-home", "page-heritage", "page-stores", "page-policies", "page-contact"];
    if (protectedIds.includes(id)) {
      return NextResponse.json(
        { success: false, error: "Không thể xóa trang hệ thống mặc định." },
        { status: 403 },
      );
    }

    const db = await getDatabase();
    const index = db.pages.findIndex((page) => page.id === id);
    if (index < 0) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy trang để xóa" },
        { status: 404 },
      );
    }

    const [deleted] = db.pages.splice(index, 1);
    await saveDatabase(db);
    revalidatePath(`/${deleted.slug}`);

    return NextResponse.json({ success: true, data: deleted });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Không thể xóa trang";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
