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
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard variant="strong" className="p-5">
          <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Sentiment</div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold" style={{ color: toneColor }}>
            {result.sentiment.label}
          </div>
          <div className="mt-2 text-xs text-[var(--color-text-muted)]">
            {Math.round(result.sentiment.confidence * 100)}% confidence
          </div>
        </GlassCard>
        <GlassCard variant="strong" className="p-5">
          <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Toxicity</div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{result.toxicity.label}</div>
          <div className="mt-2 text-xs text-[var(--color-text-muted)]">Score {result.toxicity.score.toFixed(2)}</div>
        </GlassCard>
        <GlassCard variant="strong" className="p-5">
          <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Language</div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{result.language}</div>
          <div className="mt-2 text-xs text-[var(--color-text-muted)]">Auto-detected · {result.wordCount} words</div>
        </GlassCard>
      </div>

      <GlassCard variant="interactive" className="p-6">
        <h3 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold">Emotion breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={emotionChartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="emotion" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} width={90} />
            <Tooltip 
              contentStyle={{ 
                background: "var(--color-bg-elevated)", 
                border: "1px solid rgba(255,255,255,0.1)", 
                borderRadius: 12,
                backdropFilter: "blur(16px)",
              }} 
            />
            <Bar dataKey="intensity" fill="url(#emotionGradient)" radius={[0, 6, 6, 0]} />
            <defs>
              <linearGradient id="emotionGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-accent-violet)" />
                <stop offset="100%" stopColor="var(--color-accent-cyan)" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard variant="interactive" className="p-6">
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((k) => (
              <Badge key={k.word} tone="neutral">{k.word} · {k.count}</Badge>
            ))}
            {result.keywords.length === 0 && (
              <span className="text-sm text-[var(--color-text-muted)]">No strong keywords detected.</span>
            )}
          </div>
        </GlassCard>
        <GlassCard variant="interactive" className="p-6">
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">AI summary</h3>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{result.summary || "Not enough text to summarize."}</p>
        </GlassCard>
      </div>
    </div>
  );
}