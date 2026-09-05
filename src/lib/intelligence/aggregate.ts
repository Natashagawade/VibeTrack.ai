import "server-only";
import { prisma } from "@/lib/prisma";

function sentimentLabel(sentiment: unknown): string {
  return (sentiment as { label?: string } | null)?.label ?? "Neutral";
}

function sentimentNormalized(sentiment: unknown): number {
  const n = (sentiment as { normalized?: number } | null)?.normalized;
  return typeof n === "number" ? n : 0;
}

export interface SignalStats {
  totalSignals: number;
  positive: number;
  neutral: number;
  negative: number;
  avgSentiment: number;
  complaints: number;
  refunds: number;
  cancels: number;
  featureRequests: number;
  toxicSignals: number;
  bySeverity: Array<{ severity: string; count: number }>;
  last24h: number;
}

export async function getSignalStats(orgId: string, recentWindowDays = 7): Promise<SignalStats> {
  const [total, positive, neutral, negative, complaints, refunds, cancels, featureRequest, last24h, severityGroups] =
    await Promise.all([
      prisma.customerSignal.count({ where: { orgId } }),
      prisma.customerSignal.count({ where: { orgId, sentiment: { path: ["label"], equals: "Positive" } } }),
      prisma.customerSignal.count({ where: { orgId, sentiment: { path: ["label"], equals: "Neutral" } } }),
      prisma.customerSignal.count({ where: { orgId, sentiment: { path: ["label"], equals: "Negative" } } }),
      prisma.customerSignal.count({ where: { orgId, isComplaint: true } }),
      prisma.customerSignal.count({ where: { orgId, refundRequest: true } }),
      prisma.customerSignal.count({ where: { orgId, cancelIntent: true } }),
      prisma.customerSignal.count({ where: { orgId, featureRequest: true } }),
      prisma.customerSignal.count({
        where: { orgId, receivedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.customerSignal.groupBy({ by: ["severity"], where: { orgId }, _count: true }),
    ]);

  const recentSignals = await prisma.customerSignal.findMany({
    where: {
      orgId,
      receivedAt: { gte: new Date(Date.now() - recentWindowDays * 24 * 60 * 60 * 1000) },
    },
    select: { sentiment: true },
  });
  const avgSentiment = recentSignals.length
    ? recentSignals.reduce((sum, s) => sum + sentimentNormalized(s.sentiment), 0) / recentSignals.length
    : 0;

  const toxic = await prisma.customerSignal.count({
    where: { orgId, toxicity: { path: ["label"], equals: "High" } },
  });

  return {
    totalSignals: total,
    positive,
    neutral,
    negative,
    avgSentiment: Math.round(avgSentiment * 100) / 100,
    complaints,
    refunds,
    cancels,
    featureRequests: featureRequest,
    toxicSignals: toxic,
    bySeverity: severityGroups
      .map((g) => ({ severity: g.severity, count: g._count }))
      .sort((a, b) => "LOW,MEDIUM,HIGH,CRITICAL".indexOf(a.severity) - "LOW,MEDIUM,HIGH,CRITICAL".indexOf(b.severity)),
    last24h,
  };
}

export interface TrendPoint {
  day: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  avgSentiment: number;
}

export async function getSentimentTrend(orgId: string, days = 7): Promise<TrendPoint[]> {
  const start = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);

  const signals = await prisma.customerSignal.findMany({
    where: { orgId, receivedAt: { gte: start } },
    select: { receivedAt: true, sentiment: true },
  });

  const buckets = new Map<string, TrendPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), { day: d.toISOString().slice(0, 10), positive: 0, neutral: 0, negative: 0, total: 0, avgSentiment: 0 });
  }

  const sums = new Map<string, number>();
  for (const s of signals) {
    const day = s.receivedAt.toISOString().slice(0, 10);
    const point = buckets.get(day);
    if (!point) continue;
    const label = sentimentLabel(s.sentiment);
    if (label === "Positive") point.positive += 1;
    else if (label === "Negative") point.negative += 1;
    else point.neutral += 1;
    point.total += 1;
    sums.set(day, (sums.get(day) ?? 0) + sentimentNormalized(s.sentiment));
  }

  for (const point of buckets.values()) {
    const sum = sums.get(point.day) ?? 0;
    point.avgSentiment = point.total ? Math.round((sum / point.total) * 100) / 100 : 0;
  }

  return Array.from(buckets.values());
}

export interface IssueBucket {
  category: string;
  count: number;
  complaints: number;
  refunds: number;
  cancels: number;
  lastSeenAt: string | null;
  topSeverity: string;
}

