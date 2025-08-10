import { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith("/api/v1/snapshots/download") ||
                         nextUrl.pathname.startsWith("/dashboard") ||
                         nextUrl.pathname.startsWith("/teams") ||
                         nextUrl.pathname.startsWith("/settings");

      if (isProtected && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  providers: [], // Configured in auth.ts
  debug: process.env.NODE_ENV === "development",
  trustHost: true, // Trust the host in production
};