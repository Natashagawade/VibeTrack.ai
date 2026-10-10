"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

const TYPES = [
  "PROBLEM_PATTERN",
  "DECISION",
  "ACTION_OUTCOME",
  "INCIDENT",
  "EXPERIMENT",
  "BUSINESS_FACT",
  "MILESTONE",
  "LESSON",
];

export function MemoryCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    type: "PROBLEM_PATTERN",
    title: "",
    summary: "",
    entityNames: "",
    tags: "",
    occurredAt: "",
    importance: "",
    confidence: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          summary: form.summary.trim(),
          entityNames: form.entityNames.split(",").map((s) => s.trim()).filter(Boolean),
          tags: form.tags.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
          occurredAt: form.occurredAt ? new Date(form.occurredAt + "T12:00:00").toISOString() : undefined,
          importance: form.importance ? Number(form.importance) : undefined,
          confidence: form.confidence ? Number(form.confidence) : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to save memory.");
      setDone(true);
      setForm({ type: "PROBLEM_PATTERN", title: "", summary: "", entityNames: "", tags: "", occurredAt: "", importance: "", confidence: "" });
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        setDone(false);
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save memory.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard variant="interactive" className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-base font-semibold">Record a memory</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Store a real business fact, decision, outcome or problem pattern — evidence-backed only.
          </p>
        </div>
        <Button size="sm" variant="glass" onClick={() => setOpen((o) => !o)}>
          <Plus className="h-3.5 w-3.5" /> {open ? "Close" : "New memory"}
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-5 space-y-4 animate-fade-in-up">
          {done && (
            <div className="glass-badge text-[var(--color-signal-positive)] border-[var(--color-signal-positive)]/30 bg-[var(--color-signal-positive)]/10 px-3 py-2 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Memory saved.
            </div>
          )}
          {error && <p className="text-sm text-[var(--color-signal-negative)]">{error}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="glass-input focus-ring rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)]"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t.replaceAll("_", " ").toLowerCase()}</option>
              ))}
            </select>
            <input
              value={form.occurredAt}
              onChange={(e) => set("occurredAt", e.target.value)}
              type="date"
              className="glass-input focus-ring rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)]"
            />
          </div>

          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Title, e.g. Delivery delays recur at month-end"
            className="glass-input focus-ring w-full rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
          <Textarea
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            rows={3}
            placeholder="What actually happened, what was done, and the measured outcome — no speculation."
            className="glass-input focus-ring w-full rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.entityNames}
              onChange={(e) => set("entityNames", e.target.value)}
              placeholder="Entities (comma): Bangalore, Acme"
              className="glass-input focus-ring rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="Tags (comma): logistics, season"
              className="glass-input focus-ring rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--color-text-secondary)]">Importance (0–1)</label>
              <input
                value={form.importance}
                onChange={(e) => set("importance", e.target.value)}
                type="number"
                min={0}
                max={1}
                step={0.1}
                className="flex-1 glass-input focus-ring rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--color-text-secondary)]">Confidence (0–1)</label>
              <input
                value={form.confidence}
                onChange={(e) => set("confidence", e.target.value)}
                type="number"
                min={0}
                max={1}
                step={0.1}
                className="flex-1 glass-input focus-ring rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={busy || !form.title.trim() || !form.summary.trim()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save memory
            </Button>
          </div>
        </form>
      )}
    </GlassCard>
  );
}