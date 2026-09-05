import Link from "next/link";
import { Lightbulb, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { InsightActions } from "@/components/dashboard/insight-actions";

const TYPE_LABEL: Record<string, string> = {
  SENTIMENT_DROP: "Sentiment drop",
  SENTIMENT_RISE: "Sentiment rise",
  NEW_ISSUE: "New issue",
  ISSUE_SURGE: "Issue surge",
  REFUND_ANOMALY: "Refund anomaly",
  EMERGING_TREND: "Emerging trend",
  COMPETITOR_RISK: "Competitor mention",
  RISK_UP: "Customer risk up",
  OPPORTUNITY: "Opportunity",
  ACTION_RECOMMENDED: "Action recommended",
};

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const ctx = await requireOrg();
  const [insights, untouched] = await Promise.all([
    prisma.insight.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.insight.count({
      where: { orgId: ctx.orgId, status: "NEW" },
    }),
  ]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Insights</h1>
          <p className="text-sm text-[var(--color-mist-400)]">
            {untouched} unacknowledged — run “Refresh intelligence” on the overview after new signals arrive.
          </p>
        </div>
        <Link href="/dashboard">
          <Button size="sm" variant="ghost"><Sparkles className="h-3.5 w-3.5" /> Run intelligence</Button>
        </Link>
      </div>

      <div className="space-y-4 p-6">
        {insights.length === 0 ? (
          <GlassCard className="flex flex-col items-center gap-4 p-16 text-center">
            <Lightbulb className="h-8 w-8 text-[var(--color-mist-400)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">No insights yet</h2>
            <p className="max-w-md text-sm text-[var(--color-mist-400)]">
              Insights are computed from your stored signals: sentiment swings, issue surges, refund anomalies,
              feature waves, and competitor mentions. Each one is backed by the exact signals that triggered it.
            </p>
          </GlassCard>
        ) : (
          insights.map((insight) => {
            const evidence = insight.evidence as { sampleTexts?: string[]; signals?: number } | null;
            return (
              <GlassCard key={insight.id} className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--color-aurora-cyan)]/40 bg-[var(--color-aurora-cyan)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-aurora-cyan)]">
                        {TYPE_LABEL[insight.type] ?? insight.type.toLowerCase()}
                      </span>
                      <span className="text-xs text-[var(--color-mist-400)]">
                        {new Date(insight.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-base font-semibold">{insight.title}</h2>
                    <p className="mt-1 text-sm text-[var(--color-mist-300)]">{insight.body}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-mist-400)]">
                      <span>Severity <span className="font-semibold text-[var(--color-mist-100)]">{insight.severity}</span></span>
                      <span>Confidence <span className="font-semibold text-[var(--color-mist-100)]">{Math.round(insight.confidence * 100)}%</span></span>
                      <span>Backed by <span className="font-semibold text-[var(--color-mist-100)]">{insight.signalsCount}</span> signal{insight.signalsCount === 1 ? "" : "s"}</span>
                    </div>
                    {evidence?.sampleTexts && evidence.sampleTexts.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {evidence.sampleTexts.slice(0, 3).map((t, i) => (
                          <p key={i} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-[var(--color-mist-300)]">
                            “{t}”
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    <InsightActions id={insight.id} status={insight.status} />
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </>
  );
}