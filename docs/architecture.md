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
  - Routes requests to nginx storage backend

### 3. Nginx Storage Backend
- **Endpoint**: `nginx.fullnodes.svc.cluster.local:32708` (internal)
- **External**: `https://snapshots.bryanlabs.net`
- **Purpose**: Static file serving with secure_link module
- **Features**:
  - Autoindex JSON format for programmatic access
  - Secure link validation for bandwidth enforcement
  - Shared PVC with snapshot processor
- **Structure**:
  ```
  /snapshots/
  ├── osmosis-1/
  │   ├── osmosis-1-25261834.tar.zst
  │   ├── osmosis-1-25261834.tar.lz4
  │   └── latest.json
  ├── noble-1/
  │   ├── noble-1-20250722.tar.zst
  │   └── noble-1-20250722.tar.lz4
  └── cosmoshub-4/
      └── cosmoshub-4-22806278.tar.zst
  ```

### 4. Snapshot Processor
- **Location**: `ghcr.io/bryanlabs/snapshot-processor`
- **Purpose**: Request-based snapshot creation and management
- **Features**:
  - Request queue system for scheduled and on-demand snapshots
  - Dual compression support (ZST and LZ4)
  - Retention policy enforcement (deletes old VolumeSnapshots)
  - Dynamic resource allocation for compression jobs
- **Process**:
  1. Receives request (scheduled or on-demand)
  2. Creates VolumeSnapshot from PVC
  3. Mounts snapshot and compresses with shell commands
  4. Uploads to shared PVC (nginx storage)
  5. Updates latest.json pointer
  6. Applies retention policy

### 5. Redis Cache
- **Purpose**: Session storage and caching
- **Usage**:
  - NextAuth v5 session storage
  - Download tracking and counting
  - Bandwidth usage metrics
  - Rate limiting

## Data Flow

### Download Flow (Free Tier)
```
User Browser → WebApp API → Generate Secure URL (tier=free) → 
→ User Downloads → Nginx Storage (50MB/s limit, secure_link validation)
```

### Download Flow (Premium Tier)
```
User Login → NextAuth Session → WebApp API → Generate Secure URL (tier=premium) → 
→ User Downloads → Nginx Storage (250MB/s limit, secure_link validation)
```

### Snapshot Creation Flow
```
Scheduler/User Request → Processor API → Create VolumeSnapshot → 
→ Mount & Compress (ZST/LZ4) → Upload to Nginx Storage → Apply Retention Policy
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
- **snapshots.bryanlabs.net**: Direct nginx storage access

## Security Model

### Authentication
- NextAuth v5 with email/password and wallet support
- Database-backed sessions (SQLite)
- Legacy JWT support for API compatibility
- User registration enabled
- Account linking between email and wallet

### URL Security
- Secure URLs with nginx secure_link module
- URLs expire in 5 minutes
- MD5 hash includes IP, expiration, and tier
- Download tracking via nginx logs and Redis

### Network Security
- All internal communication over cluster network
- TLS termination at ingress
- Secure download URLs with nginx secure_link module

## Configuration

### Environment Variables (WebApp)
```bash
# Nginx Configuration
NGINX_ENDPOINT=nginx
NGINX_PORT=32708
NGINX_USE_SSL=false
NGINX_EXTERNAL_URL=https://snapshots.bryanlabs.net
SECURE_LINK_SECRET=<secret>

# Authentication
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=https://snapshots.bryanlabs.net
DATABASE_URL=file:/app/prisma/dev.db
# Legacy API support
PREMIUM_USERNAME=premium_user
PREMIUM_PASSWORD_HASH=<bcrypt>
JWT_SECRET=<secret>

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
# Secure link validation
secure_link $arg_md5,$arg_expires;
secure_link_md5 "$secure_link_expires$uri$remote_addr$arg_tier $secret";

# Bandwidth limits based on tier
map $arg_tier $limit_rate {
    default      50m;  # 50MB/s for free tier
    "free"       50m;
    "premium"    250m; # 250MB/s for premium tier
}
```

## Monitoring

### Current Metrics
- Nginx access logs for download tracking
- Kubernetes pod metrics (CPU, memory)
- Nginx storage usage (shared PVC)

### Health Checks
- WebApp: `/api/health` endpoint
- Nginx: TCP port checks
- Nginx: TCP port checks
- Processor: `/api/health` endpoint

## Snapshot Storage Format

### File Naming Convention
```
<chain-id>-<block-height>.tar.zst
Example: osmosis-1-25261834.tar.zst
```

### Metadata Files (latest.json)
```json
{
  "chain_id": "osmosis-1",
  "height": 25261834,
  "size": 91547443618,
  "created_at": "2024-12-16T08:30:00Z",
  "filename": "osmosis-1-25261834.tar.lz4",
  "compression": "lz4",
  "compression_level": 1
}
```

## Scaling Considerations

### Current Limits
- Total bandwidth: 500MB/s (infrastructure limit)
- Storage: 10TB PVC (expandable with TopoLVM)
- Concurrent downloads: ~100 (nginx worker limits)

### Bottlenecks
1. Single Redis instance (can be clustered)
2. Nginx bandwidth enforcement (CPU intensive)
3. Nginx static file serving for high performance

## Disaster Recovery

### Backup Strategy
- TopoLVM provides redundant storage
- Snapshot processor retention policies prevent overflow
- Kubernetes etcd backed up daily
- Configuration stored in Git

### Recovery Procedures
1. **WebApp failure**: Kubernetes auto-restarts pods
2. **Nginx failure**: Kubernetes auto-restarts, data persists on PVC
3. **Complete failure**: Restore from Git + PVC backups