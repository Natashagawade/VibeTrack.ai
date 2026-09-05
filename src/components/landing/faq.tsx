"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const QA = [
  {
    q: "What content can VibeTrack analyze?",
    a: "Text, images, audio, video, PDFs, DOCX, CSV, Excel, URLs, and social posts — all through the same scoring pipeline, so results are comparable across formats.",
  },
  {
    q: "Do I need to bring my own AI keys?",
    a: "The text engine ships working out of the box. Image, audio, and video modules connect to OpenAI, Gemini, Whisper, or your own model endpoints once you add keys in Settings.",
  },
  {
    q: "Can I monitor a brand that isn't mine?",
    a: "Yes — brand monitoring works on any public company or product, tracking reputation, complaint themes, and sentiment trend over time.",
  },
  {
    q: "Is there a REST API?",
    a: "Every module is available over a documented REST API with per-key rate limits, so you can pipe VibeTrack into your own product.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <h2 className="mb-10 text-center font-[family-name:var(--font-display)] text-5xl font-black uppercase tracking-tighter">
        Questions, answered
      </h2>
      <div className="space-y-4">
        {QA.map((item, i) => (
          <GlassCard key={item.q} className="overflow-hidden border-2 border-white bg-black">
            <button
              className="focus-ring flex w-full items-center justify-between px-6 py-5 text-left hover:bg-white hover:text-black transition-colors"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-black uppercase tracking-tight text-sm sm:text-base">{item.q}</span>
              <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", open === i && "rotate-180")} />
            </button>
            {open === i && (
              <p className="px-6 pt-2 pb-6 text-sm font-medium border-t-2 border-white bg-black text-neutral-400">{item.a}</p>
            )}
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
