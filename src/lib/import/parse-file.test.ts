import { describe, it, expect } from "vitest";

import { parseFileBuffer, ImportParseError, validateUpload } from "./parse-file";

function buffer(text: string): Buffer {
  return Buffer.from(text, "utf8");
}

describe("validateUpload", () => {
  it("rejects unsupported extensions with a helpful message", () => {
    expect(() => validateUpload({ fileName: "doc.pdf", mimeType: null, sizeBytes: 10, buffer: buffer("%PDF-1.4") })).toThrow(ImportParseError);
  });

  it("rejects empty files", () => {
    expect(() => validateUpload({ fileName: "a.csv", mimeType: null, sizeBytes: 0, buffer: buffer("") })).toThrow(/empty/);
  });

  it("rejects PDF magic bytes even with a csv name", () => {
    expect(() => validateUpload({ fileName: "evil.csv", mimeType: null, sizeBytes: 5, buffer: buffer("%PDF-") })).toThrow(ImportParseError);
  });

  it("rejects xlsx that isn't actually a zip archive", () => {
    expect(() => validateUpload({ fileName: "fake.xlsx", mimeType: null, sizeBytes: 8, buffer: buffer("notazip!!") })).toThrow(/\.xlsx/);
  });
});

describe("parseFileBuffer / CSV", () => {
  it("parses header rows and skips empty lines, stripping a UTF-8 BOM", () => {
    const csv = buffer("\uFEFFcustomer_id,feedback_text,rating\nC1,Love it,5\nC2,Broke,1\n,,,\nC3,ok,3\n");
    const parsed = parseFileBuffer({
      fileName: "reviews.csv",
      mimeType: "text/csv",
      sizeBytes: csv.length,
      buffer: csv,
    });
    expect(parsed.realFileType).toBe("csv");
    expect(parsed.headers).toEqual(["customer_id", "feedback_text", "rating"]);
    expect(parsed.rowCount).toBe(3);
    expect(parsed.rows[0]["feedback_text"]).toBe("Love it");
  });
});

describe("parseFileBuffer / JSON", () => {
  it("accepts a plain array", () => {
    const json = buffer('[{"customer_id":"1","text":"Great"},{"customer_id":"2","text":"Bad"}]');
    const parsed = parseFileBuffer({
      fileName: "data.json",
      mimeType: "application/json",
      sizeBytes: json.length,
      buffer: json,
    });
    expect(parsed.rowCount).toBe(2);
    expect(parsed.rows[0]["text"]).toBe("Great");
  });

  it("unwraps a common top-level array key and coerces values to strings", () => {
    const json = buffer('{"data":[{"rating":5,"review":"Nice"}]}');
    const parsed = parseFileBuffer({
      fileName: "data.json",
      mimeType: "application/json",
      sizeBytes: json.length,
      buffer: json,
    });
    expect(parsed.rowCount).toBe(1);
    expect(parsed.rows[0]["rating"]).toBe("5");
    expect(parsed.warnings.some((w) => w.includes("data"))).toBe(true);
  });
});

describe("parseFileBuffer / TXT", () => {
  it("turns the whole plain file into one feedback row", () => {
    const txt = buffer("Loved the second shipment, the timing was perfect.");
    const parsed = parseFileBuffer({
      fileName: "note.txt",
      mimeType: "text/plain",
      sizeBytes: txt.length,
      buffer: txt,
    });
    expect(parsed.rowCount).toBe(1);
    expect(parsed.rows[0]["text"]).toContain("second shipment");
  });
});

describe("parseFileBuffer / XLSX", () => {
  it("parses the first data sheet into rows with headers", async () => {
    // Build a tiny workbook in-memory the same way the app ships it.
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["customer_id", "feedback_text"],
      ["A1", "Fantastic experience"],
      ["A2", "Would like a refund"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const bytes = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const parsed = parseFileBuffer({ fileName: "data.xlsx", mimeType: "", sizeBytes: bytes.length, buffer: bytes });
    expect(parsed.realFileType).toBe("xlsx");
    expect(parsed.rowCount).toBe(2);
    expect(parsed.rows[1]["feedback_text"]).toBe("Would like a refund");
  });
});