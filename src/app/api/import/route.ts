import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRequestScope } from "@/lib/signals/auth";

export async function GET(req: NextRequest) {
  const scope = await resolveRequestScope(req);
  if (!scope) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const imports = await prisma.import.findMany({
    where: { orgId: scope.orgId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      name: true,
      fileType: true,
      status: true,
      totalRecords: true,
      validRecords: true,
      duplicateRecords: true,
      invalidRecords: true,
      importedRecords: true,
      error: true,
      createdAt: true,
      processedAt: true,
    },
  });

  return NextResponse.json({ imports });
}