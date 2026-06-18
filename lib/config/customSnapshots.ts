/**
 * Policy for user-requested custom snapshots.
 *
 * These values protect the shared nginx storage PVC from being exhausted by
 * custom snapshot requests. They are read from environment variables so they
 * can be tuned per-deployment today, and are the single source of truth for
 * both the request-creation enforcement and the account quota endpoint.
 *
 * Phase 2 will move these into the admin-editable SystemConfig table so they
 * can be changed from the website without a redeploy.
 */

/**
 * The admin-editable columns on the SystemConfig singleton. Kept as a standalone
 * interface so server code can read/write them through a typed bridge until
 * `prisma generate` regenerates the client with these columns.
 */
export interface CustomSnapshotPolicyColumns {
  customSnapshotRetentionHours: number;
  customSnapshotMaxPerUserFree: number;
  customSnapshotMaxPerUserPremium: number;
  customSnapshotMaxPerUserUltra: number;
  customSnapshotGlobalCapGb: number;
}

export const CUSTOM_SNAPSHOT_POLICY_DEFAULTS: CustomSnapshotPolicyColumns = {
  customSnapshotRetentionHours: 24,
  customSnapshotMaxPerUserFree: 0,
  customSnapshotMaxPerUserPremium: 1,
  customSnapshotMaxPerUserUltra: 3,
  customSnapshotGlobalCapGb: 100,
};

export interface CustomSnapshotPolicy {
  /** Auto-cleanup window. Custom artifacts are removed after this many hours. */
  retentionHours: number;
  /** Fallback concurrent-active limit per user when no tier override applies. */
  maxConcurrentPerUser: number;
  /** Per-tier concurrent-active overrides. */
  perTierConcurrent: Record<string, number>;
  /** Hard ceiling on total hosted custom bytes, across all users, in GiB. */
  globalStorageCapGb: number;
}

function intFromEnv(name: string, fallback: number, { allowZero = false } = {}): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return fallback;
  if (n === 0 && !allowZero) return fallback;
  return n;
}

export function getCustomSnapshotPolicy(): CustomSnapshotPolicy {
  return {
    retentionHours: intFromEnv('CUSTOM_SNAPSHOT_RETENTION_HOURS', 24),
    maxConcurrentPerUser: intFromEnv('CUSTOM_SNAPSHOT_MAX_PER_USER', 1),
    perTierConcurrent: {
      free: intFromEnv('CUSTOM_SNAPSHOT_MAX_FREE', 0, { allowZero: true }),
      premium: intFromEnv('CUSTOM_SNAPSHOT_MAX_PREMIUM', 1),
      ultra: intFromEnv('CUSTOM_SNAPSHOT_MAX_ULTRA', 3),
      unlimited: intFromEnv('CUSTOM_SNAPSHOT_MAX_ULTRA', 3),
    },
    globalStorageCapGb: intFromEnv('CUSTOM_SNAPSHOT_GLOBAL_CAP_GB', 100),
  };
}

export function maxConcurrentForTier(policy: CustomSnapshotPolicy, tier?: string | null): number {
  if (tier && policy.perTierConcurrent[tier] !== undefined) {
    return policy.perTierConcurrent[tier];
  }
  return policy.maxConcurrentPerUser;
}

/**
 * The stored retention is an integer number of days (min 1). Derive it from the
 * hours policy so the processor's existing day-based cleanup honours the window.
 */
export function retentionDaysFromPolicy(policy: CustomSnapshotPolicy): number {
  return Math.max(1, Math.ceil(policy.retentionHours / 24));
}
