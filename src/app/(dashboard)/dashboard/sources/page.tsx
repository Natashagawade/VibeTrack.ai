import Link from "next/link";
import { Database, UploadCloud, Plug, Inbox, CircleDot, CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/authz";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "positive" | "neutral" | "negative" | "aurora"> = {
  IN_SYNC: "positive",
  SYNCING: "aurora",
  NOT_SYNCED: "neutral",
  DISABLED: "neutral",
  ERROR: "negative",
  COMPLETED: "positive",
  PARTIALLY_COMPLETED: "warning" as never,
  FAILED: "negative",
  PREVIEWED: "aurora",
  PROCESSING: "aurora",
  UPLOADED: "neutral",
  QUEUED: "neutral",
  CANCELLED: "neutral",
};

const tone = (status: string) => STATUS_TONE[status] ?? "neutral";

const KIND_LABELS: Record<string, string> = {
  upload: "File import",
  review: "Reviews",
  support: "Support",
  social: "Social",
  call: "Calls",
  survey: "Surveys",
  url: "URL",
  news: "News",
};

function statusLabel(status: string): string {
  return status.toLowerCase().replaceAll("_", " ");
}

export default async function SourcesPage() {
  const ctx = await requireOrg();

  const [sources, imports, integrations] = await Promise.all([
    prisma.source.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { lastSyncAt: "desc" },
      take: 50,
    }),
    prisma.import.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.integration.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { kind: "asc" },
    }),
  ]);

  const connectedIntegrations = integrations.filter((i) => i.status === "CONNECTED").length;

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Data sources</h1>
          <p className="text-sm text-[var(--color-mist-400)]">
            Everything feeding your signals — file imports first, live connectors next.
          </p>
        </div>
        <Link href="/dashboard/import">
          <Button size="sm">
            <UploadCloud className="h-4 w-4" /> Import a file
          </Button>
        </Link>
      </div>

      <div className="space-y-8 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard className="p-5">
            <div className="text-xs text-[var(--color-mist-400)]">Active sources</div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{sources.length}</div>
            <p className="mt-1 text-xs text-[var(--color-mist-400)]">
              {sources.filter((s) => s.enabled).length} enabled · {sources.filter((s) => s.syncStatus === "IN_SYNC").length} in sync
            </p>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="text-xs text-[var(--color-mist-400)]">Records synced</div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">
              {sources.reduce((sum, s) => sum + s.recordsSynced, 0).toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-[var(--color-mist-400)]">cumulative across sources</p>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="text-xs text-[var(--color-mist-400)]">Connectors</div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{connectedIntegrations} / {integrations.length}</div>
            <Link href="/dashboard/integrations" className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-aurora-cyan)] hover:underline">
              <Plug className="h-3 w-3" /> Configure integrations
            </Link>
          </GlassCard>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">Sources</h2>
            <span className="text-xs text-[var(--color-mist-400)]">{sources.length} total</span>
          </div>

          {sources.length === 0 ? (
            <GlassCard className="flex flex-col items-center gap-4 p-12 text-center">
              <Inbox className="h-8 w-8 text-[var(--color-mist-400)]" />
              <p className="max-w-sm text-sm text-[var(--color-mist-400)]">
                No sources yet. Import your first file to create one, or analyze feedback live from the Capture menu.
              </p>
              <Link href="/dashboard/import"><Button>Import a file</Button></Link>
            </GlassCard>
          ) : (
            <GlassCard className="overflow-hidden p-0">
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_140px] items-center gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-mist-400)]">
                  <span>Source</span>
                  <span>Status</span>
                  <span className="text-right">Records</span>
                  <span>Last sync</span>
                </div>
                {sources.map((s) => (
                  <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_120px_120px_140px] items-center gap-4 px-6 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {s.enabled ? (
                          <CircleDot className="h-3.5 w-3.5 shrink-0 text-[var(--color-aurora-cyan)]" />
                        ) : (
                          <CircleDot className="h-3.5 w-3.5 shrink-0 text-[var(--color-mist-400)]" />
                        )}
                        <span className="truncate text-[var(--color-mist-100)]">{s.name}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--color-mist-400)]">
                        {KIND_LABELS[s.kind] ?? s.kind} · {s.kind}
                      </div>
                      {s.lastSyncError && <div className="mt-0.5 text-xs text-[var(--color-signal-negative)]">{s.lastSyncError}</div>}
                    </div>
                    <div>
                      <Badge tone={tone(s.syncStatus)}>{statusLabel(s.syncStatus)}</Badge>
                    </div>
                    <div className="text-right text-[var(--color-mist-300)]">{s.recordsSynced.toLocaleString()}</div>
                    <div className="text-xs text-[var(--color-mist-400)]">
                      {s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleDateString() : "never"}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">Recent imports</h2>
            <Link href="/dashboard/import" className="text-xs text-[var(--color-aurora-cyan)] hover:underline">Import data</Link>
          </div>

          {imports.length === 0 ? (
            <GlassCard className="p-6 text-sm text-[var(--color-mist-400)]">
              No imports yet — CSV, Excel, JSON and TXT files appear here.
            </GlassCard>
          ) : (
            <GlassCard className="overflow-hidden p-0">
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-[minmax(0,1fr)_120px_90px_90px_120px] items-center gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-mist-400)]">
                  <span>File</span>
                  <span>Status</span>
                  <span className="text-right">Rows</span>
                  <span className="text-right">Imported</span>
                  <span>Date</span>
                </div>
                {imports.map((imp) => (
                  <div key={imp.id} className="grid grid-cols-[minmax(0,1fr)_120px_90px_90px_120px] items-center gap-4 px-6 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {imp.status === "COMPLETED" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--color-signal-positive)]" />
                        ) : imp.status === "FAILED" ? (
                          <XCircle className="h-3.5 w-3.5 shrink-0 text-[var(--color-signal-negative)]" />
                        ) : (
                          <Database className="h-3.5 w-3.5 shrink-0 text-[var(--color-mist-400)]" />
                        )}
                        <span className="truncate text-[var(--color-mist-100)]">{imp.name}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--color-mist-400)]">
                        {imp.fileType.toUpperCase()} · {imp.duplicateRecords} duplicate · {imp.invalidRecords} invalid
                      </div>
                    </div>
                    <div>
                      <Badge tone={tone(imp.status)}>{statusLabel(imp.status)}</Badge>
                    </div>
                    <div className="text-right text-[var(--color-mist-300)]">{imp.totalRecords.toLocaleString()}</div>
                    <div className="text-right text-[var(--color-mist-300)]">{imp.importedRecords.toLocaleString()}</div>
                    <div className="text-xs text-[var(--color-mist-400)]">{new Date(imp.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </section>

        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-base font-semibold">Live connectors are next</h3>
              <p className="mt-1 max-w-xl text-sm text-[var(--color-mist-400)]">
                The sync engine behind this schema will pull from Shopify, Zendesk and Google Business Profile
                with OAuth, cursor-based watermarks and audit trails — but your file pipeline is fully working today.
              </p>
            </div>
            <Link href="/dashboard/integrations"><Button variant="ghost">Connectors</Button></Link>
          </div>
        </GlassCard>
      </div>
    </>
  );
}