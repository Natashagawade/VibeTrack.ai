import type { NextAuthConfig } from "next-auth";

/**
 * Edge-runtime-safe config.
 *
 * The app is public — there is no sign-in page — so no OAuth providers are
 * registered. The Credentials provider and the Prisma adapter live in
 * `src/lib/auth.ts`, which only ever runs in the Node runtime (API routes,
 * server components), never in Edge Middleware.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  providers: [],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
