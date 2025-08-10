# Nginx Service Architecture

A mag-7 enterprise-grade service abstraction for nginx operations with dependency injection, circuit breaker patterns, and comprehensive mocking.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Operations    │ ──▶│ Service Registry │ ──▶│ Nginx Service   │
│   (Business)    │    │  (DI Container)  │    │ Implementation  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                ▲                       │
                                │                       ▼
                        ┌───────────────┐    ┌─────────────────┐
                        │ Configuration │    │ Circuit Breaker │
                        │   & Bootstrap │    │ Retry & Metrics │
                        └───────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Initialize Services (App Startup)

```typescript
// app/layout.tsx or middleware.ts
import { initializeNginxServices } from '@/lib/nginx';

// Call once at application startup
initializeNginxServices();
```

### 2. Use Operations (Business Logic)

```typescript
// No more environment branching!
import { listChains, listSnapshots, generateDownloadUrl } from '@/lib/nginx';

export async function getChainData() {
  // Service implementation is automatically selected
  const chains = await listChains();
  const snapshots = await listSnapshots('cosmoshub-4');
  const downloadUrl = await generateDownloadUrl('cosmoshub-4', 'snapshot.tar.zst', 'premium');
  
  return { chains, snapshots, downloadUrl };
}
```

## 🎯 Service Selection Logic

| Environment | Default Behavior | Override |
|-------------|------------------|----------|
| `test` | Always mock | `NGINX_SERVICE_TYPE=production` |
| `development` | Mock (unless forced) | `FORCE_REAL_NGINX=true` |
| `production` | Production with fallback | `NGINX_SERVICE_TYPE=mock` |

## 🔧 Configuration

### Environment Variables

```bash
# Service Selection
NGINX_SERVICE_TYPE=auto|production|mock
FORCE_REAL_NGINX=true|false

# Production Service Config
NGINX_ENDPOINT=nginx
NGINX_PORT=32708
NGINX_USE_SSL=true|false
NGINX_TIMEOUT=5000
NGINX_RETRY_ATTEMPTS=3

# Circuit Breaker
NGINX_CB_THRESHOLD=5
NGINX_CB_TIMEOUT=30000

# Fallback Behavior
NGINX_ENABLE_FALLBACK=true|false
NGINX_FALLBACK_TIMEOUT=2000

# Security
SECURE_LINK_SECRET=your-secret-key
NGINX_EXTERNAL_URL=https://snapshots.bryanlabs.net
```

## 🧪 Testing

### Force Service Types

```typescript
import { nginxServiceBootstrap } from '@/lib/nginx';

// In tests
beforeEach(() => {
  nginxServiceBootstrap.forceMock();
});

// Test production behavior
nginxServiceBootstrap.forceProduction();

// Reset to auto-detection
nginxServiceBootstrap.useAuto();
```

### Mock Service Features

```typescript
import { MockNginxService } from '@/lib/nginx';

const mockService = new MockNginxService();

// Get realistic test data
const snapshots = mockService.getMockSnapshots('cosmoshub-4');

// Add custom test data
mockService.addMockChain('test-chain', [{
  name: 'test-snapshot.tar.zst',
  size: 1000000,
  mtime: new Date().toUTCString(),
  type: 'file'
}]);

// Simulate failures
mockService.simulateFailure(0.5); // 50% error rate
```

## 🔍 Monitoring

### Service Metrics

```typescript
import { getServiceMetrics } from '@/lib/nginx';

const metrics = getServiceMetrics();
console.log({
  requestCount: metrics.requestCount,
  errorCount: metrics.errorCount,
  averageResponseTime: metrics.averageResponseTime,
  circuitBreakerState: metrics.circuitBreakerState
});
```

### Health Checks

```typescript
import { getNginxService } from '@/lib/nginx';

const service = await getNginxService();
const isHealthy = await service.healthCheck();
console.log(`Service: ${service.getServiceName()}, Healthy: ${isHealthy}`);
```

## 🏢 Mag-7 Patterns Used

### 1. **Dependency Injection**
- Service registry manages all dependencies
- No hard-coded service selection
- Easy to test and swap implementations

### 2. **Circuit Breaker**
- Prevents cascade failures
- Automatic fallback to mock data
- Configurable thresholds and timeouts

### 3. **Retry with Exponential Backoff**
- Automatic retry for transient failures
- Jitter to prevent thundering herd
- Respects retryable error types

### 4. **Interface Segregation**
- Clean service interfaces
- Single responsibility per service
- Easy to mock and test

### 5. **Observability**
- Comprehensive metrics collection
- Structured logging with context
- Health check endpoints

### 6. **Configuration Management**
- Environment-based configuration
- Runtime overrides for testing
- Secure defaults

## 🔄 Migration from Old Code

### Before (Anti-pattern)
```typescript
export async function listChains(): Promise<ChainInfo[]> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    const nginxClient = getNginxClient();
    objects = await nginxClient.listObjects('/');
  } else {
    try {
      objects = await listObjects('');
    } catch (error) {
      const nginxClient = getNginxClient();
      objects = await nginxClient.listObjects('/');
    }
  }
  // ...
}
```

### After (Best Practice)
```typescript
export async function listChains(): Promise<ChainInfo[]> {
  const nginxService = await getNginxService();
  const objects = await nginxService.listObjects('');
  // Service selection handled by DI container
}
```

## 🚦 Error Handling

```typescript
import { 
  NginxServiceError, 
  NginxTimeoutError, 
  NginxCircuitBreakerError 
} from '@/lib/nginx';

try {
  const snapshots = await listSnapshots('cosmoshub-4');
} catch (error) {
  if (error instanceof NginxTimeoutError) {
    // Handle timeout - maybe show cached data
  } else if (error instanceof NginxCircuitBreakerError) {
    // Circuit breaker is open - service degraded
  } else if (error instanceof NginxServiceError) {
    // Other nginx-related errors
    console.error('Nginx error:', error.code, error.statusCode);
  }
}
```

## 📊 Performance Benefits

1. **Reduced Latency**: Circuit breaker prevents slow failing calls
2. **Better Reliability**: Automatic fallback to mock data
3. **Improved Testing**: Fast mock responses, no network calls
4. **Observability**: Real-time metrics and health monitoring
5. **Scalability**: Service pooling and connection management

## 🎭 Mock Data Quality

The mock service provides:
- **Realistic file sizes**: Based on actual blockchain data
- **Proper timestamps**: Recent snapshots with realistic intervals
- **Chain diversity**: 8 different blockchain networks
- **File variations**: Multiple snapshot formats (.tar.zst, .tar.lz4)
- **SHA256 files**: Matching checksum files
- **Latency simulation**: Configurable network delay

This ensures development and testing closely mirrors production behavior.
