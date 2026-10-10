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
        <GlassCard variant="interactive" className="p-6 lg:col-span-2 animate-fade-in-up">
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Sparkles className="h-4 w-4 text-[var(--color-accent-cyan)]" />
            Paste text, a review, or a comment
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            className="focus-ring w-full resize-none rounded-xl glass-input px-4 py-4 text-sm leading-relaxed text-[var(--color-text-primary)]"
            placeholder="Paste customer feedback, a review, support ticket, or any text to analyze…"
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">{result?.wordCount ?? 0} words analyzed</span>
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
          <div className="flex items-center justify-between animate-fade-in-up">
            <span className="text-xs text-[var(--color-text-muted)]">Scored by</span>
            <EngineBadge engine={engine} />
          </div>

          {result ? (
            <>
              <AnalysisResultPanel result={result} />

              <GlassCard variant="interactive" className="p-6 animate-fade-in-up">
                <h3 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">Highlighted sentences</h3>
                <ul className="space-y-2">
                  {result.highlightedSentences.map((h, i) => (
                    <li key={i} className="glass-panel-subtle rounded-xl p-3 text-sm text-[var(--color-text-primary)]">
                      {h.sentence}
                    </li>
                  ))}
                  {result.highlightedSentences.length === 0 && (
                    <li className="text-sm text-[var(--color-text-muted)]">No standout sentences detected.</li>
                  )}
                </ul>
              </GlassCard>
            </>
          ) : (
            <GlassCard variant="interactive" className="flex flex-col items-center gap-3 p-10 text-center animate-fade-in-up">
              <Sparkles className="h-8 w-8 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-muted)] max-w-md">
                Paste a review, support ticket, or survey response on the left, then hit Analyze. The result is stored as a signal and feeds your intelligence.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </>
  );
}