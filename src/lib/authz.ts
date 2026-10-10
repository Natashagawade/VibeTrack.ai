import "server-only";
import { auth } from "@/lib/auth";
import { resolveSharedOrg, resolveUserOrg } from "@/lib/org";

export interface AuthContext {
  userId: string;
  email: string;
  name?: string | null;
  role: string;
  orgId: string;
  orgRole: string;
}

/**
 * Resolves who is calling and which tenant they may touch.
 *
 * Signed-in users get their own organization. Because there is no sign-in any
 * more, unauthenticated calls resolve to the single shared workspace instead
 * of being sent to a login page — the dashboard is public.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const session = await auth().catch(() => null);
  const user = session?.user;

  if (user?.id) {
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

  const shared = await resolveSharedOrg();
  return {
    userId: "",
    email: "",
    role: "USER",
    orgId: shared.orgId,
    orgRole: shared.orgRole,
  };
}

/** Page-guard alias kept for the many call sites that already use it. */
export async function requireOrg(): Promise<AuthContext> {
  return getAuthContext();
}
