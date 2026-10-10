"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  UploadCloud, Table2, CheckCircle2, AlertTriangle, Loader2, Sparkles,
  FileSpreadsheet, ArrowRight, RotateCcw, Database,
} from "lucide-react";
import { Dropzone } from "@/components/ui/dropzone";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TARGET_FIELDS } from "@/lib/import/column-mapping";

interface PreviewStats {
  total: number;
  valid: number;
  validUnique: number;
  duplicate: number;
  invalid: number;
  existingInOrg: number;
}

interface PreviewRowItem {
  row: number;
  status: "valid" | "duplicate" | "invalid";
  values: Record<string, string>;
  extracted: Record<string, string>;
}

interface UploadResponse {
  import: { id: string; name: string; fileType: string; status: string };
  headers: string[];
  mapping: Record<string, string>;
  detected: Record<string, { target: string; confidence: number }>;
  previewRows: PreviewRowItem[];
  stats: PreviewStats;
  warnings: string[];
  truncated: boolean;
}

interface ProcessResponse {
  importId: string;
  status: string;
  total: number;
  valid: number;
  invalid: number;
  imported: number;
  duplicates: number;
  failed: number;
  failures: Array<{ row: number; reason: string }>;
  sourceId: string | null;
}

type Step = "upload" | "preview" | "processing" | "done";

