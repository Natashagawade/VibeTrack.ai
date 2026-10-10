/**
 * VibeTrack AI — local image insight engine.
 *
 * Pure, DOM-free helpers that turn *measured* pixel statistics (and any OCR
 * text) into an honest, deterministic description of an image.
 *
 * This is the always-available counterpart to the AI vision path. It never
 * invents objects, scenes or faces: every label here is derived from a real
 * measurement, and it says so. When a working vision model is configured the
 * AI path adds caption/scene/object detail on top; when it isn't (missing key,
 * exhausted quota), this still produces a correct, useful result.
 */

export interface ImagePixelStats {
  width: number;
  height: number;
  avgBrightness: number; // 0-255
  contrast: number; // luminance standard deviation (~0-128)
  colorfulness: number; // 0-1 mean saturation
  warmth: number; // -1 (blue-leaning) .. 1 (orange-leaning)
  dominantColor: string; // hex
  palette: { color: string; percent: number }[];
}

export function brightnessBucket(v: number): string {
  if (v < 45) return "Very dark";
  if (v < 95) return "Dark";
  if (v < 155) return "Medium";
  if (v < 205) return "Bright";
  return "Very bright";
}

export function colorfulnessBucket(c: number): string {
  if (c < 0.06) return "Grayscale";
  if (c < 0.2) return "Muted";
  if (c < 0.45) return "Balanced";
  return "Vivid";
}

export function warmthBucket(w: number): string {
  if (w < -0.08) return "Cool (blue-leaning)";
  if (w > 0.08) return "Warm (orange-leaning)";
  return "Neutral";
}

export function contrastBucket(c: number): string {
  if (c < 20) return "Low";
  if (c < 45) return "Moderate";
  return "High";
}

export function aspectLabel(width: number, height: number): string {
  if (!width || !height) return "Unknown";
  const ratio = width / height;
  const shape = ratio > 1.15 ? "landscape" : ratio < 0.87 ? "portrait" : "square";
  return `${ratio.toFixed(2)} (${shape})`;
}

export function tonalityLabel(stats: Pick<ImagePixelStats, "avgBrightness" | "colorfulness">): string {
  return `${brightnessBucket(stats.avgBrightness)} and ${colorfulnessBucket(stats.colorfulness).toLowerCase()}`;
}

/**
 * Best-effort mood. When OCR text exists we reuse the deterministic text
 * engine's sentiment label (which is a real measurement of the visible text);
 * otherwise we derive it from colour/brightness only and label it as such.
 */
export function localMood(
  stats: Pick<ImagePixelStats, "avgBrightness" | "colorfulness" | "warmth">,
  textSentiment: string | null
): string {
  if (textSentiment === "Positive") return "Positive — based on the text in the image";
  if (textSentiment === "Negative") return "Negative — based on the text in the image";
  if (textSentiment === "Neutral") return "Neutral — based on the text in the image";

  const bright = stats.avgBrightness >= 155;
  const dark = stats.avgBrightness < 95;
  const vivid = stats.colorfulness >= 0.45;
  const muted = stats.colorfulness < 0.2;

  let base: string;
  if (bright && vivid) base = "Bright and energetic";
  else if (bright) base = "Light and calm";
  else if (dark && muted) base = "Subdued and dim";
  else if (dark) base = "Dark and moody";
  else if (vivid) base = "Colourful and lively";
  else base = "Balanced and neutral";

  const warm = stats.warmth > 0.08 ? "warm-toned" : stats.warmth < -0.08 ? "cool-toned" : null;
  return `${base}${warm ? `, ${warm}` : ""} — from colour and brightness only`;
}

export interface LocalImageInsight {
  source: "local";
  width: number;
  height: number;
  aspect: string;
  brightness: string;
  contrast: string;
  colorfulness: string;
  warmth: string;
  tonality: string;
  mood: string;
  dominantColor: string;
  palette: { color: string; percent: number }[];
  hasText: boolean;
  textPreview: string;
  textSentiment: string | null;
  /** Present when a face-expression model found at least one human face. */
  faceEmotion: FaceEmotionSummary | null;
  limitations: string[];
}

/** The seven classes face-api's expression network outputs. */
export const EXPRESSION_LABELS = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "fearful",
  "disgusted",
  "surprised",
] as const;

export type ExpressionLabel = (typeof EXPRESSION_LABELS)[number];

