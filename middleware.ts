import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes = [
  '/api/v1/admin',
  '/admin',
];

// Define auth routes
const authRoutes = [
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/auth/me',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow all requests for now
  // TODO: Implement actual authentication check when needed
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};