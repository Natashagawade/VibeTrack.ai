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
  limitations: string[];
}

export function buildLocalInsight(
  stats: ImagePixelStats,
  opts: { ocrText?: string; textSentiment?: string | null } = {}
): LocalImageInsight {
  const text = (opts.ocrText ?? "").trim();
  const hasText = text.length > 3;

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
    mood: localMood(stats, hasText ? opts.textSentiment ?? null : null),
    dominantColor: stats.dominantColor,
    palette: stats.palette,
    hasText,
    textPreview: hasText ? text.slice(0, 240) : "",
    textSentiment: hasText ? opts.textSentiment ?? null : null,
    limitations: [
      "Measured directly from pixels and OCR text — no object, scene or face recognition.",
      "Caption, scene, objects and face emotion require a vision model (AI vision analysis).",
    ],
  };
}
