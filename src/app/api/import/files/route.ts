import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { ImportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveRequestScope } from "@/lib/signals/auth";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { parseFileBuffer, ImportParseError, MAX_IMPORT_ROWS } from "@/lib/import/parse-file";
import { detectMapping, simplifyMapping } from "@/lib/import/column-mapping";
import { buildPreview, countExistingRows, hashesForRows } from "@/lib/import/preview";

export async function POST(req: NextRequest) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const limited = await rateLimit(`import-upload:${scope.orgId}`, { limit: 30, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!formData || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file. Send multipart form-data with a 'file' field." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = parseFileBuffer({ fileName: file.name, mimeType: file.type || null, sizeBytes: file.size, buffer });
  } catch (e) {
    if (e instanceof ImportParseError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  if (parsed.rows.length === 0) {
    return NextResponse.json({ error: "No rows found in that file (empty sheet or no data rows)." }, { status: 400 });
  }

  const detected = detectMapping(parsed.headers, parsed.rows);
  const mapping = simplifyMapping(detected);
  const preview = buildPreview(parsed, mapping);

  const hashes = hashesForRows(parsed, mapping);
  const existing = await countExistingRows({
    orgId: scope.orgId,
    hashes,
    findByDb: async (hs) => {
      const rows = await prisma.customerSignal.findMany({
        where: { orgId: scope.orgId, dedupeHash: { in: hs } },
        select: { dedupeHash: true },
      });
      return rows.map((r) => r.dedupeHash as string);
    },
  });

  const importRow = await prisma.import.create({
    data: {
      orgId: scope.orgId,
      createdById: scope.userId,
      name: file.name,
      fileType: parsed.realFileType,
      mimeType: file.type || null,
      sizeBytes: file.size,
      status: ImportStatus.PREVIEWED,
      columnMapping: mapping as unknown as Prisma.InputJsonValue,
      preview: preview.rows as unknown as Prisma.InputJsonValue,
      meta: {
        headers: parsed.headers,
        rows: parsed.rows,
        rowCount: parsed.rowCount,
        realFileType: parsed.realFileType,
        warnings: parsed.warnings,
        truncated: parsed.truncated,
      },
      totalRecords: parsed.rows.length,
      validRecords: preview.stats.valid,
      duplicateRecords: preview.stats.duplicate,
      invalidRecords: preview.stats.invalid,
    },
    select: {
      id: true,
      name: true,
      fileType: true,
      status: true,
      totalRecords: true,
      validRecords: true,
      duplicateRecords: true,
      invalidRecords: true,
      createdAt: true,
    },
  });

  await logAudit({
    orgId: scope.orgId,
    userId: scope.userId,
    action: "import.uploaded",
    entity: "Import",
    entityId: importRow.id,
    metadata: { file: file.name, fileType: parsed.realFileType, rows: parsed.rows.length },
  });

  return NextResponse.json({
    import: importRow,
    headers: parsed.headers,
    mapping,
    detected,
    previewRows: preview.rows,
    stats: { ...preview.stats, existingInOrg: existing.existing },
    warnings: parsed.warnings,
    truncated: parsed.truncated,
    maxRows: MAX_IMPORT_ROWS,
  });
}