# Monitoring and Metrics Guide

This document describes the monitoring, metrics, and rate limiting functionality implemented for the snapshot service.

## Overview

The monitoring system includes:
- Prometheus metrics collection
- Request/response logging
- Rate limiting
- Bandwidth tracking and management
- Structured logging with Winston

## Components

### 1. Prometheus Metrics (`lib/monitoring/metrics.ts`)

Collects the following metrics:
- **api_requests_total**: Total API requests by method, route, and status code
- **api_response_time_seconds**: Response time histogram
- **downloads_initiated_total**: Download counter by tier and snapshot ID
- **auth_attempts_total**: Authentication attempts by type and success
- **bandwidth_usage_bytes**: Current bandwidth usage by tier and user
- **active_connections**: Active download connections by tier
- **rate_limit_hits_total**: Rate limit hits by endpoint and tier

Access metrics at: `/api/metrics`

### 2. Rate Limiting (`lib/middleware/rateLimiter.ts`)

Three rate limit tiers:
- **Download**: 10 requests per minute
- **Auth**: 5 attempts per 15 minutes
- **General**: 100 requests per minute (free), 200 for premium

Usage:
```typescript
export const POST = withRateLimit(handler, 'download');
```

### 3. Bandwidth Management (`lib/bandwidth/manager.ts`)

Tracks and limits bandwidth usage:
- **Free tier**: 1 MB/s, 5 GB/month
- **Premium tier**: 10 MB/s, 100 GB/month

Features:
- Per-user bandwidth tracking
- Monthly usage limits
- Active connection management
- Automatic bandwidth division among connections

### 4. Request Logging (`lib/middleware/logger.ts`)

Structured logging with Winston:
- Request/response details
- Download events
- Authentication events
- Bandwidth usage
- Rate limit hits

## API Endpoints

### Metrics Endpoint
```
GET /api/metrics
```
Returns Prometheus-formatted metrics.

### Admin Statistics
```
GET /api/admin/stats
```
Returns JSON-formatted statistics (requires authentication).

### Bandwidth Reset (Cron)
```
GET /api/cron/reset-bandwidth
```
Resets monthly bandwidth usage (called by cron job).

## Integration Guide

### Adding Monitoring to API Routes

Use the `withApiMonitoring` wrapper:

```typescript
import { withApiMonitoring } from '@/lib/middleware/apiWrapper';

async function handleRequest(request: NextRequest) {
  // Your handler logic
}

export const GET = withApiMonitoring(handleRequest, '/api/your-route', {
  rateLimit: 'general',  // optional
  requireAuth: true      // optional
});
```

### Manual Integration

For more control, integrate components directly:

```typescript
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { logRequest } from '@/lib/middleware/logger';
import { withRateLimit } from '@/lib/middleware/rateLimiter';

async function handler(request: NextRequest) {
  const endTimer = collectResponseTime('GET', '/api/route');
  
  try {
    // Your logic
    
    endTimer();
    trackRequest('GET', '/api/route', 200);
    return response;
  } catch (error) {
    endTimer();
    trackRequest('GET', '/api/route', 500);
    throw error;
  }
}

export const GET = withRateLimit(handler, 'general');
```

## Bandwidth Tracking

For actual file downloads, integrate with your CDN/file server:

```typescript
import { trackDownloadBandwidth, endDownloadConnection } from '@/lib/bandwidth/downloadTracker';

// When download starts
bandwidthManager.startConnection(connectionId, userId, tier);

// During download (called periodically)
trackDownloadBandwidth(connectionId, bytesTransferred);

// When download completes
endDownloadConnection(connectionId);
```

## Cron Jobs

### Vercel Cron Configuration

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/reset-bandwidth",
    "schedule": "0 0 1 * *"
  }]
}
```

### Environment Variables

Add to `.env`:
```
CRON_SECRET=your-secret-key
```

## Monitoring Dashboard

### Prometheus/Grafana Setup

1. Configure Prometheus to scrape `/api/metrics`
2. Import provided Grafana dashboards
3. Set up alerts based on metrics

### Built-in Admin Stats

Access JSON statistics at `/api/admin/stats` (requires authentication).

## Best Practices

1. **Use the wrapper functions** - They handle all monitoring automatically
2. **Set appropriate rate limits** - Adjust based on your traffic patterns
3. **Monitor bandwidth usage** - Set up alerts for users approaching limits
4. **Review logs regularly** - Look for patterns in errors and rate limit hits
5. **Scale rate limiters** - Consider Redis for distributed rate limiting in production

## Troubleshooting

### High Rate Limit Hits
- Review rate limit configuration
- Check for abusive clients
- Consider increasing limits for legitimate use cases

### Bandwidth Issues
- Monitor active connections
- Check for stuck connections
- Verify bandwidth calculation accuracy

### Metrics Not Updating
- Ensure metrics are being collected in all routes
- Check for errors in metric collection
- Verify Prometheus scraping configuration