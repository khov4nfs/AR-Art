import { NextResponse } from "next/server";
import { getRequestUser } from "@/features/auth/infrastructure/supabase/request-user";
import { getSupabaseServerClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";

export const runtime = "nodejs";

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

async function requireIdentity(request: Request) {
  const user = await getRequestUser(request);
  return user?.id ?? null;
}

export async function GET(request: Request) {
  try {
    const userId = await requireIdentity(request);
    if (!userId) return NextResponse.json({ error: "Sign in to EVERIE." }, { status: 401 });
    const { data, error } = await getSupabaseServerClient()
      .from("everie_user_collection")
      .select("artwork_id")
      .eq("everie_user_id", userId)
      .order("collected_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return NextResponse.json({ artworkIds: (data ?? []).map(({ artwork_id }) => artwork_id) });
  } catch {
    return NextResponse.json({ error: "Unable to load collection." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireIdentity(request);
    if (!userId) return NextResponse.json({ error: "Sign in to EVERIE." }, { status: 401 });
    const body = (await request.json()) as { artworkId?: unknown };
    if (typeof body.artworkId !== "string" || !UUID_RE.test(body.artworkId)) {
      return NextResponse.json({ error: "Invalid artwork." }, { status: 400 });
    }
    const supabase = getSupabaseServerClient();
    const { data: artwork, error: artworkError } = await supabase.from("artworks")
      .select("id").eq("id", body.artworkId).eq("status", "published").maybeSingle();
    if (artworkError) throw artworkError;
    if (!artwork) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
    const { error } = await supabase.from("everie_user_collection")
      .upsert({ everie_user_id: userId, artwork_id: artwork.id }, {
        onConflict: "everie_user_id,artwork_id", ignoreDuplicates: true,
      });
    if (error) throw error;
    return NextResponse.json({ collected: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save collection item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await requireIdentity(request);
    if (!userId) return NextResponse.json({ error: "Sign in to EVERIE." }, { status: 401 });
    const body = (await request.json()) as { artworkId?: unknown };
    if (typeof body.artworkId !== "string" || !UUID_RE.test(body.artworkId)) {
      return NextResponse.json({ error: "Invalid artwork." }, { status: 400 });
    }
    const { error } = await getSupabaseServerClient().from("everie_user_collection")
      .delete().eq("everie_user_id", userId).eq("artwork_id", body.artworkId);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Unable to update collection." }, { status: 500 });
  }
}
