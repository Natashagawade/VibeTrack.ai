import Link from "next/link";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function sentimentLabel(sentiment: unknown): string {
  return (sentiment as { label?: string } | null)?.label ?? "Neutral";
}

const RISK_TONE: Record<string, "neutral" | "positive" | "negative"> = {
  LOW: "neutral",
  MEDIUM: "positive",
  HIGH: "negative",
  CRITICAL: "negative",
};

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const ctx = await requireOrg();

  const customers = await prisma.customer.findMany({
    where: { orgId: ctx.orgId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      signals: {
        orderBy: { receivedAt: "desc" },
        take: 1,
        select: { sentiment: true, text: true, severity: true, receivedAt: true },
      },
      risks: { select: { score: true, level: true, updatedAt: true } },
      _count: { select: { signals: true } },
    },
  });

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Customers</h1>
          <p className="text-sm text-[var(--color-mist-400)]">
            {customers.length.toLocaleString()} identified from incoming signals. Risk scores come from the explainable
            risk engine.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {customers.length === 0 ? (
          <GlassCard className="flex flex-col items-center gap-4 p-16 text-center">
            <Users className="h-8 w-8 text-[var(--color-mist-400)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">No customers identified yet</h2>
            <p className="max-w-md text-sm text-[var(--color-mist-400)]">
              Customers appear here automatically when signals carry identifying info (email or name).
            </p>
            <Link href="/dashboard/text"><Button>Analyze text</Button></Link>
          </GlassCard>
        ) : (
          <GlassCard className="overflow-hidden p-0">
            <div className="grid grid-cols-[minmax(0,1fr)_120px_140px_90px] items-center gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-mist-400)]">
              <span>Customer</span>
              <span>Signals</span>
              <span className="text-right">Risk</span>
              <span className="text-right">Latest</span>
            </div>
            <div className="divide-y divide-white/5">
              {customers.map((c) => {
                const latest = c.signals[0];
                const risk = c.risks[0];
                return (
                  <div key={c.id} className="grid grid-cols-[minmax(0,1fr)_120px_140px_90px] items-center gap-4 px-6 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-[var(--color-mist-100)]">{c.name ?? c.email ?? c.externalRef ?? "Unknown"}</div>
                      <div className="truncate text-xs text-[var(--color-mist-400)]">
                        {c.email}{c.segment ? ` · ${c.segment}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--color-mist-400)]">{c._count.signals.toLocaleString()}</div>
                    <div className="flex items-center justify-end gap-2">
                      {risk ? (
                        <>
                          <span className="font-[family-name:var(--font-display)] text-sm">{risk.score}</span>
                          <Badge tone={RISK_TONE[risk.level] ?? "neutral"}>{risk.level}</Badge>
                        </>
                      ) : (
                        <span className="text-xs text-[var(--color-mist-400)]">—</span>
                      )}
                    </div>
                    <div className="text-right text-xs text-[var(--color-mist-400)]">
                      {latest ? (
                        <>
                          <Badge tone={sentimentLabel(latest.sentiment) === "Positive" ? "positive" : sentimentLabel(latest.sentiment) === "Negative" ? "negative" : "neutral"}>
                            {sentimentLabel(latest.sentiment)}
                          </Badge>
                          <span className="ml-2">{new Date(latest.receivedAt).toLocaleDateString()}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}