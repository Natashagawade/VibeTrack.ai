import { describe, expect, it } from "vitest";
import {
  buildLocalInsight,
  summarizeFaceEmotions,
  type ExpressionScores,
  type ImagePixelStats,
} from "@/lib/image-insight";

const stats: ImagePixelStats = {
  width: 800,
  height: 600,
  avgBrightness: 120,
  contrast: 30,
  colorfulness: 0.3,
  warmth: 0.1,
  dominantColor: "#808080",
  palette: [],
};

function scores(overrides: Partial<ExpressionScores>): ExpressionScores {
  return {
    neutral: 0,
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0,
    ...overrides,
  };
}

describe("summarizeFaceEmotions", () => {
  it("returns null when no faces are detected", () => {
    expect(summarizeFaceEmotions([])).toBeNull();
  });

  it("reports the dominant expression for a clearly sad face", () => {
    const result = summarizeFaceEmotions([scores({ sad: 0.86, neutral: 0.08, happy: 0.03 })])!;
    expect(result.faces).toBe(1);
    expect(result.dominant.label).toBe("sad");
    expect(result.dominant.intensity).toBeCloseTo(0.86);
    expect(result.emotions[0]).toEqual({ emotion: "Sadness", intensity: 1 });
  });

  it("averages expressions across multiple faces", () => {
    const result = summarizeFaceEmotions([
      scores({ sad: 0.8, neutral: 0.2 }),
      scores({ sad: 0.4, neutral: 0.6 }),
    ])!;
    expect(result.faces).toBe(2);
    expect(result.dominant.label).toBe("sad");
    expect(result.dominant.intensity).toBeCloseTo(0.6);
  });

  it("passes through bounding boxes unmodified", () => {
    const boxes = [{ x: 100, y: 50, width: 200, height: 200 }];
    const result = summarizeFaceEmotions([scores({ happy: 0.9 })], boxes)!;
    expect(result.boxes).toEqual(boxes);
  });

  it("flags low confidence when every expression is under the reporting floor", () => {
    const result = summarizeFaceEmotions([scores({ neutral: 0.09, sad: 0.08 })])!;
    expect(result.lowConfidence).toBe(true);
  });

  it("normalizes intensities so they sum to 1 above the floor", () => {
    const result = summarizeFaceEmotions([scores({ sad: 0.6, angry: 0.3, neutral: 0.1 })])!;
    const total = result.emotions.reduce((s, e) => s + e.intensity, 0);
    expect(total).toBeCloseTo(1, 1);
    expect(result.emotions.map((e) => e.emotion)).toEqual(["Sadness", "Anger"]);
  });
});

describe("buildLocalInsight with face emotion", () => {
  it("uses the detected expression as the mood when one is present", () => {
    const faceEmotion = summarizeFaceEmotions([scores({ sad: 0.91, neutral: 0.09 })])!;
    const insight = buildLocalInsight(stats, { faceEmotion });
    expect(insight.mood).toContain("Sadness");
    expect(insight.faceEmotion).toBe(faceEmotion);
  });

  it("falls back to colour-based mood when no face emotion is available", () => {
    const insight = buildLocalInsight(stats, {});
    expect(insight.mood).toContain("from colour and brightness only");
    expect(insight.faceEmotion).toBeNull();
  });

  it("falls back to colour mood when a face was found but scored under the floor", () => {
    const faceEmotion = summarizeFaceEmotions([scores({ neutral: 0.09, angry: 0.08 })])!;
    const insight = buildLocalInsight(stats, { faceEmotion });
    expect(insight.mood).not.toContain("Anger");
    expect(insight.mood).toContain("from colour and brightness only");
  });

  it("mentions the on-device model in its limitations when faces were found", () => {
    const faceEmotion = summarizeFaceEmotions([scores({ happy: 0.7 })])!;
    const insight = buildLocalInsight(stats, { faceEmotion });
    expect(insight.limitations.join(" ")).toContain("on-device");
  });
});