const statusTone = (status: PreviewRowItem["status"]) =>
  status === "valid" ? "positive" : status === "duplicate" ? "neutral" : "negative";

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [headerTargets, setHeaderTargets] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ rows: PreviewRowItem[]; stats: PreviewStats } | null>(null);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mappingDirty, setMappingDirty] = useState(false);

  async function handleFile(file: File) {
    setBusy("Parsing your file…");
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/import/files", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      const up = data as UploadResponse;
      setUpload(up);
      const initial: Record<string, string> = {};
      for (const header of up.headers) {
        initial[header] = up.detected[header]?.target ?? "ignore";
      }
      setHeaderTargets(initial);
      setPreview({ rows: up.previewRows, stats: up.stats });
      setMappingDirty(false);
      setStep("preview");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function autodetect() {
    if (!upload) return;
    const initial: Record<string, string> = {};
    for (const header of upload.headers) {
      initial[header] = upload.detected[header]?.target ?? "ignore";
    }
    setHeaderTargets(initial);
    setMappingDirty(false);
  }

  async function applyMapping() {
    if (!upload) return;
    setBusy("Refreshing preview…");
    setError(null);
    try {
      const columnMapping: Record<string, string> = {};
      for (const [header, target] of Object.entries(headerTargets)) {
        if (target !== "ignore") columnMapping[target] = header;
      }
      if (!columnMapping["text"]) throw new Error("Map at least one column to Feedback text.");
      const res = await fetch(`/api/import/${upload.import.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnMapping }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save the mapping.");
      setPreview({ rows: data.previewRows, stats: data.stats });
      setMappingDirty(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function runImport() {
    if (!upload) return;
    setBusy("Importing… this can take a moment for large files.");
    setError(null);
    setStep("processing");
    try {
      const res = await fetch(`/api/import/${upload.import.id}/process`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed.");
      setResult(data as ProcessResponse);
      setStep("done");
    } catch (e) {
      setError((e as Error).message);
      setStep("preview");
    } finally {
      setBusy(null);
    }
  }

  const textMapped = useMemo(
    () => Object.values(headerTargets).some((t) => t === "text"),
    [headerTargets]
  );

  useEffect(() => {
    if (!preview) return;
  }, [preview]);

  if (step === "upload") {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-2xl space-y-6 p-6">
          <GlassCard variant="interactive" className="p-6 animate-fade-in-up">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--color-accent-cyan)]" />
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">Import feedback at scale</h2>
            </div>
            <p className="mb-5 text-sm text-[var(--color-text-secondary)]">
              Upload a CSV, Excel, JSON or TXT file with your reviews, tickets, survey responses or
              support conversations. VibeTrack validates the file, auto-detects your columns, previews
              duplicates + invalid rows, then funnels every record into your signals — the same
              intelligence pipeline behind your dashboards.
            </p>
            <Dropzone
              accept=".csv,.xlsx,.xls,.json,.txt"
              onFile={handleFile}
              label="Drop a file or click to browse"
              hint="CSV · XLSX · XLS · JSON · TXT — up to 25 MB, 10,000 rows"
            />
            {busy && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Loader2 className="h-4 w-4 animate-spin" /> {busy}
              </div>
            )}
            {error && (
              <div className="mt-4 flex items-start gap-2 text-sm text-[var(--color-signal-negative)]">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </GlassCard>
          <GlassCard variant="interactive" className="p-6 animate-fade-in-up delay-1">
            <h3 className="mb-3 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              What happens next
            </h3>
            <ol className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li><span className="text-[var(--color-accent-cyan)]">1.</span> Validate — size, type and content are checked before parsing.</li>
              <li><span className="text-[var(--color-accent-cyan)]">2.</span> Preview — every row is scored valid / duplicate / invalid.</li>
              <li><span className="text-[var(--color-accent-cyan)]">3.</span> Map columns — we detect customer ID, feedback, rating, date, product and more.</li>
              <li><span className="text-[var(--color-accent-cyan)]">4.</span> Import — records flow through the same pipeline as live feedback (dedupe, sentiment, intent, issues).</li>
            </ol>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              Raw rows are preserved with each signal for full traceability. Nothing is sent to AI providers.
            </p>
          </GlassCard>
        </div>
      </>
    );
  }

  if (step === "done" && result) {
    const imperfect = result.failed > 0;
    return (
      <>
        <Header />
        <div className="mx-auto max-w-2xl space-y-6 p-6">
          {imperfect ? (
            <GlassCard variant="interactive" className="flex items-start gap-3 p-6 border border-[var(--color-accent-amber)]/30 bg-[var(--color-accent-amber)]/5 animate-fade-in-up">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--color-accent-amber)]" />
              <div>
                <p className="font-[family-name:var(--font-display)] text-base font-semibold">Import finished with issues</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {result.failed} row{result.failed === 1 ? "" : "s"} couldn&apos;t be processed — everything else was imported.
                </p>
              </div>
            </GlassCard>
          ) : (
            <GlassCard variant="interactive" className="flex items-start gap-3 p-6 border border-[var(--color-signal-positive)]/30 bg-[var(--color-signal-positive)]/5 animate-fade-in-up">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-signal-positive)]" />
              <div>
                <p className="font-[family-name:var(--font-display)] text-base font-semibold">Import complete</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {result.imported.toLocaleString()} new signals created and flowing through your intelligence pipeline.
                </p>
              </div>
            </GlassCard>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Imported" value={result.imported} />
            <StatCard label="Duplicates skipped" value={result.duplicates} />
            <StatCard label="Invalid rows" value={result.invalid} />
            <StatCard label="Failed" value={result.failed} warn={result.failed > 0} />
          </div>

          {result.failures.length > 0 && (
            <GlassCard variant="interactive" className="p-6 animate-fade-in-up">
              <h3 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">Row errors</h3>
              <div className="max-h-64 divide-y divide-white/5 overflow-y-auto">
                {result.failures.slice(0, 10).map((f, i) => (
                  <div key={i} className="flex items-start gap-3 py-2.5 text-sm">
                    <Badge tone="negative">Row {f.row}</Badge>
                    <span className="text-[var(--color-text-secondary)]">{f.reason}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/signals"><Button>View signals <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/dashboard/sources"><Button variant="glass">Open data sources</Button></Link>
            <Button variant="glass" onClick={() => { setStep("upload"); setUpload(null); setResult(null); setError(null); }}>
              <RotateCcw className="h-4 w-4" /> Import another file
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Preview / mapping step
  return (
    <>
      <Header />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
              <FileSpreadsheet className="h-5 w-5 text-[var(--color-accent-cyan)]" />
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-sm font-semibold">{upload?.import.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {preview?.stats.total.toLocaleString()} rows · {upload?.import.fileType.toUpperCase()}
              </p>
            </div>
          </div>
          <Button variant="glass" size="sm" onClick={() => { setStep("upload"); setUpload(null); setError(null); }}>
            <RotateCcw className="h-4 w-4" /> New file
          </Button>
        </div>

        {upload?.warnings.map((w) => (
          <GlassCard key={w} variant="subtle" className="flex items-start gap-2 p-4 text-sm text-[var(--color-text-secondary)]">
            <Sparkles className="mt-0.5 h-4 w-4 text-[var(--color-accent-cyan)]" /> {w}
          </GlassCard>
        ))}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total rows" value={preview?.stats.total ?? 0} />
          <StatCard label="Valid" value={preview?.stats.valid ?? 0} tone="positive" />
          <StatCard label="Duplicates in file" value={preview?.stats.duplicate ?? 0} />
          <StatCard label="Already in org" value={preview?.stats.existingInOrg ?? 0} />
          <StatCard label="Invalid" value={preview?.stats.invalid ?? 0} tone="warning" />
        </div>

        <GlassCard variant="interactive" className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-base font-semibold">We detected your data structure</h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Review the column mapping below. Feedback text is required — adjust anything, then confirm.
              </p>
            </div>
            <Button variant="glass" size="sm" onClick={autodetect}>
              <Sparkles className="h-4 w-4" /> Autodetect
            </Button>
          </div>

          <div className="divide-y divide-white/5">
            {upload?.headers.map((header) => {
              const target = headerTargets[header] ?? "ignore";
              const detectedInfo = upload.detected[header];
              const isText = target === "text";
              return (
                <div key={header} className="grid items-center gap-3 py-3 text-sm sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text-primary)]">{header}</span>
                      {isText && <Badge tone="positive">Feedback text</Badge>}
                      {detectedInfo && detectedInfo.target !== "ignore" && detectedInfo.confidence >= 0.9 && (
                        <Badge tone="cyan">confident</Badge>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                      {detectedInfo && detectedInfo.target !== "ignore"
                        ? `sample: ${sampleValue(upload.previewRows, header)}`
                        : "no pattern detected — pick manually or ignore"}
                    </div>
                  </div>
                  <select
                    value={target}
                    onChange={(e) => {
                      setHeaderTargets((prev) => ({ ...prev, [header]: e.target.value }));
                      setMappingDirty(true);
                    }}
                    className="w-56 glass-input focus-ring rounded-xl px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  >
                    {TARGET_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-5">
            <p className="text-xs text-[var(--color-text-muted)]">
              {textMapped ? "Feedback text column mapped — ready to import." : "No column mapped to Feedback text yet."}
            </p>
            <div className="flex gap-3">
              {mappingDirty && (
                <Button variant="glass" size="sm" onClick={applyMapping} disabled={busy !== null}>
                  {busy === "Refreshing preview…" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Apply mapping
                </Button>
              )}
              <Button size="sm" onClick={runImport} disabled={!textMapped || busy !== null || step === "processing"}>
                {busy === "Importing… this can take a moment for large files." ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Import data
              </Button>
            </div>
          </div>
        </GlassCard>

        {error && (
          <div className="glass-badge border-[var(--color-signal-negative)]/30 bg-[var(--color-signal-negative)]/5 px-4 py-3 text-sm text-[var(--color-signal-negative)] flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" /> {error}
          </div>
        )}

        <GlassCard variant="interactive" className="overflow-hidden p-0">
          <div className="border-b border-white/5 px-6 py-3 text-sm font-medium text-[var(--color-text-secondary)]">
            Preview — first {Math.min(preview?.rows.length ?? 0, 25)}
          </div>
          <div className="max-h-96 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                  <th className="px-6 py-2 font-medium">#</th>
                  {upload?.headers.map((h) => (
                    <th key={h} className="px-4 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {preview?.rows.map((r) => (
                  <tr key={r.row} className="text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors">
                    <td className="px-6 py-2">
                      <Badge tone={statusTone(r.status)}>{r.row}</Badge>
                    </td>
                    {upload?.headers.map((h) => (
                      <td key={h} className="max-w-[220px] truncate px-4 py-2">{r.values[h] || ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

function sampleValue(rows: PreviewRowItem[], header: string): string {
  for (const r of rows) {
    if (r.values[header]) return r.values[header].slice(0, 40);
  }
  return "—";
}

function StatCard({ label, value, tone, warn }: { label: string; value: number; tone?: "positive" | "warning" | "negative"; warn?: boolean }) {
  const color =
    tone === "positive"
      ? "text-[var(--color-signal-positive)]"
      : tone === "negative" || warn
        ? "text-[var(--color-signal-negative)]"
        : tone === "warning"
          ? "text-[var(--color-accent-amber)]"
          : "text-[var(--color-text-primary)]";
  return (
    <GlassCard variant="interactive" className="p-4">
      <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{label}</div>
      <div className={`mt-1 font-[family-name:var(--font-display)] text-2xl ${color}`}>{value.toLocaleString()}</div>
    </GlassCard>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between border-b border-white/5 bg-[var(--color-bg-elevated)]/60 backdrop-blur-xl px-6 py-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">Import data</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Bulk-load reviews, tickets, surveys and chats from files.</p>
      </div>
      <Link href="/dashboard/sources" className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
        <Table2 className="h-4 w-4" /> Data sources
      </Link>
    </div>
  );
}