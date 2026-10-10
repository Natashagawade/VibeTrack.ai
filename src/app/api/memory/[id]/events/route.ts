import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRequestScope } from "@/lib/signals/auth";
import { appendMemoryEvent } from "@/lib/memory/service";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await ctx.params;
  const memory = await prisma.businessMemory.findFirst({ where: { id, orgId: scope.orgId }, select: { id: true } });
  if (!memory) return NextResponse.json({ error: "Memory not found." }, { status: 404 });

  const events = await prisma.memoryEvent.findMany({
    where: { orgId: scope.orgId, memoryId: id },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || !body.summary) {
    return NextResponse.json({ error: "summary is required." }, { status: 400 });
  }

  try {
    const event = await appendMemoryEvent(scope.orgId, id, scope.userId, {
      kind: body.kind,
      summary: body.summary,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
      entities: body.entities,
      evidence: body.evidence,
      signalId: body.signalId,
      actionId: body.actionId,
      insightId: body.insightId,
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "NOT_FOUND") return NextResponse.json({ error: "Memory not found." }, { status: 404 });
    const message = e instanceof Error ? e.message : "Failed to add event.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
