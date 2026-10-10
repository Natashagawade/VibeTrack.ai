import { describe, expect, it } from "vitest";
import {
  aspectLabel,
  brightnessBucket,
  buildLocalInsight,
  colorfulnessBucket,
  contrastBucket,
  localMood,
  tonalityLabel,
  warmthBucket,
  type ImagePixelStats,
} from "@/lib/image-insight";

const baseStats: ImagePixelStats = {
  width: 1200,
  height: 800,
  avgBrightness: 190,
  contrast: 30,
  colorfulness: 0.5,
  warmth: 0.2,
  dominantColor: "#c08040",
  palette: [{ color: "#c08040", percent: 60 }],
};

describe("image insight pure engine", () => {
  it("buckets brightness", () => {
    expect(brightnessBucket(10)).toBe("Very dark");
    expect(brightnessBucket(80)).toBe("Dark");
    expect(brightnessBucket(120)).toBe("Medium");
    expect(brightnessBucket(180)).toBe("Bright");
    expect(brightnessBucket(240)).toBe("Very bright");
  });

  it("buckets colourfulness", () => {
    expect(colorfulnessBucket(0.01)).toBe("Grayscale");
    expect(colorfulnessBucket(0.1)).toBe("Muted");
    expect(colorfulnessBucket(0.3)).toBe("Balanced");
    expect(colorfulnessBucket(0.7)).toBe("Vivid");
  });

  it("buckets warmth", () => {
    expect(warmthBucket(-0.5)).toBe("Cool (blue-leaning)");
    expect(warmthBucket(0)).toBe("Neutral");
    expect(warmthBucket(0.5)).toBe("Warm (orange-leaning)");
  });

  it("buckets contrast", () => {
    expect(contrastBucket(5)).toBe("Low");
    expect(contrastBucket(30)).toBe("Moderate");
    expect(contrastBucket(80)).toBe("High");
  });

  it("labels aspect ratio and orientation", () => {
    expect(aspectLabel(1200, 800)).toBe("1.50 (landscape)");
    expect(aspectLabel(800, 1200)).toBe("0.67 (portrait)");
    expect(aspectLabel(500, 500)).toBe("1.00 (square)");
  });

  it("composes a tonality phrase from measurements", () => {
    expect(tonalityLabel({ avgBrightness: 190, colorfulness: 0.5 })).toBe("Bright and vivid");
    expect(tonalityLabel({ avgBrightness: 30, colorfulness: 0.01 })).toBe("Very dark and grayscale");
  });

  it("uses text sentiment for mood when text is present", () => {
    expect(localMood(baseStats, "Positive")).toContain("Positive");
    expect(localMood(baseStats, "Negative")).toContain("Negative");
    expect(localMood(baseStats, "Neutral")).toContain("Neutral");
  });

  it("derives pixel-only mood and discloses the source when no text", () => {
    const mood = localMood(baseStats, null);
    expect(mood).toContain("colour and brightness only");
  });

  it("builds an insight that flags missing text and limitations", () => {
    const insight = buildLocalInsight(baseStats, { ocrText: "" });
    expect(insight.source).toBe("local");
    expect(insight.hasText).toBe(false);
    expect(insight.textSentiment).toBeNull();
    expect(insight.aspect).toBe("1.50 (landscape)");
    expect(insight.limitations.length).toBeGreaterThan(0);
  });

  it("carries OCR text and sentiment into the insight", () => {
    const insight = buildLocalInsight(baseStats, {
      ocrText: "This product is terrible and it broke immediately.",
      textSentiment: "Negative",
    });
    expect(insight.hasText).toBe(true);
    expect(insight.textSentiment).toBe("Negative");
    expect(insight.mood).toContain("Negative");
    expect(insight.textPreview).toContain("terrible");
  });
});
