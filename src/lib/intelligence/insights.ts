import "server-only";
import type { InsightType, Severity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/org";

const DAY_MS = 24 * 60 * 60 * 1000;

function weekKey(d: Date): string {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const diff = (copy.getDay() === 0 ? -6 : 1) - copy.getDay();
  copy.setDate(copy.getDate() + diff);
  return copy.toISOString().slice(0, 10);
}

function severityToPriority(severity: Severity): "P0" | "P1" | "P2" | "P3" {
  if (severity === "CRITICAL") return "P0";
  if (severity === "HIGH") return "P1";
  if (severity === "MEDIUM") return "P2";
  return "P3";
}

interface InsightDraft {
  type: InsightType;
  title: string;
  body: string;
  severity: Severity;
  confidence: number;
  signalsCount: number;
  dedupeKey: string;
  evidence: {
    window: { from: string; to: string };
    category?: string;
    sampleTexts?: string[];
    confidence?: number;
  };
  issueId?: string;
}

async function signalsInWindow(orgId: string, from: Date, to: Date) {
  const rows = await prisma.customerSignal.findMany({
    where: { orgId, receivedAt: { gte: from, lt: to } },
    select: { sentiment: true, text: true, issueCategory: true, refundRequest: true, cancelIntent: true, isComplaint: true, featureRequest: true },
  });
  return rows;
}

function avgNormalized(rows: Array<{ sentiment: unknown }>): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, r) => acc + ((r.sentiment as { normalized?: number } | null)?.normalized ?? 0), 0);
  return sum / rows.length;
}

async function ensureIssue(orgId: string, name: string): Promise<string> {
  const issue = await prisma.issue.upsert({
    where: { orgId_name: { orgId, name } },
    update: { lastSeenAt: new Date() },
    create: { orgId, name, firstDetectedAt: new Date() },
  });
  return issue.id;
}

async function upsertInsight(orgId: string, draft: InsightDraft) {
  const existing = await prisma.insight.findUnique({
    where: { orgId_dedupeKey: { orgId, dedupeKey: draft.dedupeKey } },
  });
  if (existing) return null;

  const evidence = { ...draft.evidence, confidence: draft.confidence };

  const insight = await prisma.insight.create({
    data: {
      orgId,
      type: draft.type,
      title: draft.title,
      body: draft.body,
      severity: draft.severity,
      confidence: draft.confidence,
      signalsCount: draft.signalsCount,
      evidence: evidence as unknown as object,
      dedupeKey: draft.dedupeKey,
      issueId: draft.issueId,
    },
  });

  if (draft.severity === "HIGH" || draft.severity === "CRITICAL") {
    const recommendation = await prisma.recommendation.create({
      data: {
        orgId,
        insightId: insight.id,
        issueId: draft.issueId,
        title: `Address: ${draft.title}`,
        body: draft.body,
        confidence: draft.confidence,
        priority: severityToPriority(draft.severity),
      },
    });
    await prisma.action.create({
      data: {
        orgId,
        title: `Investigate ${draft.title}`,
        type: "INVESTIGATE",
        priority: severityToPriority(draft.severity),
        status: "OPEN",
        insightId: insight.id,
        recommendationId: recommendation.id,
        issueId: draft.issueId,
      },
    });
  }

  return insight;
}

export interface IntelligenceRunSummary {
  created: number;
  insights: Array<{ id: string; title: string; type: string; severity: string }>;
}

/**
 * Rule-based intelligence refresh: scans the last 7 vs previous 7 days of
 * stored signals and creates (deduplicated) Insights for real patterns —
 * sentiment swings, issue surges, refund/feature spikes, competitor mentions.
 * High-severity insights are materialized into Recommendations + Actions.
 */
