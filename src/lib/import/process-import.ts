import "server-only";
import { createHash } from "node:crypto";
import type { Prisma, SignalChannel, SignalKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeText } from "@/lib/text-analysis";
import { classifySignal } from "@/lib/analysis";
import { signalHash } from "@/lib/signals/pipeline";
import { extractRowValues, hashesForRows } from "@/lib/import/preview";
import { logAudit } from "@/lib/audit";
import { MAX_SIGNAL_TEXT } from "@/lib/import/parse-file";
import { ImportStatus, JobState, JobType, SourceSyncStatus } from "@prisma/client";

const CHANNEL_ALIASES: Array<[SignalChannel, RegExp]> = [
  ["REVIEW", /review|appstore|playstore|g?play|app.?store|trustpilot|yelp|amazon|product_hunt/i],
  ["SOCIAL", /social|twitter|\bx\b|facebook|instagram|tiktok|linkedin|reddit|youtube|threads/i],
  ["SUPPORT", /support|ticket|zendesk|helpdesk|service|helpdesk/i],
  ["SURVEY", /survey|feedback_form|form|nps|questionnaire|feedback_forms/i],
  ["CALL", /call|voice|phone|telephone/i],
  ["CHAT", /chat|messenger|intercom|livechat|whatsapp/i],
  ["EMAIL", /email|e-?mail|mail/i],
  ["WEB", /web|website|site|portal/i],
  ["IN_APP", /in.?app|app_review|mobile_app/i],
  ["NEWS", /news|article|press|blog/i],
];

export function mapChannel(value: string | undefined): SignalChannel {
  if (!value) return "OTHER";
  const normalized = value.trim().toLowerCase();
  for (const [channel, re] of CHANNEL_ALIASES) {
    if (re.test(normalized)) return channel;
  }
  return "OTHER";
}

export function kindForFileType(fileType: string): SignalKind {
  switch (fileType) {
    case "xlsx":
    case "xls":
      return "EXCEL";
    case "csv":
    case "json":
      return "CSV";
    case "txt":
    default:
      return "TEXT";
  }
}

function parseReceivedAt(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!/\d{4}/.test(trimmed)) return undefined;
  const ts = Date.parse(trimmed);
  if (Number.isNaN(ts)) return undefined;
  return new Date(ts);
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export interface ImportProcessResult {
  importId: string;
  jobId: string;
  status: ImportStatus;
  total: number;
  valid: number;
  invalid: number;
  imported: number;
  duplicates: number;
  failed: number;
  failures: Array<{ row: number; reason: string }>;
  sourceId: string | null;
}

const BATCH_SIZE = 400;

/**
 * Runs a confirmed file import end-to-end and funnels every record into the
 * signal pipeline (same analysis + same org-scoped dedupe semantics as
 * `ingestSignal`, bulk-executed with an atomic `createMany ... skipDuplicates`).
 */
