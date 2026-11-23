import { access, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Readiness without exposing credentials, file paths or customer data. */
export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const [cms, uploads] = await Promise.all([
      readFile(path.join(dataDir, "cms-store.json"), "utf8"),
      stat(uploadsDir),
    ]);
    const parsed: unknown = JSON.parse(cms);
    if (!parsed || typeof parsed !== "object" ||
      !Array.isArray((parsed as { users?: unknown }).users) ||
      ((parsed as { users: unknown[] }).users).length === 0 ||
      !Array.isArray((parsed as { products?: unknown }).products) ||
      !uploads.isDirectory()) throw new Error("Invalid CMS or uploads");

    try {
      const raw = await readFile(path.join(dataDir, "ar-artworks.json"), "utf8");
      const ar: unknown = JSON.parse(raw);
      if (!ar || typeof ar !== "object" ||
        (ar as { schemaVersion?: unknown }).schemaVersion !== 1 ||
        !Array.isArray((ar as { artworks?: unknown }).artworks) ||
        !(ar as { collections?: unknown }).collections ||
        typeof (ar as { collections?: unknown }).collections !== "object" ||
        Array.isArray((ar as { collections?: unknown }).collections)) {
        throw new Error("Invalid AR registry");
      }
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code !== "ENOENT") throw cause;
    }

    await Promise.all([
      access(dataDir, constants.R_OK | constants.W_OK),
      access(uploadsDir, constants.R_OK | constants.W_OK),
    ]);
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