/** Human-facing label + how it reads against the text engine's vocabulary. */
export const EXPRESSION_DISPLAY: Record<ExpressionLabel, string> = {
  neutral: "Neutral",
  happy: "Joy",
  sad: "Sadness",
  angry: "Anger",
  fearful: "Fear",
  disgusted: "Disgust",
  surprised: "Surprise",
};

/** Raw per-expression probabilities for one detected face. */
export type ExpressionScores = Record<ExpressionLabel, number>;

export interface FaceEmotionSummary {
  faces: number;
  /** Dominant expression across all faces, with its confidence. */
  dominant: { label: ExpressionLabel; intensity: number };
  /** Every expression above the reporting floor, highest first. */
  emotions: { emotion: string; intensity: number }[];
  /** Where each face sits, as fractions of image size, for overlay boxes. */
  boxes: { x: number; y: number; width: number; height: number }[];
  /** True when at least one face was detected but none scored above the floor. */
  lowConfidence: boolean;
}

const FLOOR = 0.15;

/**
 * Averages expression probabilities across every detected face and reports the
 * dominant emotion. Intensity is normalised over the expressions that clear the
 * floor so the chart always sums to something meaningful.
 */
export function summarizeFaceEmotions(
  faces: ExpressionScores[],
  boxes: { x: number; y: number; width: number; height: number }[] = []
): FaceEmotionSummary | null {
  if (!faces.length) return null;

  const avg = {} as ExpressionScores;
  for (const label of EXPRESSION_LABELS) {
    avg[label] = faces.reduce((sum, f) => sum + (f[label] ?? 0), 0) / faces.length;
  }

  const ranked = EXPRESSION_LABELS
    .map((label) => ({ label, value: avg[label] }))
    .sort((a, b) => b.value - a.value);

  const kept = ranked.filter((r) => r.value >= FLOOR);
  const total = kept.reduce((s, r) => s + r.value, 0);

  return {
    faces: faces.length,
    dominant: { label: ranked[0].label, intensity: ranked[0].value },
    emotions: kept.length
      ? kept.map((r) => ({
          emotion: EXPRESSION_DISPLAY[r.label],
          intensity: Math.round((r.value / total) * 100) / 100,
        }))
      : [{ emotion: EXPRESSION_DISPLAY[ranked[0].label], intensity: ranked[0].value }],
    boxes,
    lowConfidence: kept.length === 0,
  };
}

export function buildLocalInsight(
  stats: ImagePixelStats,
  opts: { ocrText?: string; textSentiment?: string | null; faceEmotion?: FaceEmotionSummary | null } = {}
): LocalImageInsight {
  const text = (opts.ocrText ?? "").trim();
  const hasText = text.length > 3;
  const faceEmotion = opts.faceEmotion ?? null;

  // A measurable facial expression outranks a colour-temperature guess.
  const mood = faceEmotion && !faceEmotion.lowConfidence
    ? `${EXPRESSION_DISPLAY[faceEmotion.dominant.label]} — detected on ${faceEmotion.faces} face${faceEmotion.faces === 1 ? "" : "s"} (${Math.round(faceEmotion.dominant.intensity * 100)}% confidence)`
    : localMood(stats, hasText ? opts.textSentiment ?? null : null);

  return {
    source: "local",
    width: stats.width,
    height: stats.height,
    aspect: aspectLabel(stats.width, stats.height),
    brightness: `${brightnessBucket(stats.avgBrightness)} (${Math.round(stats.avgBrightness)}/255)`,
    contrast: contrastBucket(stats.contrast),
    colorfulness: colorfulnessBucket(stats.colorfulness),
    warmth: warmthBucket(stats.warmth),
    tonality: tonalityLabel(stats),
    mood,
    dominantColor: stats.dominantColor,
    palette: stats.palette,
    hasText,
    textPreview: hasText ? text.slice(0, 240) : "",
    textSentiment: hasText ? opts.textSentiment ?? null : null,
    faceEmotion,
    limitations: faceEmotion
      ? [
          "Facial expression recognised on-device by a small CNN (7 expression classes) — no image leaves the browser.",
          "Caption, scene and object labels still require a vision model (AI vision analysis).",
        ]
      : [
          "Measured directly from pixels and OCR text — no object, scene or face recognition.",
          "Caption, scene, objects and face emotion require a vision model (AI vision analysis).",
        ],
  };
}
