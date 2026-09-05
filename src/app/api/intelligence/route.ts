import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSignalsContext } from "@/lib/signals/auth";
import { logAudit } from "@/lib/audit";
import {
  getSignalStats,
  getSentimentTrend,
  getTopIssues,
  getTopTopics,
  getRecentSignals,
  getRiskSummary,
} from "@/lib/intelligence/aggregate";
import { computeCustomerRisks } from "@/lib/intelligence/risk";
import { generateInsights } from "@/lib/intelligence/insights";

export async function GET(req: NextRequest) {
  const ctx = await withSignalsContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "Authenticate with a session or an API key (Authorization: Bearer)." }, { status: 401 });
  }

  const [stats, trend, issues, topics, recent, risks, openActions, newInsights] = await Promise.all([
    getSignalStats(ctx.orgId),
    getSentimentTrend(ctx.orgId, 7),
    getTopIssues(ctx.orgId),
    getTopTopics(ctx.orgId),
    getRecentSignals(ctx.orgId, 10),
    getRiskSummary(ctx.orgId, 10),
    prisma.action.count({ where: { orgId: ctx.orgId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.insight.count({ where: { orgId: ctx.orgId, status: "NEW" } }),
  ]);

  return NextResponse.json({
    orgId: ctx.orgId,
    generatedAt: new Date().toISOString(),
    stats,
    trend,
    issues,
    topics,
    recent,
    risks,
    openActions,
    newInsights,
  });
}

export async function POST(req: NextRequest) {
  const ctx = await withSignalsContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "Authenticate with a session or an API key (Authorization: Bearer)." }, { status: 401 });
  }

  const risks = await computeCustomerRisks({ orgId: ctx.orgId });
  const insightRun = await generateInsights(ctx.orgId);

  await logAudit({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "intelligence.refresh",
    entity: "Organization",
    entityId: ctx.orgId,
    metadata: { risks: risks.length, createdInsights: insightRun.created },
  });

  return NextResponse.json({
    risksComputed: risks.length,
    insightsCreated: insightRun.created,
    insights: insightRun.insights,
  });
}