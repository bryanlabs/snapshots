import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/admin-middleware";
import { prisma } from "@/lib/prisma";
import { buildSnapshotCatalog } from "@/lib/snapshots/custom-catalog";

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
    isPinned: request.isPinned,
    isFeatured: request.isFeatured,
    deletedAt: request.deletedAt?.toISOString() || null,
    adminNote: request.adminNote,
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
    user: request.user
      ? {
          id: request.user.id,
          email: request.user.email,
          walletAddress: request.user.walletAddress,
          displayName: request.user.displayName,
          role: request.user.role,
          tier: request.user.personalTier?.name || null,
        }
      : null,
  };
}

async function handleGetCustomSnapshots(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);

  const chainIds = await prisma.snapshotRequest.findMany({
    where: { deletedAt: null },
    distinct: ["chainId"],
    select: { chainId: true },
  });

  await Promise.all(chainIds.map(({ chainId }) => buildSnapshotCatalog(chainId, { role: "admin", tier: "ultra" })));

  const requests = await prisma.snapshotRequest.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" as const } },
              { processorRequestId: { contains: q, mode: "insensitive" as const } },
              { chainId: { contains: q, mode: "insensitive" as const } },
              { resultFileName: { contains: q, mode: "insensitive" as const } },
              { user: { walletAddress: { contains: q, mode: "insensitive" as const } } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          walletAddress: true,
          displayName: true,
          role: true,
          personalTier: { select: { name: true } },
        },
      },
    },
    take: limit,
    orderBy: [
      { isPinned: "desc" },
      { isFeatured: "desc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({
    success: true,
    data: requests.map(serializeRequest),
  });
}

export const GET = withAdminAuth(handleGetCustomSnapshots);
