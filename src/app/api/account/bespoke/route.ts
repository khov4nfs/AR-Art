import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/store";
import { isAuthError, requireUser } from "@/lib/adminSession";
import { bespokeOf, customerBespokeView } from "@/lib/server/customer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireUser(req);
  if (isAuthError(gate)) return gate;
  const db = await getDatabase();
  return NextResponse.json({ success: true, data: bespokeOf(db, gate.user).map(customerBespokeView) });
}
