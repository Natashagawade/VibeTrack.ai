import { NextRequest, NextResponse } from "next/server";
import { ImportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveRequestScope } from "@/lib/signals/auth";
import { rateLimit } from "@/lib/rate-limit";
import { processImport } from "@/lib/import/process-import";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await ctx.params;
  const imp = await prisma.import.findFirst({ where: { id, orgId: scope.orgId } });
  if (!imp) return NextResponse.json({ error: "Import not found." }, { status: 404 });

  const runnable = ["UPLOADED", "PREVIEWED", "FAILED"] as ImportStatus[];
  if (!runnable.includes(imp.status)) {
    return NextResponse.json(
      { error: `This import is ${imp.status.toLowerCase().replaceAll("_", " ")} — it can't be submitted again.` },
      { status: 409 }
    );
  }

  const limited = await rateLimit(`import-process:${scope.orgId}`, { limit: 20, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  try {
    const result = await processImport({ orgId: scope.orgId, userId: scope.userId, importId: imp.id });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message.slice(0, 500) }, { status: 500 });
  }
}