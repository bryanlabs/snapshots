# Integration Guide: Migrating to New Nginx Architecture

## 📝 Summary

This guide shows how to migrate from the old environment-based branching approach to the new mag-7 dependency injection pattern.

## 🔄 Step-by-Step Migration

### Step 1: Initialize Services at App Startup

Add this to your main layout or middleware:

```typescript
// app/layout.tsx
import { initializeNginxServices } from '@/lib/nginx';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize nginx services once
  initializeNginxServices();
  
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Step 2: Update API Routes

Replace the old operations with the new ones:

```typescript
// app/api/v1/chains/route.ts
// OLD (remove this)
// import { listChains } from '@/lib/nginx/operations';

// NEW (use this)
import { listChains } from '@/lib/nginx';

export async function GET() {
  try {
    const chains = await listChains();
    return Response.json(chains);
  } catch (error) {
    console.error('Error fetching chains:', error);
    return Response.json({ error: 'Failed to fetch chains' }, { status: 500 });
  }
}
```

### Step 3: Update Component Code

```typescript
// components/chains/ChainList.tsx
import { listChains, listSnapshots } from '@/lib/nginx';

export async function ChainList() {
  // No more environment checking!
  const chains = await listChains();
  
  return (
    <div>
      {chains.map(chain => (
        <ChainCard key={chain.chainId} chain={chain} />
      ))}
    </div>
  );
}
```

### Step 4: Environment Configuration

Update your environment files:

```bash
# .env.local (development)
NGINX_SERVICE_TYPE=auto
# FORCE_REAL_NGINX=true  # Uncomment to test with real nginx

# .env.production
NGINX_SERVICE_TYPE=production
NGINX_ENDPOINT=nginx
NGINX_PORT=32708
NGINX_USE_SSL=false
NGINX_ENABLE_FALLBACK=true
SECURE_LINK_SECRET=your-production-secret

# .env.test
NGINX_SERVICE_TYPE=mock
```

### Step 5: Update Tests

```typescript
// __tests__/api/chains.test.ts
import { nginxServiceBootstrap } from '@/lib/nginx';

describe('Chains API', () => {
  beforeEach(() => {
    // Force mock service for consistent testing
    nginxServiceBootstrap.forceMock();
  });

  afterEach(() => {
    nginxServiceBootstrap.reset();
  });

  it('should return chains', async () => {
    const response = await fetch('/api/v1/chains');
    const chains = await response.json();
    
    expect(chains).toHaveLength(8);
    expect(chains[0]).toHaveProperty('chainId');
  });
});
```

## 🗑️ Files to Remove/Update

### Remove These Files
- `lib/nginx-dev.ts` (replaced by service registry)
- Any manual mock management code

### Update These Files
- `lib/nginx/operations.ts` (already updated)
- `lib/nginx/client.ts` (keep for backwards compatibility)
- All API routes using nginx operations
- Components fetching chain/snapshot data

## 🎯 Testing Your Migration

### 1. Test Mock Service
```bash
# Should use mock data
npm run dev
# Visit http://localhost:3000 - should show 8 blockchain chains
```

### 2. Test Production Behavior
```bash
# Force production service (will fallback to mock if nginx unavailable)
FORCE_REAL_NGINX=true npm run dev
```

### 3. Test Service Switching
```typescript
// In browser console or test file
import { nginxServiceBootstrap, getServiceMetrics } from '@/lib/nginx';

// Switch to mock
nginxServiceBootstrap.forceMock();
console.log('Using mock service');

// Check metrics
console.log(getServiceMetrics());

// Switch back to auto
nginxServiceBootstrap.useAuto();
```

## 📊 Benefits After Migration

### ✅ Before (Problems)
- Environment branching in every function
- Hard to test different scenarios
- No circuit breaker or retry logic
- Manual fallback management
- Tight coupling between business logic and implementation

### ✨ After (Solutions)
- Clean separation of concerns
- Automatic service selection
- Enterprise-grade reliability patterns
- Easy testing with service forcing
- Loose coupling with dependency injection

## 🔍 Monitoring Your Migration

### Check Service Health
```typescript
import { getNginxService, getServiceMetrics } from '@/lib/nginx';

// In monitoring dashboard or health check endpoint
export async function checkNginxHealth() {
  const service = await getNginxService();
  const isHealthy = await service.healthCheck();
  const metrics = getServiceMetrics();
  
  return {
    serviceName: service.getServiceName(),
    healthy: isHealthy,
    metrics
  };
}
```

### Add Logging
```typescript
// In your logger setup
import { getServiceMetrics } from '@/lib/nginx';

setInterval(() => {
  const metrics = getServiceMetrics();
  if (metrics) {
    logger.info('Nginx service metrics', {
      requestCount: metrics.requestCount,
      errorCount: metrics.errorCount,
      circuitBreakerState: metrics.circuitBreakerState,
      averageResponseTime: metrics.averageResponseTime
    });
  }
}, 60000); // Log every minute
```

## 🚑 Rollback Plan

If you need to rollback:

1. **Quick Rollback**: Set `NGINX_SERVICE_TYPE=mock` in production
2. **Code Rollback**: The old `client.ts` functions are still exported for compatibility
3. **Emergency**: All old mock data is preserved in the new mock service

## 🎆 Next Steps After Migration

1. **Monitor metrics** in production for the first week
2. **Set up alerts** for circuit breaker state changes
3. **Add custom mock data** for specific test scenarios
4. **Configure retry policies** based on your nginx performance
5. **Add more sophisticated health checks** if needed

Your application now follows mag-7 engineering patterns used at Google, Meta, and other leading tech companies!
