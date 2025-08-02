import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";

const requestSchema = z.object({
  chainId: z.string(),
  targetHeight: z.number().min(0),
  compressionType: z.enum(["zstd", "lz4"]),
  compressionLevel: z.number().min(0).max(15).optional(),
  retentionDays: z.number().min(1).max(365),
  isPrivate: z.boolean().optional().default(false),
  scheduleType: z.literal("once"), // Only support one-time snapshots
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only premium and unlimited users can request custom snapshots
    if (session.user.tier !== 'premium' && session.user.tier !== 'unlimited') {
      return NextResponse.json(
        { error: "Custom snapshots are only available for premium and unlimited users" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = requestSchema.parse(body);

    // Forward request to snapshot-processor
    const processorUrl = process.env.SNAPSHOT_PROCESSOR_URL || 'http://snapshot-processor:8080';
    const processorResponse = await fetch(`${processorUrl}/api/v1/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chain_id: validatedData.chainId,
        target_height: validatedData.targetHeight,
        compression_type: validatedData.compressionType,
        compression_level: validatedData.compressionLevel,
        retention_days: validatedData.retentionDays,
        is_private: validatedData.isPrivate,
        user_id: session.user.id,
        priority: 100, // Premium users get highest priority
      }),
    });

    if (!processorResponse.ok) {
      const error = await processorResponse.text();
      throw new Error(`Snapshot processor error: ${error}`);
    }

    const result = await processorResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        requestId: result.request_id,
        status: result.status,
        message: "Custom snapshot request created successfully",
      }
    });
  } catch (error) {
    console.error('Custom snapshot request error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create snapshot request" },
      { status: 500 }
    );
  }
}