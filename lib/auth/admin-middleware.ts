import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Middleware to check if the current user has admin role
 * Returns null if authorized, or an error response if not
 */
export async function requireAdmin() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Authentication required" },
      { status: 401 }
    );
  }

  // Special handling for the premium user (legacy support)
  if (session.user.id === 'premium-user') {
    // Premium user is not an admin by default
    return NextResponse.json(
      { error: "Forbidden", message: "Admin access required" },
      { status: 403 }
    );
  }

  // Fetch the user to check their role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: "Forbidden", message: "Admin access required" },
      { status: 403 }
    );
  }

  // User is authenticated and has admin role
  return null;
}

/**
 * Helper to wrap admin route handlers
 */
export function withAdminAuth<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args) => {
    const adminCheck = await requireAdmin();
    if (adminCheck) return adminCheck;
    
    return handler(...args);
  }) as T;
}