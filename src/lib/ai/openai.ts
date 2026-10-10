import "server-only";
import type { FullTextAnalysis } from "@/lib/text-analysis";

const OPENAI_BASE = "https://api.openai.com/v1";

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0);
}

function requireKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  return key;
}

/**
 * Runs a genuine model-graded text analysis via GPT-4o-mini, JSON-mode.
 * Shape matches FullTextAnalysis so the same UI component renders either
 * the local lexicon engine's output or this one with zero changes.
 */
export async function aiAnalyzeText(text: string): Promise<FullTextAnalysis> {
  const key = requireKey();

  const prompt = `Analyze the sentiment and emotional content of the following text. Respond ONLY with a JSON object matching this exact shape, no markdown, no commentary:

{
  "sentiment": { "label": "Positive" | "Negative" | "Neutral", "normalized": number between -1 and 1, "confidence": number between 0 and 1 },
  "emotions": [ { "emotion": string, "intensity": number between 0 and 1 } ] (up to 8, sorted descending by intensity, from this set: Joy, Trust, Anger, Sadness, Fear, Surprise, Disgust, Anticipation),
  "keywords": [ { "word": string, "count": number } ] (up to 10 most salient terms or short phrases),
  "toxicity": { "score": number between 0 and 1, "label": "Low" | "Medium" | "High" },
  "language": string (the detected language name, e.g. "English"),
  "summary": string (1-2 sentence summary),
  "highlightedSentences": [ { "sentence": string, "score": number between 0 and 1 } ] (up to 3 most emotionally charged sentences from the original text, verbatim)
}

Text to analyze:
"""
${text.slice(0, 8000)}
"""`;

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI text analysis failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty response.");

  const parsed = JSON.parse(raw);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return {
    sentiment: {
      score: parsed.sentiment?.normalized ?? 0,
      normalized: parsed.sentiment?.normalized ?? 0,
      label: parsed.sentiment?.label ?? "Neutral",
      confidence: parsed.sentiment?.confidence ?? 0.5,
      positiveHits: [],
      negativeHits: [],
    },
    emotions: parsed.emotions ?? [],
    keywords: parsed.keywords ?? [],
    toxicity: parsed.toxicity ?? { score: 0, label: "Low" },
    language: parsed.language ?? "English",
    summary: parsed.summary ?? "",
    wordCount,
    highlightedSentences: parsed.highlightedSentences ?? [],
  };
}

/** Transcribes audio via Whisper. Accepts a Buffer plus its filename/mimetype. */
export async function aiTranscribeAudio(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const key = requireKey();

  const form = new FormData();
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  form.append("file", new Blob([arrayBuffer], { type: mimeType }), filename);
  form.append("model", "whisper-1");

  const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Whisper transcription failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.text as string;
}

export interface VisionAnalysis {
  caption: string;
  scene: string;
  objects: string[];
  mood: string;
  faceEmotions: { emotion: string; intensity: number }[];
}

export type AIVisionErrorCode =
  | "quota_exhausted"
  | "auth"
  | "rate_limit"
  | "bad_response"
  | "unknown";

/**
 * Typed vision failure so the API route and UI can distinguish an exhausted
 * account (a real, actionable condition) from a transient/model failure and
 * degrade gracefully instead of surfacing a raw provider error.
 */
export class AIVisionError extends Error {
  code: AIVisionErrorCode;
  providerStatus: number;

  constructor(code: AIVisionErrorCode, providerStatus: number, message: string) {
    super(message);
    this.name = "AIVisionError";
    this.code = code;
    this.providerStatus = providerStatus;
  }
}

/** Describes an image (caption, scene, objects, mood, best-effort face emotion) via GPT-4o-mini vision. */
export async function aiAnalyzeImage(base64DataUrl: string): Promise<VisionAnalysis> {
  const key = requireKey();

  const prompt = `Look at this image and respond ONLY with a JSON object matching this exact shape, no markdown, no commentary:

{
  "caption": string (one sentence describing the image),
  "scene": string (e.g. "indoor office", "outdoor beach", "product photo on white background"),
  "objects": [string] (up to 8 notable objects or subjects visible),
  "mood": string (the overall emotional tone the image conveys, e.g. "calm", "energetic", "tense"),
  "faceEmotions": [ { "emotion": string, "intensity": number between 0 and 1 } ] (if any human faces are visible, your best estimate of their emotional expression; empty array if no faces)
}`;

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: base64DataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw classifyVisionError(res.status, body);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new AIVisionError("bad_response", 502, "AI vision returned an empty response.");
  try {
    return JSON.parse(raw) as VisionAnalysis;
  } catch {
    throw new AIVisionError("bad_response", 502, "AI vision returned an unreadable response.");
  }
}

function classifyVisionError(status: number, body: string): AIVisionError {
  if (status === 401 || status === 403) {
    return new AIVisionError(
      "auth",
      status,
      "AI vision is unavailable: the OpenAI API key was rejected. Check OPENAI_API_KEY."
    );
  }
  if (status === 429 && /insufficient_quota|credit_balance_exhausted|current quota/i.test(body)) {
    return new AIVisionError(
      "quota_exhausted",
      status,
      "AI vision is unavailable: the OpenAI account has no remaining credits. Add credits in your OpenAI billing settings, then try again. Local analysis is shown instead."
    );
  }
  if (status === 429) {
    return new AIVisionError("rate_limit", status, "AI vision is rate-limited right now. Try again in a moment.");
  }
  return new AIVisionError("unknown", status, `AI vision request failed (${status}).`);
}
