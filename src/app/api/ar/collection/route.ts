import { NextResponse } from "next/server";
import { getRequestUser } from "@/features/auth/infrastructure/local/request-user";
import { readArData, updateArData } from "@/features/artwork/infrastructure/local/ar-data";

export const runtime = "nodejs";
const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Sign in to EVERIE." }, { status: 401 });
    const data = await readArData();
    return NextResponse.json({ artworkIds: (data.collections[user.id] ?? []).slice(0, 500) });
  } catch {
    return NextResponse.json({ error: "Unable to load collection." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Sign in to EVERIE." }, { status: 401 });
    const body = (await request.json()) as { artworkId?: unknown };
    if (typeof body.artworkId !== "string" || !UUID_RE.test(body.artworkId))
      return NextResponse.json({ error: "Invalid artwork." }, { status: 400 });
    const found = await updateArData(data => {
      if (!data.artworks.some(x => x.id === body.artworkId && x.status === "published")) return false;
      const collection = (data.collections[user.id] ??= []);
      if (!collection.includes(body.artworkId as string)) collection.unshift(body.artworkId as string);
      return true;
    });
    return found ? NextResponse.json({ collected: true }, { status: 201 })
      : NextResponse.json({ error: "Artwork not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Unable to save collection item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Sign in to EVERIE." }, { status: 401 });
    const body = (await request.json()) as { artworkId?: unknown };
    if (typeof body.artworkId !== "string" || !UUID_RE.test(body.artworkId))
      return NextResponse.json({ error: "Invalid artwork." }, { status: 400 });
    await updateArData(data => {
      data.collections[user.id] = (data.collections[user.id] ?? []).filter(x => x !== body.artworkId);
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Unable to update collection." }, { status: 500 });
  }
}
