# Deployment Guide - Snapshot Service Web Application

This guide explains how the snapshot service web application is deployed as part of the BryanLabs bare-metal Kubernetes infrastructure.

## Architecture Overview

```
VolumeSnapshot → Snapshot Processor → Nginx Storage → Next.js Web App → Users
                       ↓                    ↓              ↓
                  Request API          Shared PVC      Redis Cache
```

## Current Infrastructure

The snapshot service infrastructure consists of:

1. **Nginx Storage Service** - Serves processed snapshot files from shared PVC
2. **Snapshot Processor** - Request-based system that creates and compresses snapshots
3. **Redis** - Caching and session storage
4. **Web Application** - Next.js UI for browsing and downloading snapshots

## Deployment Architecture

The web application is deployed within the bare-metal repository structure:

```
bare-metal/
└── cluster/
    └── chains/
        └── cosmos/
            └── fullnode/
                └── snapshot-service/
                    ├── processor/      # Snapshot processor deployment
                    ├── nginx/          # Nginx storage service
                    └── webapp/         # Web application (this service)
                        ├── deployment.yaml
                        ├── configmap.yaml
                        ├── secrets.yaml
                        ├── pvc.yaml
                        └── kustomization.yaml
```

## Prerequisites

- Access to the bare-metal repository
- Kubernetes cluster with snapshot infrastructure deployed
- Docker registry access (ghcr.io/bryanlabs)
- Nginx and snapshot-processor services running in `fullnodes` namespace

## Step 1: Build and Push the Web Application

```bash
# IMPORTANT: Always use semantic versioning, never "latest"
# Build and push the Docker image
docker buildx build --builder cloud-bryanlabs-builder \
  --platform linux/amd64 \
  -t ghcr.io/bryanlabs/snapshots:v1.5.0 \
  --push .
```

## Step 2: Update Kubernetes Manifests

The deployment is managed through the bare-metal repository. Update the image version in:

```yaml
# bare-metal/cluster/chains/cosmos/fullnode/snapshot-service/webapp/kustomization.yaml
images:
  - name: ghcr.io/bryanlabs/snapshots
    newTag: v1.5.0  # Update to your new version
```

## Step 3: Deploy via Kustomize

**⚠️ CRITICAL: Never apply individual files or subdirectories!**

```bash
# Navigate to bare-metal repository root
cd /Users/danb/code/github.com/bryanlabs/bare-metal

# Preview changes
kubectl diff -k cluster

# Apply ALL changes from cluster root
kubectl apply -k cluster

# Check deployment status
kubectl get pods -n fullnodes -l app=webapp
kubectl get svc -n fullnodes webapp
```

## Step 4: Integration Points

The web application integrates with the existing infrastructure:

### 1. **Nginx Storage Access**
- Internal endpoint: `nginx.fullnodes.svc.cluster.local:32708`
- Reads snapshots from shared PVC mounted at `/snapshots`
- Uses nginx autoindex JSON format for file listing
- Generates secure download URLs with nginx secure_link module

### 2. **Snapshot Processor Integration**
- Processor API: `http://snapshot-processor.fullnodes.svc.cluster.local:8080`
- Web app can request on-demand snapshots via API
- Processor handles compression (ZST/LZ4) and uploads to nginx storage

### 3. **Redis Integration**
- Endpoint: `redis.fullnodes.svc.cluster.local:6379`
- Used for session storage and caching
- Tracks download counts and bandwidth usage

### 4. **File Organization**
```
/snapshots/{chain-id}/
  ├── {chain-id}-{timestamp}.tar.zst    # ZST compressed snapshots
  ├── {chain-id}-{timestamp}.tar.lz4    # LZ4 compressed snapshots
  └── latest.json                        # Pointer to latest snapshot
```

## Step 5: Configuration

### Environment Variables (via ConfigMap)
```yaml
# nginx storage
NGINX_ENDPOINT: nginx
NGINX_PORT: "32708"
NGINX_USE_SSL: "false"
NGINX_EXTERNAL_URL: https://snapshots.bryanlabs.net

# authentication
NEXTAUTH_URL: https://snapshots.bryanlabs.net
NODE_ENV: production

# bandwidth management
BANDWIDTH_FREE_TOTAL: "50"
BANDWIDTH_PREMIUM_TOTAL: "250"

# redis
REDIS_HOST: redis
REDIS_PORT: "6379"

# limits
DAILY_DOWNLOAD_LIMIT: "10"
```

