import { NextResponse } from "next/server";
import { InsightStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

const VALID_STATUSES = new Set<string>(["NEW", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"]);

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: { status?: string };
  try {
    body = await _req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const status = body.status;
  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const existing = await prisma.insight.findFirst({
    where: { id, orgId: ctx.orgId },
    select: { id: true, status: true },
  });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const updated = await prisma.insight.update({
    where: { id },
    data: {
      status: status as InsightStatus,
      resolvedAt: status === "RESOLVED" ? new Date() : status === "NEW" ? null : undefined,
    },
  });

  await logAudit({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "insight.update_status",
    entity: "insight",
    entityId: id,
    metadata: { from: existing.status, to: updated.status },
  });

  return NextResponse.json({ ok: true, status: updated.status });
}