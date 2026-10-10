import { describe, it, expect } from "vitest";
import { extractRowValues, buildPreview } from "./preview";

describe("extractRowValues", () => {
  it("pulls only mapped values", () => {
    const row = { "customer_id": "C1", "feedback_text": "Love it", "rating": "5", "junk": "x" };
    const out = extractRowValues(row, {
      text: "feedback_text",
      customer_id: "customer_id",
      rating: "rating",
    });
    expect(out).toEqual({ customer_id: "C1", text: "Love it", rating: "5" });
    expect(out["junk"]).toBeUndefined();
  });
});

describe("buildPreview", () => {
  const mapping = { text: "feedback_text", rating: "rating" };

  it("flags duplicate rows within the file and rows without text", () => {
    const parsed = {
      rows: [
        { feedback_text: "Love this product", rating: "5" },
        { feedback_text: "Love this product", rating: "4" }, // duplicate text
        { feedback_text: "   ", rating: "2" }, // invalid (empty after trim)
        { feedback_text: "Arrived on time", rating: "3" },
      ],
    };
    const preview = buildPreview(parsed, mapping);
    expect(preview.stats.total).toBe(4);
    expect(preview.stats.valid).toBe(2);
    expect(preview.stats.validUnique).toBe(2);
    expect(preview.stats.duplicate).toBe(1);
    expect(preview.stats.invalid).toBe(1);
  });

  it("uses sanitized extracted values for status checks", () => {
    const parsed = { rows: [{ feedback_text: "  Good stuff " }] };
    const preview = buildPreview(parsed, mapping);
    expect(preview.stats.invalid).toBe(0);
    expect(preview.stats.valid).toBe(1);
  });

  it("caps preview rows returned to 25", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ feedback_text: `row ${i}` }));
    const preview = buildPreview({ rows: many }, mapping);
    expect(preview.rows.length).toBe(25);
  });
});