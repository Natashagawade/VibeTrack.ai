import { analyzeText, extractKeywords } from "./text-analysis";

export interface RowResult {
  rowIndex: number;
  text: string;
  sentimentLabel: "Positive" | "Negative" | "Neutral";
  normalized: number;
}

export interface BatchAnalysis {
  totalRows: number;
  columnUsed: string;
  results: RowResult[];
  distribution: { name: string; value: number }[];
  avgSentiment: number;
  topKeywords: { word: string; count: number }[];
  toxicFlags: number;
}

/** Picks the column most likely to hold free text (longest average string length). */
export function pickTextColumn(rows: Record<string, string>[]): string | null {
  if (rows.length === 0) return null;
  const columns = Object.keys(rows[0]);
  let best: { col: string; avgLen: number } | null = null;
  for (const col of columns) {
    const lens = rows
      .map((r) => (r[col] ?? "").toString().trim().length)
      .filter((l) => l > 0);
    if (lens.length === 0) continue;
    const avgLen = lens.reduce((a, b) => a + b, 0) / lens.length;
    if (!best || avgLen > best.avgLen) best = { col, avgLen };
  }
  return best?.col ?? columns[0] ?? null;
}

export function analyzeBatch(rows: Record<string, string>[], maxRows = 500): BatchAnalysis {
  const column = pickTextColumn(rows);
  const limited = rows.slice(0, maxRows);
  const results: RowResult[] = [];
  let toxicFlags = 0;
  let sentimentSum = 0;
  const allText: string[] = [];

  limited.forEach((row, i) => {
    const text = column ? (row[column] ?? "").toString() : "";
    if (!text.trim()) return;
    const analysis = analyzeText(text);
    results.push({
      rowIndex: i,
      text,
      sentimentLabel: analysis.sentiment.label,
      normalized: analysis.sentiment.normalized,
    });
    sentimentSum += analysis.sentiment.normalized;
    if (analysis.toxicity.label !== "Low") toxicFlags += 1;
    allText.push(text);
  });

  const pos = results.filter((r) => r.sentimentLabel === "Positive").length;
  const neg = results.filter((r) => r.sentimentLabel === "Negative").length;
  const neu = results.length - pos - neg;

  return {
    totalRows: results.length,
    columnUsed: column ?? "(none detected)",
    results,
    distribution: [
      { name: "Positive", value: pos },
      { name: "Negative", value: neg },
      { name: "Neutral", value: neu },
    ],
    avgSentiment: results.length ? sentimentSum / results.length : 0,
    topKeywords: extractKeywords(allText.join(" "), 12),
    toxicFlags,
  };
}

export function toReportCSV(batch: BatchAnalysis): string {
  const header = "row,sentiment,score,text\n";
  const body = batch.results
    .map((r) => `${r.rowIndex},${r.sentimentLabel},${r.normalized.toFixed(3)},"${r.text.replace(/"/g, '""').slice(0, 300)}"`)
    .join("\n");
  return header + body;
}
