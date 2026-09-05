import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveUserOrg } from "@/lib/org";

export interface AuthContext {
  userId: string;
  email: string;
  name?: string | null;
  role: string;
  orgId: string;
  orgRole: string;
}

/**
 * Node-runtime auth helper: resolves the signed-in user plus their tenant.
 * Lazily provisions an Organization for legacy users on first access.
 * Returns null when unauthenticated (use requireOrg for page guards).
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;

  let orgId = user.orgId;
  let orgRole = user.orgRole;

  if (!orgId) {
    const ctx = await resolveUserOrg(user.id, user.email, user.name);
    orgId = ctx.orgId;
    orgRole = ctx.orgRole;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    name: user.name,
    role: user.role ?? "USER",
    orgId,
    orgRole,
  };
}

/** Page/dashboard guard: redirects to /sign-in when unauthenticated. */
export async function requireOrg(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-in");
  return ctx;
}