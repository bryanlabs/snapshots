import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      );
    }

    // Check if user exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!userExists) {
      // User in session but not in database
      return NextResponse.json(
        { 
          error: "Session invalid - user not found in database",
          requiresReauth: true 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      userId: session.user.id,
      hasEmail: !!session.user.email,
      hasWallet: !!session.user.walletAddress
    });
  } catch (error) {
    console.error('Session sync error:', error);
    return NextResponse.json(
      { error: "Failed to sync session" },
      { status: 500 }
    );
  }
}