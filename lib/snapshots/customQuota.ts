import { prisma } from '@/lib/prisma';
import {
  getCustomSnapshotPolicy,
  maxConcurrentForTier,
  retentionDaysFromPolicy,
  type CustomSnapshotPolicy,
  type CustomSnapshotPolicyColumns,
} from '@/lib/config/customSnapshots';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Resolve the effective policy: admin-editable SystemConfig values overlaid on
 * the env/default policy. Falls back to env defaults if the row or DB is absent.
 */
export async function resolveCustomSnapshotPolicy(): Promise<CustomSnapshotPolicy> {
  const base = getCustomSnapshotPolicy();
  try {
    const cfg = await prisma.systemConfig.findUnique({ where: { id: 'system' } });
    if (!cfg) return base;
    // Bridge until `prisma generate` regenerates the client with these columns.
    const cols = cfg as unknown as CustomSnapshotPolicyColumns;
    return {
      retentionHours: cols.customSnapshotRetentionHours,
      maxConcurrentPerUser: base.maxConcurrentPerUser,
      perTierConcurrent: {
        ...base.perTierConcurrent,
        free: cols.customSnapshotMaxPerUserFree,
        premium: cols.customSnapshotMaxPerUserPremium,
        ultra: cols.customSnapshotMaxPerUserUltra,
        unlimited: cols.customSnapshotMaxPerUserUltra,
      },
      globalStorageCapGb: cols.customSnapshotGlobalCapGb,
    };
  } catch {
    return base;
  }
}

/**
 * Count a user's custom snapshots that currently occupy a quota slot: anything
 * pending/processing, plus completed artifacts that are still within the
 * retention window and not soft-deleted (i.e. still hosted on storage).
 */
export async function getUserActiveCustomCount(userId: string, retentionDays: number): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * ONE_DAY_MS);
  return prisma.snapshotRequest.count({
    where: {
      userId,
      OR: [
        { status: { in: ['pending', 'processing'] } },
        { status: 'completed', deletedAt: null, completedAt: { gte: cutoff } },
        { status: 'completed', deletedAt: null, completedAt: null, createdAt: { gte: cutoff } },
      ],
    },
  });
}

/** Sum of bytes for custom artifacts that are still hosted (completed, not expired, not deleted). */
export async function getHostedCustomBytes(retentionDays: number): Promise<bigint> {
  const cutoff = new Date(Date.now() - retentionDays * ONE_DAY_MS);
  const agg = await prisma.snapshotRequest.aggregate({
    _sum: { resultFileSizeBytes: true },
    where: {
      deletedAt: null,
      status: 'completed',
      OR: [
        { completedAt: { gte: cutoff } },
        { completedAt: null, createdAt: { gte: cutoff } },
      ],
    },
  });
  return agg._sum.resultFileSizeBytes ?? BigInt(0);
}

export interface CustomSnapshotQuota {
  retentionHours: number;
  retentionDays: number;
  maxConcurrent: number;
  activeCount: number;
  hostedBytes: bigint;
  capBytes: bigint;
  atUserLimit: boolean;
  overGlobalCap: boolean;
  canCreate: boolean;
}

/** Evaluate the full quota picture for a user before creating a custom request. */
export async function evaluateCustomSnapshotQuota(
  userId: string,
  tier?: string | null,
): Promise<CustomSnapshotQuota> {
  const policy = await resolveCustomSnapshotPolicy();
  const retentionDays = retentionDaysFromPolicy(policy);
  const maxConcurrent = maxConcurrentForTier(policy, tier);

  const [activeCount, hostedBytes] = await Promise.all([
    getUserActiveCustomCount(userId, retentionDays),
    getHostedCustomBytes(retentionDays),
  ]);

  const capBytes = BigInt(policy.globalStorageCapGb) * BigInt(1024) ** BigInt(3);
  const atUserLimit = activeCount >= maxConcurrent;
  const overGlobalCap = hostedBytes >= capBytes;

  return {
    retentionHours: policy.retentionHours,
    retentionDays,
    maxConcurrent,
    activeCount,
    hostedBytes,
    capBytes,
    atUserLimit,
    overGlobalCap,
    canCreate: maxConcurrent > 0 && !atUserLimit && !overGlobalCap,
  };
}
