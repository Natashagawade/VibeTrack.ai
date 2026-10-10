"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { MessageSquareText, RefreshCw, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OverviewData } from "@/app/(dashboard)/dashboard/types";

const SEVERITY_TONE: Record<string, "neutral" | "positive" | "negative"> = {
  LOW: "neutral",
  MEDIUM: "positive",
  HIGH: "negative",
  CRITICAL: "negative",
};

export function OverviewView({ data }: { data: OverviewData }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { stats } = data;

  const hasSignals = stats.totalSignals > 0;

  const netLabel =
    stats.avgSentiment > 0.1 ? "Positive" : stats.avgSentiment < -0.1 ? "Negative" : "Neutral";

  const statCards = [
    { label: "Customer signals", value: stats.totalSignals.toLocaleString(), sub: `${stats.last24h} in the last 24h` },
    { label: "Avg sentiment (7d)", value: stats.avgSentiment.toFixed(2), sub: netLabel, tone: netLabel === "Negative" ? "text-[var(--color-signal-negative)]" : netLabel === "Positive" ? "text-[var(--color-signal-positive)]" : "text-[var(--color-text-muted)]" },
    { label: "Complaints", value: stats.complaints.toLocaleString(), sub: `of ${stats.totalSignals} signals`, tone: stats.complaints > 0 ? "text-[var(--color-signal-negative)]" : "text-[var(--color-text-muted)]" },
    { label: "Open actions", value: data.openActions.toLocaleString(), sub: `${data.newInsights} unread insight${data.newInsights === 1 ? "" : "s"}`, tone: data.openActions > 0 ? "text-[var(--color-signal-negative)]" : "text-[var(--color-text-muted)]" },
  ];

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/intelligence", { method: "POST" });
      if (!res.ok) throw new Error("refresh failed");
    } finally {
      setRefreshing(false);
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-6 pt-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold">Customer intelligence</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Live patterns from your stored customer signals — nothing fabricated.</p>
        </div>
        <Button size="sm" variant="glass" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh intelligence"}
        </Button>
      </div>

      <div className="space-y-6 p-6">
        {!hasSignals && (
          <GlassCard variant="interactive" className="p-10 text-center animate-fade-in-up">
            <Sparkles className="mx-auto h-8 w-8 text-[var(--color-text-muted)]" />
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold">No customer signals yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
              Signals flow in the moment you analyze a review, support ticket, survey, call transcript, document, or
              feedback URL. Run your first analysis and this dashboard will light up with real intelligence.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard/text"><Button>Analyze text</Button></Link>
              <Link href="/dashboard/csv"><Button variant="glass">Upload CSV</Button></Link>
              <Link href="/dashboard/url"><Button variant="glass">Fetch a URL</Button></Link>
            </div>
          </GlassCard>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <GlassCard key={s.label} variant="interactive" className="p-5">
              <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">{s.label}</div>
              <div className="mt-2 flex items-end justify-between">
                <span className={`font-[family-name:var(--font-display)] text-2xl font-semibold ${s.tone ?? ""}`}>{s.value}</span>
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">{s.sub}</div>
            </GlassCard>
          ))}
        </div>

        {!hasSignals && (
          <GlassCard variant="subtle" className="p-8 text-center text-sm text-[var(--color-text-muted)]">
            Insights, issue detection, customer risk, competitor mentions, and actions all appear here once signals exist.
            Every number below comes from your own data.
          </GlassCard>
        )}

        {hasSignals && (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <GlassCard variant="interactive" className="p-6 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">Sentiment — last 7 days</h2>
                  <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-signal-positive)]" />Positive</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-signal-negative)]" />Negative</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data.trend}>
                    <defs>
                      <linearGradient id="posFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-signal-positive)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-signal-positive)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="negFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-signal-negative)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--color-signal-negative)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, backdropFilter: "blur(16px)" }} />
                    <Area type="monotone" dataKey="positive" stroke="var(--color-signal-positive)" fill="url(#posFill)" strokeWidth={2} />
                    <Area type="monotone" dataKey="negative" stroke="var(--color-signal-negative)" fill="url(#negFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard variant="interactive" className="p-6">
                <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold">Top issue categories</h2>
                {data.issues.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">No issues classified yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.issues.slice(0, 5).map((issue) => (
                      <div key={issue.category} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-[var(--color-text-primary)]">{issue.category}</span>
                          <Badge tone={SEVERITY_TONE[issue.topSeverity] ?? "neutral"}>{issue.topSeverity}</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-[var(--color-accent-cyan)]"
                              style={{ width: `${Math.min(100, (issue.count / (data.issues[0]?.count || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--color-text-muted)]">{issue.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <GlassCard variant="interactive" className="p-6 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">Recent signals</h2>
                  <Link href="/dashboard/signals"><Button size="sm" variant="glass">View all</Button></Link>
                </div>
                {data.recent.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">No signals yet.</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {data.recent.slice(0, 8).map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-4 py-3 text-sm hover:bg-white/5 rounded-xl transition-colors">
                        <div className="flex min-w-0 items-center gap-3">
                          <MessageSquareText className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                          <div className="min-w-0">
                            <div className="truncate text-[var(--color-text-primary)]">{s.text}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">
                              {s.kind.toLowerCase()} · {s.issueCategory ?? "general"} · {new Date(s.receivedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge tone={s.sentimentLabel === "Positive" ? "positive" : s.sentimentLabel === "Negative" ? "negative" : "neutral"}>
                          {s.sentimentLabel}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              <GlassCard variant="interactive" className="p-6">
                <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold">At-risk customers</h2>
                {data.risks.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">No customers flagged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.risks.slice(0, 5).map((r) => (
                      <div key={r.customerId} className="flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <div className="truncate text-[var(--color-text-primary)]">{r.name ?? r.email ?? "Unknown customer"}</div>
                          <div className="text-xs text-[var(--color-text-muted)]">{r.reasons[0]?.reason ?? "No reasons"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={SEVERITY_TONE[r.level] ?? "neutral"}>{r.level}</Badge>
                          <span className="font-[family-name:var(--font-display)] text-sm">{r.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </>
  );
}