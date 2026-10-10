"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Dropzone } from "@/components/ui/dropzone";
import { EngineBadge } from "@/components/dashboard/engine-badge";
import { AnalysisResultPanel } from "@/components/dashboard/analysis-result-panel";
import { useConfigStatus } from "@/lib/use-config-status";
import type { FullTextAnalysis } from "@/lib/text-analysis";
import { Loader2, AlertTriangle, Mic, KeyRound, FileAudio, CheckCircle2 } from "lucide-react";

export default function AudioAnalysisPage() {
  const { status, loading: statusLoading } = useConfigStatus();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<FullTextAnalysis | null>(null);
  const [engine, setEngine] = useState("local");

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);
    setTranscript("");
    try {
      const form = new FormData();
      form.append("audio", file);
      const res = await fetch("/api/analyze/audio", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't analyze that audio file.");
        return;
      }
      setTranscript(data.transcript);
      setResult(data.result);
      setEngine(data.engine);
    } catch {
      setError("Network error while transcribing that file.");
    } finally {
      setLoading(false);
    }
  }

  const keyMissing = !statusLoading && status && !status.openai;

  return (
    <>
      <Topbar title="Audio analysis" />
      <div className="space-y-6 p-6">
        <GlassCard variant="interactive" className="p-6 animate-fade-in-up">
          <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
            Upload an audio file. Speech-to-text runs through OpenAI Whisper, then the transcript is scored through the same sentiment/emotion engine as Text analysis.
          </p>

          {keyMissing ? (
            <div className="glass-panel-subtle rounded-xl border border-dashed border-white/15 p-6 text-sm text-[var(--color-text-secondary)] flex items-start gap-3">
              <KeyRound className="h-5 w-5 shrink-0 text-[var(--color-accent-cyan)] mt-0.5" />
              <div>
                Add <code className="rounded bg-white/5 px-1.5 py-0.5 text-[var(--color-text-primary)] font-mono">OPENAI_API_KEY</code> to your <code className="rounded bg-white/5 px-1.5 py-0.5 text-[var(--color-text-primary)] font-mono">.env.local</code> to enable transcription — Whisper needs it and there&apos;s no local fallback for speech-to-text.
              </div>
            </div>
          ) : (
            <Dropzone
              accept="audio/*"
              onFile={handleFile}
              label="Drop an audio file, or click to browse"
              hint="MP3, WAV, M4A — up to 25MB"
            />
          )}

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Transcribing…
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-signal-negative)]">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}
        </GlassCard>

        {result && (
          <>
            <GlassCard variant="interactive" className="p-6 animate-fade-in-up delay-1">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <Mic className="h-4 w-4" /> Transcript
                </div>
                <EngineBadge engine={engine} />
              </div>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-base)]/30 rounded-xl p-4 font-mono text-xs leading-relaxed">
                {transcript}
              </p>
            </GlassCard>
            <AnalysisResultPanel result={result} />
          </>
        )}

        <GlassCard variant="subtle" className="border-dashed p-5 text-xs text-[var(--color-text-muted)] animate-fade-in-up delay-2">
          <div className="flex items-start gap-2">
            <FileAudio className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Stress/tone detection and speaker diarization need a dedicated audio model beyond Whisper&apos;s transcript — flagged here rather than faked.
              <Badge tone="neutral" className="ml-2">Not yet wired</Badge>
            </span>
          </div>
        </GlassCard>
      </div>
    </>
  );
}