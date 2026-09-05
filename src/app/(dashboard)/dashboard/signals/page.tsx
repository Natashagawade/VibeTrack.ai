import Link from "next/link";
import { MessageSquareText, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignalKind } from "@prisma/client";

const KIND_FILTERS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All" },
  { key: "REVIEW", label: "Reviews" },
  { key: "SUPPORT_TICKET", label: "Support" },
  { key: "SOCIAL", label: "Social" },
  { key: "SURVEY", label: "Surveys" },
  { key: "CALL", label: "Calls" },
  { key: "URL", label: "URLs" },
];

function sentimentLabel(sentiment: unknown): string {
  return (sentiment as { label?: string } | null)?.label ?? "Neutral";
}

export const dynamic = "force-dynamic";

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const ctx = await requireOrg();
  const { kind } = await searchParams;
  const kindFilter = kind && kind !== "all" ? (kind as SignalKind) : undefined;

  const where = { orgId: ctx.orgId, ...(kindFilter ? { kind: kindFilter } : {}) };

  const [total, signals, positive, negative, nextPage] = await Promise.all([
    prisma.customerSignal.count({ where: { orgId: ctx.orgId } }),
    prisma.customerSignal.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      take: 100,
      include: {
        customer: { select: { name: true, email: true } },
        product: { select: { name: true } },
      },
    }),
    prisma.customerSignal.count({
      where: { orgId: ctx.orgId, sentiment: { path: ["label"], equals: "Positive" } },
    }),
    prisma.customerSignal.count({
      where: { orgId: ctx.orgId, sentiment: { path: ["label"], equals: "Negative" } },
    }),
    prisma.customerSignal.findMany({
      where,
      select: { id: true },
      skip: 100,
      take: 1,
    }),
  ]);

  const pills = (
    <div className="flex flex-wrap gap-2">
      {KIND_FILTERS.map((f) => (
        <Link
          key={f.key}
          href={f.key === "all" ? "/dashboard/signals" : `/dashboard/signals?kind=${f.key}`}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            (kind ?? "all") === f.key
              ? "border-[var(--color-aurora-cyan)] bg-[var(--color-aurora-cyan)]/10 text-[var(--color-mist-100)]"
              : "border-white/10 text-[var(--color-mist-400)] hover:text-[var(--color-mist-100)]"
          }`}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Signals</h1>
          <p className="text-sm text-[var(--color-mist-400)]">
            {total.toLocaleString()} captured from reviews, tickets, chats, surveys, calls, and more.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-mist-400)]">
          <span className="text-[var(--color-signal-positive)]">+{positive.toLocaleString()} positive</span>
          <span>·</span>
          <span className="text-[var(--color-signal-negative)]">−{negative.toLocaleString()} negative</span>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {pills}

        {signals.length === 0 ? (
          <GlassCard className="flex flex-col items-center gap-4 p-16 text-center">
            <Inbox className="h-8 w-8 text-[var(--color-mist-400)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {total === 0 ? "No signals captured yet" : "No signals in this filter"}
            </h2>
            <p className="max-w-md text-sm text-[var(--color-mist-400)]">
              {total === 0
                ? "Analyze a review, support ticket, survey, call transcript, CSV, or feedback URL and it lands here."
                : "Try a different source filter."}
            </p>
            {total === 0 && <Link href="/dashboard/text"><Button>Analyze text</Button></Link>}
          </GlassCard>
        ) : (
          <>
            <GlassCard className="overflow-hidden p-0">
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-mist-400)] sm:grid-cols-[minmax(0,1fr)_110px_140px_160px]">
                  <span>Signal</span>
                  <span className="text-right">Sentiment</span>
                  <span>Issue</span>
                  <span>Received</span>
                </div>
                {signals.map((s) => (
                  <div key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_110px_140px_160px]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-[var(--color-mist-400)]" />
                        <span className="truncate text-[var(--color-mist-100)]">{s.text}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--color-mist-400)]">
                        {s.kind.toLowerCase().replaceAll("_", " ")} ·{" "}
                        {s.customer?.name ?? s.customer?.email ?? "Anonymous"}
                        {s.product ? ` · ${s.product.name}` : ""}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Badge tone={sentimentLabel(s.sentiment) === "Positive" ? "positive" : sentimentLabel(s.sentiment) === "Negative" ? "negative" : "neutral"}>
                        {sentimentLabel(s.sentiment)}
                      </Badge>
                    </div>
                    <div className="text-xs text-[var(--color-mist-400)]">{s.issueCategory ?? "general"}</div>
                    <div className="text-xs text-[var(--color-mist-400)]">{new Date(s.receivedAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
            <p className="text-center text-xs text-[var(--color-mist-400)]">
              {nextPage.length > 0
                ? `Showing the latest ${signals.length.toLocaleString()} — refine filters to narrow down.`
                : "You're all caught up."}
            </p>
          </>
        )}
      </div>
    </>
  );
}