"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
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
    <section className="relative overflow-hidden px-6 pt-20 pb-28">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-[family-name:var(--font-display)] text-6xl font-black leading-[0.95] tracking-tighter uppercase sm:text-8xl">
              Understand your
              <br />
              customers.
              <br />
              <span className="text-gradient-accent">Know what to do next.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg font-medium text-[var(--color-text-secondary)]">
              VibeTrack turns reviews, tickets, chats, calls, surveys, and docs into a single signal stream — then
              classifies it into issues, insights, and actions your team can assign and track.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" variant="primary">
                  Open your dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/signals">
                <Button size="lg" variant="glass">
                  See the signal flow
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex gap-8 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <div>
                <div className="font-[family-name:var(--font-display)] text-4xl font-black text-gradient-accent">9</div>
                capture modes
              </div>
              <div>
                <div className="font-[family-name:var(--font-display)] text-4xl font-black text-gradient-accent">1</div>
                signal stream
              </div>
              <div>
                <div className="font-[family-name:var(--font-display)] text-4xl font-black text-gradient-accent">0</div>
                fabricated metrics
              </div>
            </div>
          </motion.div>
        </div>

        {/* Live signal reader: real classification of whatever you type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <GlassCard variant="interactive" className="p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
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
              className="focus-ring w-full resize-none rounded-xl glass-input px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
            <div className="mt-5 grid grid-cols-3 gap-4">
              <GlassCard variant="strong" className="p-4">
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Sentiment</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-lg font-black uppercase" style={{ color: toneColor }}>
                  {live.sentiment.label}
                </div>
                <div className="mt-3 h-3 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${toneColor}, ${toneColor})` }}
                    animate={{ width: `${Math.round(live.sentiment.confidence * 100)}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </GlassCard>
              <GlassCard variant="strong" className="p-4">
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Intent</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-lg font-black uppercase">
                  {live.signal.intent === "feature_request" ? "Feature request" : live.signal.intent}
                </div>
                <div className="mt-3 text-xs font-bold text-[var(--color-text-muted)]">classified locally</div>
              </GlassCard>
              <GlassCard variant="strong" className="p-4">
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Severity</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-lg font-black uppercase" style={{ color: live.signal.severity === "LOW" ? "var(--color-signal-neutral)" : "var(--color-signal-negative)" }}>
                  {live.signal.severity}
                </div>
                <div className="mt-3 text-xs font-bold text-[var(--color-text-muted)]">
                  {live.signal.issueCategory === "general" ? "general category" : live.signal.issueCategory}
                </div>
              </GlassCard>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}