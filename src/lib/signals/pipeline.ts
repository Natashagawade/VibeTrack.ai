import { createHash } from "node:crypto";
import type { Prisma, SignalChannel, SignalKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeText } from "@/lib/text-analysis";
import { classifySignal } from "@/lib/analysis";
import type { SignalClassification, Severity } from "@/lib/analysis";
import { aiAnalyzeText, hasOpenAIKey } from "@/lib/ai/openai";

export interface IngestSignalInput {
  orgId: string;
  userId: string;
  text: string;
  kind: SignalKind;
  channel?: SignalChannel;
  sourceName?: string;
  sourceKind?: string;
  customerName?: string;
  customerEmail?: string;
  customerExternalRef?: string;
  productName?: string;
  location?: string;
  mediaRefs?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  receivedAt?: Date;
}

export interface IngestedSignal {
  id: string;
  signal: { id: string; orgId: string };
  classification: SignalClassification;
  severity: Severity;
  dedupeHash: string;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function signalHash(text: string): string {
  return createHash("sha256").update(normalizeText(text).toLowerCase()).digest("hex");
}

async function findOrCreateSource(opts: { orgId: string; kind: string; name: string }): Promise<{ id: string }> {
  return prisma.source.findUnique({
    where: { orgId_kind_name: { orgId: opts.orgId, kind: opts.kind, name: opts.name } },
    select: { id: true },
  }).then(async (existing) => {
    if (existing) return existing;
    return prisma.source.create({ data: { orgId: opts.orgId, kind: opts.kind, name: opts.name }, select: { id: true } });
  });
}

async function findOrCreateCustomer(opts: {
  orgId: string;
  name?: string;
  email?: string;
  externalRef?: string;
}): Promise<{ id: string } | null> {
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
  return prisma.product.findUnique({ where: { orgId_name: { orgId: opts.orgId, name: opts.name } }, select: { id: true } }).then(
    async (existing) => {
      if (existing) return existing;
      return prisma.product.create({ data: { orgId: opts.orgId, name: opts.name }, select: { id: true } });
    }
  );
}

/**
 * Full signal ingestion: normalise → de-duplicate → enrich → classify →
 * resolve dimensions → persist as a CustomerSignal.
 *
 * Deduplication is atomic: upsert on the org-scoped unique `dedupeHash` column
 * prevents race-condition duplicates between concurrent requests with the same
 * normalised text.
 *
 * Deterministic local engine powers enrichment; the AI provider is used only
 * when a key is configured and healthy, falling back to the engine.
 */
export async function ingestSignal(input: IngestSignalInput): Promise<IngestedSignal> {
  const text = normalizeText(input.text);
  if (!text) throw new Error("Signal text is empty after normalisation.");

  const hash = signalHash(text);

  // Fast path: dedupe via column (new records) or metadata JSON path (legacy).
  const existing = await prisma.customerSignal.findFirst({
    where: {
      orgId: input.orgId,
      OR: [
        { dedupeHash: hash },
        { metadata: { path: ["dedupeHash"], equals: hash } },
      ],
    },
    select: { id: true },
  });
  if (existing) {
    const classification = classifySignal(text, analyzeText(text));
    return { id: existing.id, signal: { id: existing.id, orgId: input.orgId }, classification, severity: classification.severity, dedupeHash: hash };
  }

  let result;
  if (hasOpenAIKey()) {
    try {
      result = await aiAnalyzeText(text);
    } catch (e) {
      console.error("OpenAI text analysis failed, using local engine:", e);
      result = analyzeText(text);
    }
  } else {
    result = analyzeText(text);
  }

  const classification = classifySignal(text, result);

  const source =
    input.sourceName && input.sourceKind
      ? await findOrCreateSource({ orgId: input.orgId, kind: input.sourceKind, name: input.sourceName })
      : undefined;
  const customer = await findOrCreateCustomer({
    orgId: input.orgId,
    name: input.customerName,
    email: input.customerEmail,
    externalRef: input.customerExternalRef,
  });
  const product = input.productName
    ? await findOrCreateProduct({ orgId: input.orgId, name: input.productName })
    : undefined;

  // Atomic dedupe: upsert on the unique (orgId, dedupeHash) index.
  // Two concurrent requests with the same text: one creates, the other
  // hits the unique constraint and returns the existing row.
  const signal = await prisma.customerSignal.upsert({
    where: {
      orgId_dedupeHash: { orgId: input.orgId, dedupeHash: hash },
    },
    create: {
      orgId: input.orgId,
      sourceId: source?.id,
      customerId: customer?.id,
      productId: product?.id,
      kind: input.kind,
      channel: input.channel ?? "OTHER",
      receivedAt: input.receivedAt ?? new Date(),
      text,
      summary: result.summary || null,
      language: result.language || null,
      sentiment: result.sentiment as unknown as Prisma.InputJsonValue,
      emotions: result.emotions as unknown as Prisma.InputJsonValue,
      keywords: result.keywords as unknown as Prisma.InputJsonValue,
      toxicity: result.toxicity as unknown as Prisma.InputJsonValue,
      intent: classification.intent,
      issueCategory: classification.issueCategory,
      severity: classification.severity,
      isComplaint: classification.isComplaint,
      refundRequest: classification.refundRequest,
      cancelIntent: classification.cancelIntent,
      featureRequest: classification.featureRequest,
      topic: classification.issueCategory,
      location: input.location ?? undefined,
      mediaRefs: input.mediaRefs ?? undefined,
      metadata: {
        ...(input.metadata && typeof input.metadata === "object" ? (input.metadata as Record<string, unknown>) : {}),
        dedupeHash: hash,
      } as Prisma.InputJsonValue,
      dedupeHash: hash,
    },
    update: {},
  });

  return { id: signal.id, signal: { id: signal.id, orgId: signal.orgId }, classification, severity: classification.severity, dedupeHash: hash };
}