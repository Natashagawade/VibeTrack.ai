import { describe, it, expect } from "vitest";
import { detectMapping, simplifyMapping, headerKey } from "./column-mapping";

describe("headerKey", () => {
  it("normalises header casing and separators", () => {
    expect(headerKey("Customer ID")).toBe("customer_id");
    expect(headerKey("created_at")).toBe("created_at");
    expect(headerKey(" Feedback Text! ")).toBe("feedback_text");
  });
});

describe("detectMapping", () => {
  it("maps the classic review export shape", () => {
    const rows = [
      { "Customer ID": "C-100", "Review Text": "Amazing product, love it.", Rating: "5", "Created At": "2026-08-01", Product: "Aurora" },
      { "Customer ID": "C-101", "Review Text": "Broke fast, disappointed.", Rating: "1", "Created At": "2026-09-01", Product: "Aurora" },
    ];
    const mapping = detectMapping(["Customer ID", "Review Text", "Rating", "Created At", "Product"], rows);
    expect(mapping["Review Text"].target).toBe("text");
    expect(mapping["Rating"].target).toBe("rating");
    expect(mapping["Created At"].target).toBe("received_at");
    expect(mapping["Product"].target).toBe("product");
    expect(mapping["Customer ID"].target).toBe("customer_id");
  });

  it("only assigns one column per target field", () => {
    const mapping = detectMapping(["comment", "feedback"], []);
    expect(mapping["comment"].target).toBe("text");
    // second text-like column has nowhere to go
    expect(mapping["feedback"].target).toBe("ignore");
  });

  it("boosts confidence when email values look like emails", () => {
    const rows = [
      { email: "a@example.com" },
      { email: "b@example.com" },
      { email: "c@example.com" },
      { email: "d@example.com" },
    ];
    const mapping = detectMapping(["email"], rows);
    expect(mapping.email.target).toBe("customer_email");
    expect(mapping.email.confidence).toBeGreaterThan(0.9);
  });

  it("falls back to ignore for unknown headers", () => {
    const mapping = detectMapping(["uuid_blob"], []);
    expect(mapping["uuid_blob"].target).toBe("ignore");
  });
});

describe("simplifyMapping", () => {
  it("flips header→target into persisted target→header form and drops ignores", () => {
    const detected = detectMapping(["Customer", "Note", "Junk"], []);
    const simplified = simplifyMapping(detected);
    expect(Object.keys(simplified)).toContain("text");
    expect(simplified["text"]).toBeDefined();
    expect(simplified["ignore"]).toBeUndefined();
    // reverse lookup works
    expect(Object.values(simplified)).toContain("Customer");
  });
});