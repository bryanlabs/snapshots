import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateProcessorCustomSnapshotVisibility } from "@/lib/snapshots/processor-visibility";

const updateSchema = z.object({
  visibility: z.enum(["private", "public"]),
});

function serializeRequest(request: any) {
  return {
    id: request.id,
    processorRequestId: request.processorRequestId,
    chainId: request.chainId,
    blockHeight: request.blockHeight.toString(),
    compressionType: request.compressionType,
    databaseBackend: request.databaseBackend,
    requestNote: request.requestNote,
    visibility: request.visibility,
    publishStatus: request.publishStatus,
    status: request.status,
    errorMessage: request.errorMessage,
    progressPhase: request.progressPhase,
    progressMessage: request.progressMessage,
    progressPercent: request.progressPercent,
    progressEtaSeconds: request.progressEtaSeconds,
    progressUpdatedAt: request.progressUpdatedAt?.toISOString() || null,
    retentionDays: request.retentionDays,
    resultStorageChainId: request.resultStorageChainId,
    resultFileName: request.resultFileName,
    resultFileSizeBytes: request.resultFileSizeBytes?.toString() || null,
    resultHeight: request.resultHeight?.toString() || null,
    verifiedAt: request.verifiedAt?.toISOString() || null,
    restoreVerifiedAt: request.restoreVerifiedAt?.toISOString() || null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    completedAt: request.completedAt?.toISOString() || null,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { requestId } = await params;
  const parsed = updateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.snapshotRequest.findFirst({
    where: {
      id: requestId,
      userId: session.user.id,
      deletedAt: null,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Custom snapshot request not found" },
      { status: 404 }
    );
  }

  const publishStatus = parsed.data.visibility === "public" ? "published" : "private";
  const updateData = parsed.data.visibility === "public"
    ? {
        visibility: "public" as const,
        publishStatus,
      }
    : {
        visibility: "private" as const,
        publishStatus,
        isPinned: false,
        isFeatured: false,
      };

  if (existing.resultFileName) {
    await updateProcessorCustomSnapshotVisibility({
      chainId: existing.chainId,
      appRequestId: existing.id,
      visibility: parsed.data.visibility,
      publishStatus,
    });
  }

  const updated = await prisma.snapshotRequest.update({
    where: { id: requestId },
    data: updateData,
  });

  return NextResponse.json({
    success: true,
    data: serializeRequest(updated),
  });
}
