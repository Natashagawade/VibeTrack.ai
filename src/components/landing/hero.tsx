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
              <span className="text-gradient-aurora">Know what to do next.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg font-medium text-[var(--color-mist-300)]">
              VibeTrack turns reviews, tickets, chats, calls, surveys, and docs into a single signal stream — then
              classifies it into issues, insights, and actions your team can assign and track.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/dashboard">
                <Button size="lg">
                  Open your dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/signals">
                <Button size="lg" variant="outline">
                  See the signal flow
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex gap-8 text-xs font-bold uppercase tracking-wider text-[var(--color-mist-400)]">
              <div>
                <div className="font-[family-name:var(--font-display)] text-4xl font-black text-white">9</div>
                capture modes
              </div>
              <div>
                <div className="font-[family-name:var(--font-display)] text-4xl font-black text-white">1</div>
                signal stream
              </div>
              <div>
                <div className="font-[family-name:var(--font-display)] text-4xl font-black text-white">0</div>
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
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between border-b-2 border-white pb-3">
              <span className="text-xs font-black uppercase tracking-widest text-white">
                Live signal reader — type any feedback
              </span>
              <span
                className="h-3 w-3 rounded-none border border-white"
                style={{ background: toneColor }}
              />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={4}
              className="focus-ring w-full resize-none rounded-none border-2 border-white bg-black p-4 text-sm font-bold text-white placeholder:text-neutral-600"
            />
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div className="rounded-none border-2 border-white bg-black p-4">
                <div className="text-xs font-black uppercase tracking-wider text-neutral-400">Sentiment</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-lg font-black uppercase" style={{ color: toneColor }}>
                  {live.sentiment.label}
                </div>
                <div className="mt-3 h-3 w-full overflow-hidden rounded-none border border-white bg-neutral-900">
                  <motion.div
                    className="h-full rounded-none"
                    style={{ background: toneColor }}
                    animate={{ width: `${Math.round(live.sentiment.confidence * 100)}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
              <div className="rounded-none border-2 border-white bg-black p-4">
                <div className="text-xs font-black uppercase tracking-wider text-neutral-400">Intent</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-lg font-black uppercase">
                  {live.signal.intent === "feature_request" ? "Feature request" : live.signal.intent}
                </div>
                <div className="mt-3 text-xs font-bold text-neutral-400">classified locally</div>
              </div>
              <div className="rounded-none border-2 border-white bg-black p-4">
                <div className="text-xs font-black uppercase tracking-wider text-neutral-400">Severity</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-lg font-black uppercase" style={{ color: live.signal.severity === "LOW" ? "var(--color-signal-neutral)" : "var(--color-signal-negative)" }}>
                  {live.signal.severity}
                </div>
                <div className="mt-3 text-xs font-bold text-neutral-400">
                  {live.signal.issueCategory === "general" ? "general category" : live.signal.issueCategory}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}