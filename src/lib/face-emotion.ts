"use client";

import type { ExpressionScores, FaceEmotionSummary } from "@/lib/image-insight";
import { summarizeFaceEmotions } from "@/lib/image-insight";

/**
 * VibeTrack AI — on-device facial expression recognition.
 *
 * Runs entirely in the browser via face-api.js (TensorFlow.js WASM backend).
 * No image is ever uploaded, and no API key or quota is needed — which is why
 * this stays reliable even when a hosted vision provider is unavailable or out
 * of credits. The network behind it distinguishes seven expressions
 * (neutral, happy, sad, angry, fearful, disgusted, surprised).
 *
 * Model weights live in `public/models` and are fetched once per page load.
 */

type FaceApiModule = typeof import("@vladmandic/face-api");

/**
 * face-api re-exports the whole tfjs namespace as `tf`, but its bundled types
 * only declare the tensor ops. These three members genuinely exist at runtime
 * (the ESM bundle exposes them as lazy getters), so we describe just the slice
 * we call rather than fighting the generated types.
 */
interface TfRuntime {
  setBackend(backend: string): Promise<boolean>;
  setWasmPaths?(path: string | string[]): Promise<void> | void;
  ready(): Promise<void>;
}

let modelsPromise: Promise<FaceApiModule> | null = null;

async function loadFaceApi(): Promise<FaceApiModule> {
  const faceapi = await import("@vladmandic/face-api");
  if (!modelsPromise) {
    modelsPromise = (async () => {
      const tf = faceapi.tf as unknown as TfRuntime;
      // WASM keeps this CPU-only and deterministic; the WebGL path needs extra
      // setup and fails on headless and older browsers.
      if (typeof tf.setWasmPaths === "function") {
        await tf.setWasmPaths("/models/tfjs/");
      }
      await tf.setBackend("wasm");
      await tf.ready();

      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
      return faceapi;
    })();
  }
  return modelsPromise;
}

export interface FaceAnalysisResult {
  facesDetected: number;
  /** Face-api's raw per-face expressions, kept for callers that want them. */
  raw: { expressions: ExpressionScores; box: { x: number; y: number; width: number; height: number } }[];
  summary: FaceEmotionSummary | null;
  /** Milliseconds the models took to load on a cold run (0 when cached). */
  loadMs: number;
}

/** Lower = fewer, higher-confidence faces; higher = more detections on small faces. */
const INPUT_SIZE = 512;

/**
 * Detects faces in an image and scores their expressions. Returns
 * `facesDetected: 0` — never an error — when nothing face-shaped is found, so
 * callers can report "no faces detected" instead of pretending to a guess.
 */
export async function analyzeFaceEmotion(file: File | Blob): Promise<FaceAnalysisResult> {
  const startedAt = Date.now();
  const faceapi = await loadFaceApi();
  const loadMs = Date.now() - startedAt;

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Couldn't decode that image file."));
      image.src = url;
    });

    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: INPUT_SIZE, scoreThreshold: 0.35 }))
      .withFaceLandmarks(true)
      .withFaceExpressions();

    const raw = (detections ?? []).map((d) => ({
      expressions: {
        neutral: d.expressions.neutral ?? 0,
        happy: d.expressions.happy ?? 0,
        sad: d.expressions.sad ?? 0,
        angry: d.expressions.angry ?? 0,
        fearful: d.expressions.fearful ?? 0,
        disgusted: d.expressions.disgusted ?? 0,
        surprised: d.expressions.surprised ?? 0,
      },
      box: {
        x: d.detection.box.x,
        y: d.detection.box.y,
        width: d.detection.box.width,
        height: d.detection.box.height,
      },
    }));

    return {
      facesDetected: raw.length,
      raw,
      summary: summarizeFaceEmotions(
        raw.map((r) => r.expressions),
        raw.map((r) => ({
          x: r.box.x / img.width,
          y: r.box.y / img.height,
          width: r.box.width / img.width,
          height: r.box.height / img.height,
        }))
      ),
      loadMs,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
