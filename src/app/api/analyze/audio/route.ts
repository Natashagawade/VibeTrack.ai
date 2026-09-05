import { NextRequest, NextResponse } from "next/server";
import { analyzeText } from "@/lib/text-analysis";
import { aiAnalyzeText, aiTranscribeAudio, hasOpenAIKey } from "@/lib/ai/openai";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

const MAX_BYTES = 25 * 1024 * 1024; // Whisper's own limit

export async function POST(req: NextRequest) {
  if (!hasOpenAIKey()) {
    return NextResponse.json(
      { error: "Audio transcription needs OPENAI_API_KEY set in your environment (used for Whisper)." },
      { status: 501 }
    );
  }

  const limited = await rateLimit(`analyze-audio:${clientKeyFromRequest(req)}`, { limit: 10, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("audio");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large — 25MB max." }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const transcript = await aiTranscribeAudio(buffer, file.name, file.type || "audio/mpeg");

    if (!transcript.trim()) {
      return NextResponse.json({ error: "No speech detected in that audio." }, { status: 422 });
    }

    let result;
    let engine: "openai:gpt-4o-mini" | "local" = "local";
    try {
      result = await aiAnalyzeText(transcript);
      engine = "openai:gpt-4o-mini";
    } catch {
      result = analyzeText(transcript);
    }

    return NextResponse.json({ transcript, result, engine });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transcription failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
