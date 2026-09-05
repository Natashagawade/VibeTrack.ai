"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Dropzone } from "@/components/ui/dropzone";
import { AnalysisResultPanel } from "@/components/dashboard/analysis-result-panel";
import { extractDocumentText } from "@/lib/document-extract";
import { analyzeText, type FullTextAnalysis } from "@/lib/text-analysis";
import { EngineBadge } from "@/components/dashboard/engine-badge";
import { Loader2, AlertTriangle, FileText } from "lucide-react";

export default function DocumentAnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<string>("");
  const [result, setResult] = useState<FullTextAnalysis | null>(null);
  const [engine, setEngine] = useState("local");
  const [fileName, setFileName] = useState("");

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const text = await extractDocumentText(file);
      if (!text || text.length < 5) {
        setError("Couldn't find readable text in that file — it may be a scanned image PDF.");
        setLoading(false);
        return;
      }
      setExtracted(text);

      try {
        const res = await fetch("/api/analyze/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (res.ok) {
          setResult(data.result);
          setEngine(data.engine);
        } else {
          setResult(analyzeText(text));
          setEngine("local");
        }
      } catch {
        setResult(analyzeText(text));
        setEngine("local");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read that file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar title="Document analysis" />
      <div className="space-y-6 p-6">
        <GlassCard className="p-6">
          <p className="mb-4 text-sm text-[var(--color-mist-400)]">
            Upload a PDF or Word (.docx) file. Text is extracted directly in
            your browser, then scored through the same engine as Text
            analysis — nothing is uploaded to a server.
          </p>
          <Dropzone
            accept=".pdf,.docx"
            onFile={handleFile}
            label="Drop a PDF or DOCX file, or click to browse"
            hint="Text-based documents only — scanned/image PDFs aren't supported yet"
          />
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-mist-400)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Extracting and analyzing “{fileName}”…
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-signal-negative)]">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}
        </GlassCard>

        {result && (
          <>
            <div className="flex justify-end">
              <EngineBadge engine={engine} />
            </div>
            <GlassCard className="p-6">
              <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-mist-400)]">
                <FileText className="h-4 w-4" /> Extracted text preview
              </div>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-[var(--color-mist-300)]">
                {extracted.slice(0, 2000)}
                {extracted.length > 2000 ? "…" : ""}
              </p>
            </GlassCard>
            <AnalysisResultPanel result={result} />
          </>
        )}
      </div>
    </>
  );
}
