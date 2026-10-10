import { ListTodo, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

const STATUS_ORDER: string[] = ["OPEN", "IN_PROGRESS", "DONE", "MEASURED", "CANCELLED"];

export const dynamic = "force-dynamic";

export default async function ActionsPage() {
  const ctx = await requireOrg();

  const actions = await prisma.action.findMany({
    where: { orgId: ctx.orgId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: actions.filter((a) => a.status === status),
  })).filter((g) => g.items.length > 0);

  const total = actions.length;

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Actions</h1>
          <p className="text-sm text-[var(--color-mist-400)]">
            {total.toLocaleString()} action{total === 1 ? "" : "s"} — tasks for your team generated from confirmed
            insights, waitin for owners.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {actions.length === 0 ? (
          <GlassCard className="flex flex-col items-center gap-4 p-16 text-center">
            <ListTodo className="h-8 w-8 text-[var(--color-mist-400)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Nothing to do yet</h2>
            <p className="max-w-md text-sm text-[var(--color-mist-400)]">
              High- and critical-severity insights automatically generate recommended actions here, with priorities,
              sample evidence, and a drafted customer response. Healthy signals mean an empty slate.
            </p>
          </GlassCard>
        ) : (
          grouped.map((group) => (
            <div key={group.status}>
              <h2 className="mb-3 flex items-center gap-2 px-1 font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wider text-[var(--color-mist-400)]">
                {group.status === "DONE" || group.status === "MEASURED" ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-signal-positive)]" />
                ) : group.status === "IN_PROGRESS" ? (
                  <Loader2 className="h-4 w-4 text-[var(--color-aurora-cyan)]" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                {group.status.toLowerCase().replace("_", " ")} · {group.items.length}
              </h2>
              <div className="space-y-3">
                {group.items.map((a) => (
                  <GlassCard key={a.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-[family-name:var(--font-display)] text-base font-semibold">{a.title}</h3>
                          <Badge tone="neutral">{a.priority}</Badge>
                          <span className="text-xs text-[var(--color-mist-400)]">
                            {a.type.toLowerCase().replaceAll("_", " ")}
                          </span>
                        </div>
                        {a.impactSummary && (
                          <p className="mt-1 text-sm text-[var(--color-mist-300)]">{a.impactSummary}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-mist-400)]">
                          {a.assigneeEmail && <span>Owner {a.assigneeEmail}</span>}
                          {a.dueDate && <span>Due {new Date(a.dueDate).toLocaleDateString()}</span>}
                          <span>Created {new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {a.responseDraft && (
                        <p className="hidden max-w-xs shrink-0 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-[var(--color-mist-300)] lg:block">
                          Response draft: “{a.responseDraft}”
                        </p>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}