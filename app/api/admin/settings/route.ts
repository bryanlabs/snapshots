import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/auth/admin-middleware";
import { prisma } from "@/lib/prisma";
import type { CustomSnapshotPolicyColumns } from "@/lib/config/customSnapshots";

/** Ensure the singleton config row exists, then return it. */
async function getConfigRow() {
  return prisma.systemConfig.upsert({
    where: { id: "system" },
    create: { id: "system" },
    update: {},
  });
}

function pickPolicy(cfg: unknown): CustomSnapshotPolicyColumns {
  const cols = cfg as CustomSnapshotPolicyColumns;
  return {
    customSnapshotRetentionHours: cols.customSnapshotRetentionHours,
    customSnapshotMaxPerUserFree: cols.customSnapshotMaxPerUserFree,
    customSnapshotMaxPerUserPremium: cols.customSnapshotMaxPerUserPremium,
    customSnapshotMaxPerUserUltra: cols.customSnapshotMaxPerUserUltra,
    customSnapshotGlobalCapGb: cols.customSnapshotGlobalCapGb,
  };
}

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  const cfg = await getConfigRow();
  return NextResponse.json({ success: true, data: pickPolicy(cfg) });
}

const updateSchema = z.object({
  customSnapshotRetentionHours: z.number().int().min(1).max(720),
  customSnapshotMaxPerUserFree: z.number().int().min(0).max(50),
  customSnapshotMaxPerUserPremium: z.number().int().min(0).max(50),
  customSnapshotMaxPerUserUltra: z.number().int().min(0).max(50),
  customSnapshotGlobalCapGb: z.number().int().min(1).max(100000),
  reason: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  const session = await auth();
  const adminUserId = session?.user?.id;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid settings", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { reason, ...fields } = parsed.data;
  const before = await getConfigRow();

  const after = await prisma.$transaction(async (tx) => {
    // Bridge until `prisma generate` regenerates the client with these columns.
    const updated = await tx.systemConfig.update({
      where: { id: "system" },
      data: fields as unknown as Prisma.SystemConfigUpdateInput,
    });

    await tx.adminAuditLog.create({
      data: {
        adminUserId,
        action: "system_config.custom_snapshot_policy.update",
        before: pickPolicy(before) as unknown as Prisma.InputJsonValue,
        after: pickPolicy(updated) as unknown as Prisma.InputJsonValue,
        reason: reason || "admin custom snapshot policy update",
      },
    });

    return updated;
  });

  return NextResponse.json({ success: true, data: pickPolicy(after) });
}
