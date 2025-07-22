import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const LinkEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    // Must be authenticated with wallet
    if (!session?.user?.id || !session?.user?.walletAddress) {
      return NextResponse.json(
        { error: "Must be authenticated with wallet" },
        { status: 401 }
      );
    }

    // Can't link if already has email
    if (session.user.email) {
      return NextResponse.json(
        { error: "Account already has email linked" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = LinkEmailSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered. Please sign in with that account instead." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user with email and password
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email,
        passwordHash,
        displayName: session.user.name || email.split("@")[0],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email successfully linked to your account",
    });
  } catch (error) {
    console.error("Link email error:", error);
    return NextResponse.json(
      { error: "Failed to link email" },
      { status: 500 }
    );
  }
}