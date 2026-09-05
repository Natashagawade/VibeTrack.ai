import "server-only";
import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveUserOrg } from "@/lib/org";

export type SignalScope = {
  userId: string;
  orgId: string;
  auth: "session" | "apikey";
};

export interface ScopedContext extends SignalScope {
  where: Prisma.CustomerSignalWhereInput;
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Resolves who is calling a signals API and which tenant they may touch.
 * Two accepted clients:
 *  - `Authorization: Bearer <apiKey>`  (server API keys, stored hashed)
 *  - the signed-in session (dashboard)
 * Returns null when neither auth path resolves.
 */
export async function resolveRequestScope(request: Request): Promise<SignalScope | null> {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const apiKey = authorization.slice("Bearer ".length).trim();
    if (!apiKey) return null;
    const record = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(apiKey) } });
    if (!record || record.revokedAt) return null;
    await prisma.apiKey
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
    return { userId: record.userId, orgId: record.orgId, auth: "apikey" };
  }

  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;

  if (user.orgId) {
    return { userId: user.id, orgId: user.orgId, auth: "session" };
  }

  const ctx = await resolveUserOrg(user.id, user.email, user.name);
  return { userId: user.id, orgId: ctx.orgId, auth: "session" };
}

/** Convenience: tenant-filter scope for CustomerSignal queries. */
export async function withSignalsContext(request: Request): Promise<ScopedContext | null> {
  const scope = await resolveRequestScope(request);
  if (!scope) return null;
  return { ...scope, where: { orgId: scope.orgId } };
}