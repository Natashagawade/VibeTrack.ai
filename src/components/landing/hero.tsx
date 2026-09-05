"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { scoreSentiment, detectEmotions } from "@/lib/text-analysis";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PLACEHOLDER =
  "The new update is incredible — checkout finally feels fast and the support team was so helpful when I got stuck.";

export function Hero() {
  const [text, setText] = useState("");
  const active = text.trim().length > 0 ? text : PLACEHOLDER;

  const sentiment = useMemo(() => scoreSentiment(active), [active]);
  const emotions = useMemo(() => detectEmotions(active).slice(0, 3), [active]);

  const toneColor =
    sentiment.label === "Positive"
      ? "var(--color-signal-positive)"
      : sentiment.label === "Negative"
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
              Understand <span className="text-gradient-aurora">emotions.</span>
              <br />
              Discover insights.
            </h1>
            <p className="mt-6 max-w-lg text-lg font-medium text-[var(--color-mist-300)]">
              VibeTrack AI reads sentiment, emotion, and intent across text, audio,
              video, and documents — and turns it into a decision you can act on.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/dashboard">
                <Button size="lg">
                  Try it live <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#modalities">
                <Button size="lg" variant="outline">
                  See all modalities
                </Button>
              </a>
            </div>
            <div className="mt-10 flex gap-8 text-xs font-bold uppercase tracking-wider text-[var(--color-mist-400)]">
              <div>
                <div className="font-[family-name:var(--font-display)] text-4xl font-black text-white">12</div>
                content types
              </div>
              <div>
                <div className="font-[family-name:var(--font-display)] text-4xl font-black text-white">40+</div>
                signals
              </div>
              <div>
                <div className="font-[family-name:var(--font-display)] text-4xl font-black text-white">7</div>
                languages
              </div>
            </div>
          </motion.div>
        </div>

        {/* Signature element: a real, live sentiment reader — type and watch it think */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between border-b-2 border-white pb-3">
              <span className="text-xs font-black uppercase tracking-widest text-white">
                Live demo — type anything
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
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-none border-2 border-white bg-black p-4">
                <div className="text-xs font-black uppercase tracking-wider text-neutral-400">Sentiment</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-black uppercase" style={{ color: toneColor }}>
                  {sentiment.label}
                </div>
                <div className="mt-3 h-3 w-full overflow-hidden rounded-none border border-white bg-neutral-900">
                  <motion.div
                    className="h-full rounded-none"
                    style={{ background: toneColor }}
                    animate={{ width: `${Math.round(sentiment.confidence * 100)}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="mt-2 text-xs font-bold text-neutral-400">
                  {Math.round(sentiment.confidence * 100)}% confidence
                </div>
              </div>
              <div className="rounded-none border-2 border-white bg-black p-4">
                <div className="text-xs font-black uppercase tracking-wider text-neutral-400">Top emotions</div>
                <div className="mt-2 space-y-2">
                  {emotions.map((e) => (
                    <div key={e.emotion} className="flex items-center justify-between text-xs font-bold">
                      <span className="text-neutral-300 uppercase">{e.emotion}</span>
                      <span className="text-white font-black">
                        {Math.round(e.intensity * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
