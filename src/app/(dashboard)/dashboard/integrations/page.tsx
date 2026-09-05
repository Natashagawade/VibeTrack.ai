import { Plug } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

const STATUS_TONE: Record<string, "neutral" | "positive" | "negative"> = {
  CONNECTED: "positive",
  NOT_CONFIGURED: "neutral",
  ERROR: "negative",
  DISABLED: "neutral",
};

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const ctx = await requireOrg();
  const integrations = await prisma.integration.findMany({
    where: { orgId: ctx.orgId },
    orderBy: [{ status: "asc" }, { kind: "asc" }],
  });

  const connected = integrations.filter((i) => i.status === "CONNECTED").length;

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Integrations</h1>
          <p className="text-sm text-[var(--color-mist-400)]">
            {connected} of {integrations.length.toLocaleString()} connected — where signals come from and where actions
            go.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {integrations.length === 0 ? (
          <GlassCard className="flex flex-col items-center gap-4 p-16 text-center">
            <Plug className="h-8 w-8 text-[var(--color-mist-400)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">No integrations yet</h2>
            <p className="max-w-md text-sm text-[var(--color-mist-400)]">
              Connect sources like Zendesk, Intercom, or Slack to stream signals in, and destinations like Jira or
              Linear to push actions out.
            </p>
          </GlassCard>
        ) : (
          <GlassCard className="overflow-hidden p-0">
            <div className="divide-y divide-white/5">
              <div className="grid grid-cols-[minmax(0,1fr)_140px_auto] items-center gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-mist-400)]">
                <span>Integration</span>
                <span>Status</span>
                <span />
              </div>
              {integrations.map((i) => (
                <div key={i.id} className="grid grid-cols-[minmax(0,1fr)_140px_auto] items-center gap-4 px-6 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--color-mist-100)]">{i.name}</div>
                    <div className="text-xs text-[var(--color-mist-400)]">
                      {i.kind.toLowerCase().replaceAll("_", " ")}
                      {i.lastError ? ` · ${i.lastError}` : ""}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[i.status] ?? "neutral"}>{i.status.toLowerCase().replaceAll("_", " ")}</Badge>
                  <span className="text-xs text-[var(--color-mist-400)]">
                    {i.status === "CONNECTED"
                      ? `connected ${i.updatedAt ? new Date(i.updatedAt).toLocaleDateString() : ""}`
                      : i.setupUrl
                        ? "setup link"
                        : "—"}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}