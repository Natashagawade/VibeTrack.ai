import { signalHash } from "@/lib/signals/pipeline";
import type { ParsedFile } from "@/lib/import/parse-file";

export type RowStatus = "valid" | "duplicate" | "invalid";

export interface PreviewResult {
  stats: {
    total: number;
    valid: number;
    validUnique: number;
    duplicate: number;
    invalid: number;
  };
  rows: Array<{
    row: number;
    status: RowStatus;
    values: Record<string, string>;
    extracted: Record<string, string>;
  }>;
}

/** Pulls the mapped values out of a row per the confirmed column mapping. */
export function extractRowValues(
  row: Record<string, string>,
  columnMapping: Record<string, string>
): Record<string, string> {
  const extracted: Record<string, string> = {};
  for (const [target, header] of Object.entries(columnMapping)) {
    const value = row[header];
    if (value && String(value).trim() !== "") extracted[target] = String(value).trim();
  }
  return extracted;
}

/** Builds preview + per-row status (valid / duplicate / invalid) from a mapping. */
export function buildPreview(
  parsed: Pick<ParsedFile, "rows">,
  columnMapping: Record<string, string>
): PreviewResult {
  const seenWithinFile = new Set<string>();
  const rows: PreviewResult["rows"] = [];
  let duplicate = 0;
  let invalid = 0;

  parsed.rows.forEach((row, index) => {
    const extracted = extractRowValues(row, columnMapping);
    const text = extracted["text"] ?? "";
    let status: RowStatus = "valid";
    if (!text) status = "invalid";
    else {
      const hash = signalHash(text);
      if (seenWithinFile.has(hash)) {
        status = "duplicate";
      } else {
        seenWithinFile.add(hash);
      }
    }
    if (status === "duplicate") duplicate++;
    if (status === "invalid") invalid++;
    rows.push({ row: index + 2, status, values: row, extracted });
  });

  const valid = parsed.rows.length - duplicate - invalid;

  return {
    stats: {
      total: parsed.rows.length,
      valid,
      validUnique: seenWithinFile.size,
      duplicate,
      invalid,
    },
    rows: rows.slice(0, 25),
  };
}

/** Intersects a set of hashes with hashes already persisted in the org (DB-targeted dedupe). */
export async function countExistingRows(opts: {
  orgId: string;
  hashes: string[];
  findByDb: (hashes: string[]) => Promise<string[]>;
}): Promise<{ existing: number; hashes: string[] }> {
  if (opts.hashes.length === 0) return { existing: 0, hashes: [] };
  const rows = await opts.findByDb(opts.hashes);
  const found = new Set(rows);
  const hashes = opts.hashes.filter((h) => !found.has(h));
  return { existing: opts.hashes.length - hashes.length, hashes };
}

export function hashesForRows(parsed: Pick<ParsedFile, "rows">, columnMapping: Record<string, string>): string[] {
  const hashes: string[] = [];
  for (const row of parsed.rows) {
    const text = extractRowValues(row, columnMapping)["text"] ?? "";
    if (text) hashes.push(signalHash(text));
  }
  return hashes;
}