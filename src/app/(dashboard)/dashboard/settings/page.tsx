"use client";

import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { useConfigStatus, type ConfigStatus } from "@/lib/use-config-status";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const ROWS: { key: keyof ConfigStatus; label: string; envVar: string; note: string }[] = [
  { key: "openai", label: "OpenAI", envVar: "OPENAI_API_KEY", note: "Text/CSV/Documents/URL upgrade to AI-grade scoring; powers Audio (Whisper) and Image vision" },
  { key: "gemini", label: "Gemini", envVar: "GEMINI_API_KEY", note: "Present for future routes — not yet wired to any module" },
  { key: "huggingface", label: "HuggingFace", envVar: "HUGGINGFACE_API_KEY", note: "Present for future open-source model routes" },
  { key: "database", label: "Database", envVar: "DATABASE_URL", note: "Persists signals, intelligence and import history" },
  { key: "redis", label: "Redis", envVar: "REDIS_URL", note: "For distributed rate limiting and background job queues (BullMQ)" },
  { key: "cloudinary", label: "Cloudinary", envVar: "CLOUDINARY_CLOUD_NAME / API_KEY", note: "Media storage for uploaded images/audio" },
  { key: "smtp", label: "SMTP", envVar: "SMTP_HOST / USER / PASSWORD", note: "Alert emails" },
  { key: "newsApi", label: "News API", envVar: "NEWS_API_KEY", note: "For the News Analysis module" },
  { key: "youtubeApi", label: "YouTube", envVar: "YOUTUBE_API_KEY", note: "For Social listening — YouTube comments" },
  { key: "reddit", label: "Reddit", envVar: "REDDIT_CLIENT_ID / SECRET", note: "For Social listening — Reddit" },
  { key: "twitter", label: "Twitter / X", envVar: "TWITTER_BEARER_TOKEN", note: "For Social listening — X mentions" },
];

export default function SettingsPage() {
  const { status, loading } = useConfigStatus();

  return (
    <>
      <Topbar title="Settings" />
      <div className="space-y-6 p-6">
        <GlassCard className="p-6">
          <p className="text-sm text-[var(--color-mist-400)]">
            API keys are never entered or stored in the app itself — for
            security, they live only in your <code className="rounded bg-black/20 px-1.5 py-0.5 text-[var(--color-mist-200)]">.env.local</code> file
            (or your host&apos;s environment variable settings) and are read
            server-side. This page just reports which ones are currently
            detected, without ever exposing their values.
          </p>
        </GlassCard>

        <GlassCard className="overflow-hidden">
          {loading || !status ? (
            <div className="flex items-center gap-2 p-8 text-sm text-[var(--color-mist-400)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking configuration…
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {ROWS.map((row) => {
                const active = status[row.key];
                return (
                  <div key={row.key} className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      {active ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-signal-positive)]" />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-[var(--color-mist-400)]" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-[var(--color-mist-100)]">{row.label}</div>
                        <div className="text-xs text-[var(--color-mist-400)]">{row.note}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="hidden text-xs text-[var(--color-mist-400)] sm:block">{row.envVar}</code>
                      <Badge tone={active ? "positive" : "neutral"}>{active ? "Configured" : "Not set"}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
