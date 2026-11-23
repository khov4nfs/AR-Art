import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/adminSession";

import { createArtworkServices } from "@/features/artwork/infrastructure/local/artwork-services";
import { getRequestUser } from "@/features/auth/infrastructure/local/request-user";

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { listStudioArtworks } = createArtworkServices();
    const products = await listStudioArtworks.execute(user.id, isAdminRole(user.role));
    return NextResponse.json({ products });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to load studio products.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
