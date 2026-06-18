import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { evaluateCustomSnapshotQuota } from "@/lib/snapshots/customQuota";
import { getEffectiveAccessTier } from "@/lib/utils/tier";

/**
 * Returns the calling user's custom-snapshot quota: the retention window, their
 * concurrent limit, how many are currently active, and whether they can create
 * another one right now. Powers the caveat and the disabled state in the modal.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quota = await evaluateCustomSnapshotQuota(
      session.user.id,
      getEffectiveAccessTier(session.user.tier),
    );
    return NextResponse.json({
      success: true,
      data: {
        retentionHours: quota.retentionHours,
        maxConcurrent: quota.maxConcurrent,
        activeCount: quota.activeCount,
        atUserLimit: quota.atUserLimit,
        overGlobalCap: quota.overGlobalCap,
        canCreate: quota.canCreate,
      },
    });
  } catch (error) {
    console.error("Failed to evaluate custom snapshot quota:", error);
    return NextResponse.json(
      { error: "Failed to load custom snapshot quota" },
      { status: 500 },
    );
  }
}
