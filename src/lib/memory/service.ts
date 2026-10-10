import "server-only";
import type { Prisma, MemoryType, MemoryEventKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import {
  buildSearchText,
  extractKeywords,
  memoryHash,
  normalize,
  scoreMemory,
} from "@/lib/memory/recall";

export type { MemoryType, MemoryEventKind };

export interface MemoryEntity {
  type: string;
  name: string;
  refId?: string;
  role?: string;
}

export interface CreateMemoryInput {
  type?: MemoryType;
  title: string;
  summary: string;
  occurredAt?: Date;
  importance?: number;
  confidence?: number;
  source?: string;
  entityNames?: string[];
  entities?: MemoryEntity[];
  tags?: string[];
  signalId?: string;
  issueId?: string;
  insightId?: string;
  actionId?: string;
  customerId?: string;
  productId?: string;
}

export interface MemoryEventInput {
  kind: MemoryEventKind;
  summary: string;
  occurredAt?: Date;
  entities?: MemoryEntity[];
  evidence?: Array<{ type: string; refId: string; text: string }>;
  signalId?: string;
  actionId?: string;
  insightId?: string;
}

const DEFAULT_IMPORTANCE = 0.5;
const DEFAULT_CONFIDENCE = 0.6;

function clamp(value: number | undefined, fallback: number, min = 0, max = 1): number {
  const v = value ?? fallback;
  return Math.min(max, Math.max(min, v));
}

export const VALID_MEMORY_TYPES: MemoryType[] = [
  "PROBLEM_PATTERN",
  "DECISION",
  "ACTION_OUTCOME",
  "INCIDENT",
  "EXPERIMENT",
  "BUSINESS_FACT",
  "MILESTONE",
  "LESSON",
];

export const VALID_EVENT_KINDS: MemoryEventKind[] = [
  "CREATED",
  "SIGNAL",
  "DECISION_MADE",
  "ACTION_TAKEN",
  "OUTCOME_MEASURED",
  "INCIDENT_STARTED",
  "INCIDENT_RESOLVED",
  "EXPERIMENT_STARTED",
  "EXPERIMENT_CONCLUDED",
  "MILESTONE",
  "NOTE",
];

export function isMemoryType(v: unknown): v is MemoryType {
  return typeof v === "string" && (VALID_MEMORY_TYPES as string[]).includes(v);
}

export function isEventKind(v: unknown): v is MemoryEventKind {
  return typeof v === "string" && (VALID_EVENT_KINDS as string[]).includes(v);
}

function selectable() {
  return {
    id: true,
    type: true,
    status: true,
    title: true,
    summary: true,
    importance: true,
    confidence: true,
    occurredAt: true,
    source: true,
    entities: true,
    tags: true,
    keywords: true,
    searchText: true,
    dedupeKey: true,
    createdAt: true,
    updatedAt: true,
    signalId: true,
    issueId: true,
    insightId: true,
    actionId: true,
    customerId: true,
    productId: true,
  } as const;
}

type MemoryRow = Prisma.BusinessMemoryGetPayload<{ select: ReturnType<typeof selectable> }>;

async function getMemoriesForOrg(orgId: string) {
  return prisma.businessMemory.findMany({
    where: { orgId },
    orderBy: [{ importance: "desc" }, { occurredAt: "desc" }],
    select: selectable(),
  });
}

export interface CreateMemoryResult {
  memory: MemoryRow;
  created: boolean;
  event: { id: string; kind: string };
}

export async function createMemory(
  orgId: string,
  userId: string | undefined,
  input: CreateMemoryInput
): Promise<CreateMemoryResult> {
  const type: MemoryType = isMemoryType(input.type) ? input.type : "PROBLEM_PATTERN";
  const title = (input.title || "").trim().slice(0, 240);
  if (!title) throw new Error("Memory title is required.");
  const summary = (input.summary || "").trim();
  if (!summary) throw new Error("Memory summary is required.");

  const entityNames = input.entityNames ?? input.entities?.map((e) => e.name) ?? [];
  const keywords = extractKeywords(`${title} ${summary}`, entityNames);
  const dedupeKey = memoryHash(type, title, summary);
  const searchText = buildSearchText(title, summary, entityNames);

  const importance = clamp(input.importance, DEFAULT_IMPORTANCE);
  const confidence = clamp(input.confidence, DEFAULT_CONFIDENCE);
  const occurredAt = input.occurredAt ?? new Date();
  const source = input.source ?? "manual";
  const tags = input.tags ?? [];
  const entities = (input.entities ?? []).slice(0, 50);

  const found = await prisma.businessMemory.findUnique({
    where: { orgId_dedupeKey: { orgId, dedupeKey } },
    select: { id: true },
  });
  if (found) {
    const updated = await prisma.businessMemory.update({
      where: { id: found.id },
      data: {
        summary,
        importance,
        confidence,
        occurredAt,
        source,
        entities: entities as unknown as Prisma.InputJsonValue,
        tags,
        keywords,
        searchText,
      },
      select: selectable(),
    });
    return { memory: updated, created: false, event: { id: "", kind: "" } };
  }

  const memory = await prisma.businessMemory.create({
    data: {
      orgId,
      type,
      title,
      summary,
      importance,
      confidence,
      occurredAt,
      source,
      entities: entities as unknown as Prisma.InputJsonValue,
      tags,
      keywords,
      searchText,
      dedupeKey,
      createdById: userId ?? null,
      signalId: input.signalId ?? null,
      issueId: input.issueId ?? null,
      insightId: input.insightId ?? null,
      actionId: input.actionId ?? null,
      customerId: input.customerId ?? null,
      productId: input.productId ?? null,
    },
    select: selectable(),
  });

  const event = await prisma.memoryEvent.create({
    data: {
      orgId,
      memoryId: memory.id,
      kind: "CREATED",
      summary: `Memory recorded: ${title}`,
      occurredAt,
      createdById: userId ?? null,
      signalId: input.signalId ?? null,
      actionId: input.actionId ?? null,
      insightId: input.insightId ?? null,
    },
    select: { id: true, kind: true },
  });

  await logAudit({
    orgId,
    userId,
    action: "memory.created",
    entity: "BusinessMemory",
    entityId: memory.id,
    metadata: { type, title, dedupeKey },
  });

  return { memory, created: true, event: { id: event.id, kind: event.kind } };
}

export async function appendMemoryEvent(
  orgId: string,
  memoryId: string,
  userId: string | undefined,
  input: MemoryEventInput
) {
  const memory = await prisma.businessMemory.findFirst({ where: { id: memoryId, orgId } });
  if (!memory) throw Object.assign(new Error("Memory not found."), { code: "NOT_FOUND" });

  const kind: MemoryEventKind = isEventKind(input.kind) ? input.kind : "NOTE";
  const event = await prisma.memoryEvent.create({
    data: {
      orgId,
      memoryId,
      kind,
      summary: input.summary.trim().slice(0, 2000),
      occurredAt: input.occurredAt ?? new Date(),
      entities: input.entities as unknown as Prisma.InputJsonValue | undefined,
      evidence: input.evidence as unknown as Prisma.InputJsonValue | undefined,
      createdById: userId ?? null,
      signalId: input.signalId ?? null,
      actionId: input.actionId ?? null,
      insightId: input.insightId ?? null,
    },
    select: { id: true, kind: true, summary: true, occurredAt: true },
  });

  await logAudit({
    orgId,
    userId,
    action: "memory.event_added",
    entity: "MemoryEvent",
    entityId: event.id,
    metadata: { memoryId, kind },
  });
  return event;
}

export interface MemorySearchHit {
  memory: MemoryRow;
  score: number;
}

export async function searchMemories(
  orgId: string,
  query: string,
  opts: { limit?: number; minMatches?: number } = {}
): Promise<MemorySearchHit[]> {
  const memories = await getMemoriesForOrg(orgId);
  const queryTokens = normalize(query).split(" ").filter(Boolean);
  const scored = memories
    .map((m) => ({ memory: m, score: scoreMemory(m, queryTokens, 0, { minMatches: opts.minMatches }) }))
    .filter((h) => h.score > 0);
  scored.sort((a, b) => b.score - a.score || b.memory.occurredAt.getTime() - a.memory.occurredAt.getTime());
  return scored.slice(0, opts.limit ?? 5);
}

export type RecallLabel = "Actual" | "Estimated" | "Predicted" | "Demo";

export interface RecallResult {
  label: RecallLabel;
  queryTokens: string[];
  minScore: number;
  enoughData: boolean;
  evaluated: number;
  matched: number;
  founder: { found: boolean; entities: string[] } | null;
  results: MemorySearchHit[];
}

export async function recallForOrg(
  orgId: string,
  query: string,
  entityNames: string[] = [],
  opts: { limit?: number; minMatches?: number } = {}
): Promise<RecallResult> {
  const memories = await getMemoriesForOrg(orgId);
  const queryTokens = normalize(query).split(" ").filter(Boolean);
  const scored = memories
    .map((m) => ({
      memory: m,
      score: scoreMemory(m, queryTokens, 0, { minMatches: opts.minMatches }),
    }))
    .filter((h) => h.score > 0);

  scored.sort((a, b) => b.score - a.score || b.memory.occurredAt.getTime() - a.memory.occurredAt.getTime());
  const results = scored.slice(0, opts.limit ?? 5);

  const foundEntities = entityNames.filter((n) =>
    results.some((h) => normalize(`${h.memory.title} ${h.memory.summary} ${(h.memory.entities as Array<{ name?: string }> | null)?.map((e) => e.name).join(" ")}`).includes(normalize(n)))
  );

  const enoughData = memories.length > 0;
  const minScore = results.length > 0 ? results[results.length - 1].score : 0;

  let label: RecallLabel;
  if (results.length === 0) {
    label = "Actual"; // "nothing found" — always true given stored data, never fabricated
  } else {
    label = foundEntities.length > 0 ? "Actual" : "Estimated";
  }

  return {
    label,
    queryTokens,
    minScore,
    enoughData,
    evaluated: memories.length,
    matched: scored.length,
    founder: results.length > 0 ? { found: foundEntities.length > 0, entities: foundEntities } : null,
    results,
  };
}

export interface IssueRecollection {
  label: RecallLabel;
  recap: string | null;
  memory: MemoryRow | null;
  maxScore: number;
}

/** "Have we experienced this before?" — returns the single closest prior memory. */
export async function distillIssueRecollection(
  orgId: string,
  issueText: string,
  entityNames: string[] = []
): Promise<IssueRecollection> {
  const recall = await recallForOrg(orgId, issueText, entityNames, { limit: 1 });
  const top = recall.results[0] ?? null;
  if (!top) {
    return { label: "Actual", recap: null, memory: null, maxScore: 0 };
  }
  return {
    label: recall.label,
    recap: `Prior memory: “${top.memory.title}” (${top.memory.type}, confidence ${Math.round(
      (top.memory.confidence ?? 0) * 100
    )}%).`,
    memory: top.memory,
    maxScore: top.score,
  };
}
