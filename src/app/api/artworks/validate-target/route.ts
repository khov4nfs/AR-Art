import { NextResponse } from "next/server";
import { LocalArtworkRepository } from "@/features/artwork/infrastructure/local/local-artwork-repository";
import { getRequestUser } from "@/features/auth/infrastructure/local/request-user";

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const hash = typeof body.hash === "string" ? body.hash.trim().toLowerCase() : "";
    const excludeId = typeof body.excludeId === "string" ? body.excludeId.trim() : undefined;

    if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
      return NextResponse.json({ error: "A valid SHA-256 hash is required." }, { status: 400 });
    }

    const repository = new LocalArtworkRepository();
    const duplicate = await repository.findDuplicateTargetImage(hash, excludeId);

    if (duplicate) {
      return NextResponse.json({
        unique: false,
        duplicateId: duplicate.id,
        duplicateTitle: duplicate.title,
        error: "This target image is already used by another AR artwork. Each AR product requires a unique scan image.",
      }, { status: 409 });
    }

    return NextResponse.json({ unique: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to validate target image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
