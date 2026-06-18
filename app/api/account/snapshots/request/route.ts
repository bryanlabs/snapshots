import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { evaluateCustomSnapshotQuota } from "@/lib/snapshots/customQuota";
import { trackCustomSnapshotRequest } from "@/lib/monitoring/metrics";
import {
  createTierAccessError,
  getEffectiveAccessTier,
  getEffectiveTierCapabilities,
} from "@/lib/utils/tier";

const requestSchema = z.object({
  chainId: z.string(),
  targetHeight: z.number().min(0),
  compressionType: z.enum(["zstd", "lz4"]),
  compressionLevel: z.number().min(0).max(12).optional(),
  retentionDays: z.number().min(1).max(365),
  isPrivate: z.boolean().optional(),
  visibility: z.enum(["private", "public"]).optional(),
  sharePublicly: z.boolean().optional(),
  note: z.string().max(500).optional(),
  scheduleType: z.literal("once"), // Only support one-time snapshots
});

function priorityForTier(tier?: string | null) {
  if (tier === "ultra" || tier === "unlimited" || tier === "enterprise" || tier === "ultimate") return 200;
  if (tier === "premium") return 100;
  return 0;
}

function resolveVisibility(data: z.infer<typeof requestSchema>) {
  if (data.visibility) return data.visibility;
  if (data.sharePublicly) return "public";
  if (data.isPrivate === false) return "public";
  return "private";
}

export async function POST(request: NextRequest) {
  let localRequestId: string | null = null;
  let metricContext: {
    chainId: string;
    tier: string;
    visibility: string;
  } | null = null;

  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const effectiveTier = getEffectiveAccessTier(session.user.tier);
    const capabilities = getEffectiveTierCapabilities(session.user.tier);
    const body = await request.json();
    const validatedData = requestSchema.parse(body);
    const visibility = resolveVisibility(validatedData);
    metricContext = {
      chainId: validatedData.chainId,
      tier: effectiveTier,
      visibility,
    };

    if (!capabilities.canRequestCustomSnapshots) {
      trackCustomSnapshotRequest(validatedData.chainId, effectiveTier, visibility, "denied");
      const tierError = createTierAccessError(session.user.tier, 'custom snapshots');
      return NextResponse.json(
        { error: tierError.error, code: tierError.code },
        { status: tierError.status }
      );
    }

    // Enforce custom snapshot retention/quota policy to protect shared storage
    const quota = await evaluateCustomSnapshotQuota(session.user.id, effectiveTier);
    if (quota.overGlobalCap) {
      trackCustomSnapshotRequest(validatedData.chainId, effectiveTier, visibility, "rate_limited");
      return NextResponse.json(
        {
          error: "Custom snapshot storage is temporarily full. Please try again after some snapshots expire.",
          code: "STORAGE_FULL",
        },
        { status: 503 }
      );
    }
    if (quota.maxConcurrent <= 0) {
      trackCustomSnapshotRequest(validatedData.chainId, effectiveTier, visibility, "denied");
      return NextResponse.json(
        { error: "Your plan does not include custom snapshots.", code: "QUOTA_NOT_ALLOWED" },
        { status: 403 }
      );
    }
    if (quota.atUserLimit) {
      trackCustomSnapshotRequest(validatedData.chainId, effectiveTier, visibility, "rate_limited");
      return NextResponse.json(
        {
          error: `You can have ${quota.maxConcurrent} custom snapshot${quota.maxConcurrent === 1 ? "" : "s"} at a time. Delete an existing one or wait for it to expire.`,
          code: "QUOTA_EXCEEDED",
        },
        { status: 429 }
      );
    }

    const publishStatus = visibility === "public" ? "published" : "private";
    const priority = priorityForTier(effectiveTier);

    const localRequest = await prisma.snapshotRequest.create({
      data: {
        userId: session.user.id,
        chainId: validatedData.chainId,
        blockHeight: BigInt(validatedData.targetHeight),
        pruningMode: "custom",
        compressionType: validatedData.compressionType,
        databaseBackend: "goleveldb",
        requestNote: validatedData.note,
        visibility,
        publishStatus,
        scheduleType: validatedData.scheduleType,
        status: "pending",
        progressPhase: "queued",
        progressMessage: "Request submitted and waiting for the snapshot worker",
        progressPercent: 0,
        progressUpdatedAt: new Date(),
        priority,
        retentionDays: quota.retentionDays,
      },
    });
    localRequestId = localRequest.id;

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
        compression_types: [validatedData.compressionType],
        compression_level: validatedData.compressionLevel,
        app_request_id: localRequest.id,
        user_id: session.user.id,
        visibility,
        publish_status: publishStatus,
        request_note: validatedData.note,
        retention_days: quota.retentionDays,
        retention_hours: quota.retentionHours,
      }),
    });

    if (!processorResponse.ok) {
      const error = await processorResponse.text();
      throw new Error(`Snapshot processor error: ${error}`);
    }

    const result = await processorResponse.json();

    await prisma.snapshotRequest.update({
      where: { id: localRequest.id },
      data: {
        processorRequestId: result.request_id,
        status: result.status || "pending",
      },
    });

    trackCustomSnapshotRequest(validatedData.chainId, effectiveTier, visibility, "success");

    return NextResponse.json({
      success: true,
      data: {
        requestId: localRequest.id,
        processorRequestId: result.request_id,
        status: result.status,
        visibility,
        publishStatus,
        message: "Custom snapshot request created successfully",
      }
    });
  } catch (error) {
    console.error('Custom snapshot request error:', error);

    if (metricContext) {
      trackCustomSnapshotRequest(
        metricContext.chainId,
        metricContext.tier,
        metricContext.visibility,
        error instanceof z.ZodError ? "invalid" : "error"
      );
    }

    if (localRequestId) {
      await prisma.snapshotRequest.update({
        where: { id: localRequestId },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Failed to create snapshot request",
        },
      }).catch((updateError) => {
        console.error("Failed to mark custom snapshot request as failed:", updateError);
      });
    }
    
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
