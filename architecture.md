# BryanLabs Snapshot Service Architecture

## Overview

The BryanLabs Snapshot Service is a production-grade blockchain snapshot hosting platform that provides tiered bandwidth access (free and premium) for Cosmos ecosystem chains. The system is designed for high availability, security, and optimal performance.

## System Components

### 1. Snapshot WebApp (Next.js)
- **Location**: `ghcr.io/bryanlabs/snapshots:v1.1.1`
- **Purpose**: Frontend UI and API server
- **Key Features**:
  - Chain browsing interface
  - Snapshot listing and metadata display
  - JWT-based authentication for premium users
  - Pre-signed URL generation with tier metadata
  - API endpoints for programmatic access

### 2. Nginx Proxy
- **Location**: Kubernetes ConfigMap in `cluster/chains/cosmos/fullnode/snapshot-service/nginx-proxy/`
- **Purpose**: Bandwidth enforcement and request routing
- **Key Features**:
  - Enforces 50MB/s for free tier
  - Enforces 250MB/s for premium tier
  - IP-based access logging (no longer enforced)
  - Routes requests to MinIO backend

### 3. MinIO Object Storage
- **Endpoint**: `minio.apps.svc.cluster.local:9000` (internal)
- **External**: `minio.bryanlabs.net`
- **Purpose**: S3-compatible storage for snapshot files
- **Structure**:
  ```
  snapshots/
  ├── osmosis-1/
  │   ├── osmosis-1-25261834.tar.zst
  │   ├── osmosis-1-25261834.json
  │   └── osmosis-1-25261834.sha256
  ├── noble-1/
  │   └── noble-1-0.tar.zst
  └── cosmoshub-4/
      └── cosmoshub-4-22806278.tar.zst
  ```

### 4. Snapshot Processor
- **Location**: `ghcr.io/bryanlabs/cosmos-snapshotter`
- **Purpose**: Creates compressed snapshots from running nodes
- **Process**:
  1. Stops the blockchain node
  2. Creates tar archive of data directory
  3. Compresses with zstd (level 3)
  4. Generates metadata and checksums
  5. Uploads to MinIO
  6. Restarts the node

### 5. Redis Cache
- **Purpose**: Session storage and rate limiting
- **Usage**:
  - JWT session management
  - Download rate limiting (10/minute)
  - Future: bandwidth metrics tracking

## Data Flow

### Download Flow (Free Tier)
```
User Browser → WebApp API → Generate Pre-signed URL (tier=free) → 
→ User Downloads → Nginx Proxy (50MB/s limit) → MinIO Storage
```

### Download Flow (Premium Tier)
```
User Login → JWT Cookie → WebApp API → Generate Pre-signed URL (tier=premium) → 
→ User Downloads → Nginx Proxy (250MB/s limit) → MinIO Storage
```

### Snapshot Creation Flow
```
Kubernetes CronJob → Snapshot Processor → Stop Node → 
→ Compress Data → Upload to MinIO → Restart Node
```

## Kubernetes Architecture

### Deployments
- **webapp**: 2 replicas with anti-affinity
- **nginx-proxy**: 3 replicas for high availability
- **redis**: Single instance with persistent volume

### Services
- **webapp-service**: ClusterIP for internal routing
- **nginx-service**: LoadBalancer for external access
- **redis-service**: ClusterIP for webapp connection

### Ingress
- **snapshots.bryanlabs.net**: Routes to webapp
- **minio.bryanlabs.net**: Direct MinIO access (with nginx proxy)

## Security Model

### Authentication
- Single premium user with bcrypt password hash
- JWT tokens in httpOnly cookies
- 7-day session duration
- No user registration (by design)

### URL Security
- Pre-signed URLs expire in 24 hours
- URLs include tier metadata for bandwidth enforcement
- Download tracking via MinIO access logs

### Network Security
- All internal communication over cluster network
- TLS termination at ingress
- No direct MinIO exposure (except through nginx)

## Configuration

### Environment Variables (WebApp)
```bash
# MinIO Configuration
MINIO_ENDPOINT=minio.apps.svc.cluster.local
MINIO_PORT=9000
MINIO_BUCKET_NAME=snapshots
MINIO_ACCESS_KEY=<secret>
MINIO_SECRET_KEY=<secret>

# Authentication
PREMIUM_USERNAME=premium_user
PREMIUM_PASSWORD_HASH=<bcrypt>
SESSION_PASSWORD=<secret>

# Bandwidth Limits
BANDWIDTH_FREE_TOTAL=50
BANDWIDTH_PREMIUM_TOTAL=250

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### Nginx Configuration
```nginx
# Bandwidth limits enforced via limit_rate
map $arg_X-Amz-Meta-Tier $limit_rate {
    default      50m;  # 50MB/s for free tier
    "free"       50m;
    "premium"    250m; # 250MB/s for premium tier
}
```

## Monitoring

### Current Metrics
- Nginx access logs for download tracking
- Kubernetes pod metrics (CPU, memory)
- MinIO storage usage

### Health Checks
- WebApp: `/api/health` endpoint
- Nginx: TCP port checks
- MinIO: Built-in health endpoints

## Snapshot Storage Format

### File Naming Convention
```
<chain-id>-<block-height>.tar.zst
Example: osmosis-1-25261834.tar.zst
```

### Metadata Files
```json
{
  "chain_id": "osmosis-1",
  "height": 25261834,
  "size": 91547443618,
  "created_at": "2024-12-16T08:30:00Z",
  "pruning": "default",
  "indexer": "kv",
  "compression": "zstd",
  "compression_level": 3
}
```

## Scaling Considerations

### Current Limits
- Total bandwidth: 500MB/s (infrastructure limit)
- Storage: ~500TB available in MinIO
- Concurrent downloads: ~100 (nginx worker limits)

### Bottlenecks
1. Single Redis instance (can be clustered)
2. Nginx bandwidth enforcement (CPU intensive)
3. MinIO IOPS for many concurrent reads

## Disaster Recovery

### Backup Strategy
- MinIO data replicated across multiple drives
- Kubernetes etcd backed up daily
- Configuration stored in Git

### Recovery Procedures
1. **WebApp failure**: Kubernetes auto-restarts pods
2. **MinIO failure**: Restore from drive replicas
3. **Complete failure**: Restore from Git + MinIO backups