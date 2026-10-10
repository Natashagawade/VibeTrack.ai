import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, TrendingDown, Minus, AlertTriangle, Search, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";

async function getCompetitorData(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { competitorNames: true },
  });

  const names = org?.competitorNames ?? [];
  
  if (names.length === 0) {
    return { names: [], data: [] };
  }

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const monthMs = 30 * 24 * 60 * 60 * 1000;

  const competitorData = await Promise.all(
    names.map(async (name) => {
      const filter = { contains: name, mode: "insensitive" as const };
      
      const [
        totalMentions,
        lastWeek,
        prevWeek,
        lastMonth,
        prevMonth,
        recentSignals,
        sentimentBreakdown,
        topIssues,
      ] = await Promise.all([
        prisma.customerSignal.count({ where: { orgId, text: filter } }),
        prisma.customerSignal.count({
          where: { orgId, text: filter, receivedAt: { gte: new Date(now - weekMs) } },
        }),
        prisma.customerSignal.count({
          where: { orgId, text: filter, receivedAt: { gte: new Date(now - 2 * weekMs), lt: new Date(now - weekMs) } },
        }),
        prisma.customerSignal.count({
          where: { orgId, text: filter, receivedAt: { gte: new Date(now - monthMs) } },
        }),
        prisma.customerSignal.count({
          where: { orgId, text: filter, receivedAt: { gte: new Date(now - 2 * monthMs), lt: new Date(now - monthMs) } },
        }),
        prisma.customerSignal.findMany({
          where: { orgId, text: filter },
          orderBy: { receivedAt: "desc" },
          take: 5,
          select: { id: true, text: true, receivedAt: true, sentiment: true, severity: true, channel: true },
        }),
        prisma.customerSignal.groupBy({
          by: ["sentiment"],
          where: { orgId, text: filter },
          _count: true,
        }),
        prisma.customerSignal.groupBy({
          by: ["issueCategory"],
          where: { orgId, text: filter, issueCategory: { not: null } },
          _count: true,
          orderBy: { _count: { issueCategory: "desc" } },
          take: 3,
        }),
      ]);

      // Parse sentiment breakdown
      let positive = 0, negative = 0, neutral = 0;
      sentimentBreakdown.forEach((s: any) => {
        const label = s.sentiment?.label ?? "Neutral";
        if (label === "Positive") positive = s._count;
        else if (label === "Negative") negative = s._count;
        else neutral = s._count;
      });

      const weekDelta = lastWeek - prevWeek;
      const monthDelta = lastMonth - prevMonth;
      
      // Calculate risk score based on negative sentiment and mention velocity
      const riskScore = Math.min(100, Math.round(
        (negative / Math.max(1, totalMentions)) * 60 + 
        (Math.max(0, weekDelta) / Math.max(1, prevWeek)) * 40
      ));

      return {
        name,
        totalMentions,
        lastWeek,
        prevWeek,
        lastMonth,
        prevMonth,
        weekDelta,
        monthDelta,
        recentSignals,
        sentiment: { positive, negative, neutral },
        topIssues,
        riskScore,
        riskLevel: riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW",
      };
    })
  );

  return { names, data: competitorData };
}

export const dynamic = "force-dynamic";

