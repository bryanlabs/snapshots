import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

// Configure which routes require authentication
export const config = {
  matcher: [
    // Protect API routes that require authentication
    "/api/v1/snapshots/download/:path*",
    "/api/v1/teams/:path*",
    "/api/v1/credits/:path*",
    "/api/v1/requests/:path*",
    // Protect UI routes
    "/dashboard/:path*",
    "/teams/:path*",
    "/settings/:path*",
  ],
};