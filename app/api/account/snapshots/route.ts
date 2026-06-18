import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildSnapshotCatalog } from "@/lib/snapshots/custom-catalog";

function serializeRequest(request: any) {
  const completedAt = request.completedAt || null;
  const expiresAt = completedAt
    ? new Date(completedAt.getTime() + request.retentionDays * 24 * 60 * 60 * 1000)
    : null;

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
    isPinned: request.isPinned,
    isFeatured: request.isFeatured,
    adminNote: request.adminNote,
    verifiedAt: request.verifiedAt?.toISOString() || null,
    restoreVerifiedAt: request.restoreVerifiedAt?.toISOString() || null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    completedAt: request.completedAt?.toISOString() || null,
    expiresAt: expiresAt?.toISOString() || null,
  };
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const chainIds = await prisma.snapshotRequest.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
    },
    distinct: ["chainId"],
    select: { chainId: true },
  });

  await Promise.all(
    chainIds.map(({ chainId }) =>
      buildSnapshotCatalog(chainId, {
        id: session.user.id,
        role: session.user.role,
        tier: session.user.tier,
      })
    )
  );

  const requests = await prisma.snapshotRequest.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: requests.map(serializeRequest),
  });
}
