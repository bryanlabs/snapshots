import { register, Counter, Histogram, Gauge } from 'prom-client';

// Clear the register to prevent duplicate metrics
register.clear();

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