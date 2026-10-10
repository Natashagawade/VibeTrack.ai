"use client";

import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { analyzeBatch, toReportCSV, type BatchAnalysis } from "@/lib/batch-analysis";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Download, Loader2, AlertTriangle } from "lucide-react";

const COLORS: Record<string, string> = {
  Positive: "#4fe0a0",
  Negative: "#f66b6b",
  Neutral: "#8b93b0",
};

export default function CsvAnalysisPage() {
  const [batch, setBatch] = useState<BatchAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  function processRows(rows: Record<string, string>[]) {
    if (rows.length === 0) {
      setError("No rows found in that file.");
      setBatch(null);
      return;
    }
    setError(null);
    setBatch(analyzeBatch(rows));
  }

  function handleFile(file: File) {
    setLoading(true);
    setFileName(file.name);
    const isExcel = /\.xlsx?$/.test(file.name);

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, string>[];
          processRows(rows);
        } catch {
          setError("Couldn't read that Excel file.");
        }
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          processRows(res.data);
          setLoading(false);
        },
        error: () => {
          setError("Couldn't parse that CSV file.");
          setLoading(false);
        },
      });
    }
  }

  function downloadReport() {
    if (!batch) return;
    const blob = new Blob([toReportCSV(batch)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibetrack-report-${fileName.replace(/\.[^.]+$/, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Topbar title="CSV & Excel analysis" />
      <div className="space-y-6 p-6">
        <GlassCard className="p-6">
          <p className="mb-4 text-sm text-[var(--color-mist-400)]">
            Upload a CSV or Excel file with a reviews/comments column. VibeTrack
            auto-detects the free-text column and scores every row through the
            same engine as Text analysis — entirely in your browser.
          </p>
          <Dropzone
            accept=".csv,.xlsx,.xls"
            onFile={handleFile}
            label="Drop a CSV or Excel file, or click to browse"
            hint="Up to 500 rows analyzed per upload"
          />
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-mist-400)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Parsing and scoring rows…
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-signal-negative)]">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}
        </GlassCard>

        {batch && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <GlassCard className="p-5">
                <div className="text-xs text-[var(--color-mist-400)]">Rows analyzed</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{batch.totalRows}</div>
              </GlassCard>
              <GlassCard className="p-5">
                <div className="text-xs text-[var(--color-mist-400)]">Column used</div>
                <div className="mt-1 truncate font-[family-name:var(--font-display)] text-lg">{batch.columnUsed}</div>
              </GlassCard>
              <GlassCard className="p-5">
                <div className="text-xs text-[var(--color-mist-400)]">Avg. sentiment</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{batch.avgSentiment.toFixed(2)}</div>
              </GlassCard>
              <GlassCard className="p-5">
                <div className="text-xs text-[var(--color-mist-400)]">Toxicity flags</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{batch.toxicFlags}</div>
              </GlassCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <GlassCard className="p-6">
                <h3 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold">Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={batch.distribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {batch.distribution.map((d) => (
                        <Cell key={d.name} fill={COLORS[d.name]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#101524", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#aab1c9" }} />
                  </PieChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="p-6 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-[family-name:var(--font-display)] text-base font-semibold">Top keywords</h3>
                  <Button size="sm" variant="ghost" onClick={downloadReport}>
                    <Download className="h-4 w-4" /> Download report
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {batch.topKeywords.map((k) => (
                    <Badge key={k.word} tone="neutral">{k.word} · {k.count}</Badge>
                  ))}
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-6">
              <h3 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold">Row-level results</h3>
              <div className="max-h-96 divide-y divide-white/5 overflow-y-auto">
                {batch.results.slice(0, 100).map((r) => (
                  <div key={r.rowIndex} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="truncate text-[var(--color-mist-300)]">{r.text}</span>
                    <Badge tone={r.sentimentLabel === "Positive" ? "positive" : r.sentimentLabel === "Negative" ? "negative" : "neutral"}>
                      {r.sentimentLabel}
                    </Badge>
                  </div>
                ))}
              </div>
              {batch.results.length > 100 && (
                <p className="mt-3 text-xs text-[var(--color-mist-400)]">
                  Showing first 100 of {batch.results.length} rows — download the full report above.
                </p>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </>
  );
}
