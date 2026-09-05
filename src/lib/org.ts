import "server-only";
import { randomUUID } from "node:crypto";
import { IntegrationKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "workspace";
}

export interface OrgContext {
  orgId: string;
  orgRole: string;
  created: boolean;
}

const INTEGRATION_KINDS: IntegrationKind[] = [
  "JIRA",
  "LINEAR",
  "SLACK",
  "TEAMS",
  "ZENDESK",
  "INTERCOM",
  "GOOGLE_SHEETS",
  "REST_API",
];

/**
 * Resolve the tenant a user belongs to. Legacy users (created before
 * multi-tenancy) have no Organization; the first access provisions one with
 * the user as OWNER, default notification preferences, and NOT_CONFIGURED
 * integration rows. New sign-ups are provisioned explicitly at registration.
 */
export async function resolveUserOrg(userId: string, email?: string | null, name?: string | null): Promise<OrgContext> {
  const existing = await prisma.membership.findFirst({
    where: { userId },
    select: { orgId: true, role: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) {
    return { orgId: existing.orgId, orgRole: existing.role, created: false };
  }

  const orgName = (name?.trim() || email?.trim() || "My workspace").slice(0, 80);
  const slugBase = slugify(email?.split("@")[0] ?? orgName);

  const org = await prisma.organization.create({
    data: {
      name: orgName,
      slug: `${slugBase}-${randomUUID().slice(0, 8)}`,
      competitorNames: [],
    },
  });

  await prisma.$transaction([
    prisma.membership.create({ data: { orgId: org.id, userId, role: "OWNER" } }),
    prisma.notificationPref.create({ data: { orgId: org.id, userId } }),
    ...INTEGRATION_KINDS.map((kind) =>
      prisma.integration.create({ data: { orgId: org.id, kind, name: kind.toLowerCase() } })
    ),
  ]);

  return { orgId: org.id, orgRole: "OWNER", created: true };
}