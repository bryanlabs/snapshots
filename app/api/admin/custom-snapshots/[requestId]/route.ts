import { NextRequest, NextResponse } from "next/server";
import type { SnapshotRequest } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/auth/admin-middleware";
import { prisma } from "@/lib/prisma";
import { updateProcessorCustomSnapshotVisibility } from "@/lib/snapshots/processor-visibility";

const updateSchema = z.object({
  visibility: z.enum(["private", "public"]).optional(),
  publishStatus: z.enum(["private", "pending_review", "published", "rejected"]).optional(),
  isPinned: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  adminNote: z.string().max(1000).nullable().optional(),
  restoreVerifiedAt: z.string().datetime().nullable().optional(),
  deleted: z.boolean().optional(),
  reason: z.string().max(500).optional(),
});

function serializeForAudit(request: SnapshotRequest) {
  return {
    id: request.id,
    chainId: request.chainId,
    userId: request.userId,
    status: request.status,
    visibility: request.visibility,
    publishStatus: request.publishStatus,
    isPinned: request.isPinned,
    isFeatured: request.isFeatured,
    adminNote: request.adminNote,
    deletedAt: request.deletedAt?.toISOString?.() || null,
    resultFileName: request.resultFileName,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  const session = await auth();
  const adminUserId = session?.user?.id;
  const { requestId } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const before = await prisma.snapshotRequest.findUnique({ where: { id: requestId } });

  if (!before) {
    return NextResponse.json(
      { success: false, error: "Custom snapshot request not found" },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = {};

  if (parsed.data.visibility) updateData.visibility = parsed.data.visibility;
  if (parsed.data.publishStatus) updateData.publishStatus = parsed.data.publishStatus;
  if (parsed.data.isPinned !== undefined) updateData.isPinned = parsed.data.isPinned;
  if (parsed.data.isFeatured !== undefined) updateData.isFeatured = parsed.data.isFeatured;
  if (parsed.data.adminNote !== undefined) updateData.adminNote = parsed.data.adminNote;
  if (parsed.data.restoreVerifiedAt !== undefined) {
    updateData.restoreVerifiedAt = parsed.data.restoreVerifiedAt ? new Date(parsed.data.restoreVerifiedAt) : null;
  }
  if (parsed.data.deleted !== undefined) {
    updateData.deletedAt = parsed.data.deleted ? new Date() : null;
    if (parsed.data.deleted) updateData.publishStatus = "rejected";
  }

  if (updateData.publishStatus === "published") {
    updateData.visibility = "public";
  }
  if (updateData.visibility === "private") {
    updateData.publishStatus = "private";
    updateData.isPinned = false;
    updateData.isFeatured = false;
  }

  const nextVisibility = ((updateData.visibility as "private" | "public" | undefined) || before.visibility) as "private" | "public";
  const nextPublishStatus = ((updateData.publishStatus as "private" | "pending_review" | "published" | "rejected" | undefined) || before.publishStatus) as "private" | "pending_review" | "published" | "rejected";

  if (
    before.resultFileName &&
    (nextVisibility !== before.visibility || nextPublishStatus !== before.publishStatus)
  ) {
    await updateProcessorCustomSnapshotVisibility({
      chainId: before.chainId,
      appRequestId: before.id,
      visibility: nextVisibility,
      publishStatus: nextPublishStatus,
    });
  }

  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.snapshotRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    await tx.adminAuditLog.create({
      data: {
        adminUserId,
        targetUserId: before.userId,
        action: "custom_snapshot.update",
        before: serializeForAudit(before),
        after: serializeForAudit(updated),
        reason: parsed.data.reason || "admin custom snapshot management",
      },
    });

    return updated;
  });

  return NextResponse.json({
    success: true,
    data: serializeForAudit(after),
  });
}
