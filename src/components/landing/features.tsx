import { GlassCard } from "@/components/ui/glass-card";
import {
  Brain, MessageSquareText, Image as ImageIcon, Mic, Video, FileText,
  Table2, Link2, Share2, Radar, Bell, GitCompare,
} from "lucide-react";

const FEATURES = [
  { icon: MessageSquareText, title: "Text sentiment & emotion", desc: "Sentiment, emotion, sarcasm, toxicity, and intent in one pass." },
  { icon: ImageIcon, title: "Image understanding", desc: "OCR, face emotion, scene and object detection, captioning." },
  { icon: Video, title: "Video timelines", desc: "Frame-by-frame emotion tracking synced with speech." },
  { icon: Mic, title: "Audio & voice", desc: "Speech-to-text with tone, stress, and speaker detection." },
  { icon: FileText, title: "Documents", desc: "PDF & DOCX summarization with entities and keywords." },
  { icon: Table2, title: "CSV & Excel", desc: "Bulk review analysis with distribution and trend charts." },
  { icon: Link2, title: "URL & articles", desc: "Scrape, summarize, and score any page or news article." },
  { icon: Share2, title: "Social listening", desc: "X, Reddit, YouTube, and LinkedIn mood tracking." },
  { icon: Radar, title: "Brand monitoring", desc: "Track reputation and complaints for any company." },
  { icon: GitCompare, title: "Compare mode", desc: "Put two brands, products, or reviews side by side." },
  { icon: Bell, title: "Smart alerts", desc: "Get notified the moment sentiment or toxicity spikes." },
  { icon: Brain, title: "AI chat over your data", desc: "Ask why customers are unhappy — get a straight answer." },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-14 max-w-2xl border-l-4 border-white pl-6">
        <span className="text-xs uppercase tracking-widest font-black text-white">Platform</span>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-black uppercase tracking-tighter">
          One engine, every signal
        </h2>
        <p className="mt-4 text-sm font-medium text-neutral-400">
          Every module below shares the same scoring pipeline, so results stay
          consistent whether you upload a review CSV or paste a tweet.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <GlassCard key={f.title} className="group p-6 border-2 border-white hover:bg-white hover:text-black transition-all">
            <f.icon className="h-6 w-6 text-white group-hover:text-black" />
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-black uppercase tracking-tight">
              {f.title}
            </h3>
            <p className="mt-2 text-sm font-medium text-neutral-400 group-hover:text-neutral-800">{f.desc}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
