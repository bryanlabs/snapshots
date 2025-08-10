import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";
import { z } from "zod";

const WalletAuthSchema = z.object({
  walletAddress: z.string().min(1),
  signature: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = WalletAuthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Sign in with wallet credentials
    // NextAuth will handle the session creation
    await signIn("wallet", {
      walletAddress: parsed.data.walletAddress,
      signature: parsed.data.signature,
      message: parsed.data.message,
      redirect: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Wallet auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}