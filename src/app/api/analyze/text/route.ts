import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SignalChannel } from "@prisma/client";
import { analyzeText } from "@/lib/text-analysis";
import { aiAnalyzeText, hasOpenAIKey } from "@/lib/ai/openai";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { resolveRequestScope } from "@/lib/signals/auth";
import { ingestSignal } from "@/lib/signals/pipeline";

const channelValues = Object.values(SignalChannel) as [string, ...string[]];

const bodySchema = z.object({
  text: z.string().min(1, "Text is required.").max(20000, "Text is too long (max 20,000 characters)."),
  channel: z.enum(channelValues as [SignalChannel, ...SignalChannel[]]).optional(),
  sourceName: z.string().max(120).optional(),
  sourceKind: z.string().max(60).optional(),
  customerName: z.string().max(120).optional(),
  customerEmail: z.string().max(200).optional(),
  productName: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  const scope = await resolveRequestScope(req);
  const bucketKey = scope ? `analyze-text:${scope.orgId}` : `analyze-text:${clientKeyFromRequest(req)}`;
  const limited = await rateLimit(bucketKey, { limit: 60, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const { text, channel, sourceName, sourceKind, customerName, customerEmail, productName } = parsed.data;

  // Persist as a CustomerSignal when the caller can be attributed to a tenant.
  let signalId: string | undefined;
  if (scope) {
    try {
      const ingested = await ingestSignal({
        orgId: scope.orgId,
        userId: scope.userId,
        text,
        kind: "TEXT",
        channel: channel ?? "OTHER",
        sourceName,
        sourceKind,
        customerName,
        customerEmail,
        productName,
      });
      signalId = ingested.id;
    } catch (e) {
      console.error("Signal ingestion failed, analysis continues without persistence:", e);
    }
  }

  let result;
  if (hasOpenAIKey()) {
    try {
      result = await aiAnalyzeText(text);
      return NextResponse.json({ result, engine: "openai:gpt-4o-mini", signalId });
    } catch (e) {
      // Fall through to local engine so the feature still works if the API call fails.
      console.error("OpenAI text analysis failed, falling back to local engine:", e);
    }
  }

  result = analyzeText(text);
  return NextResponse.json({ result, engine: "local", signalId });
}