import { describe, it, expect } from "vitest";
import { analyzeText } from "./text-analysis";
import {
  detectIntent,
  detectIssueCategory,
  computeSeverity,
  classifySignal,
  enrichSignal,
} from "./analysis";

describe("detectIntent", () => {
  it("detects a feature request", () => {
    expect(detectIntent("I would love a dark mode, please add it to the roadmap.")).toBe("feature_request");
  });

  it("detects a refund request", () => {
    expect(detectIntent("Please refund my order, I want my money back.")).toBe("refund");
  });

  it("detects cancellation intent", () => {
    expect(detectIntent("Cancel my subscription now.")).toBe("cancel");
  });

  it("treats a how-to as a question, not a cancel", () => {
    expect(detectIntent("How do I cancel my subscription?")).toBe("question");
  });

  it("detects a complaint", () => {
    expect(detectIntent("This is unacceptable, the worst experience, never again.")).toBe("complaint");
  });

  it("detects praise", () => {
    expect(detectIntent("This is amazing, I love it, absolutely fantastic service.")).toBe("praise");
  });

  it("falls back to other for neutral text", () => {
    expect(detectIntent("The package arrived on Tuesday at 3pm.")).toBe("other");
  });
});

describe("detectIssueCategory", () => {
  it("classifies delivery problems", () => {
    expect(detectIssueCategory("My package never arrived, tracking shows nothing.")).toBe("delivery");
  });

  it("classifies login problems", () => {
    expect(detectIssueCategory("I can't log in, my password reset is broken.")).toBe("login & account");
  });

  it("classifies payment problems", () => {
    expect(detectIssueCategory("I was charged twice on my card.")).toBe("payment & billing");
  });

  it("defaults to general", () => {
    expect(detectIssueCategory("The weather today is quite pleasant.")).toBe("general");
  });
});

describe("computeSeverity", () => {
  it("flags strong negativity as CRITICAL", () => {
    const text = "This is the absolute worst experience I have ever had, I am furious and will never order again.";
    const result = analyzeText(text);
    expect(computeSeverity(text, result, "complaint")).toBe("CRITICAL");
  });

  it("keeps positive signals LOW", () => {
    const text = "Really enjoyed it, will definitely recommend to friends.";
    const result = analyzeText(text);
    expect(computeSeverity(text, result, "praise")).toBe("LOW");
  });

  it("raises refund intent to HIGH on negativity", () => {
    const text = "I want a refund, this product is disappointing.";
    const result = analyzeText(text);
    expect(computeSeverity(text, result, "refund")).toBe("HIGH");
  });
});

describe("classifySignal", () => {
  it("sets featureRequest flag from intent", () => {
    const text = "Please add offline mode, it would be great if the app worked without internet.";
    const classification = classifySignal(text, analyzeText(text));
    expect(classification.featureRequest).toBe(true);
    expect(classification.isComplaint).toBe(false);
  });

  it("sets refundRequest flag", () => {
    const text = "Give me my money back, this is a scam.";
    const classification = classifySignal(text, analyzeText(text));
    expect(classification.refundRequest).toBe(true);
  });

  it("marks strong complaints as complaints", () => {
    const text = "Terrible support, still waiting after days, unacceptable.";
    const classification = classifySignal(text, analyzeText(text));
    expect(classification.isComplaint).toBe(true);
  });

  it("always returns a valid severity", () => {
    const text = "Everything is fine today.";
    const classification = classifySignal(text, analyzeText(text));
    expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(classification.severity);
  });
});

describe("enrichSignal", () => {
  it("returns analysis plus classification with an issue category", () => {
    const { result, classification } = enrichSignal("My order never arrived, package lost in transit. I want a refund.");
    expect(result.wordCount).toBeGreaterThan(0);
    expect(classification.issueCategory).toBeTruthy();
    expect(classification.severity).toBeTruthy();
  });
});