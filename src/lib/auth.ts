import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { resolveUserOrg } from "@/lib/org";

// Full, Node-runtime config: everything from the edge-safe authConfig plus
// the Credentials provider, the Prisma adapter, and org-aware JWT hydration —
// all of which need Node APIs unavailable in Edge Middleware. Only ever
// imported from API routes and server components — never from proxy.ts.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      const userId = token.id;
      if (user) {
        const signInUserId = user.id;
        if (!signInUserId) return token;
        token.id = signInUserId;
        token.role = user.role ?? "USER";
        const ctx = await resolveUserOrg(signInUserId, user.email, user.name);
        token.orgId = ctx.orgId;
        token.orgRole = ctx.orgRole;
      } else if (userId && !token.orgId) {
        // Legacy sessions minted before org hydration can self-heal.
        const ctx = await resolveUserOrg(userId);
        token.orgId = ctx.orgId;
        token.orgRole = ctx.orgRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "USER";
        session.user.orgId = token.orgId ?? "";
        session.user.orgRole = token.orgRole ?? "";
      }
      return session;
    },
  },
});