### Secrets
```yaml
# Required secrets in webapp-secrets
NEXTAUTH_SECRET: <generated-secret>
DATABASE_URL: file:/app/prisma/dev.db
SECURE_LINK_SECRET: <nginx-secure-link-secret>
PREMIUM_USERNAME: premium_user
PREMIUM_PASSWORD_HASH: <bcrypt-hash>
SESSION_PASSWORD: <session-encryption-password>
```

## Step 6: Verify Deployment

```bash
# Check pod status
kubectl get pods -n fullnodes -l app=webapp

# View logs
kubectl logs -n fullnodes -l app=webapp

# Test internal connectivity
kubectl exec -n fullnodes deployment/webapp -- wget -O- http://nginx:32708/noble-1/

# Check health endpoint
kubectl port-forward -n fullnodes svc/webapp 8080:3000
curl http://localhost:8080/api/health
```

## Monitoring and Health Checks

### Health Monitoring
```bash
# Check pod health
kubectl get pods -n fullnodes -l app=webapp

# View real-time logs
kubectl logs -f -n fullnodes -l app=webapp

# Check resource usage
kubectl top pod -n fullnodes -l app=webapp

# Access health endpoint
kubectl port-forward -n fullnodes svc/webapp 8080:3000
curl http://localhost:8080/api/health
```

### Prometheus Metrics
The application exports metrics at `/api/metrics`:
- Request counts and latencies
- Download statistics by tier
- Authentication success/failure rates
- Database query performance

## Troubleshooting

### Pod Issues
```bash
# Check pod events
kubectl describe pod -n fullnodes -l app=webapp

# Verify secrets exist
kubectl get secret -n fullnodes webapp-secrets

# Check configmap
kubectl get configmap -n fullnodes webapp-config
```

### Database Issues
```bash
# Access pod shell
kubectl exec -it -n fullnodes deployment/webapp -- /bin/sh

# Initialize database manually
cd /app && ./scripts/init-db-proper.sh

# Check database file
ls -la /app/prisma/dev.db
```

### Connectivity Issues
```bash
# Test nginx connectivity
kubectl exec -n fullnodes deployment/webapp -- wget -O- http://nginx:32708/

# Test redis connectivity
kubectl exec -n fullnodes deployment/webapp -- nc -zv redis 6379

# Test snapshot-processor API
kubectl exec -n fullnodes deployment/webapp -- wget -O- http://snapshot-processor:8080/api/health
```

## Security Considerations

1. **Authentication**: NextAuth.js v5 with CSRF protection
2. **Secrets Management**: All sensitive data in Kubernetes secrets
3. **Database**: SQLite with restricted PVC access
4. **Downloads**: Secure URLs with nginx secure_link module
5. **TLS**: Ingress with cert-manager for HTTPS

## Integration with Snapshot Processor

The web app can request on-demand snapshots:

```bash
# Request a new snapshot (from within cluster)
curl -X POST http://snapshot-processor.fullnodes.svc.cluster.local:8080/api/v1/request \
  -H "Content-Type: application/json" \
  -d '{
    "chain_id": "noble-1",
    "compression": "lz4",
    "request_type": "on_demand"
  }'
```

## Maintenance Tasks

### Update Image Version
1. Build new image with semantic version
2. Update `bare-metal/cluster/chains/cosmos/fullnode/snapshot-service/webapp/kustomization.yaml`
3. Deploy via `kubectl apply -k cluster` from bare-metal root

### Database Backup
```bash
# Create backup
kubectl exec -n fullnodes deployment/webapp -- \
  sqlite3 /app/prisma/dev.db ".backup /tmp/backup.db"

# Copy backup locally
kubectl cp fullnodes/webapp-pod:/tmp/backup.db ./webapp-backup.db
```

### Clear Redis Cache
```bash
kubectl exec -n fullnodes deployment/redis -- redis-cli FLUSHDB
```