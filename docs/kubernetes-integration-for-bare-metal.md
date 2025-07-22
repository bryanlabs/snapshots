# Kubernetes Integration for Bare-Metal Infrastructure

This document describes how the Snapshots service is integrated into the BryanLabs bare-metal Kubernetes infrastructure.

## Overview

The Snapshots web application is deployed as part of a comprehensive snapshot service ecosystem within the bare-metal repository. It works in conjunction with:

1. **Snapshot Processor** - Request-based system that creates and compresses blockchain snapshots
2. **Nginx Storage** - Static file server that hosts snapshot files  
3. **Redis** - Caching and session storage
4. **TopoLVM** - Dynamic volume provisioning for storage

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        fullnodes namespace                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │
│  │   Snapshot   │────▶│    Nginx     │◀────│   Web App    │       │
│  │  Processor   │     │   Storage    │     │  (Next.js)   │       │
│  └──────────────┘     └──────────────┘     └──────────────┘       │
│         │                     │                     │                │
│         ▼                     ▼                     ▼                │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │
│  │ Request API  │     │  Shared PVC  │     │    SQLite    │       │
│  │   :8080      │     │  /snapshots  │     │   Database   │       │
│  └──────────────┘     └──────────────┘     └──────────────┘       │
│                                                    │                 │
│                        ┌──────────────┐            ▼                │
│                        │    Redis     │     ┌──────────────┐       │
│                        │    Cache     │     │   TopoLVM    │       │
│                        └──────────────┘     │     PVCs     │       │
│                                             └──────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

## Repository Structure

```
bare-metal/
└── cluster/
    └── chains/
        └── cosmos/
            └── fullnode/
                └── snapshot-service/
                    ├── nginx/              # Nginx storage service
                    │   ├── deployment.yaml
                    │   ├── configmap.yaml
                    │   ├── service.yaml
                    │   ├── pvc.yaml
                    │   └── kustomization.yaml
                    ├── processor/          # Snapshot processor
                    │   ├── deployment-unified.yaml
                    │   ├── configmap.yaml
                    │   ├── rbac-unified.yaml
                    │   ├── service.yaml
                    │   └── kustomization.yaml
                    ├── webapp/             # Web application
                    │   ├── deployment.yaml
                    │   ├── configmap.yaml
                    │   ├── secrets.yaml
                    │   ├── pvc.yaml
                    │   ├── service.yaml
                    │   └── kustomization.yaml
                    ├── redis/              # Redis cache
                    │   ├── deployment.yaml
                    │   ├── service.yaml
                    │   └── kustomization.yaml
                    └── kustomization.yaml  # Main kustomization
```

## Service Communication

### Internal Service Discovery
All services communicate using Kubernetes DNS within the `fullnodes` namespace:

- **Nginx Storage**: `nginx.fullnodes.svc.cluster.local:32708`
- **Snapshot Processor**: `snapshot-processor.fullnodes.svc.cluster.local:8080`
- **Web App**: `webapp.fullnodes.svc.cluster.local:3000`
- **Redis**: `redis.fullnodes.svc.cluster.local:6379`

### External Access
- **Public URL**: `https://snapshots.bryanlabs.net` (via Ingress)
- **TLS**: Managed by cert-manager with Let's Encrypt

## Storage Architecture

### Shared Storage PVC
The nginx service uses a shared PVC that's mounted by both nginx and the snapshot processor:

```yaml
# nginx/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nginx-storage
  namespace: fullnodes
spec:
  accessModes:
    - ReadWriteMany  # Allows multiple pods to mount
  resources:
    requests:
      storage: 10Ti
  storageClassName: topolvm-ssd-xfs
```

### Storage Layout
```
/snapshots/
├── noble-1/
│   ├── noble-1-20250722-175949.tar.lz4
│   ├── noble-1-20250722-174634.tar.zst
│   └── latest.json
├── osmosis-1/
│   ├── osmosis-1-20250722-180000.tar.lz4
│   └── latest.json
└── [other-chains]/
```

## Integration Flow

### 1. Snapshot Creation
```
User Request → Web App → Processor API → Create Snapshot Job
                                      ↓
                                 Compress (ZST/LZ4)
                                      ↓
                                 Upload to Shared PVC
                                      ↓
                                 Update latest.json
```

### 2. Snapshot Browsing
```
User Browse → Web App → Nginx Autoindex API → Parse JSON
                                           ↓
                                    Display Snapshots
                                           ↓
                                    Generate Secure URLs
```

### 3. Snapshot Download
```
User Click → Web App → Generate Secure Link → Redirect to Nginx
                                           ↓
                                    Direct Download
                                    (with bandwidth limits)
```

## Request-Based Snapshot System

