import Link from "next/link";
import { AlertTriangle, Bug } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import { getTopIssues } from "@/lib/intelligence/aggregate";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

const SEVERITY_RANK = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const SEVERITY_COLOR: Record<string, string> = {
  LOW: "text-[var(--color-mist-400)]",
  MEDIUM: "text-[var(--color-aurora-cyan)]",
  HIGH: "text-[var(--color-signal-negative)]",
  CRITICAL: "text-[var(--color-signal-negative)]",
};

export const dynamic = "force-dynamic";

export default async function IssuesPage() {
  const ctx = await requireOrg();
  const [issues, samples] = await Promise.all([
    getTopIssues(ctx.orgId, 10),
    prisma.customerSignal.findMany({
      where: { orgId: ctx.orgId, issueCategory: { not: null } },
      orderBy: { receivedAt: "desc" },
      take: 6,
      select: { id: true, text: true, issueCategory: true, severity: true, receivedAt: true },
    }),
  ]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Issues</h1>
          <p className="text-sm text-[var(--color-mist-400)]">
            Recurring problems grouped by category — severity is set by the strongest signal.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {issues.length === 0 ? (
          <GlassCard className="flex flex-col items-center gap-4 p-16 text-center">
            <Bug className="h-8 w-8 text-[var(--color-mist-400)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">No issues classified yet</h2>
            <p className="max-w-md text-sm text-[var(--color-mist-400)]">
              Once signals come in, they are automatically bucketed into issue categories like delivery, billing,
              support, or login. Run a few analyses to get started.
            </p>
            <Link href="/dashboard/text"><Button>Analyze text</Button></Link>
          </GlassCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {issues.map((issue) => (
              <GlassCard key={issue.category} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--color-mist-400)]" />
                      <h2 className="truncate font-[family-name:var(--font-display)] text-base font-semibold capitalize">
                        {issue.category}
                      </h2>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-mist-400)]">
                      {issue.count} signal{issue.count === 1 ? "" : "s"}
                      {issue.complaints > 0 ? ` · ${issue.complaints} complaint${issue.complaints === 1 ? "" : "s"}` : ""}
                      {issue.refunds > 0 ? ` · ${issue.refunds} refund request${issue.refunds === 1 ? "" : "s"}` : ""}
                      {issue.cancels > 0 ? ` · ${issue.cancels} cancellation intent` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 font-[family-name:var(--font-display)] text-sm font-semibold ${SEVERITY_COLOR[issue.topSeverity] ?? ""}`}>
                    {issue.topSeverity}{" "}
                    <span className="text-[var(--color-mist-400)]">· rank {SEVERITY_RANK.indexOf(issue.topSeverity) + 1}</span>
                  </span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-[var(--color-aurora-pink)]"
                    style={{ width: `${Math.min(100, (issue.count / (issues[0]?.count || 1)) * 100)}%` }}
                  />
                </div>
                {issue.lastSeenAt && (
                  <p className="mt-3 text-xs text-[var(--color-mist-400)]">Last seen {new Date(issue.lastSeenAt).toLocaleDateString()}</p>
                )}
              </GlassCard>
            ))}
          </div>
        )}

        {samples.length > 0 && (
          <GlassCard className="p-6">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold">Latest classified signals</h2>
            <div className="divide-y divide-white/5">
              {samples.map((s) => (
                <div key={s.id} className="py-3 text-sm">
                  <p className="text-[var(--color-mist-100)]">{s.text}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-mist-400)]">
                    <span className="capitalize">{s.issueCategory}</span>
                    <span className={`ml-2 font-medium ${SEVERITY_COLOR[s.severity] ?? ""}`}>{s.severity}</span>
                    <span className="ml-2">{new Date(s.receivedAt).toLocaleDateString()}</span>
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}