import "server-only";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  truncated: boolean;
  realFileType: string;
  warnings: string[];
}

export class ImportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportParseError";
  }
}

export const SUPPORTED_EXTENSIONS = ["csv", "xlsx", "xls", "json", "txt"] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

/** Max rows kept for preview + processing; larger files are truncated (flagged). */
export const MAX_IMPORT_ROWS = 10_000;
/** Max text length a single signal may carry (mirrors /api/analyze/text). */
export const MAX_SIGNAL_TEXT = 20_000;

export const SIZE_LIMITS: Record<SupportedExtension, number> = {
  csv: 15 * 1024 * 1024,
  xlsx: 25 * 1024 * 1024,
  xls: 15 * 1024 * 1024,
  json: 15 * 1024 * 1024,
  txt: 5 * 1024 * 1024,
};

export function extensionOf(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ext;
}

/** Validates extension + MIME + magic bytes enough to reject obvious junk. */
export function validateUpload(opts: { fileName: string; mimeType: string | null; sizeBytes: number; buffer: Buffer }): SupportedExtension {
  const ext = extensionOf(opts.fileName);
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ImportParseError(
      `Unsupported file type ".${ext}". Supported: ${SUPPORTED_EXTENSIONS.join(", ")}. ` +
        "PDF, DOCX, images, audio and video are handled one-at-a-time on the Analyze pages."
    );
  }
  const supported = ext as SupportedExtension;

  const limit = SIZE_LIMITS[supported];
  if (opts.sizeBytes > limit) {
    throw new ImportParseError(`File is ${(opts.sizeBytes / 1024 / 1024).toFixed(1)} MB — the ${supported.toUpperCase()} limit is ${Math.round(limit / 1024 / 1024)} MB.`);
  }
  if (opts.sizeBytes === 0) {
    throw new ImportParseError("The uploaded file is empty.");
  }

  const head = opts.buffer.subarray(0, 8);
  const isZip = head[0] === 0x50 && head[1] === 0x4b; // "PK"
  const isPdf = head.toString("latin1").startsWith("%PDF");

  if (isPdf) {
    throw new ImportParseError("PDF files can't be bulk-imported yet — use the Analyze > Documents page for single documents." + ` Instead, export the document as CSV or TXT and re-upload.`);
  }
  if (ext === "xlsx" && !isZip) {
    throw new ImportParseError("That file looks corrupted or isn't a real .xlsx file.");
  }
  if (ext === "csv" && opts.buffer.subarray(0, 1024).toString("utf8").includes("\u0000")) {
    throw new ImportParseError("That file doesn't look like a plain-text CSV (binary content detected).");
  }

  return supported;
}

function cleanHeaders(raw: Record<string, unknown>): string[] {
  return Object.keys(raw).map((h) => h.trim()).filter(Boolean);
}

function trimRows(rows: Record<string, unknown>[]): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  for (const row of rows) {
    const cleaned: Record<string, string> = {};
    let hasValue = false;
    for (const [k, v] of Object.entries(row)) {
      const key = k.trim();
      if (!key) continue;
      const value = v === undefined || v === null ? "" : String(v).trim();
      if (v !== undefined && v !== null && String(v).trim() !== "") hasValue = true;
      cleaned[key] = value;
    }
    if (hasValue) out.push(cleaned);
  }
  return out;
}

function parseCsv(buffer: Buffer): { rows: Record<string, string>[]; warnings: string[] } {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  let parsed;
  try {
    parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      dynamicTyping: false,
    });
  } catch {
    throw new ImportParseError("Couldn't parse that CSV file.");
  }
  if (parsed.errors?.length) {
    const serious = parsed.errors.filter((e) => e.code === "TooFewFields" || e.code === "TooManyFields");
    return {
      rows: trimRows(parsed.data).map((r) => r as unknown as Record<string, string>),
      warnings: serious.length
        ? [`${serious.length} row(s) had missing or extra fields and were read best-effort.`]
        : [],
    };
  }
  return { rows: trimRows(parsed.data), warnings: [] };
}

function parseExcel(buffer: Buffer): { rows: Record<string, string>[]; warnings: string[] } {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  } catch {
    throw new ImportParseError("Couldn't read that Excel file. Make sure it's a valid .xlsx or .xls workbook.");
  }
  const sheetNames = wb.SheetNames.filter((name) => {
    const ws = wb.Sheets[name];
    return ws && XLSX.utils.decode_range(ws["!ref"] || "A1").e.r > 0;
  });
  if (sheetNames.length === 0) {
    throw new ImportParseError("That workbook has no sheets with data rows.");
  }
  const warnings = wb.SheetNames.length > 1 ? [`Read sheet "${sheetNames[0]}" (${wb.SheetNames.length} sheets found).`] : [];
  const ws = wb.Sheets[sheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false, blankrows: false });
  return { rows: trimRows(rows), warnings };
}

function parseJson(buffer: Buffer): { rows: Record<string, string>[]; warnings: string[] } {
  let data: unknown;
  try {
    data = JSON.parse(buffer.toString("utf8").replace(/^\uFEFF/, ""));
  } catch {
    throw new ImportParseError("That JSON file isn't valid JSON.");
  }

  const warnings: string[] = [];
  let list: unknown[] | undefined;
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["data", "rows", "items", "records", "signals", "feedbacks", "feedback", "results"]) {
      if (Array.isArray(obj[key])) {
        list = obj[key];
        warnings.push(`Read the "${key}" array from the JSON.`);
        break;
      }
    }
    if (!list) list = [obj]; // single feedback object
  } else {
    throw new ImportParseError("That JSON file should contain an array of records (or an object with a data/rows/items array).");
  }

  const cleaned = trimRows(list as Record<string, unknown>[]);
  return { rows: cleaned, warnings };
}

function parseTxt(buffer: Buffer): { rows: Record<string, string>[]; warnings: string[] } {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "").trim();
  if (!text) throw new ImportParseError("That text file is empty.");
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const rows = blocks.map((b) => ({ text: b.slice(0, MAX_SIGNAL_TEXT) }));
  const warnings = blocks.length > 1 ? [`Split the file into ${blocks.length} entries on blank lines.`] : [];
  return { rows, warnings };
}

/** Server-side parse: validates, sniffs, and normalises the uploaded bytes. */
export function parseFileBuffer(opts: { fileName: string; mimeType: string | null; sizeBytes: number; buffer: Buffer }): ParsedFile {
  const ext = validateUpload(opts);

  let rows: Record<string, string>[];
  let warnings: string[] = [];
  switch (ext) {
    case "csv":
      ({ rows, warnings } = parseCsv(opts.buffer));
      break;
    case "xlsx":
    case "xls":
      ({ rows, warnings } = parseExcel(opts.buffer));
      break;
    case "json":
      ({ rows, warnings } = parseJson(opts.buffer));
      break;
    case "txt":
      ({ rows, warnings } = parseTxt(opts.buffer));
      break;
  }

  // Keep empty melted duplicates? No: keep only rows that contain any value.
  let truncated = false;
  if (rows.length > MAX_IMPORT_ROWS) {
    rows = rows.slice(0, MAX_IMPORT_ROWS);
    truncated = true;
  }

  const headers = rows.length > 0 ? cleanHeaders(rows[0]) : [];
  return {
    headers,
    rows,
    rowCount: rows.length,
    truncated,
    realFileType: ext,
    warnings,
  };
}