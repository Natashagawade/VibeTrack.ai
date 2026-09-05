import { TrendingUp, Rocket } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const ctx = await requireOrg();

  const [opportunities, featureRequests] = await Promise.all([
    prisma.productOpportunity.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.customerSignal.groupBy({
      by: ["issueCategory"],
      where: { orgId: ctx.orgId, featureRequest: true },
      _count: true,
    }),
  ]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Opportunities</h1>
          <p className="text-sm text-[var(--color-mist-400)]">
            Feature demand from real signals, turned into structured opportunities for your roadmap.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {featureRequests.map((f) => (
            <GlassCard key={f.issueCategory ?? "general"} className="p-6">
              <div className="text-xs text-[var(--color-mist-400)]">Feature requests</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold">{f._count.toLocaleString()}</div>
              <div className="mt-1 text-sm text-[var(--color-mist-400)] capitalize">
                {f.issueCategory ?? "general"}
              </div>
            </GlassCard>
          ))}
          {featureRequests.length === 0 && (
            <GlassCard className="p-6 text-sm text-[var(--color-mist-400)] lg:col-span-3">
              No feature requests captured yet. Signals flagged as feature requests land here automatically.
            </GlassCard>
          )}
        </div>

        {opportunities.length === 0 ? (
          <GlassCard className="flex flex-col items-center gap-4 p-16 text-center">
            <Rocket className="h-8 w-8 text-[var(--color-mist-400)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">No opened opportunities</h2>
            <p className="max-w-md text-sm text-[var(--color-mist-400)]">
              When a feature wave or high-impact issue is confirmed, it becomes a ProductOpportunity with evidence,
              severity, and suggested tasks for your roadmap.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {opportunities.map((o) => (
              <GlassCard key={o.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 shrink-0 text-[var(--color-mist-400)]" />
                      <h2 className="truncate font-[family-name:var(--font-display)] text-base font-semibold">{o.title}</h2>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-mist-300)]">{o.summary}</p>
                    <p className="mt-2 text-xs text-[var(--color-mist-400)]">
                      {o.priority} priority · {o.status.toLowerCase()} · {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge tone="positive">{o.priority}</Badge>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </>
  );
}