export default async function BrandMonitorPage() {
  const ctx = await requireOrg();
  const { names, data } = await getCompetitorData(ctx.orgId);

  const shown = names.length > 0;

  return (
    <>
      <Topbar title="Brand monitoring" />
      <div className="space-y-6 p-6">
        {/* Header with add competitor action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Brand monitoring</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Track competitor mentions across customer feedback. Detect sentiment shifts, emerging issues, and churn risk signals.
            </p>
          </div>
          <a
            href="/dashboard/settings?tab=competitors"
            className="glass-button-ghost px-4 py-2 text-sm flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Manage competitors
          </a>
        </div>

        {!shown ? (
          /* Empty state */
          <GlassCard variant="interactive" className="flex flex-col items-center gap-4 p-12 text-center max-w-2xl mx-auto animate-fade-in-up">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent-violet)]/20 to-[var(--color-accent-cyan)]/20 border border-[var(--color-accent-violet)]/30 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-[var(--color-accent-violet)]" />
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">No competitors configured</h2>
            <p className="max-w-md text-sm text-[var(--color-text-secondary)]">
              Add competitor names in Settings to start tracking when customers mention them. 
              Brand intelligence will surface matching signals, flag sentiment shifts, and detect churn risk.
            </p>
            <a
              href="/dashboard/settings?tab=competitors"
              className="glass-button-primary px-6 py-3 text-sm flex items-center gap-2 mt-2"
            >
              <Building2 className="h-4 w-4" />
              Add competitors
            </a>
          </GlassCard>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <GlassCard className="p-5 animate-fade-in-up delay-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Tracked competitors</p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{names.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-accent-violet)]/20 border border-[var(--color-accent-violet)]/30 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-[var(--color-accent-violet)]" />
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-5 animate-fade-in-up delay-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Total mentions (all time)</p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
                      {data.reduce((sum, d) => sum + d.totalMentions, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-accent-cyan)]/20 border border-[var(--color-accent-cyan)]/30 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-[var(--color-accent-cyan)]" />
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-5 animate-fade-in-up delay-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Mentions this week</p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
                      {data.reduce((sum, d) => sum + d.lastWeek, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-accent-emerald)]/20 border border-[var(--color-accent-emerald)]/30 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[var(--color-accent-emerald)]" />
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-5 animate-fade-in-up delay-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">High risk competitors</p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--color-signal-negative)]">
                      {data.filter(d => d.riskLevel === "HIGH").length}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-signal-negative)]/20 border border-[var(--color-signal-negative)]/30 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-[var(--color-signal-negative)]" />
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Competitor cards */}
            <div className="space-y-4">
              {data
                .sort((a, b) => b.riskScore - a.riskScore)
                .map((comp, index) => {
                  const weekDeltaPct = comp.prevWeek > 0 ? Math.round(((comp.lastWeek - comp.prevWeek) / comp.prevWeek) * 100) : 0;
                  const monthDeltaPct = comp.prevMonth > 0 ? Math.round(((comp.lastMonth - comp.prevMonth) / comp.prevMonth) * 100) : 0;
                  
                  return (
                    <GlassCard key={comp.name} variant="interactive" className="p-6 animate-fade-in-up" style={{ animationDelay: `${(index + 5) * 0.05}s` }}>
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-violet)]/20 to-[var(--color-accent-cyan)]/20 border border-[var(--color-accent-violet)]/30 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-[var(--color-accent-cyan)]" />
                            </div>
                            <div>
                              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold truncate">{comp.name}</h2>
                              <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-muted)]">
                                <span>{comp.totalMentions.toLocaleString()} total mentions</span>
                                <span>·</span>
                                <span>{comp.lastWeek} this week</span>
                                <span>·</span>
                                <span>{comp.lastMonth} this month</span>
                              </div>
                            </div>
                            <Badge tone={comp.riskLevel === "HIGH" ? "negative" : comp.riskLevel === "MEDIUM" ? "amber" : "positive"}>
                              Risk: {comp.riskLevel} ({comp.riskScore})
                            </Badge>
                          </div>

                          {/* Sentiment breakdown */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Badge tone="positive" className="gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-[var(--color-signal-positive)]" />
                              Positive {comp.sentiment.positive}
                            </Badge>
                            <Badge tone="neutral" className="gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-[var(--color-signal-neutral)]" />
                              Neutral {comp.sentiment.neutral}
                            </Badge>
                            <Badge tone="negative" className="gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-[var(--color-signal-negative)]" />
                              Negative {comp.sentiment.negative}
                            </Badge>
                          </div>

                          {/* Top issues */}
                          {comp.topIssues.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className="text-xs text-[var(--color-text-muted)]">Top issues:</span>
                              {comp.topIssues.map((issue: any) => (
                                <Badge key={issue.issueCategory} tone="cyan" className="gap-1">
                                  {issue.issueCategory} ({issue._count})
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-3 lg:w-64 shrink-0">
                          {/* Trend indicators */}
                          <div className="flex flex-wrap items-center justify-end gap-4 w-full">
                            <div className="text-right">
                              <p className="text-xs text-[var(--color-text-muted)]">Week over week</p>
                              <p className={comp.weekDelta > 0 ? "text-[var(--color-signal-negative)]" : comp.weekDelta < 0 ? "text-[var(--color-signal-positive)]" : "text-[var(--color-text-muted)]"}>
                                {comp.weekDelta > 0 ? (
                                  <>
                                    <ArrowUpRight className="h-3 w-3 inline mr-1" />
                                    +{weekDeltaPct}%
                                  </>
                                ) : comp.weekDelta < 0 ? (
                                  <>
                                    <ArrowDownRight className="h-3 w-3 inline mr-1" />
                                    {weekDeltaPct}%
                                  </>
                                ) : (
                                  <Minus className="h-3 w-3 inline mr-1" />
                                  —
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-[var(--color-text-muted)]">Month over month</p>
                              <p className={comp.monthDelta > 0 ? "text-[var(--color-signal-negative)]" : comp.monthDelta < 0 ? "text-[var(--color-signal-positive)]" : "text-[var(--color-text-muted)]"}>
                                {comp.monthDelta > 0 ? (
                                  <>
                                    <ArrowUpRight className="h-3 w-3 inline mr-1" />
                                    +{monthDeltaPct}%
                                  </>
                                ) : comp.monthDelta < 0 ? (
                                  <>
                                    <ArrowDownRight className="h-3 w-3 inline mr-1" />
                                    {monthDeltaPct}%
                                  </>
                                ) : (
                                  <Minus className="h-3 w-3 inline mr-1" />
                                  —
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Recent signals preview */}
                          {comp.recentSignals.length > 0 && (
                            <div className="w-full space-y-2">
                              {comp.recentSignals.slice(0, 3).map((signal: any) => (
                                <div key={signal.id} className="glass-panel-subtle rounded-lg p-3 hover:glass-panel transition-all duration-200">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-[var(--color-text-primary)] line-clamp-2">"{signal.text.slice(0, 120)}"</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge tone={signal.sentiment?.label === "Positive" ? "positive" : signal.sentiment?.label === "Negative" ? "negative" : "neutral"} className="text-[10px]">
                                          {signal.sentiment?.label ?? "Neutral"}
                                        </Badge>
                                        <span className="text-[10px] text-[var(--color-text-muted)]">
                                          {new Date(signal.receivedAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {comp.recentSignals.length > 3 && (
                                <button className="text-xs text-[var(--color-accent-cyan)] hover:underline w-full text-left py-1">
                                  View all {comp.recentSignals.length} signals →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </>
  );
}