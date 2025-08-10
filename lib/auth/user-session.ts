import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface UserSessionInfo {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    tier?: string;
  } | null;
  isAuthenticated: boolean;
}

/**
 * Get current user session with tier information from database
 */
export async function getUserSession(): Promise<UserSessionInfo> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { user: null, isAuthenticated: false };
    }

    // Get user tier from database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        personalTierId: true,
        personalTier: {
          select: {
            name: true
          }
        }
      }
    });

    if (!dbUser) {
      console.error(`Session user ${session.user.id} not found in database`);
      return { user: null, isAuthenticated: false };
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.displayName || session.user.name || undefined,
        role: dbUser.role,
        tier: dbUser.personalTier?.name || 'free' // Default to free if no tier assigned
      },
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Error getting user session:', error);
    return { user: null, isAuthenticated: false };
  }
}

/**
 * Get user tier for unauthenticated users (defaults to free)
 */
export function getGuestUserTier(): string {
  return 'free';
}