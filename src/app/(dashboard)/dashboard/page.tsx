import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import {
  getSignalStats,
  getSentimentTrend,
  getTopIssues,
  getRecentSignals,
  getRiskSummary,
} from "@/lib/intelligence/aggregate";
import { OverviewView } from "@/components/dashboard/overview-view";
import type { OverviewData } from "./types";

const getOverviewData = cache(async (orgId: string, orgName: string): Promise<OverviewData> => {
  const [stats, trend, issues, recent, risks, actionCount, insightCount] = await Promise.all([
    getSignalStats(orgId),
    getSentimentTrend(orgId, 7),
    getTopIssues(orgId, 8),
    getRecentSignals(orgId, 8),
    getRiskSummary(orgId, 5),
    prisma.action.count({ where: { orgId, status: "OPEN" } }),
    prisma.insight.count({ where: { orgId, status: "NEW" } }),
  ]);

  return {
    orgName,
    stats,
    trend,
    issues,
    recent,
    risks,
    openActions: actionCount,
    newInsights: insightCount,
    generatedAt: new Date().toISOString(),
  };
});

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const ctx = await requireOrg();
  const org = await prisma.organization.findUnique({
    where: { id: ctx.orgId },
    select: { id: true, name: true },
  });
  const data = await getOverviewData(ctx.orgId, org?.name ?? "Workspace");

  return <OverviewView data={data} />;
}