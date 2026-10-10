"use client";

import { useState } from "react";
import { Search, Loader2, History, ShieldCheck, FlaskConical } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

interface RecallMemory {
  id: string;
  title: string;
  summary: string;
  type: string;
  importance: number;
  confidence: number;
  occurredAt: string;
  score: number;
}

interface RecallResponse {
  label: "Actual" | "Estimated" | "Predicted" | "Demo";
  minScore: number;
  enoughData: boolean;
  evaluated: number;
  matched: number;
  founder: { found: boolean; entities: string[] } | null;
  results: RecallMemory[];
  recap?: string | null;
  memory?: RecallMemory | null;
}

const TYPE_LABEL: Record<string, string> = {
  PROBLEM_PATTERN: "Problem pattern",
  DECISION: "Decision",
  ACTION_OUTCOME: "Action outcome",
  INCIDENT: "Incident",
  EXPERIMENT: "Experiment",
  BUSINESS_FACT: "Business fact",
  MILESTONE: "Milestone",
  LESSON: "Lesson",
};

const LABEL_TONE: Record<RecallResponse["label"], "positive" | "neutral" | "negative" | "aurora" | "cyan" | "violet"> = {
  Actual: "positive",
  Estimated: "violet",
  Predicted: "cyan",
  Demo: "negative",
};

export function MemoryRecallPanel() {
  const [query, setQuery] = useState("");
  const [entities, setEntities] = useState("");
  const [data, setData] = useState<RecallResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runRecall(e: React.FormEvent) {
    e.preventDefault();
    const text = query.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/memory/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          entityNames: entities.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Recall failed.");
      setData(body as RecallResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recall failed.");
      setData(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard variant="interactive" className="p-6">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-[var(--color-accent-cyan)]" />
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold">
          Have we experienced this before?
        </h3>
      </div>
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
        Describe an issue or situation; Business Memory surfaces prior stored experience with its evidence.
      </p>

      <form onSubmit={runRecall} className="space-y-3">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          placeholder="e.g. Delivery delays around festival season, packaging damaged, north region"
          className="glass-input focus-ring w-full rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
        />
        <input
          value={entities}
          onChange={(e) => setEntities(e.target.value)}
          placeholder="Optional entities (comma separated): Bangalore, Acme, Zendesk"
          className="glass-input focus-ring w-full rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
        />
        <div className="flex items-center justify-end gap-2">
          <Button type="submit" size="sm" disabled={busy || !query.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Recall
          </Button>
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-[var(--color-signal-negative)]">{error}</p>}

      {data && (
        <div className="mt-5 space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Result label</span>
            <Badge tone={LABEL_TONE[data.label]}>
              {data.label === "Actual" ? <ShieldCheck className="mr-1 h-3 w-3" /> : <FlaskConical className="mr-1 h-3 w-3" />}
              {data.label}
            </Badge>
            {data.label === "Estimated" && (
              <span className="text-xs text-[var(--color-text-muted)]">model-based match, not a factual claim</span>
            )}
          </div>

          {data.results.length === 0 ? (
            <GlassCard variant="subtle" className="p-4 text-sm text-[var(--color-text-secondary)]">
              {data.evaluated === 0
                ? "No memories recorded yet — add your first Business Memory to start building recall."
                : `No stored memory matched that description (evaluated ${data.evaluated}, matched ${data.matched}). Nothing fabricated.`}
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {data.results.map((m) => (
                <GlassCard key={m.id} variant="subtle" className="p-4 hover-glass transition-all duration-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-text-primary)]">
                      {m.title}
                    </span>
                    <Badge tone="neutral">{TYPE_LABEL[m.type] ?? m.type.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{m.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
                    <span>Confidence <span className="font-semibold text-[var(--color-text-primary)]">{Math.round(m.confidence * 100)}%</span></span>
                    <span>Importance <span className="font-semibold text-[var(--color-text-primary)]">{Math.round(m.importance * 100)}%</span></span>
                    <span>When <span className="font-semibold text-[var(--color-text-primary)]">{new Date(m.occurredAt).toLocaleDateString()}</span></span>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}