import { createHash } from "node:crypto";

/**
 * Pure, deterministic recall helpers for Business Memory (VibeTrack 3.0, Sprint 1).
 *
 * Everything in this module is free of Prisma / network dependencies so it can be
 * unit-tested in isolation. It implements:
 *   - normalisation / tokenisation / keyword extraction for free-text recall
 *   - building a memory's lexical fields (keywords, searchText, dedupeKey)
 *   - an explainable lexical + importance + recency score used to rank memories
 *
 * Scores are relative ranking signals only — they are never presented as real
 * probabilities (see §40 "No fake AI"). Confidence labels are derived in the
 * service layer from evidence counts + confidence thresholds.
 */

const STOPWORDS = new Set(
  "a an the and or but is are was were be been being to of in on for with as at by from that this it its i you he she we they my your our their not no so if then than just about again also do does did done have has had over under how what which when where why who whom while".split(
    " "
  )
);

/** Lowercase, strip punctuation, collapse whitespace, drop empties. */
export function normalize(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((x) => x.length > 0)
    .join(" ");
}

/** Unique, ordered, content-bearing tokens from text plus optional origin words. */
export function extractKeywords(text: string, origins?: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (t: string) => {
    const k = t.toLowerCase();
    if (k.length < 3 || STOPWORDS.has(k) || seen.has(k)) return;
    seen.add(k);
    out.push(k);
  };
  for (const token of normalize(text).split(" ")) add(token);
  for (const origin of origins ?? []) for (const token of normalize(origin).split(" ")) add(token);
  return out;
}

/** Deterministic org+type+content key -> stable dedupeKey (idempotent distillation). */
export function memoryHash(type: string, title: string, summary = ""): string {
  const base = normalize(title || summary);
  return createHash("sha256").update(`${type}|${base}`).digest("hex").slice(0, 24);
}

/** Normalised search surface: title + summary + entity names. */
export function buildSearchText(title: string, summary: string, entityNames: string[] = []): string {
  return normalize([title, summary, ...entityNames].join(" "));
}

export interface ScoredMemory {
  id: string;
  title: string;
  summary: string;
  type: string;
  keywords: string[];
  entityNames?: string[];
  tags?: string[];
  importance: number;
  confidence: number;
  occurredAt: string;
  score: number;
}

/** Relative score: unique content-token overlap, importance bonus, recency tail. */
export function scoreMemory(
  mem: {
    keywords?: string[];
    tags?: string[];
    entityNames?: string[];
    importance?: number;
    confidence?: number;
    occurredAt?: string | Date;
  },
  queryTokens: string[],
  prevScore = 0,
  opts: { minMatches?: number } = {}
): number {
  const minMatches = opts.minMatches ?? 2;
  const memTokens = new Set<string>();
  for (const k of mem.keywords ?? []) memTokens.add(k.toLowerCase());
  for (const tag of mem.tags ?? []) memTokens.add(tag.toLowerCase());
  for (const e of mem.entityNames ?? []) for (const t of normalize(e).split(" ")) memTokens.add(t);

  let intersect = 0;
  const seen = new Set<string>();
  for (const token of queryTokens) {
    const t = token.toLowerCase();
    if (seen.has(t)) continue;
    seen.add(t);
    if (memTokens.has(t)) intersect += 1;
  }

  if (intersect === 0) return 0;
  if (intersect < minMatches) return 0;

  let score = intersect + (mem.importance ?? 0.5) * 0.5;
  const now = Date.now();
  const ts = mem.occurredAt instanceof Date ? mem.occurredAt.getTime() : Date.parse(mem.occurredAt || "");
  if (!Number.isNaN(ts) && ts > 0) {
    const days = Math.max(0, (now - ts) / (24 * 60 * 60 * 1000));
    score += Math.max(0, 1 - days / 180); // recency tail over ~6 months
  }
  score += prevScore;
  if ((mem.confidence ?? 0.5) <= 0.3) score *= 0.6;
  return Math.round(score * 100) / 100;
}
