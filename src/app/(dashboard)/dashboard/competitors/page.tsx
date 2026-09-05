import { Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

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
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Competitors</h1>
          <p className="text-sm text-[var(--color-mist-400)]">
            Mentions of competitors across your customer feedback, tracked week over week.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {!shown ? (
          <GlassCard className="flex flex-col items-center gap-4 p-16 text-center">
            <Building2 className="h-8 w-8 text-[var(--color-mist-400)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">No competitors configured</h2>
            <p className="max-w-md text-sm text-[var(--color-mist-400)]">
              Add competitor names to your workspace to start tracking when customers mention them. Competitor
              intelligence will surface matching signals and flag churn risk.
            </p>
          </GlassCard>
        ) : (
          rows.map((row) => {
            const delta = row.recent7 - row.previous7;
            return (
              <GlassCard key={row.name} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">{row.name}</h2>
                    <p className="mt-1 text-sm text-[var(--color-mist-400)]">
                      {row.total.toLocaleString()} total mention{row.total === 1 ? "" : "s"} ·{" "}
                      {row.recent7} in last 7 days
                      <span className={delta > 0 ? " ml-2 text-[var(--color-signal-negative)]" : delta < 0 ? " ml-2 text-[var(--color-signal-positive)]" : " ml-2 text-[var(--color-mist-400)]"}>
                        {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : "— ±0"} vs previous week
                      </span>
                    </p>
                  </div>
                  {row.recent7 > 0 && <Badge tone="negative">{row.recent7} this week</Badge>}
                </div>
                {row.signals.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {row.signals.map((s) => (
                      <p key={s.id} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-[var(--color-mist-300)]">
                        “{s.text}”{" "}
                        <span className="ml-1 text-[var(--color-mist-400)]">
                          · {new Date(s.receivedAt).toLocaleDateString()}
                        </span>
                      </p>
                    ))}
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