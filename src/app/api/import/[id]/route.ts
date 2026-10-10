import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { ImportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveRequestScope } from "@/lib/signals/auth";
import { logAudit } from "@/lib/audit";
import { TARGET_BY_VALUE } from "@/lib/import/column-mapping";
import { buildPreview, countExistingRows, hashesForRows } from "@/lib/import/preview";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await ctx.params;
  const imp = await prisma.import.findFirst({ where: { id, orgId: scope.orgId } });
  if (!imp) return NextResponse.json({ error: "Import not found." }, { status: 404 });

  const mutable = ["UPLOADED", "PREVIEWED", "FAILED"] as ImportStatus[];
  if (!mutable.includes(imp.status)) {
    return NextResponse.json({ error: `This import is ${imp.status.toLowerCase()} — its mapping can no longer be changed.` }, { status: 409 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.columnMapping !== "object" || body.columnMapping === null) {
    return NextResponse.json({ error: "Expected a columnMapping object." }, { status: 400 });
  }
  const columnMapping = body.columnMapping as Record<string, string>;

  const meta = (imp.meta ?? {}) as { headers?: string[] };
  const headers = meta.headers ?? [];
  const textHeader = columnMapping["text"];
  if (!textHeader) return NextResponse.json({ error: "Map at least one column to Feedback text." }, { status: 400 });

  for (const [target, header] of Object.entries(columnMapping)) {
    if (target === "ignore") continue;
    if (!TARGET_BY_VALUE[target]) {
      return NextResponse.json({ error: `Unknown target field "${target}".` }, { status: 400 });
    }
    if (!headers.includes(header)) {
      return NextResponse.json({ error: `"${header}" isn't a column in this file.` }, { status: 400 });
    }
  }

  const updated = await prisma.import.update({
    where: { id: imp.id },
    data: { columnMapping: columnMapping as unknown as Prisma.InputJsonValue },
    select: { id: true, status: true, columnMapping: true },
  });

  // Recompute preview + stats against the confirmed mapping (server-side; keeps
  // all parsing/dedupe logic out of the client bundle).
  const fullMeta = imp.meta as unknown as { rows?: Record<string, string>[] } | null;
  const rows = fullMeta?.rows ?? [];
  const preview = buildPreview({ rows }, columnMapping);
  const hashes = hashesForRows({ rows }, columnMapping);
  const existing = await countExistingRows({
    orgId: scope.orgId,
    hashes,
    findByDb: async (hs) => {
      const db = await prisma.customerSignal.findMany({
        where: { orgId: scope.orgId, dedupeHash: { in: hs } },
        select: { dedupeHash: true },
      });
      return db.map((r) => r.dedupeHash as string);
    },
  });

  await logAudit({
    orgId: scope.orgId,
    userId: scope.userId,
    action: "import.mapping_confirmed",
    entity: "Import",
    entityId: imp.id,
    metadata: { file: imp.name, mapping: columnMapping },
  });

  return NextResponse.json({
    import: updated,
    previewRows: preview.rows,
    stats: { ...preview.stats, existingInOrg: existing.existing },
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await ctx.params;
  const imp = await prisma.import.findFirst({ where: { id, orgId: scope.orgId } });
  if (!imp) return NextResponse.json({ error: "Import not found." }, { status: 404 });

  const done = ["COMPLETED", "PARTIALLY_COMPLETED", "CANCELLED"] as ImportStatus[];
  if (done.includes(imp.status)) {
    return NextResponse.json({ error: `This import already ${imp.status.toLowerCase().replaceAll("_", " ")}.` }, { status: 409 });
  }
  if (imp.status === "PROCESSING") {
    return NextResponse.json({ error: "This import is currently processing — wait for it to finish first." }, { status: 409 });
  }

  await prisma.import.update({ where: { id: imp.id }, data: { status: ImportStatus.CANCELLED } });

  await logAudit({
    orgId: scope.orgId,
    userId: scope.userId,
    action: "import.cancelled",
    entity: "Import",
    entityId: imp.id,
    metadata: { file: imp.name },
  });

  return NextResponse.json({ ok: true, status: ImportStatus.CANCELLED });
}