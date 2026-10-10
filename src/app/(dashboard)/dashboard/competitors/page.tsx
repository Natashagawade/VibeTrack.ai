import { Building2, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

function sentimentLabel(sentiment: unknown): string {
  return (sentiment as { label?: string } | null)?.label ?? "Neutral";
}

async function getCompetitorRows(orgId: string, names: string[]) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const rows = await Promise.all(
    names.map(async (name) => {
      const filter = { contains: name, mode: "insensitive" as const };
      const [recent, recent7, previous7, signals] = await Promise.all([
        prisma.customerSignal.count({ where: { orgId, text: filter } }),
        prisma.customerSignal.count({
          where: { orgId, text: filter, receivedAt: { gte: new Date(now - weekMs) } },
        }),
        prisma.customerSignal.count({
          where: {
            orgId,
            text: filter,
            receivedAt: { gte: new Date(now - 2 * weekMs), lt: new Date(now - weekMs) },
          },
        }),
        prisma.customerSignal.findMany({
          where: { orgId, text: filter },
          orderBy: { receivedAt: "desc" },
          take: 3,
          select: { id: true, text: true, receivedAt: true, sentiment: true },
        }),
      ]);
      return { name, total: recent, recent7, previous7, signals };
    })
  );
  return rows;
}

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const ctx = await requireOrg();
  const org = await prisma.organization.findUnique({
    where: { id: ctx.orgId },
    select: { competitorNames: true },
  });

  const names = org?.competitorNames ?? [];
  const rows = await getCompetitorRows(ctx.orgId, names);

  const shown = names.length > 0;

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[var(--color-bg-elevated)]/60 backdrop-blur-xl">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Competitors</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Mentions of competitors across your customer feedback, tracked week over week.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {!shown ? (
          <GlassCard variant="interactive" className="flex flex-col items-center gap-4 p-12 text-center max-w-2xl mx-auto animate-fade-in-up">
            <Building2 className="h-8 w-8 text-[var(--color-text-muted)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">No competitors configured</h2>
            <p className="max-w-md text-sm text-[var(--color-text-muted)]">
              Add competitor names to your workspace to start tracking when customers mention them. Competitor
              intelligence will surface matching signals and flag churn risk.
            </p>
          </GlassCard>
        ) : (
          rows.map((row) => {
            const delta = row.recent7 - row.previous7;
            const deltaPct = row.previous7 > 0 ? Math.round((delta / row.previous7) * 100) : 0;
            return (
              <GlassCard key={row.name} variant="interactive" className="p-6 animate-fade-in-up">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">{row.name}</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {row.total.toLocaleString()} total mention{row.total === 1 ? "" : "s"} ·{" "}
                      {row.recent7} in last 7 days
                      <span className={delta > 0 ? " ml-2 text-[var(--color-signal-negative)]" : delta < 0 ? " ml-2 text-[var(--color-signal-positive)]" : " ml-2 text-[var(--color-text-muted)]"}>
                        {delta > 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                            +{delta} ({deltaPct}%)
                          </>
                        ) : delta < 0 ? (
                          <>
                            <TrendingDown className="h-3 w-3 inline mr-1" />
                            {delta} ({deltaPct}%)
                          </>
                        ) : (
                          <>
                            <Minus className="h-3 w-3 inline mr-1" />
                            — ±0
                          </>
                        )} vs previous week
                      </span>
                    </p>
                  </div>
                  {row.recent7 > 0 && <Badge tone="negative">{row.recent7} this week</Badge>}
                </div>
                {row.signals.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                {row.signals.map((s) => {
                  const label = sentimentLabel(s.sentiment);
                  return (
                      <div key={s.id} className="glass-panel-subtle rounded-lg p-3 hover-glass transition-all duration-200">
                        <p className="text-xs text-[var(--color-text-primary)]">"{s.text.slice(0, 200)}"</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            tone={label === "Positive" ? "positive" : label === "Negative" ? "negative" : "neutral"}
                            className="text-[10px]"
                          >
                            {label}
                          </Badge>
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            {new Date(s.receivedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                  );
                })}
                  </div>
                )}
              </GlassCard>
            );
          })
        )}
      </div>
    </>
  );
}