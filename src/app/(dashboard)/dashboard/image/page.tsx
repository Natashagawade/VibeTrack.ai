"use client";

import { useState } from "react";
import Image from "next/image";
import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { AnalysisResultPanel } from "@/components/dashboard/analysis-result-panel";
import { runOcr, analyzeImageColors } from "@/lib/image-analysis";
import { buildLocalInsight, type LocalImageInsight } from "@/lib/image-insight";
import { analyzeText, type FullTextAnalysis } from "@/lib/text-analysis";
import { useConfigStatus } from "@/lib/use-config-status";
import type { VisionAnalysis } from "@/lib/ai/openai";
import { Loader2, AlertTriangle, ScanText, Palette, Eye, Sparkles, KeyRound, CheckCircle2, Image as ImageIcon } from "lucide-react";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageAnalysisPage() {
  const { status } = useConfigStatus();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [insight, setInsight] = useState<LocalImageInsight | null>(null);
  const [result, setResult] = useState<FullTextAnalysis | null>(null);

  const [vision, setVision] = useState<VisionAnalysis | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState<{ message: string; code?: string } | null>(null);

  async function handleFile(f: File) {
    setLoading(true);
    setError(null);
    setResult(null);
    setInsight(null);
    setOcrText("");
    setProgress(0);
    setVision(null);
    setVisionError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));

    try {
      const [text, colorAnalysis] = await Promise.all([
        runOcr(f, setProgress),
        analyzeImageColors(f),
      ]);
      const textAnalysis = text.trim().length > 3 ? analyzeText(text) : null;
      setOcrText(text);
      setResult(textAnalysis);
      setInsight(
        buildLocalInsight(colorAnalysis, {
          ocrText: text,
          textSentiment: textAnalysis?.sentiment.label ?? null,
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't analyze that image.");
    } finally {
      setLoading(false);
    }
  }

  async function runVisionAnalysis() {
    if (!file) return;
    setVisionLoading(true);
    setVisionError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/analyze/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVisionError({ message: data.error ?? "Vision analysis failed.", code: data.code });
        return;
      }
      setVision(data.result);
    } catch {
      setVisionError({ message: "Network error during vision analysis." });
    } finally {
      setVisionLoading(false);
    }
  }

  const visionDegraded =
    visionError?.code === "quota_exhausted" ||
    visionError?.code === "auth" ||
    visionError?.code === "not_configured" ||
    visionError?.code === "rate_limit";

  return (
    <>
      <Topbar title="Image analysis" />
      <div className="space-y-6 p-6">
        <GlassCard variant="interactive" className="p-6 animate-fade-in-up">
          <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
            Upload an image. Real OCR (Tesseract, running as WASM in your browser) extracts any visible text and scores it through the text engine. 
            The local profile measures brightness, contrast, colour and warmth directly from the pixels — so you always get a correct result, with or without a vision model. 
            Caption, scene and object detection need AI vision (see the note below).
          </p>
          <Dropzone
            accept="image/*"
            onFile={handleFile}
            label="Drop an image, or click to browse"
            hint="PNG, JPG, or WEBP with visible text works best for OCR"
          />
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Running OCR… {Math.round(progress * 100)}%
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-signal-negative)]">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}
        </GlassCard>

        {preview && (
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard variant="interactive" className="overflow-hidden p-3 lg:col-span-1 animate-fade-in-up delay-1">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[var(--color-bg-base)]/50">
                <Image src={preview} alt="Uploaded preview" fill className="object-cover" unoptimized />
              </div>
            </GlassCard>

            <div className="space-y-4 lg:col-span-2">
              <GlassCard variant="interactive" className="p-6 animate-fade-in-up delay-2">
                <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <ScanText className="h-4 w-4" /> OCR extracted text
                </div>
                <p className="text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-base)]/30 rounded-xl p-4 min-h-[100px] max-h-60 overflow-y-auto font-mono text-xs leading-relaxed">
                  {ocrText.trim() || (loading ? "Scanning…" : "No text detected in this image.")}
                </p>
              </GlassCard>

              {insight && (
                <GlassCard variant="interactive" className="p-6 animate-fade-in-up delay-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <Palette className="h-4 w-4" /> Image profile
                    </div>
                    <Badge tone="positive"><CheckCircle2 className="h-3 w-3 mr-1" />Measured</Badge>
                  </div>
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-lg border border-white/10"
                      style={{ background: insight.dominantColor }}
                    />
                    <div className="text-sm">
                      <div className="text-[var(--color-text-primary)] font-mono">{insight.dominantColor}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {insight.width}×{insight.height} · aspect {insight.aspect}
                      </div>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-[var(--color-text-muted)]">Brightness</dt>
                      <dd className="text-[var(--color-text-primary)]">{insight.brightness}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--color-text-muted)]">Contrast</dt>
                      <dd className="text-[var(--color-text-primary)]">{insight.contrast}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--color-text-muted)]">Colourfulness</dt>
                      <dd className="text-[var(--color-text-primary)]">{insight.colorfulness}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--color-text-muted)]">Warmth</dt>
                      <dd className="text-[var(--color-text-primary)]">{insight.warmth}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-[var(--color-text-muted)]">Tonality</dt>
                      <dd className="text-[var(--color-text-primary)]">{insight.tonality}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-[var(--color-text-muted)]">Mood</dt>
                      <dd className="text-[var(--color-text-primary)]">{insight.mood}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {insight.palette.map((p) => (
                      <Badge key={p.color} tone="neutral" className="gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-white/20"
                          style={{ background: p.color }}
                        />
                        {p.percent}%
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-[var(--color-text-muted)]">{insight.limitations[1]}</p>
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {result && <AnalysisResultPanel result={result} />}

        {preview && (
          <GlassCard variant="interactive" className="p-6 animate-fade-in-up">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Eye className="h-4 w-4" /> AI vision analysis
              </div>
              {status && !status.openai ? (
                <Badge tone="neutral" className="gap-1">
                  <KeyRound className="h-3 w-3" /> Needs OPENAI_API_KEY
                </Badge>
              ) : (
                <Button size="sm" onClick={runVisionAnalysis} disabled={visionLoading} variant="primary">
                  {visionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Run vision analysis
                </Button>
              )}
            </div>

            {visionError && (
              <div
                className={`flex items-start gap-2 text-sm ${
                  visionDegraded ? "text-[var(--color-accent-amber)]" : "text-[var(--color-signal-negative)]"
                }`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{visionError.message}</span>
              </div>
            )}

            {!vision && !visionError && (
              <p className="text-sm text-[var(--color-text-muted)]">
                Optional. Adds a model-generated caption, scene, objects and face emotion on top of the measured profile above.
              </p>
            )}

            {vision && (
              <div className="grid gap-4 sm:grid-cols-2">
                <GlassCard variant="subtle" className="p-4">
                  <div className="text-xs text-[var(--color-text-muted)]">Caption</div>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">{vision.caption}</p>
                </GlassCard>
                <GlassCard variant="subtle" className="p-4">
                  <div className="text-xs text-[var(--color-text-muted)]">Scene</div>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">{vision.scene}</p>
                </GlassCard>
                <GlassCard variant="subtle" className="p-4">
                  <div className="text-xs text-[var(--color-text-muted)]">Mood</div>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">{vision.mood}</p>
                </GlassCard>
                <GlassCard variant="subtle" className="p-4">
                  <div className="text-xs text-[var(--color-text-muted)]">Objects</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {vision.objects.map((o) => (
                      <Badge key={o} tone="cyan">{o}</Badge>
                    ))}
                  </div>
                </GlassCard>
                {vision.faceEmotions.length > 0 && (
                  <GlassCard variant="subtle" className="p-4 sm:col-span-2">
                    <div className="text-xs text-[var(--color-text-muted)]">Face emotion (best-effort)</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {vision.faceEmotions.map((e) => (
                        <Badge key={e.emotion} tone="neutral">
                          {e.emotion} · {Math.round(e.intensity * 100)}%
                        </Badge>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </>
  );
}