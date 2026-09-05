"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { EngineBadge } from "@/components/dashboard/engine-badge";
import { AnalysisResultPanel } from "@/components/dashboard/analysis-result-panel";
import { analyzeText, type FullTextAnalysis } from "@/lib/text-analysis";
import { Sparkles, Wand2, Loader2, AlertTriangle } from "lucide-react";

export default function TextAnalysisPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<FullTextAnalysis | null>(null);
  const [engine, setEngine] = useState<string>("local");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed.");
        return;
      }
      setResult(data.result);
      setEngine(data.engine);
    } catch {
      setError("Network error — falling back to the local engine.");
      setResult(analyzeText(input));
      setEngine("local");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar title="Text analysis" />
      <div className="grid gap-6 p-6 lg:grid-cols-5">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-mist-400)]">
            <Sparkles className="h-4 w-4 text-[var(--color-aurora-cyan)]" />
            Paste text, a review, or a comment
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            className="focus-ring w-full resize-none rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-[var(--color-mist-100)]"
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-[var(--color-mist-400)]">{result?.wordCount ?? 0} words analyzed</span>
            <Button onClick={handleAnalyze} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Analyze
            </Button>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-signal-negative)]">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}
        </GlassCard>

        <div className="space-y-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-mist-400)]">Scored by</span>
            <EngineBadge engine={engine} />
          </div>

          {result ? (
            <>
              <AnalysisResultPanel result={result} />

              <GlassCard className="p-6">
                <h3 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">Highlighted sentences</h3>
                <ul className="space-y-2">
                  {result.highlightedSentences.map((h, i) => (
                    <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-[var(--color-mist-200)]">
                      {h.sentence}
                    </li>
                  ))}
                  {result.highlightedSentences.length === 0 && (
                    <li className="text-sm text-[var(--color-mist-400)]">No standout sentences detected.</li>
                  )}
                </ul>
              </GlassCard>
            </>
          ) : (
            <GlassCard className="flex flex-col items-center gap-3 p-10 text-center">
              <Sparkles className="h-6 w-6 text-[var(--color-mist-400)]" />
              <p className="text-sm text-[var(--color-mist-400)]">
                Paste a review, support ticket, or survey response on the left, then hit Analyze. The result is stored
                as a signal and feeds your intelligence.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </>
  );
}
