import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/store";
import { sha256 } from "@/lib/server/security";
import { claimByVerifiedEmail } from "@/lib/server/customer";
import { siteUrl } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") || "";
  const token = req.nextUrl.searchParams.get("token") || "";
  const db = await getDatabase();
  const user = db.users.find((u) => u.id === uid);
  const ok =
    user?.verifyTokenHash &&
    crypto.timingSafeEqual(Buffer.from(user.verifyTokenHash), Buffer.from(sha256(token)));
  if (!user || !ok) return NextResponse.redirect(`${siteUrl(req)}/account?verified=0`);
  user.emailVerified = true;
  user.verifyTokenHash = undefined;
  claimByVerifiedEmail(db, user);
  await saveDatabase(db);
  return NextResponse.redirect(`${siteUrl(req)}/account?verified=1`);
}