The snapshot processor implements a request-based system:

### API Endpoints
- `POST /api/v1/request` - Submit snapshot request
- `GET /api/v1/requests` - List all requests
- `GET /api/v1/request/{id}` - Get request status

### Request Types
1. **Scheduled** - Created by internal scheduler
2. **On-Demand** - Created by user request via web app

### Request Flow
```json
{
  "chain_id": "noble-1",
  "compression": "lz4",
  "compression_level": 1,
  "request_type": "on_demand",
  "requested_by": "user@example.com"
}
```

## Deployment Process

### 1. Build Images
```bash
# Web App
docker buildx build --builder cloud-bryanlabs-builder \
  --platform linux/amd64 \
  -t ghcr.io/bryanlabs/snapshots:v1.5.0 \
  --push .

# Processor
docker buildx build --builder cloud-bryanlabs-builder \
  --platform linux/amd64 \
  -t ghcr.io/bryanlabs/snapshot-processor:v1.2.3 \
  --push .
```

### 2. Update Kustomization
```yaml
# webapp/kustomization.yaml
images:
  - name: ghcr.io/bryanlabs/snapshots
    newTag: v1.5.0

# processor/kustomization.yaml  
images:
  - name: ghcr.io/bryanlabs/snapshot-processor
    newTag: v1.2.3
```

### 3. Deploy via Kustomize
```bash
# CRITICAL: Always deploy from repository root
cd /Users/danb/code/github.com/bryanlabs/bare-metal
kubectl diff -k cluster
kubectl apply -k cluster
```

## Configuration Management

### ConfigMaps
Each service has its own ConfigMap for non-sensitive configuration:

```yaml
# webapp-config
NGINX_ENDPOINT: nginx
NGINX_PORT: "32708"
BANDWIDTH_FREE_TOTAL: "50"
BANDWIDTH_PREMIUM_TOTAL: "250"

# processor-config
MODE: unified
DRY_RUN: "false"
WORKER_COUNT: "1"
```

### Secrets
Sensitive data is stored in Kubernetes secrets:

```yaml
# webapp-secrets
NEXTAUTH_SECRET: <generated>
DATABASE_URL: file:/app/prisma/dev.db
SECURE_LINK_SECRET: <shared-with-nginx>

# processor-secrets
# Currently none required
```

## Monitoring and Observability

### Health Checks
All services implement health endpoints:
- Web App: `/api/health`
- Processor: `/api/health`
- Nginx: TCP port check

### Prometheus Metrics
- Web App exports metrics at `/api/metrics`
- Processor exports metrics at `/metrics`
- Nginx metrics via nginx-prometheus-exporter

### Logging
- All services log to stdout/stderr
- Logs collected by cluster logging infrastructure
- Available in Grafana Loki

## Security Considerations

### Network Policies
- Services only accessible within cluster
- External access only via Ingress
- Redis not exposed externally

### Authentication
- Web app uses NextAuth.js v5
- Processor trusts all requests (internal only)
- Nginx uses secure_link for download protection

### RBAC
The processor requires specific permissions:
```yaml
rules:
- apiGroups: ["snapshot.storage.k8s.io"]
  resources: ["volumesnapshots"]
  verbs: ["get", "list", "watch", "delete"]
- apiGroups: ["batch"]
  resources: ["jobs"]
  verbs: ["create", "get", "list", "watch", "delete"]
```

## Troubleshooting

### Common Issues

1. **Web app can't connect to nginx**
   ```bash
   kubectl exec -n fullnodes deployment/webapp -- \
     wget -O- http://nginx:32708/
   ```

2. **Processor can't create snapshots**
   ```bash
   kubectl logs -n fullnodes deployment/snapshot-processor
   kubectl get volumesnapshots -n fullnodes
   ```

3. **Redis connection issues**
   ```bash
   kubectl exec -n fullnodes deployment/webapp -- \
     nc -zv redis 6379
   ```

### Debug Commands
```bash
# Check all snapshot service pods
kubectl get pods -n fullnodes -l 'app in (webapp,nginx,snapshot-processor,redis)'

# View recent logs
kubectl logs -n fullnodes -l app=webapp --tail=50
kubectl logs -n fullnodes -l app=snapshot-processor --tail=50

# Check PVC usage
kubectl exec -n fullnodes deployment/nginx -- df -h /usr/share/nginx/html
```

## Future Enhancements

1. **Multi-region support** - Replicate snapshots across regions
2. **S3 compatibility** - Add S3 backend option alongside nginx
3. **Automated cleanup** - Remove old snapshots based on retention policies
4. **Metrics dashboard** - Dedicated Grafana dashboard for snapshot services
5. **Webhook notifications** - Notify when snapshots are ready