export async function getTopIssues(orgId: string, limit = 8): Promise<IssueBucket[]> {
  const [base, withFlags, severityGroups] = await Promise.all([
    prisma.customerSignal.groupBy({
      by: ["issueCategory"],
      where: { orgId },
      _count: true,
      _max: { receivedAt: true },
      orderBy: { _count: { issueCategory: "desc" } },
      take: limit,
    }),
    prisma.customerSignal.groupBy({
      by: ["issueCategory", "isComplaint", "refundRequest", "cancelIntent"],
      where: { orgId, OR: [{ isComplaint: true }, { refundRequest: true }, { cancelIntent: true }] },
      _count: true,
    }),
    prisma.customerSignal.groupBy({ by: ["issueCategory", "severity"], where: { orgId }, _count: true }),
  ]);

  const flagCounts = new Map<string, { complaints: number; refunds: number; cancels: number }>();
  for (const g of withFlags) {
    const cat = g.issueCategory ?? "general";
    const cur = flagCounts.get(cat) ?? { complaints: 0, refunds: 0, cancels: 0 };
    if (g.isComplaint) cur.complaints += g._count;
    if (g.refundRequest) cur.refunds += g._count;
    if (g.cancelIntent) cur.cancels += g._count;
    flagCounts.set(cat, cur);
  }

  const severityRank = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const topSeverity = new Map<string, string>();
  for (const g of severityGroups) {
    const cat = g.issueCategory ?? "general";
    const rank = severityRank.indexOf(g.severity);
    const cur = severityRank.indexOf(topSeverity.get(cat) ?? "LOW");
    if (rank > cur) topSeverity.set(cat, g.severity);
  }

  return base
    .map((g) => {
      const cat = g.issueCategory ?? "general";
      return {
        category: cat,
        count: g._count,
        complaints: flagCounts.get(cat)?.complaints ?? 0,
        refunds: flagCounts.get(cat)?.refunds ?? 0,
        cancels: flagCounts.get(cat)?.cancels ?? 0,
        lastSeenAt: g._max.receivedAt ? g._max.receivedAt.toISOString() : null,
        topSeverity: topSeverity.get(cat) ?? "LOW",
      };
    })
    .sort((a, b) => b.count - a.count);
}

export interface TopicBucket {
  topic: string;
  count: number;
  positive: number;
  negative: number;
  lastSeenAt: string | null;
}

export async function getTopTopics(orgId: string, limit = 8): Promise<TopicBucket[]> {
  const base = await prisma.customerSignal.groupBy({
    by: ["topic"],
    where: { orgId },
    _count: true,
    _max: { receivedAt: true },
    orderBy: { _count: { topic: "desc" } },
    take: limit,
  });
  if (base.length === 0) return [];

  const topics = base.map((b) => b.topic ?? "uncategorised");

  const negative = new Map<string, number>();
  const allNegative = await prisma.customerSignal.groupBy({
    by: ["topic"],
    where: { orgId, topic: { in: topics }, sentiment: { path: ["label"], equals: "Negative" } },
    _count: true,
  });
  for (const g of allNegative) negative.set(g.topic ?? "uncategorised", g._count);

  const positive = new Map<string, number>();
  const allPositive = await prisma.customerSignal.groupBy({
    by: ["topic"],
    where: { orgId, topic: { in: topics }, sentiment: { path: ["label"], equals: "Positive" } },
    _count: true,
  });
  for (const g of allPositive) positive.set(g.topic ?? "uncategorised", g._count);

  return base.map((g) => {
    const topic = g.topic ?? "uncategorised";
    return {
      topic,
      count: g._count,
      positive: positive.get(topic) ?? 0,
      negative: negative.get(topic) ?? 0,
      lastSeenAt: g._max.receivedAt ? g._max.receivedAt.toISOString() : null,
    };
  });
}

export interface RecentSignal {
  id: string;
  text: string;
  kind: string;
  issueCategory: string | null;
  intent: string | null;
  severity: string;
  sentimentLabel: string;
  sentimentScore: number;
  receivedAt: string;
}

export async function getRecentSignals(orgId: string, limit = 12): Promise<RecentSignal[]> {
  const rows = await prisma.customerSignal.findMany({
    where: { orgId },
    orderBy: { receivedAt: "desc" },
    take: limit,
    select: {
      id: true,
      text: true,
      kind: true,
      issueCategory: true,
      intent: true,
      severity: true,
      sentiment: true,
      receivedAt: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    text: r.text.length > 180 ? `${r.text.slice(0, 180)}…` : r.text,
    kind: r.kind,
    issueCategory: r.issueCategory,
    intent: r.intent,
    severity: r.severity,
    sentimentLabel: sentimentLabel(r.sentiment),
    sentimentScore: sentimentNormalized(r.sentiment),
    receivedAt: r.receivedAt.toISOString(),
  }));
}

export interface RiskSummary {
  customerId: string;
  name: string | null;
  email: string | null;
  score: number;
  level: string;
  reasons: Array<{ reason: string; weight: number }>;
}

export async function getRiskSummary(orgId: string, limit = 10): Promise<RiskSummary[]> {
  const risks = await prisma.customerRisk.findMany({
    where: { orgId },
    orderBy: { score: "desc" },
    take: limit,
    include: { customer: { select: { name: true, email: true } } },
  });
  return risks.map((r) => ({
    customerId: r.customerId,
    name: r.customer.name,
    email: r.customer.email,
    score: r.score,
    level: r.level,
    reasons: (r.reasons as Array<{ reason: string; weight: number }>) ?? [],
  }));
}