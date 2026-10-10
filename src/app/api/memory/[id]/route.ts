import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRequestScope } from "@/lib/signals/auth";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await ctx.params;
  const memory = await prisma.businessMemory.findFirst({ where: { id, orgId: scope.orgId } });
  if (!memory) return NextResponse.json({ error: "Memory not found." }, { status: 404 });

  return NextResponse.json({ memory });
}
