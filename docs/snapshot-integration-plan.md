# Snapshot Integration Implementation

This document describes the actual implementation of the snapshot service integration, documenting how the system was built and deployed.

## Overview

The snapshot service has been successfully implemented as a comprehensive system that provides:

1. **Request-based snapshot creation** via the snapshot-processor
2. **Nginx storage backend** for serving snapshot files
3. **Next.js web application** for user interface and API
4. **Dual compression support** (ZST and LZ4)
5. **NextAuth v5 authentication** with email and wallet support

## Architecture As Implemented

### Component Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Snapshot Service Architecture                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  External Users                                                      │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────┐                                                        │
│  │ Ingress │ (https://snapshots.bryanlabs.net)                     │
│  └────┬────┘                                                        │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────────────────┐                                       │
│  │    Next.js Web App      │                                       │
│  │  - NextAuth v5 Auth     │                                       │
│  │  - User Management      │                                       │
│  │  - API Routes           │                                       │
│  └──────────┬──────────────┘                                       │
│             │                                                        │
│       ┌─────┴─────┬────────────┬─────────────┐                     │
│       ▼           ▼            ▼             ▼                     │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐               │
│  │  Nginx  │ │  Redis  │ │ Snapshot │ │  SQLite  │               │
│  │ Storage │ │  Cache  │ │Processor │ │    DB    │               │
│  └────┬────┘ └─────────┘ └────┬─────┘ └──────────┘               │
│       │                        │                                     │
│       └────────┬───────────────┘                                    │
│                ▼                                                     │
│         ┌──────────────┐                                           │
│         │  Shared PVC  │                                           │
│         │ /snapshots/  │                                           │
│         └──────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Snapshot Creation Flow**
   ```
   Scheduler/User → Processor API → Create Request → Queue
                                                     ↓
                                              Process Request
                                                     ↓
                                           Create VolumeSnapshot
                                                     ↓
                                              Compress Data
                                                     ↓
                                           Upload to Shared PVC
                                                     ↓
                                          Apply Retention Policy
   ```

2. **User Access Flow**
   ```
   User → Web App → Authenticate → Browse Snapshots → Download
              ↓                         ↓               ↓
         NextAuth v5            Nginx Autoindex   Secure Link
              ↓                         ↓               ↓
          Session                 Parse JSON      Direct Download
   ```

## Implementation Details

### 1. Snapshot Processor

The snapshot-processor was built as a Go application with:

- **Request-based architecture** replacing the original VolumeSnapshot watcher
- **Internal scheduler** for automated snapshot creation
- **Shell-based compression** using system commands (not Go libraries)
- **Retention policy enforcement** to clean up old VolumeSnapshots
- **Dynamic resource allocation** for compression jobs

Key features implemented:
```go
// Request types
type SnapshotRequest struct {
    ChainID         string
    Compression     string
    CompressionLevel int
    RequestType     string // "scheduled" or "on_demand"
    RequestedBy     string
}

// Retention cleanup after successful processing
func (w *RequestWorker) applyRetentionPolicy(ctx context.Context, chainID string) error {
    // Delete old VolumeSnapshots based on count/age policies
}
```

### 2. Nginx Storage Backend

Replaced MinIO with nginx for simplicity and performance:

- **Static file serving** with autoindex module
- **JSON autoindex format** for programmatic access
- **Secure link module** for protected downloads
- **Shared PVC** mounted by both nginx and processor

Configuration highlights:
```nginx
location /snapshots/ {
    alias /usr/share/nginx/html/;
    autoindex on;
    autoindex_format json;
    autoindex_localtime on;
    
    # Secure link validation
    secure_link $arg_md5,$arg_expires;
    secure_link_md5 "$secure_link_expires$uri$remote_addr$arg_tier $secret";
}
```

### 3. Web Application Updates

Major changes to the Next.js application:

- **Migrated to NextAuth v5** from custom JWT implementation
- **Added dual compression support** (ZST and LZ4 detection)
- **Integrated with processor API** for on-demand snapshots
- **Updated nginx client** to parse autoindex JSON
- **Implemented credit system** (5 downloads/day for free users)

Key components:
```typescript
// Nginx operations updated for dual compression
export async function listSnapshots(chainId: string) {
  const files = await nginxClient.listFiles(`snapshots/${chainId}`);
  return files.filter(f => 
    f.name.endsWith('.tar.zst') || f.name.endsWith('.tar.lz4')
  );
}

// NextAuth v5 configuration
export const authOptions = {
  providers: [
    CredentialsProvider({...}),
    // Future: OAuth providers
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }
};
```

### 4. Deployment Integration

Deployed within the bare-metal repository structure:

```
bare-metal/cluster/chains/cosmos/fullnode/snapshot-service/
├── nginx/          # Storage service
├── processor/      # Snapshot processor  
├── webapp/         # Web application
├── redis/          # Cache service
└── kustomization.yaml
```

Key deployment features:
- All services in `fullnodes` namespace
- Kustomize-based configuration management
- Shared secrets between services
- Health checks and monitoring

## Compression Implementation

### Dual Compression Support

Both ZST and LZ4 compression implemented with shell commands:

```bash
# ZST compression (levels 1-22)
tar cf - /data | zstd -${LEVEL} > output.tar.zst

# LZ4 compression (levels 1-9)  
tar cf - /data | lz4 -${LEVEL} > output.tar.lz4
```

### Performance Characteristics

- **ZST**: Better compression ratio, slower speed
  - Level 1-3: Fast compression
  - Level 9: Default balanced
  - Level 19-22: Maximum compression

- **LZ4**: Faster compression, larger files
  - Level 1: Maximum speed
  - Level 9: Maximum compression

## Authentication System

### NextAuth v5 Implementation

- **Session-based auth** replacing JWT tokens
- **Database sessions** stored in SQLite
- **CSRF protection** built-in
- **Account linking** between email and wallet

### User Tiers

1. **Free Tier**
   - 50 Mbps shared bandwidth
   - 5 downloads per day
   - No registration required

2. **Premium Tier**  
   - 250 Mbps shared bandwidth
   - Unlimited downloads
   - Email/wallet authentication

## Monitoring and Observability

### Health Endpoints

- Web App: `/api/health`
- Processor: `/api/health`
- Full system status including service dependencies

### Prometheus Metrics

- Request processing times
- Download counts by chain/tier
- Compression job statistics
- Error rates and latencies

### Logging

- Structured JSON logging
- Collected by cluster infrastructure
- Available in Grafana Loki

## Security Implementation

### Access Control

1. **Public endpoints** - Read-only chain/snapshot data
2. **Authenticated endpoints** - Download URL generation
3. **Admin endpoints** - System statistics and management

### Download Protection

- Time-limited URLs (5 minute expiration)
- IP-based validation
- Tier-based bandwidth limits
- MD5 hash verification

## Lessons Learned

### What Worked Well

1. **Nginx simplicity** - Much simpler than MinIO for static files
2. **Request-based architecture** - Better visibility and control
3. **Shell compression** - More reliable than Go libraries
4. **NextAuth v5** - Robust authentication out of the box

### Challenges Overcome

1. **Shell compatibility** - Fixed sh vs bash issues in Alpine
2. **Variable ordering** - Resolved script execution order problems
3. **Retention cleanup** - Implemented proper VolumeSnapshot deletion
4. **LZ4 display** - Fixed web app filtering to show all formats

### Future Improvements

1. **Multi-region replication** - Distribute snapshots globally
2. **S3 compatibility layer** - Optional S3 backend support
3. **Webhook notifications** - Alert when snapshots ready
4. **Advanced scheduling** - Per-chain custom schedules
5. **Compression presets** - Optimized settings per chain

## Migration Notes

For teams migrating from the old MinIO-based system:

1. **Update snapshot paths** - Now under `/snapshots/[chain-id]/`
2. **Change download URLs** - Use nginx secure links
3. **Update authentication** - Migrate to NextAuth sessions
4. **Compression format** - Support both .tar.zst and .tar.lz4

## Conclusion

The snapshot service integration has been successfully implemented with improved reliability, performance, and user experience. The system now provides a solid foundation for blockchain snapshot distribution with room for future enhancements.