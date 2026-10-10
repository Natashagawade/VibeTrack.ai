"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const QA = [
  {
    q: "What content can VibeTrack analyze?",
    a: "Text, images (including OCR and on-device facial expression), audio, PDFs, DOCX, CSV, Excel and URLs — all through the same scoring pipeline, so results are comparable across formats.",
  },
  {
    q: "Do I need to bring my own AI keys?",
    a: "Text, image pixel/OCR analysis and facial expression recognition all ship working out of the box with no keys. The audio module connects to OpenAI Whisper, and AI caption/scene labels need an OpenAI vision key — add them in Settings.",
  },
  {
    q: "Can I monitor competitors I don't own?",
    a: "Yes. Name the competitors you care about and every customer signal that mentions them is tracked — mention volume, sentiment mix, top issues and week-over-week movement.",
  },
  {
    q: "Is there a REST API?",
    a: "Yes — POST /api/signals accepts your own feedback, and /api/intelligence exposes the computed intelligence, both with scoped API keys.",
  },
  {
    q: "Do I need an account?",
    a: "No. VibeTrack is public — open it and start analyzing. Add DATABASE_URL to persist signals and intelligence.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <h2 className="mb-10 text-center font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
        Questions, answered
      </h2>
      <div className="space-y-4">
        {QA.map((item, i) => (
          <GlassCard key={item.q} variant="interactive" className="overflow-hidden">
            <button
              className="focus-ring flex w-full items-center justify-between px-6 py-5 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.q}</span>
              <ChevronDown className={cn("h-5 w-5 shrink-0 text-[var(--color-text-secondary)] transition-transform duration-200", open === i && "rotate-180")} />
            </button>
            {open === i && (
              <p className="px-6 pt-2 pb-6 text-sm font-medium border-t border-white/10 text-[var(--color-text-secondary)] animate-fade-in-up">{item.a}</p>
            )}
          </GlassCard>
        ))}
      </div>
    </section>
  );
}