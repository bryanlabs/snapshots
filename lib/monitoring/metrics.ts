import { register, Counter, Histogram, Gauge } from 'prom-client';

// Clear the register to prevent duplicate metrics
register.clear();

type SnapshotVisibility = 'private' | 'public' | 'scheduled' | 'unknown';
type SnapshotMetricResult = 'success' | 'denied' | 'not_found' | 'invalid' | 'rate_limited' | 'error';

// API request counter
export const apiRequestsTotal = new Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'route', 'status_code']
});

// API response time histogram
export const apiResponseTime = new Histogram({
  name: 'api_response_time_seconds',
  help: 'API response time in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10]
});

// Download counter
export const downloadsInitiated = new Counter({
  name: 'downloads_initiated_total',
  help: 'Total number of downloads initiated',
  labelNames: ['tier', 'snapshot_id']
});

// Low-cardinality snapshot service usage metric. This intentionally does not
// include snapshot IDs or filenames because those grow without bound.
export const snapshotDownloadUrlRequests = new Counter({
  name: 'snapshot_download_url_requests_total',
  help: 'Total number of signed snapshot download URL requests',
  labelNames: ['chain_id', 'database', 'tier', 'visibility', 'result']
});

export const snapshotCustomRequests = new Counter({
  name: 'snapshot_custom_requests_total',
  help: 'Total number of custom snapshot requests submitted through the webapp',
  labelNames: ['chain_id', 'tier', 'visibility', 'result']
});

export const snapshotCustomRequestsCurrent = new Gauge({
  name: 'snapshot_custom_requests_current',
  help: 'Current custom snapshot request count by chain, visibility, and status',
  labelNames: ['chain_id', 'visibility', 'status']
});

export const snapshotCustomStorageBytes = new Gauge({
  name: 'snapshot_custom_storage_bytes',
  help: 'Current custom snapshot storage bytes by chain and visibility',
  labelNames: ['chain_id', 'visibility']
});

export const snapshotCustomStorageCapBytes = new Gauge({
  name: 'snapshot_custom_storage_cap_bytes',
  help: 'Configured custom snapshot storage cap in bytes'
});

// Authentication attempts counter
export const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'success']
});

// Bandwidth usage gauge
export const bandwidthUsage = new Gauge({
  name: 'bandwidth_usage_bytes',
  help: 'Current bandwidth usage in bytes',
  labelNames: ['tier', 'user_id']
});

// Active connections gauge
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['tier']
});

// Rate limit hits counter
export const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'tier']
});

// Helper function to collect response time
export function collectResponseTime(method: string, route: string) {
  const end = apiResponseTime.startTimer({ method, route });
  return end;
}

// Helper function to track request
export function trackRequest(method: string, route: string, statusCode: number) {
  apiRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
}

// Helper function to track download
export function trackDownload(tier: string, snapshotId: string) {
  downloadsInitiated.inc({ tier, snapshot_id: snapshotId });
}

export function trackSnapshotDownloadUrlRequest(
  chainId: string,
  database: string | null | undefined,
  tier: string,
  visibility: SnapshotVisibility | string | null | undefined,
  result: SnapshotMetricResult
) {
  snapshotDownloadUrlRequests.inc({
    chain_id: chainId || 'unknown',
    database: database || 'unknown',
    tier: tier || 'unknown',
    visibility: visibility || 'unknown',
    result,
  });
}

export function trackCustomSnapshotRequest(
  chainId: string,
  tier: string,
  visibility: string | null | undefined,
  result: SnapshotMetricResult
) {
  snapshotCustomRequests.inc({
    chain_id: chainId || 'unknown',
    tier: tier || 'unknown',
    visibility: visibility || 'unknown',
    result,
  });
}

export async function refreshCustomSnapshotMetrics() {
  const { prisma } = await import('@/lib/prisma');

  snapshotCustomRequestsCurrent.reset();
  snapshotCustomStorageBytes.reset();

  const [requestGroups, storageGroups, systemConfig] = await Promise.all([
    prisma.snapshotRequest.groupBy({
      by: ['chainId', 'visibility', 'status'],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.snapshotRequest.groupBy({
      by: ['chainId', 'visibility'],
      where: {
        deletedAt: null,
        resultFileSizeBytes: { not: null },
      },
      _sum: { resultFileSizeBytes: true },
    }),
    prisma.systemConfig.findUnique({
      where: { id: 'system' },
      select: { customSnapshotGlobalCapGb: true },
    }),
  ]);

  for (const group of requestGroups) {
    snapshotCustomRequestsCurrent.set({
      chain_id: group.chainId,
      visibility: group.visibility,
      status: group.status,
    }, group._count._all);
  }

  for (const group of storageGroups) {
    snapshotCustomStorageBytes.set({
      chain_id: group.chainId,
      visibility: group.visibility,
    }, Number(group._sum.resultFileSizeBytes ?? 0));
  }

  snapshotCustomStorageCapBytes.set((systemConfig?.customSnapshotGlobalCapGb || 0) * 1024 * 1024 * 1024);
}

// Helper function to track auth attempt
export function trackAuthAttempt(type: string, success: boolean) {
  authAttempts.inc({ type, success: success.toString() });
}

// Helper function to update bandwidth usage
export function updateBandwidthUsage(tier: string, userId: string, bytes: number) {
  bandwidthUsage.set({ tier, user_id: userId }, bytes);
}

// Helper function to update active connections
export function updateActiveConnections(tier: string, count: number) {
  activeConnections.set({ tier }, count);
}

// Helper function to track rate limit hit
export function trackRateLimitHit(endpoint: string, tier: string) {
  rateLimitHits.inc({ endpoint, tier });
}

// Export register for metrics endpoint
export { register };
