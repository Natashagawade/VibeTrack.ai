import { describe, expect, it } from "vitest";
import {
  normalize,
  extractKeywords,
  memoryHash,
  buildSearchText,
  scoreMemory,
} from "@/lib/memory/recall";

describe("memory recall pure engine", () => {
  it("normalizes and strips punctuation/lowercases", () => {
    expect(normalize("Delivery is late! The ORDER #42")).toBe("delivery is late the order 42");
    expect(normalize("")).toBe("");
  });

  it("extracts unique content keywords and drops stopwords", () => {
    const kws = extractKeywords("The delivery was late and the packaging broken");
    expect(kws).toContain("delivery");
    expect(kws).toContain("late");
    expect(kws).toContain("packaging");
    expect(kws).toContain("broken");
    expect(kws).not.toContain("the");
    expect(new Set(kws).size).toBe(kws.length);
  });

  it("includes origin words in keywords", () => {
    expect(extractKeywords("review this", ["Zendesk"])).toContain("zendesk");
  });

  it("builds a stable dedupe key from type+title", () => {
    const a = memoryHash("PROBLEM_PATTERN", "Delivery delays in Bangalore");
    const b = memoryHash("PROBLEM_PATTERN", "delivery delays in bangalore");
    const c = memoryHash("PROBLEM_PATTERN", "A different memory");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("builds a normalised search surface", () => {
    expect(buildSearchText("Delivery delays", "Customers in Bangalore", ["Acme"])).toBe(
      "delivery delays customers in bangalore acme"
    );
  });

  it("scores memories by token overlap and ignores below minMatches", () => {
    const query = ["delivery", "delay", "bangalore"];
    const base = {
      keywords: ["delivery", "delay"],
      tags: [],
      entityNames: [],
      importance: 0.5,
      confidence: 0.8,
      occurredAt: "2026-08-01T00:00:00Z",
    };
    const high = scoreMemory({ ...base, keywords: ["delivery", "delay", "bangalore"] }, query);
    const low = scoreMemory({ ...base, keywords: ["delivery"] }, query);
    expect(high).toBeGreaterThan(0);
    expect(low).toBe(0);
  });

  it("penalizes low-confidence memories", () => {
    const query = ["delivery", "delay"];
    const mem = {
      keywords: ["delivery", "delay"],
      tags: [],
      entityNames: [],
      importance: 0.5,
      confidence: 0.2,
      occurredAt: "2026-08-01T00:00:00Z",
    };
    const conf = scoreMemory({ ...mem, confidence: 0.8 }, query);
    const lowConf = scoreMemory({ ...mem, confidence: 0.2 }, query);
    expect(conf).toBeGreaterThan(lowConf);
  });
});
