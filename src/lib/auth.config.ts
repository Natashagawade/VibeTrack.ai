import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

const providers: NextAuthConfig["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

/**
 * Edge-runtime-safe config: OAuth providers + session callbacks only.
 * Deliberately excludes the Credentials provider (needs bcrypt) and the
 * Prisma adapter (needs a Node-only DB driver) — both of those only run in
 * `src/lib/auth.ts`, which executes in the Node runtime (API routes, server
 * components), never inside Edge Middleware. Importing Prisma/bcrypt into
 * middleware.ts is a common Auth.js + Prisma pitfall; this split avoids it.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/sign-in",
    newUser: "/dashboard",
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
