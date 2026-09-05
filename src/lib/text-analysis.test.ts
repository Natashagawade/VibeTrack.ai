import { describe, it, expect } from "vitest";
import {
  scoreSentiment,
  detectEmotions,
  extractKeywords,
  detectToxicity,
  detectLanguage,
  summarize,
  analyzeText,
} from "./text-analysis";

describe("scoreSentiment", () => {
  it("labels a clearly positive sentence as Positive", () => {
    const result = scoreSentiment("This is amazing, I love it, absolutely wonderful and perfect.");
    expect(result.label).toBe("Positive");
    expect(result.normalized).toBeGreaterThan(0);
  });

  it("labels a clearly negative sentence as Negative", () => {
    const result = scoreSentiment("This is terrible, I hate it, the worst experience ever.");
    expect(result.label).toBe("Negative");
    expect(result.normalized).toBeLessThan(0);
  });

  it("labels neutral factual text as Neutral", () => {
    const result = scoreSentiment("The package arrived on Tuesday at 3pm via courier.");
    expect(result.label).toBe("Neutral");
  });

  it("flips polarity under simple negation", () => {
    const positive = scoreSentiment("The service was good.");
    const negated = scoreSentiment("The service was not good.");
    expect(negated.normalized).toBeLessThan(positive.normalized);
  });

  it("keeps confidence within [0, 1]", () => {
    const result = scoreSentiment("Great! Amazing! Perfect! Wonderful! Love it!");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

describe("detectEmotions", () => {
  it("ranks Joy highest for clearly happy text", () => {
    const emotions = detectEmotions("I am so happy and excited, this is wonderful and fun!");
    expect(emotions[0].emotion).toBe("Joy");
  });

  it("returns intensities within [0, 1]", () => {
    const emotions = detectEmotions("I am furious and angry about this rude treatment.");
    emotions.forEach((e) => {
      expect(e.intensity).toBeGreaterThanOrEqual(0);
      expect(e.intensity).toBeLessThanOrEqual(1);
    });
  });
});

describe("extractKeywords", () => {
  it("excludes common stopwords", () => {
    const keywords = extractKeywords("the the the and and the product product product is is is great");
    const words = keywords.map((k) => k.word);
    expect(words).not.toContain("the");
    expect(words).not.toContain("and");
    expect(words).not.toContain("is");
  });

  it("counts repeated meaningful words correctly", () => {
    const keywords = extractKeywords("battery battery battery life life screen");
    const battery = keywords.find((k) => k.word === "battery");
    expect(battery?.count).toBe(3);
  });

  it("respects the limit parameter", () => {
    const keywords = extractKeywords(
      "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima",
      3
    );
    expect(keywords.length).toBeLessThanOrEqual(3);
  });
});

describe("detectToxicity", () => {
  it("flags overtly toxic language higher than clean text", () => {
    const toxic = detectToxicity("You are a stupid idiot and a worthless loser.");
    const clean = detectToxicity("Thanks so much for the quick and helpful response.");
    expect(toxic.score).toBeGreaterThan(clean.score);
  });

  it("keeps score within [0, 1]", () => {
    const result = detectToxicity("idiot idiot idiot stupid stupid hate hate");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});

describe("detectLanguage", () => {
  it("detects English by default function-word density", () => {
    expect(detectLanguage("This is the best product that you can buy for this price.")).toBe("English");
  });
});

describe("summarize", () => {
  it("returns the original text unchanged when already short", () => {
    const text = "Short sentence. Another one.";
    expect(summarize(text, 2)).toBe(text);
  });

  it("shortens long multi-sentence text", () => {
    const text =
      "This is the first sentence about the product. This is a second unrelated sentence about weather. " +
      "This is a third sentence with more filler content. This is a fourth sentence about something else entirely. " +
      "This is a fifth and final sentence to close things out.";
    const summary = summarize(text, 2);
    expect(summary.length).toBeLessThan(text.length);
  });
});

describe("analyzeText (integration)", () => {
  it("produces a fully-populated, internally consistent result", () => {
    const result = analyzeText(
      "I love the new design, it's fantastic! But the checkout process was slow and frustrating."
    );
    expect(result.wordCount).toBeGreaterThan(0);
    expect(["Positive", "Negative", "Neutral"]).toContain(result.sentiment.label);
    expect(result.emotions.length).toBeGreaterThan(0);
    expect(result.highlightedSentences.length).toBeGreaterThan(0);
    expect(result.highlightedSentences.length).toBeLessThanOrEqual(3);
  });

  it("handles empty input without throwing", () => {
    expect(() => analyzeText("")).not.toThrow();
  });
});