export async function processImport(opts: { orgId: string; userId: string; importId: string }): Promise<ImportProcessResult> {
  const imp = await prisma.import.findFirst({
    where: { id: opts.importId, orgId: opts.orgId },
    include: { jobs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!imp) throw new Error("Import not found.");

  const columnMapping = (imp.columnMapping ?? {}) as Record<string, string>;
  const textHeader = columnMapping["text"];
  if (!textHeader) throw new Error("No feedback text column mapped. Confirm the column mapping first.");

  const meta = (imp.meta ?? {}) as { rows?: Record<string, string>[] };
  const rows = meta.rows ?? [];
  if (rows.length === 0) throw new Error("No rows to import for this file.");

  const job = imp.jobs[0] ?? null;
  let jobId = job?.id ?? "";
  const setStatus = async (status: JobState, error?: string) => {
    try {
      if (jobId) {
        await prisma.job.update({
          where: { id: jobId },
          data: { status, error: error ?? null, startedAt: new Date(), completedAt: status === JobState.PROCESSING ? null : new Date() },
        });
      }
    } catch (e) {
      console.error("Job status update failed:", (e as Error).message);
    }
  };
  const setProgress = async (progress: number) => {
    try {
      if (jobId) {
        await prisma.job.update({ where: { id: jobId }, data: { progress, startedAt: new Date() } });
      }
    } catch (e) {
      console.error("Job progress update failed:", e);
    }
  };

  try {
    await prisma.import.update({
      where: { id: imp.id },
      data: { status: ImportStatus.PROCESSING, error: null, processedAt: new Date() },
    });
    if (!jobId) {
      const created = await prisma.job.create({
        data: {
          orgId: opts.orgId,
          type: JobType.FILE_IMPORT,
          status: JobState.PROCESSING,
          importId: imp.id,
          createdById: opts.userId,
          payload: { file: imp.name, fileType: imp.fileType, rows: rows.length },
          progress: 0,
          startedAt: new Date(),
        },
      });
      jobId = created.id;
    } else {
      await setStatus(JobState.PROCESSING);
    }

    // Resolve the org-scoped Source once (kind "upload", name = file name).
    const source = await prisma.source.upsert({
      where: { orgId_kind_name: { orgId: opts.orgId, kind: "upload", name: imp.name } },
      create: { orgId: opts.orgId, kind: "upload", name: imp.name, config: { origin: "file-upload" } },
      update: {},
      select: { id: true },
    });
    await prisma.source.update({
      where: { id: source.id },
      data: { syncStatus: SourceSyncStatus.SYNCING },
    });

    const kind = kindForFileType(imp.fileType);
    const analysisCache = new Map<string, ReturnType<typeof analyzeText>>();
    const customerCache = new Map<string, string | null>();
    const productCache = new Map<string, string | null>();

    const resolveCustomer = async (key: string, fields: { name?: string; email?: string; externalRef?: string }) => {
      const hit = customerCache.get(key);
      if (hit !== undefined) return hit;
      const resolved = await findOrCreateCustomer({ orgId: opts.orgId, ...fields });
      customerCache.set(key, resolved?.id ?? null);
      return resolved?.id ?? null;
    };

    const resolveProduct = async (name: string) => {
      const hit = productCache.get(name);
      if (hit !== undefined) return hit;
      const resolved = await findOrCreateProduct({ orgId: opts.orgId, name });
      productCache.set(name, resolved?.id ?? null);
      return resolved?.id ?? null;
    };

    // Pre-resolve unique customers/products (usually few distinct values in imports).
    const uniqueCustomers = new Map<string, { name?: string; email?: string; externalRef?: string }>();
    const uniqueProducts = new Set<string>();
    for (const row of rows) {
      const ex = extractRowValues(row, columnMapping);
      const custKey = JSON.stringify([ex["customer_id"] ?? null, ex["customer_email"] ?? null, ex["customer_name"] ?? null]);
      if (!uniqueCustomers.has(custKey)) {
        const name = ex["customer_name"] || undefined;
        const email = ex["customer_email"] || undefined;
        const externalRef = ex["customer_id"] || undefined;
        if (name || email || externalRef) uniqueCustomers.set(custKey, { name, email, externalRef });
      }
      if (ex["product"]) uniqueProducts.add(ex["product"]);
    }
    const customers = Object.fromEntries(
      await Promise.all([...uniqueCustomers.entries()].map(async ([key, fields]) => [key, await resolveCustomer(key, fields)] as const))
    );
    for (const name of uniqueProducts) await resolveProduct(name);

    const errors: Array<{ row: number; reason: string }> = [];
    let invalid = 0;
    let valid = 0;
    let attempted = 0;
    let created = 0;
    let i = 0;

    const all = rows.length;
    let batch: Prisma.CustomerSignalCreateManyInput[] = [];

    const flush = async () => {
      if (batch.length === 0) return;
      const thisBatch = batch;
      batch = [];
      try {
        const result = await prisma.customerSignal.createMany({ data: thisBatch, skipDuplicates: true });
        created += result.count;
        attempted += thisBatch.length;
      } catch {
        // One poisoned row kills the batch — retry row-by-row to isolate failures.
        for (const entry of thisBatch) {
          try {
            await prisma.customerSignal.create({ data: entry });
            created += 1;
            attempted += 1;
          } catch (rowError) {
            attempted += 1;
            if ((rowError as { code?: string }).code === "P2002") continue; // duplicate, not a failure
            errors.push({ row: (entry.metadata as { __row?: number }).__row ?? 0, reason: (rowError as Error).message.slice(0, 180) });
          }
        }
      }
    };

    for (const [idx, row] of rows.entries()) {
      const extracted = extractRowValues(row, columnMapping);
      const rawText = extracted["text"] ?? "";
      if (!rawText) {
        invalid += 1;
        continue;
      }
      const text = normalizeText(rawText);
      if (text.length > MAX_SIGNAL_TEXT) {
        invalid += 1;
        errors.push({ row: idx + 2, reason: `Text exceeds ${MAX_SIGNAL_TEXT.toLocaleString()} characters.` });
        continue;
      }

      let analysis = analysisCache.get(text);
      if (!analysis) {
        analysis = analyzeText(text);
        analysisCache.set(text, analysis);
      }
      const classification = classifySignal(text, analysis);

      const custKey = JSON.stringify([extracted["customer_id"] ?? null, extracted["customer_email"] ?? null, extracted["customer_name"] ?? null]);
      const customerId = customers[custKey] ?? null;
      const productName = extracted["product"];
      const productId = productName ? productCache.get(productName) ?? null : null;

      const metaFields: Record<string, unknown> = {
        __row: idx + 2,
        importId: imp.id,
        raw: row,
        rawHash: createHash("sha256").update(JSON.stringify(row)).digest("hex"),
      };
      if (extracted["order_id"]) metaFields.orderId = extracted["order_id"];
      if (extracted["rating"]) {
        const rating = Number(extracted["rating"].replace(",", "."));
        metaFields.rating = Number.isFinite(rating) ? rating : extracted["rating"];
      }
      if (extracted["source_url"]) metaFields.sourceUrl = extracted["source_url"];
      if (extracted["sentiment"]) metaFields.sourceSentiment = extracted["sentiment"];
      if (extracted["intent"]) metaFields.sourceIntent = extracted["intent"];
      if (extracted["customer_phone"]) metaFields.phone = extracted["customer_phone"];

      batch.push({
        orgId: opts.orgId,
        sourceId: source.id,
        customerId: customerId ?? undefined,
        productId: productId ?? undefined,
        kind,
        channel: mapChannel(extracted["channel"]),
        receivedAt: parseReceivedAt(extracted["received_at"]) ?? new Date(),
        text,
        summary: analysis.summary ?? undefined,
        language: analysis.language ?? undefined,
        sentiment: analysis.sentiment as unknown as Prisma.InputJsonValue,
        emotions: analysis.emotions as unknown as Prisma.InputJsonValue,
        keywords: analysis.keywords as unknown as Prisma.InputJsonValue,
        toxicity: analysis.toxicity as unknown as Prisma.InputJsonValue,
        intent: classification.intent,
        issueCategory: classification.issueCategory,
        severity: classification.severity,
        isComplaint: classification.isComplaint,
        refundRequest: classification.refundRequest,
        cancelIntent: classification.cancelIntent,
        featureRequest: classification.featureRequest,
        topic: classification.issueCategory,
        location: extracted["location"] ?? undefined,
        metadata: metaFields as Prisma.InputJsonValue,
        dedupeHash: signalHash(text),
      });

      valid += 1;
      i += 1;
      if (batch.length >= BATCH_SIZE) {
        await flush();
        const processed = i;
        if (processed % (BATCH_SIZE * 2) === 0) await setProgress(Math.round((processed / all) * 100));
      }
    }
    await flush();
    await setProgress(Math.min(100, Math.round((i / all) * 100)));

    const duplicates = valid - (attempted - errors.length);
    const failed = errors.length;
    const status: ImportStatus =
      failed > 0 && created === 0
        ? ImportStatus.FAILED
        : failed > 0
          ? ImportStatus.PARTIALLY_COMPLETED
          : ImportStatus.COMPLETED;

    const failuresSamples = errors.slice(0, 50);

    await prisma.import.update({
      where: { id: imp.id },
      data: {
        status,
        validRecords: valid,
        invalidRecords: invalid,
        duplicateRecords: duplicates,
        importedRecords: created,
        failures: failuresSamples as Prisma.InputJsonValue,
        error: status === ImportStatus.FAILED ? "No rows could be imported." : null,
        processedAt: new Date(),
      },
    });

    await prisma.source.update({
      where: { id: source.id },
      data: {
        syncStatus: status === ImportStatus.FAILED ? SourceSyncStatus.ERROR : SourceSyncStatus.IN_SYNC,
        lastSyncAt: new Date(),
        lastFetchAt: new Date(),
        lastSyncError: status === ImportStatus.FAILED ? "No rows could be imported." : null,
        recordsSynced: { increment: created },
      },
    });

    await setStatus(
      status === ImportStatus.FAILED ? JobState.FAILED : status === ImportStatus.PARTIALLY_COMPLETED ? JobState.PARTIALLY_COMPLETED : JobState.COMPLETED
    );

    await logAudit({
      orgId: opts.orgId,
      userId: opts.userId,
      action: "import.processed",
      entity: "Import",
      entityId: imp.id,
      metadata: { file: imp.name, total: rows.length, created, duplicates, invalid, failed, status },
    });

    return {
      importId: imp.id,
      jobId,
      status,
      total: rows.length,
      valid,
      invalid,
      imported: created,
      duplicates,
      failed,
      failures: failuresSamples,
      sourceId: source.id,
    };
  } catch (e) {
    await prisma.import
      .update({ where: { id: imp.id }, data: { status: ImportStatus.FAILED, error: (e as Error).message.slice(0, 500) } })
      .catch(() => undefined);
    await setStatus(JobState.FAILED, (e as Error).message.slice(0, 500)).catch(() => undefined);
    throw e;
  }
}

async function findOrCreateCustomer(opts: { orgId: string; name?: string; email?: string; externalRef?: string }): Promise<{ id: string } | null> {
  const key = opts.externalRef ?? opts.email ?? opts.name;
  if (!key) return null;

  let existing: { id: string } | null = null;
  if (opts.externalRef) {
    existing = await prisma.customer.findUnique({
      where: { orgId_externalRef: { orgId: opts.orgId, externalRef: opts.externalRef } },
      select: { id: true },
    });
  }
  if (!existing) {
    existing = await prisma.customer.findFirst({
      where: { orgId: opts.orgId, OR: [{ email: opts.email ?? undefined }, { name: opts.name ?? undefined }] },
      select: { id: true },
    });
  }
  if (existing) return existing;
  return prisma.customer.create({
    data: { orgId: opts.orgId, name: opts.name, email: opts.email, externalRef: opts.externalRef },
    select: { id: true },
  });
}

async function findOrCreateProduct(opts: { orgId: string; name: string }): Promise<{ id: string } | null> {
  if (!opts.name) return null;
  const existing = await prisma.product.findUnique({
    where: { orgId_name: { orgId: opts.orgId, name: opts.name } },
    select: { id: true },
  });
  if (existing) return existing;
  return prisma.product.create({ data: { orgId: opts.orgId, name: opts.name }, select: { id: true } });
}

/** Helper: the set of hashes this file would try to insert (for preview dedupe vs DB). */
export function dedupeHashesForImport(rows: Record<string, string>[], columnMapping: Record<string, string>): string[] {
  return hashesForRows({ rows }, columnMapping);
}