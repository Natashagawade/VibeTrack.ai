import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Uses the edge-safe config only — no Prisma, no bcrypt — so this bundles
// cleanly for Edge Middleware. See auth.config.ts for why.
const { auth } = NextAuth(authConfig);

// Auth only gates the dashboard once a real database is configured. With no
// DATABASE_URL set, there's nowhere to persist accounts, so the dashboard
// stays open in "demo mode" (see the banner in the dashboard layout) rather
// than locking the whole product behind a login nobody can complete.
const authEnabled = Boolean(process.env.DATABASE_URL);

export default authEnabled
  ? auth((req) => {
      const isLoggedIn = Boolean(req.auth);
      if (!isLoggedIn) {
        const signInUrl = new URL("/sign-in", req.nextUrl.origin);
        signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(signInUrl);
      }
      return NextResponse.next();
    })
  : function middleware() {
      return NextResponse.next();
    };

export const config = {
  matcher: ["/dashboard/:path*"],
};
