import { describe, it, expect } from "vitest";
import { pickTextColumn, analyzeBatch, toReportCSV } from "./batch-analysis";

describe("pickTextColumn", () => {
  it("picks the column with the longest average string length", () => {
    const rows = [
      { id: "1", review: "This product completely exceeded my expectations in every way." },
      { id: "2", review: "Terrible quality, broke after a single day of normal use." },
    ];
    expect(pickTextColumn(rows)).toBe("review");
  });

  it("returns null for an empty row set", () => {
    expect(pickTextColumn([])).toBeNull();
  });
});

describe("analyzeBatch", () => {
  const rows = [
    { review: "Absolutely love this, best purchase ever, amazing quality." },
    { review: "Terrible, awful, broke immediately, total waste of money." },
    { review: "It arrived on Tuesday as scheduled." },
  ];

  it("scores every row and buckets sentiment correctly", () => {
    const batch = analyzeBatch(rows);
    expect(batch.totalRows).toBe(3);
    expect(batch.columnUsed).toBe("review");
    const total = batch.distribution.reduce((sum, d) => sum + d.value, 0);
    expect(total).toBe(3);
  });

  it("respects the maxRows cap", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ review: `Review number ${i} is fine.` }));
    const batch = analyzeBatch(many, 5);
    expect(batch.totalRows).toBeLessThanOrEqual(5);
  });

  it("skips rows with empty text in the detected column", () => {
    const withBlanks = [{ review: "Great product, love it." }, { review: "" }, { review: "   " }];
    const batch = analyzeBatch(withBlanks);
    expect(batch.totalRows).toBe(1);
  });
});

describe("toReportCSV", () => {
  it("produces a valid CSV header and one row per result", () => {
    const batch = analyzeBatch([{ review: "Great stuff, really happy with it." }]);
    const csv = toReportCSV(batch);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("row,sentiment,score,text");
    expect(lines.length).toBe(1 + batch.results.length);
  });
});
