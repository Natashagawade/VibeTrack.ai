import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRequestScope } from "@/lib/signals/auth";
import { createMemory, recallForOrg, searchMemories } from "@/lib/memory/service";

export async function GET(req: NextRequest) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 50) || 50));

  if (q) {
    const results = await searchMemories(scope.orgId, q, { limit });
    return NextResponse.json({ results });
  }

  const memories = await prisma.businessMemory.findMany({
    where: { orgId: scope.orgId },
    orderBy: [{ occurredAt: "desc" }],
    take: limit,
  });
  return NextResponse.json({ memories });
}

export async function POST(req: NextRequest) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  const {
    type,
    title,
    summary,
    occurredAt,
    importance,
    confidence,
    source,
    entityNames,
    entities,
    tags,
    signalId,
    issueId,
    insightId,
    actionId,
    customerId,
    productId,
  } = body;

  if (!title || !summary) {
    return NextResponse.json({ error: "title and summary are required." }, { status: 400 });
  }

  try {
    const result = await createMemory(scope.orgId, scope.userId, {
      type,
      title,
      summary,
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
      importance,
      confidence,
      source,
      entityNames,
      entities,
      tags,
      signalId,
      issueId,
      insightId,
      actionId,
      customerId,
      productId,
    });
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create memory.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const text = searchParams.get("text")?.trim() ?? "";
  const entitiesRaw = searchParams.get("entities") ?? "";
  const entityNames = entitiesRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!text) {
    return NextResponse.json({ error: "Provide ?text= to recall past experience." }, { status: 400 });
  }

  const recall = await recallForOrg(scope.orgId, text, entityNames, { limit: 5 });
  return NextResponse.json(recall);
}
