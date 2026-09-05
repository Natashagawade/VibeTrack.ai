import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiAnalyzeImage, hasOpenAIKey } from "@/lib/ai/openai";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

const bodySchema = z.object({
  imageDataUrl: z.string().startsWith("data:image/", "Expected a base64 image data URL."),
});

export async function POST(req: NextRequest) {
  if (!hasOpenAIKey()) {
    return NextResponse.json(
      { error: "AI vision analysis needs OPENAI_API_KEY set in your environment." },
      { status: 501 }
    );
  }

  const limited = await rateLimit(`analyze-image:${clientKeyFromRequest(req)}`, { limit: 15, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  // Roughly caps request size — base64 inflates ~33%, so ~13MB raw image max.
  if (parsed.data.imageDataUrl.length > 18_000_000) {
    return NextResponse.json({ error: "Image too large." }, { status: 413 });
  }

  try {
    const result = await aiAnalyzeImage(parsed.data.imageDataUrl);
    return NextResponse.json({ result, engine: "openai:gpt-4o-mini" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Vision analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
