"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import type { FullTextAnalysis } from "@/lib/text-analysis";

export function AnalysisResultPanel({ result }: { result: FullTextAnalysis }) {
  const toneColor =
    result.sentiment.label === "Positive"
      ? "var(--color-signal-positive)"
      : result.sentiment.label === "Negative"
      ? "var(--color-signal-negative)"
      : "var(--color-signal-neutral)";

  const emotionChartData = result.emotions.map((e) => ({
    emotion: e.emotion,
    intensity: Math.round(e.intensity * 100),
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-5">
          <div className="text-xs text-[var(--color-mist-400)]">Sentiment</div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-2xl" style={{ color: toneColor }}>
            {result.sentiment.label}
          </div>
          <div className="mt-2 text-xs text-[var(--color-mist-400)]">
            {Math.round(result.sentiment.confidence * 100)}% confidence
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-xs text-[var(--color-mist-400)]">Toxicity</div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{result.toxicity.label}</div>
          <div className="mt-2 text-xs text-[var(--color-mist-400)]">Score {result.toxicity.score.toFixed(2)}</div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-xs text-[var(--color-mist-400)]">Language</div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">{result.language}</div>
          <div className="mt-2 text-xs text-[var(--color-mist-400)]">Auto-detected · {result.wordCount} words</div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold">Emotion breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={emotionChartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} stroke="#8b93b0" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="emotion" stroke="#8b93b0" fontSize={12} tickLine={false} axisLine={false} width={90} />
            <Tooltip contentStyle={{ background: "#101524", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
            <Bar dataKey="intensity" fill="#7c6cf6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((k) => (
              <Badge key={k.word} tone="aurora">{k.word} · {k.count}</Badge>
            ))}
            {result.keywords.length === 0 && (
              <span className="text-sm text-[var(--color-mist-400)]">No strong keywords detected.</span>
            )}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">AI summary</h3>
          <p className="text-sm text-[var(--color-mist-300)]">{result.summary || "Not enough text to summarize."}</p>
        </GlassCard>
      </div>
    </div>
  );
}
