import { NextRequest, NextResponse } from "next/server";
import { resolveRequestScope } from "@/lib/signals/auth";
import { distillIssueRecollection } from "@/lib/memory/service";

export async function POST(req: NextRequest) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });

  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "text is required." }, { status: 400 });

  const entityNames = Array.isArray(body.entityNames) ? body.entityNames.filter((s: unknown) => typeof s === "string") : [];
  const recollection = await distillIssueRecollection(scope.orgId, text, entityNames);

  return NextResponse.json(recollection);
}
