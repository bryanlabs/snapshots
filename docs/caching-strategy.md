# Caching Strategy Documentation

## Overview

The application implements a multi-layered caching strategy to optimize performance and reduce load on backend services:

1. **Redis Cache** - Server-side caching for API responses
2. **HTTP Cache Headers** - Browser and CDN caching
3. **React Query** - Client-side data caching
4. **Stale-While-Revalidate** - Serve stale data while fetching fresh

## Cache Layers

### 1. Redis Cache (Server-Side)

Located in `/lib/cache/redis-cache.ts`

#### Key Features:
- **TTL-based expiration** - Automatic cleanup
- **Tag-based invalidation** - Bulk cache clearing
- **Stale-while-revalidate** - Serve stale data during updates
- **Lock mechanism** - Prevent cache stampedes

#### Usage:
```typescript
import { cache, cacheKeys } from '@/lib/cache/redis-cache';

// Simple get/set
const data = await cache.getOrSet(
  cacheKeys.chains(),
  async () => fetchFromSource(),
  { ttl: 300, tags: ['chains'] }
);

// Stale-while-revalidate
const data = await cache.staleWhileRevalidate(
  key,
  async () => fetchFreshData(),
  { ttl: 300, staleTime: 3600 }
);

// Invalidate by tag
await cache.invalidateTag('chains');
```

### 2. HTTP Cache Headers

Located in `/lib/cache/headers.ts`

#### Cache Policies:

| Type | Max-Age | Stale-While-Revalidate | Use Case |
|------|---------|------------------------|----------|
| Static | 1 day | 1 week | Chain metadata, logos |
| Dynamic | 1 min | 5 min | Snapshot lists |
| Real-time | 0 | N/A | User data, downloads |
| Private | 0 | N/A | Account pages |
| API | 5 min | 10 min | Public API responses |

#### Usage:
```typescript
import { cacheHeaders } from '@/lib/cache/headers';

// Add cache headers to response
return new NextResponse(data, {
  headers: cacheHeaders.api(300), // 5 min cache
});
```

### 3. React Query (Client-Side)

Located in components using `useQuery`

#### Configuration:
```typescript
const { data } = useQuery({
  queryKey: ['snapshots', chainId],
  queryFn: fetchSnapshots,
  staleTime: 30_000,      // Consider stale after 30s
  cacheTime: 300_000,     // Keep in cache for 5 min
  refetchInterval: 30_000, // Poll every 30s
});
```

## Cache Keys

Consistent key naming for easy management:

```typescript
cacheKeys = {
  // Chains
  chains: () => 'chains:all',
  chain: (id) => `chain:${id}`,
  chainSnapshots: (id) => `chain:${id}:snapshots`,
  
  // Users
  userDownloads: (id) => `user:${id}:downloads`,
  userBandwidth: (id) => `user:${id}:bandwidth`,
  
  // Stats
  systemStats: () => 'stats:system',
  
  // API responses
  apiResponse: (endpoint, params) => `api:${endpoint}:${params}`,
};
```

## Invalidation Strategy

### Automatic Invalidation

1. **Time-based** - TTL expiration
2. **Event-based** - On mutations (POST, PUT, DELETE)
3. **Tag-based** - Related data invalidation

### Manual Invalidation

```typescript
// Invalidate specific key
await cache.delete(cacheKeys.chain(chainId));

// Invalidate by tag
await cache.invalidateTag('snapshots');

// Clear all cache (use sparingly)
await cache.flush();
```

## Cache Warming

Pre-populate cache for frequently accessed data:

```typescript
// Warm cache on startup
async function warmCache() {
  const chains = await fetchChains();
  await cache.set(cacheKeys.chains(), chains, { ttl: 3600 });
  
  // Warm individual chain data
  for (const chain of chains) {
    const snapshots = await fetchSnapshots(chain.id);
    await cache.set(
      cacheKeys.chainSnapshots(chain.id), 
      snapshots, 
      { ttl: 300 }
    );
  }
}
```

## Performance Optimizations

### 1. Cache Stampede Prevention

When cache expires, multiple requests might try to regenerate it simultaneously:

```typescript
const lockKey = `${key}:lock`;
const lockAcquired = await redis.set(lockKey, '1', 'NX', 'EX', 10);

if (lockAcquired) {
  // Regenerate cache
  const data = await fetchData();
  await cache.set(key, data);
  await redis.del(lockKey);
}
```

### 2. Partial Cache Updates

Update specific fields without full regeneration:

```typescript
const current = await cache.get(key);
const updated = { ...current, lastChecked: new Date() };
await cache.set(key, updated);
```

### 3. Compression

Large responses are automatically compressed by Redis:
- Strings > 1KB are compressed
- JSON payloads benefit most

## Monitoring

### Cache Hit Ratio

Track cache effectiveness:

```typescript
// In API routes
const cached = await cache.get(key);
if (cached) {
  response.headers.set('X-Cache', 'HIT');
  metrics.increment('cache.hit');
} else {
  response.headers.set('X-Cache', 'MISS');
  metrics.increment('cache.miss');
}
```

### Redis Metrics

Monitor Redis performance:
- Memory usage
- Hit/miss ratio
- Eviction count
- Command latency

## Best Practices

1. **Cache Everything Reasonable**
   - Public data: Yes
   - User-specific: Carefully
   - Sensitive data: No

2. **Set Appropriate TTLs**
   - Static data: Hours/days
   - Dynamic data: Minutes
   - Real-time: Seconds

3. **Use Tags Wisely**
   - Group related data
   - Enable bulk invalidation
   - Don't over-tag

4. **Handle Cache Failures**
   - Always fallback to source
   - Log failures for monitoring
   - Don't let cache break the app

## Configuration

Environment variables:
```bash
# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional

# Cache settings
CACHE_DEFAULT_TTL=300
CACHE_MAX_MEMORY=1gb
```

## Cache Layers Summary

```
Request → CloudFlare CDN → Nginx → Next.js → Redis → Source
           ↓               ↓        ↓         ↓
         1 hour         5 min    Memory    5 min
```

Each layer reduces load on the next, creating a robust caching system.