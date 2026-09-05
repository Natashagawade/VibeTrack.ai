import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeText } from "@/lib/text-analysis";
import { aiAnalyzeText, hasOpenAIKey } from "@/lib/ai/openai";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

const bodySchema = z.object({
  text: z.string().min(1, "Text is required.").max(20000, "Text is too long (max 20,000 characters)."),
});

export async function POST(req: NextRequest) {
  const limited = await rateLimit(`analyze-text:${clientKeyFromRequest(req)}`, { limit: 30, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const { text } = parsed.data;

  if (hasOpenAIKey()) {
    try {
      const result = await aiAnalyzeText(text);
      return NextResponse.json({ result, engine: "openai:gpt-4o-mini" });
    } catch (e) {
      // Fall through to local engine so the feature still works if the API call fails.
      console.error("OpenAI text analysis failed, falling back to local engine:", e);
    }
  }

  const result = analyzeText(text);
  return NextResponse.json({ result, engine: "local" });
}
