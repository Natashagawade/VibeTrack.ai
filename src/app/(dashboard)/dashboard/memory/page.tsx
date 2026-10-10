import { Inbox, Link2, ShieldCheck, FlaskConical } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { MemoryRecallPanel } from "@/components/dashboard/memory-recall";
import { MemoryCreateForm } from "@/components/dashboard/memory-create";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  PROBLEM_PATTERN: "Problem pattern",
  DECISION: "Decision",
  ACTION_OUTCOME: "Action outcome",
  INCIDENT: "Incident",
  EXPERIMENT: "Experiment",
  BUSINESS_FACT: "Business fact",
  MILESTONE: "Milestone",
  LESSON: "Lesson",
};

type MemoryWithCounts = {
  id: string;
  type: string;
  title: string;
  summary: string;
  importance: number;
  confidence: number;
  occurredAt: Date;
  source: string;
  entities: unknown;
  keywords: string[];
  signalId: string | null;
  issueId: string | null;
  insightId: string | null;
  actionId: string | null;
  _count: { events: number };
};

export default async function MemoryPage() {
  const ctx = await requireOrg();

  const [memories, recall] = await Promise.all([
    prisma.businessMemory.findMany({
      where: { orgId: ctx.orgId },
      orderBy: [{ occurredAt: "desc" }],
      take: 100,
      include: { _count: { select: { events: true } } },
    }),
    prisma.memoryEvent.count({ where: { orgId: ctx.orgId } }),
  ]);

  const connected = memories.filter(
    (m) => m.signalId || m.issueId || m.insightId || m.actionId
  ).length;

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Business Memory</h1>
          <p className="text-sm text-[var(--color-mist-400)]">
            A structured record of what your business has actually experienced — every entry evidence-backed, never fabricated.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard className="p-5">
            <div className="text-xs text-[var(--color-mist-400)]">Memories</div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{memories.length}</div>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="text-xs text-[var(--color-mist-400)]">Timeline events</div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{recall}</div>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="text-xs text-[var(--color-mist-400)]">Evidence-linked</div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{connected}</div>
          </GlassCard>
        </div>

        <MemoryRecallPanel />
        <MemoryCreateForm />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">Archived experience</h2>
            <span className="text-xs text-[var(--color-mist-400)]">{memories.length} memories</span>
          </div>

          {memories.length === 0 ? (
            <GlassCard className="flex flex-col items-center gap-4 p-12 text-center">
              <Inbox className="h-8 w-8 text-[var(--color-mist-400)]" />
              <p className="max-w-sm text-sm text-[var(--color-mist-400)]">
                No memories yet. Record a decision, an action outcome, an issue pattern or a fact to start
                building recall for “have we experienced this before?”.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {(memories as unknown as MemoryWithCounts[]).map((m) => (
                <GlassCard key={m.id} className="p-5">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{TYPE_LABEL[m.type] ?? m.type.toLowerCase()}</Badge>
                        <span className="text-xs text-[var(--color-mist-400)]">
                          {new Date(m.occurredAt).toLocaleDateString()}
                        </span>
                        <Badge tone={m.signalId || m.issueId || m.insightId || m.actionId ? "positive" : "neutral"}>
                          {m.signalId || m.issueId || m.insightId || m.actionId ? (
                            <Link2 className="mr-1 h-3 w-3" />
                          ) : (
                            <ShieldCheck className="mr-1 h-3 w-3" />
                          )}
                          {m.signalId || m.issueId || m.insightId || m.actionId ? "Evidence-linked" : "Recorded"}
                        </Badge>
                      </div>
                      <h3 className="mt-2 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-mist-100)]">
                        {m.title}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-mist-300)]">{m.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-mist-400)]">
                        <span>Confidence <span className="font-semibold text-[var(--color-mist-100)]">{Math.round(m.confidence * 100)}%</span></span>
                        <span>Importance <span className="font-semibold text-[var(--color-mist-100)]">{Math.round(m.importance * 100)}%</span></span>
                        <span>Events <span className="font-semibold text-[var(--color-mist-100)]">{m._count.events}</span></span>
                      </div>
                      {m.keywords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.keywords.slice(0, 8).map((k) => (
                            <span key={k} className="rounded-none border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[10px] text-[var(--color-mist-400)]">
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <FlaskConical className="hidden h-5 w-5 shrink-0 text-[var(--color-mist-500)] sm:block" />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
