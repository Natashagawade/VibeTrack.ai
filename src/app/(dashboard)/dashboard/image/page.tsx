"use client";

import { useState } from "react";
import Image from "next/image";
import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { AnalysisResultPanel } from "@/components/dashboard/analysis-result-panel";
import { runOcr, analyzeImageColors, type ImageColorAnalysis } from "@/lib/image-analysis";
import { analyzeText, type FullTextAnalysis } from "@/lib/text-analysis";
import { useConfigStatus } from "@/lib/use-config-status";
import type { VisionAnalysis } from "@/lib/ai/openai";
import { Loader2, AlertTriangle, ScanText, Palette, Eye, Sparkles, KeyRound } from "lucide-react";

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
  const [colors, setColors] = useState<ImageColorAnalysis | null>(null);
  const [result, setResult] = useState<FullTextAnalysis | null>(null);

  const [vision, setVision] = useState<VisionAnalysis | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState<string | null>(null);

  async function handleFile(f: File) {
    setLoading(true);
    setError(null);
    setResult(null);
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
      setOcrText(text);
      setColors(colorAnalysis);
      if (text.trim().length > 3) {
        setResult(analyzeText(text));
      }
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
        setVisionError(data.error ?? "Vision analysis failed.");
        return;
      }
      setVision(data.result);
    } catch {
      setVisionError("Network error during vision analysis.");
    } finally {
      setVisionLoading(false);
    }
  }

  return (
    <>
      <Topbar title="Image analysis" />
      <div className="space-y-6 p-6">
        <GlassCard className="p-6">
          <p className="mb-4 text-sm text-[var(--color-mist-400)]">
            Upload an image. Real OCR (Tesseract, running as WASM in your
            browser) extracts any visible text and scores it through the text
            engine; real pixel analysis reads brightness and dominant color
            directly from the image data. Face/scene/object detection needs a
            vision model — see the note below.
          </p>
          <Dropzone
            accept="image/*"
            onFile={handleFile}
            label="Drop an image, or click to browse"
            hint="PNG, JPG, or WEBP with visible text works best for OCR"
          />
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-mist-400)]">
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
            <GlassCard className="overflow-hidden p-3 lg:col-span-1">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/20">
                <Image src={preview} alt="Uploaded preview" fill className="object-cover" unoptimized />
              </div>
            </GlassCard>

            <div className="space-y-4 lg:col-span-2">
              <GlassCard className="p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-mist-400)]">
                  <ScanText className="h-4 w-4" /> OCR extracted text
                </div>
                <p className="text-sm text-[var(--color-mist-300)]">
                  {ocrText.trim() || (loading ? "Scanning…" : "No text detected in this image.")}
                </p>
              </GlassCard>

              {colors && (
                <GlassCard className="p-6">
                  <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-mist-400)]">
                    <Palette className="h-4 w-4" /> Color & brightness
                  </div>
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg border border-white/10"
                      style={{ background: colors.dominantColor }}
                    />
                    <div className="text-sm">
                      <div className="text-[var(--color-mist-100)]">{colors.dominantColor}</div>
                      <div className="text-xs text-[var(--color-mist-400)]">
                        Avg. brightness {colors.avgBrightness}/255
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colors.palette.map((p) => (
                      <Badge key={p.color} tone="neutral" className="gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-white/20"
                          style={{ background: p.color }}
                        />
                        {p.percent}%
                      </Badge>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {result && <AnalysisResultPanel result={result} />}

        {preview && (
          <GlassCard className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[var(--color-mist-400)]">
                <Eye className="h-4 w-4" /> AI vision analysis
              </div>
              {status && !status.openai ? (
                <Badge tone="neutral" className="gap-1">
                  <KeyRound className="h-3 w-3" /> Needs OPENAI_API_KEY
                </Badge>
              ) : (
                <Button size="sm" onClick={runVisionAnalysis} disabled={visionLoading}>
                  {visionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Run vision analysis
                </Button>
              )}
            </div>

            {visionError && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-signal-negative)]">
                <AlertTriangle className="h-4 w-4" /> {visionError}
              </div>
            )}

            {vision && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-[var(--color-mist-400)]">Caption</div>
                  <p className="mt-1 text-sm text-[var(--color-mist-200)]">{vision.caption}</p>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-mist-400)]">Scene</div>
                  <p className="mt-1 text-sm text-[var(--color-mist-200)]">{vision.scene}</p>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-mist-400)]">Mood</div>
                  <p className="mt-1 text-sm text-[var(--color-mist-200)]">{vision.mood}</p>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-mist-400)]">Objects</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {vision.objects.map((o) => (
                      <Badge key={o} tone="aurora">{o}</Badge>
                    ))}
                  </div>
                </div>
                {vision.faceEmotions.length > 0 && (
                  <div className="sm:col-span-2">
                    <div className="text-xs text-[var(--color-mist-400)]">Face emotion (best-effort)</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {vision.faceEmotions.map((e) => (
                        <Badge key={e.emotion} tone="neutral">
                          {e.emotion} · {Math.round(e.intensity * 100)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </>
  );
}
