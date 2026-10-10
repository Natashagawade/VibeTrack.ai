"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { scoreSentiment } from "@/lib/text-analysis";
import { classifySignal } from "@/lib/analysis";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PLACEHOLDER =
  "I've been waiting four days for a refund and support has gone silent. If this isn't fixed soon, I'm cancelling.";

export function Hero() {
  const [text, setText] = useState("");
  const active = text.trim().length > 0 ? text : PLACEHOLDER;

  const live = useMemo(() => {
    const sentiment = scoreSentiment(active);
    const signal = classifySignal(active, {
      sentiment,
      emotions: [],
      keywords: [],
      toxicity: { label: "Low", score: 0.1 },
      highlightedSentences: [],
      summary: "",
      language: "en",
      wordCount: active.trim().split(/\s+/).filter(Boolean).length,
    });
    return { sentiment, signal };
  }, [active]);

  const toneColor =
    live.sentiment.label === "Positive"
      ? "var(--color-signal-positive)"
      : live.sentiment.label === "Negative"
      ? "var(--color-signal-negative)"
      : "var(--color-signal-neutral)";

  return (
    <section className="relative overflow-hidden px-6 pt-16 pb-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Understand your customers.
            <br />
            <span>Know what to do next.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-[var(--color-text-secondary)]">
            VibeTrack turns reviews, tickets, chats, calls, surveys, and docs into a single signal stream — then
            classifies it into issues, insights, and actions your team can assign and track.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/dashboard">
              <Button size="md" variant="primary">
                Open dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/signals">
              <Button size="md" variant="glass">
                See the signal flow
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex gap-10 text-xs font-medium text-[var(--color-text-muted)]">
            <div>
              <div className="font-[family-name:var(--font-display)] text-xl font-semibold">9</div>
              capture modes
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-xl font-semibold">1</div>
              signal stream
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-xl font-semibold">0</div>
              fabricated metrics
            </div>
          </div>
        </div>

        <GlassCard variant="interactive" className="p-5">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Live signal reader — type any feedback
            </span>
            <span
              className="h-3 w-3 rounded-full border border-white/10"
              style={{ background: toneColor }}
            />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={4}
            className="focus-ring w-full resize-none rounded-xl glass-input px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <GlassCard variant="strong" className="p-4">
              <div className="text-xs text-[var(--color-text-muted)]">Sentiment</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-base font-semibold" style={{ color: toneColor }}>
                {live.sentiment.label}
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                <div
                  className="h-full rounded-full bg-[var(--color-text-primary)]"
                  style={{ width: `${Math.round(live.sentiment.confidence * 100)}%` }}
                />
              </div>
            </GlassCard>
            <GlassCard variant="strong" className="p-4">
              <div className="text-xs text-[var(--color-text-muted)]">Intent</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-base font-semibold">
                {live.signal.intent === "feature_request" ? "Feature request" : live.signal.intent}
              </div>
              <div className="mt-3 text-xs text-[var(--color-text-muted)]">classified locally</div>
            </GlassCard>
            <GlassCard variant="strong" className="p-4">
              <div className="text-xs text-[var(--color-text-muted)]">Severity</div>
              <div
                className="mt-1 font-[family-name:var(--font-display)] text-base font-semibold"
                style={{ color: live.signal.severity === "LOW" ? "var(--color-text-muted)" : "var(--color-text-primary)" }}
              >
                {live.signal.severity}
              </div>
              <div className="mt-3 text-xs text-[var(--color-text-muted)]">
                {live.signal.issueCategory === "general" ? "general category" : live.signal.issueCategory}
              </div>
            </GlassCard>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
