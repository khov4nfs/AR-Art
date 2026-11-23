import { NextResponse } from "next/server";

import { createArtworkServices } from "@/features/artwork/infrastructure/local/artwork-services";
import { getRequestUser } from "@/features/auth/infrastructure/local/request-user";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await context.params;
    const { publishArtwork } = createArtworkServices();
    const artwork = await publishArtwork.execute(id, user.id);

    return NextResponse.json({
      artwork,
      sharePath: `/art/${artwork.slug}`,
      arPath: `/ar/${artwork.slug}`,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to publish artwork.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
