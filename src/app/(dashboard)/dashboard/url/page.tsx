"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { AnalysisResultPanel } from "@/components/dashboard/analysis-result-panel";
import { EngineBadge } from "@/components/dashboard/engine-badge";
import { analyzeText, type FullTextAnalysis } from "@/lib/text-analysis";
import { Loader2, AlertTriangle, Link2, Globe } from "lucide-react";

export default function UrlAnalysisPage() {
  const [url, setUrl] = useState("https://en.wikipedia.org/wiki/Sentiment_analysis");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [extracted, setExtracted] = useState("");
  const [result, setResult] = useState<FullTextAnalysis | null>(null);
  const [engine, setEngine] = useState("local");

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't analyze that URL.");
        return;
      }
      setPageTitle(data.title);
      setExtracted(data.text);

      try {
        const scoreRes = await fetch("/api/analyze/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: data.text }),
        });
        const scoreData = await scoreRes.json();
        if (scoreRes.ok) {
          setResult(scoreData.result);
          setEngine(scoreData.engine);
        } else {
          setResult(analyzeText(data.text));
        }
      } catch {
        setResult(analyzeText(data.text));
      }
    } catch {
      setError("Network error while fetching that page.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar title="URL analysis" />
      <div className="space-y-6 p-6">
        <GlassCard className="p-6">
          <p className="mb-4 text-sm text-[var(--color-mist-400)]">
            Paste any article, blog post, or product page URL. A server route
            fetches the page, strips it down to readable text, and scores it —
            real page content, not a mock.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="focus-ring flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5">
              <Link2 className="h-4 w-4 shrink-0 text-[var(--color-mist-400)]" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full bg-transparent text-sm text-[var(--color-mist-100)] outline-none placeholder:text-[var(--color-mist-400)]/50"
              />
            </div>
            <Button onClick={handleAnalyze} disabled={loading || !url.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              Analyze
            </Button>
          </div>
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
              <div className="text-xs uppercase tracking-widest text-[var(--color-mist-400)]">{pageTitle || "Extracted content"}</div>
              <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-[var(--color-mist-300)]">
                {extracted.slice(0, 1500)}
                {extracted.length > 1500 ? "…" : ""}
              </p>
            </GlassCard>
            <AnalysisResultPanel result={result} />
          </>
        )}
      </div>
    </>
  );
}
