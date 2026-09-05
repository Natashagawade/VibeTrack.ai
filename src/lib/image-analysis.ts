"use client";

// Both functions run entirely in the browser (WASM OCR + canvas pixel reads).

export async function runOcr(file: File, onProgress?: (p: number) => void): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) onProgress(m.progress);
    },
  });
  const {
    data: { text },
  } = await worker.recognize(file);
  await worker.terminate();
  return text.trim();
}

export interface ImageColorAnalysis {
  avgBrightness: number; // 0-255
  dominantColor: string; // hex
  palette: { color: string; percent: number }[];
}

export async function analyzeImageColors(file: File): Promise<ImageColorAnalysis> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 200 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let rSum = 0, gSum = 0, bSum = 0, brightnessSum = 0;
  const buckets = new Map<string, number>();
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    rSum += r; gSum += g; bSum += b;
    brightnessSum += (r * 0.299 + g * 0.587 + b * 0.114);
    // Bucket into coarse 32-step color bins for a rough palette
    const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  const dominantColor = `#${toHex(rSum / pixelCount)}${toHex(gSum / pixelCount)}${toHex(bSum / pixelCount)}`;

  const palette = Array.from(buckets.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [r, g, b] = key.split(",").map(Number);
      return { color: `#${toHex(r)}${toHex(g)}${toHex(b)}`, percent: Math.round((count / pixelCount) * 100) };
    });

  return { avgBrightness: Math.round(brightnessSum / pixelCount), dominantColor, palette };
}