export async function generateInsights(orgId: string, now = new Date()): Promise<IntelligenceRunSummary> {
  const recentStart = new Date(now.getTime() - 7 * DAY_MS);
  const prevStart = new Date(now.getTime() - 14 * DAY_MS);
  const wk = weekKey(now);

  const [recent, previous] = await Promise.all([signalsInWindow(orgId, recentStart, now), signalsInWindow(orgId, prevStart, recentStart)]);

  const recentAvg = avgNormalized(recent);
  const prevAvg = avgNormalized(previous);
  const createdInsights: Array<{ id: string; title: string; type: string; severity: string }> = [];

  // 1. Sentiment drop / rise.
  if (recent.length >= 3 && prevAvg - recentAvg >= 0.12) {
    const drop = Math.round((prevAvg - recentAvg) * 100) / 100;
    const insight = await upsertInsight(orgId, {
      type: "SENTIMENT_DROP",
      title: `Sentiment dropped ${drop} points this week`,
      body: `Average signal sentiment moved from ${Math.round(prevAvg * 100) / 100} to ${Math.round(recentAvg * 100) / 100} over ${recent.length} recent signals across ${new Set(recent.map((r) => r.issueCategory).filter(Boolean)).size} issue categories.`,
      severity: drop >= 0.25 ? "CRITICAL" : "HIGH",
      confidence: Math.min(0.92, 0.45 + drop),
      signalsCount: recent.length,
      evidence: { window: { from: recentStart.toISOString(), to: now.toISOString() }, sampleTexts: recent.slice(0, 3).map((r) => r.text.slice(0, 160)) },
      dedupeKey: `sentiment-drop:${wk}`,
    });
    if (insight) createdInsights.push({ id: insight.id, title: insight.title, type: insight.type, severity: insight.severity });
  } else if (recent.length >= 3 && recentAvg - prevAvg >= 0.12) {
    const rise = Math.round((recentAvg - prevAvg) * 100) / 100;
    const insight = await upsertInsight(orgId, {
      type: "SENTIMENT_RISE",
      title: `Sentiment rose ${rise} points this week`,
      body: `Average signal sentiment improved from ${Math.round(prevAvg * 100) / 100} to ${Math.round(recentAvg * 100) / 100} over ${recent.length} recent signals.`,
      severity: "LOW",
      confidence: Math.min(0.9, 0.4 + rise),
      signalsCount: recent.length,
      evidence: { window: { from: recentStart.toISOString(), to: now.toISOString() } },
      dedupeKey: `sentiment-rise:${wk}`,
    });
    if (insight) createdInsights.push({ id: insight.id, title: insight.title, type: insight.type, severity: insight.severity });
  }

  // 2. Issue surge / new issue per category.
  const categoryCounts = new Map<string, number>();
  for (const r of recent) {
    const cat = r.issueCategory ?? "general";
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }
  const prevCategoryCounts = new Map<string, number>();
  for (const r of previous) {
    const cat = r.issueCategory ?? "general";
    prevCategoryCounts.set(cat, (prevCategoryCounts.get(cat) ?? 0) + 1);
  }

  for (const [cat, count] of categoryCounts) {
    const prevCount = prevCategoryCounts.get(cat) ?? 0;
    const surging = count >= 3 && (count >= prevCount * 1.5 || prevCount === 0);
    if (!surging) continue;

    const issueId = await ensureIssue(orgId, cat);
    const texts = recent.filter((r) => (r.issueCategory ?? "general") === cat).map((r) => r.text.slice(0, 160));

    const insight = await upsertInsight(orgId, {
      type: prevCount === 0 ? "NEW_ISSUE" : "ISSUE_SURGE",
      title: prevCount === 0 ? `New issue surfacing: ${cat}` : `${cat} signals surging (${count} this week)`,
      body: `${count} signals classified under "${cat}" in the last 7 days${prevCount ? ` vs ${prevCount} the week before` : ""}.`,
      severity: count >= 6 ? "HIGH" : "MEDIUM",
      confidence: 0.75,
      signalsCount: count,
      evidence: { window: { from: recentStart.toISOString(), to: now.toISOString() }, category: cat, sampleTexts: texts.slice(0, 3) },
      dedupeKey: `issue-${prevCount === 0 ? "new" : "surge"}:${slugify(cat)}:${wk}`,
      issueId,
    });
    if (insight) createdInsights.push({ id: insight.id, title: insight.title, type: insight.type, severity: insight.severity });
  }

  // 3. Refund / cancellation anomaly.
  const refunds = recent.filter((r) => r.refundRequest).length;
  if (refunds >= 3) {
    const insight = await upsertInsight(orgId, {
      type: "ANOMALY",
      title: `${refunds} refund requests this week`,
      body: `${refunds} customer signals requested refunds in the last 7 days. Review billing/payment friction before it compounds.`,
      severity: refunds >= 6 ? "HIGH" : "MEDIUM",
      confidence: 0.7,
      signalsCount: refunds,
      evidence: { window: { from: recentStart.toISOString(), to: now.toISOString() }, sampleTexts: recent.filter((r) => r.refundRequest).map((r) => r.text.slice(0, 160)).slice(0, 3) },
      dedupeKey: `refund-spike:${wk}`,
    });
    if (insight) createdInsights.push({ id: insight.id, title: insight.title, type: insight.type, severity: insight.severity });
  }

  // 4. Feature request wave.
  const featureRequests = recent.filter((r) => r.featureRequest).length;
  if (featureRequests >= 3) {
    const insight = await upsertInsight(orgId, {
      type: "EMERGING_TREND",
      title: `${featureRequests} feature requests this week`,
      body: `${featureRequests} customers asked for new capabilities in the last 7 days. Candidate for an opportunity / PRD.`,
      severity: "MEDIUM",
      confidence: 0.7,
      signalsCount: featureRequests,
      evidence: { window: { from: recentStart.toISOString(), to: now.toISOString() }, sampleTexts: recent.filter((r) => r.featureRequest).map((r) => r.text.slice(0, 160)).slice(0, 3) },
      dedupeKey: `feature-wave:${wk}`,
    });
    if (insight) createdInsights.push({ id: insight.id, title: insight.title, type: insight.type, severity: insight.severity });
  }

  // 5. Competitor mentions.
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { competitorNames: true } });
  for (const name of org?.competitorNames ?? []) {
    const mentions = recent.filter((r) => r.text.toLowerCase().includes(name.toLowerCase()));
    if (mentions.length === 0) continue;

    await prisma.competitor.upsert({
      where: { orgId_name: { orgId, name } },
      update: { notes: "Mentioned in customer signals this week." },
      create: { orgId, name, notes: "Mentioned in customer signals this week." },
    });

    const insight = await upsertInsight(orgId, {
      type: "COMPETITOR_RISK",
      title: `${name} mentioned by customers this week`,
      body: `${mentions.length} signals referenced competitor "${name}" in the last 7 days.`,
      severity: mentions.length >= 3 ? "HIGH" : "MEDIUM",
      confidence: 0.6,
      signalsCount: mentions.length,
      evidence: { window: { from: recentStart.toISOString(), to: now.toISOString() }, sampleTexts: mentions.map((m) => m.text.slice(0, 160)) },
      dedupeKey: `competitor:${slugify(name)}:${wk}`,
    });
    if (insight) createdInsights.push({ id: insight.id, title: insight.title, type: insight.type, severity: insight.severity });
  }

  return { created: createdInsights.length, insights: createdInsights };
}