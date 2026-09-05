import { NextRequest, NextResponse } from "next/server";
import { withSignalsContext } from "@/lib/signals/auth";
import { getRecentSignals } from "@/lib/intelligence/aggregate";

export async function GET(req: NextRequest) {
  const ctx = await withSignalsContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "Authenticate with a session or an API key (Authorization: Bearer)." }, { status: 401 });
  }

  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(100, Math.max(1, Number(limitRaw) || 12));

  const signals = await getRecentSignals(ctx.orgId, limit);

  return NextResponse.json({ orgId: ctx.orgId, signals });
}