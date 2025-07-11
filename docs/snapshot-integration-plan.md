# Snapshot Service Integration Plan

This document outlines the plan to integrate the Next.js snapshot service with the existing Kubernetes infrastructure using MinIO for object storage.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        fullnodes namespace                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Noble Node      │  │ Osmosis Node    │  │ Other Nodes     │ │
│  │ VolumeSnapshots │  │ VolumeSnapshots │  │ VolumeSnapshots │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                      Cross-namespace snapshot access
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                          apps namespace                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Snapshot        │  │ MinIO           │  │ Next.js App     │ │
│  │ Processor       │→ │ Object Storage  │← │ (Snapshots UI)  │ │
│  │ (CronJob)       │  │ (5TB Storage)   │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

1. **Single Namespace**: All application components in `apps` namespace for simplicity
2. **MinIO Storage**: S3-compatible object storage for snapshots
3. **Cross-namespace Access**: Processor reads VolumeSnapshots from `fullnodes` namespace
4. **Automated Processing**: CronJob runs every 6 hours to process new snapshots
5. **Authentication**: Iron-session for secure web authentication
6. **Bandwidth Tiers**: Free (50MB/s) and Premium (250MB/s) enforced via pre-signed URLs

## Implementation Phases

### Phase 1: Deploy MinIO in apps namespace

#### 1.1 Create MinIO Resources

Location: `/cluster/apps/minio-snapshots/`

**Files to create:**

- `namespace.yaml` - Ensure apps namespace exists
- `secrets.yaml` - MinIO root credentials and access keys
- `pvc.yaml` - 5TB persistent volume claim using topolvm-ssd-xfs
- `deployment.yaml` - MinIO server deployment (2 replicas)
- `service.yaml` - ClusterIP service exposing ports 9000 (API) and 9001 (Console)
- `servicemonitor.yaml` - Prometheus metrics collection
- `kustomization.yaml` - Kustomize configuration

**MinIO Configuration:**
```yaml
# Key environment variables
MINIO_ROOT_USER: <generate-secure-username>
MINIO_ROOT_PASSWORD: <generate-secure-password>
MINIO_PROMETHEUS_AUTH_TYPE: public
MINIO_API_REQUESTS_MAX: 500
MINIO_API_REQUESTS_DEADLINE: 1m
```

#### 1.2 Initialize MinIO

After deployment:
1. Port-forward to MinIO console: `kubectl port-forward -n apps svc/minio-snapshots 9001:9001`
2. Create `snapshots` bucket
3. Set bucket policy for public read access
4. Create service account for snapshot processor

### Phase 2: Create Snapshot Processor

#### 2.1 Build Processor Image

Location: `/cluster/apps/snapshot-processor/`

**Dockerfile.cosmos-snapshotter:**
```dockerfile
FROM golang:1.21-alpine AS builder

# Build cosmprund for snapshot pruning
RUN apk add --no-cache git make gcc musl-dev
RUN git clone https://github.com/binaryholdings/cosmprund /cosmprund && \
    cd /cosmprund && \
    go build -o /usr/local/bin/cosmprund ./cmd/cosmprund

FROM alpine:3.19

# Install required tools
RUN apk add --no-cache \
    bash \
    lz4 \
    jq \
    curl \
    bc \
    tar

# Install kubectl
RUN wget https://dl.k8s.io/release/v1.28.0/bin/linux/amd64/kubectl && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Install MinIO client
RUN wget https://dl.min.io/client/mc/release/linux-amd64/mc && \
    chmod +x mc && \
    mv mc /usr/local/bin/

# Copy cosmprund from builder
COPY --from=builder /usr/local/bin/cosmprund /usr/local/bin/cosmprund

ENTRYPOINT ["/bin/bash"]
```

Build and push: `docker build -f Dockerfile.cosmos-snapshotter -t ghcr.io/bryanlabs/cosmos-snapshotter:v1.0.0 .`

#### 2.2 Create Processor Resources

**Files to create:**

- `rbac.yaml` - ServiceAccount and ClusterRole for:
  - Reading VolumeSnapshots from fullnodes namespace
  - Creating/deleting PVCs in apps namespace
  - Creating/deleting Jobs in apps namespace
- `scripts-configmap.yaml` - Processing scripts
- `cronjob.yaml` - Scheduled job running every 6 hours
- `kustomization.yaml` - Kustomize configuration

**Key RBAC Permissions:**
```yaml
# Read snapshots from fullnodes
- apiGroups: ["snapshot.storage.k8s.io"]
  resources: ["volumesnapshots"]
  verbs: ["get", "list", "watch"]
  namespaces: ["fullnodes"]

# Create PVCs in apps namespace
- apiGroups: [""]
  resources: ["persistentvolumeclaims"]
  verbs: ["create", "get", "delete"]
  namespaces: ["apps"]
```

#### 2.3 Processing Script Logic

The main processing script will:

1. **Find VolumeSnapshots**:
   ```bash
   kubectl get volumesnapshots -n fullnodes -o json | \
     jq -r '.items[] | select(.status.readyToUse==true) | .metadata.name'
   ```

2. **For each snapshot**:
   - Create PVC from VolumeSnapshot in apps namespace
   - Mount PVC in a processing pod
   - Run cosmprund to prune unnecessary data
   - Create tar.lz4 archive
   - Calculate checksums and metadata
   - Upload to MinIO with metadata
   - Clean up temporary resources

3. **MinIO Upload**:
   ```bash
   # Configure MinIO client
   mc alias set snapshots http://minio-snapshots:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
   
   # Upload snapshot
   mc cp snapshot.tar.lz4 snapshots/snapshots/${CHAIN_ID}/
   
   # Set metadata
   mc stat snapshots/snapshots/${CHAIN_ID}/snapshot.tar.lz4 \
     --json > metadata.json
   ```

### Phase 3: Deploy Next.js Application

#### 3.1 Prepare Application

Location: `/cluster/apps/snapshots/`

**Update snapshot-fetcher.ts** to work with MinIO:
- List objects from MinIO bucket
- Parse metadata from object tags or separate JSON files
- Generate download URLs

**Environment Configuration:**
```env
# MinIO Configuration
MINIO_ENDPOINT=minio-snapshots
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=<from-secret>
MINIO_SECRET_KEY=<from-secret>
MINIO_BUCKET_NAME=snapshots

# Authentication
SESSION_PASSWORD=<generate-32-char-password>
PREMIUM_USERNAME=premium_user
PREMIUM_PASSWORD_HASH=<bcrypt-hash>

# Bandwidth
BANDWIDTH_FREE_TOTAL=50
BANDWIDTH_PREMIUM_TOTAL=250
```

#### 3.2 Create Kubernetes Resources

**Files to create:**

- `secrets.yaml` - Application secrets (session password, MinIO creds)
- `configmap.yaml` - Non-sensitive configuration
- `deployment.yaml` - Next.js application (2+ replicas)
- `service.yaml` - ClusterIP service on port 3000
- `ingress.yaml` - Public ingress at snapshots.bryanlabs.net
- `kustomization.yaml` - Kustomize configuration

**Ingress Configuration:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: snapshots
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - snapshots.bryanlabs.net
    secretName: snapshots-tls
  rules:
  - host: snapshots.bryanlabs.net
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: snapshots
            port:
              number: 3000
```

#### 3.3 Build and Deploy

1. Build Docker image from snapshots repo
2. Push to ghcr.io/bryanlabs/snapshots:latest
3. Deploy to Kubernetes

### Phase 4: Testing and Verification

#### 4.1 Functional Testing

1. **MinIO Access**:
   - Verify MinIO is accessible within cluster
   - Check bucket creation and policies
   - Test upload/download functionality

2. **Processor Testing**:
   - Manually trigger CronJob
   - Verify cross-namespace VolumeSnapshot access
   - Check snapshot processing and MinIO upload
   - Validate metadata generation

3. **Application Testing**:
   - Access UI at https://snapshots.bryanlabs.net
   - Test chain listing from MinIO
   - Verify snapshot browsing
   - Test download URL generation
   - Validate authentication flow
   - Check bandwidth tier assignment

#### 4.2 Performance Testing

1. **Bandwidth Testing**:
   - Test free tier download speeds (should be ~50MB/s)
   - Test premium tier speeds (should be ~250MB/s)
   - Verify concurrent download handling

2. **Load Testing**:
   - Simulate multiple concurrent users
   - Test API response times
   - Verify MinIO performance under load

## Monitoring and Alerting

### Metrics to Monitor

1. **MinIO Metrics**:
   - Storage usage and growth rate
   - API request rates and latencies
   - Bandwidth consumption
   - Error rates

2. **Processor Metrics**:
   - CronJob success/failure rate
   - Processing duration
   - Snapshot sizes and counts
   - Failed snapshot processing

3. **Application Metrics**:
   - API response times
   - Authentication success/failure rates
   - Download initiation counts by tier
   - Error rates by endpoint

### Alerts to Configure

1. **Critical**:
   - MinIO down or unreachable
   - Processor CronJob failures
   - Application crashes or restarts
   - Storage space < 10%

2. **Warning**:
   - High API latency (> 1s p95)
   - Authentication failure spikes
   - Storage space < 20%
   - Bandwidth limits exceeded

## Security Considerations

1. **Network Policies**:
   - Restrict MinIO access to snapshot processor and Next.js app
   - Limit egress from processor pod

2. **RBAC**:
   - Minimal permissions for service accounts
   - Read-only access to VolumeSnapshots
   - Limited PVC creation rights

3. **Secrets Management**:
   - Use Kubernetes secrets for all credentials
   - Regular rotation of MinIO access keys
   - Secure session passwords

4. **Data Protection**:
   - Ensure snapshots don't contain sensitive data
   - Set appropriate MinIO bucket policies
   - Use HTTPS for all public endpoints

## Rollback Plan

If issues arise:

1. **Quick Rollback**:
   - Keep previous snapshot hosting method as backup
   - Document manual snapshot process
   - Maintain list of snapshot URLs

2. **Data Recovery**:
   - MinIO data persists on PVC
   - VolumeSnapshots remain in fullnodes namespace
   - Can recreate from source if needed

## Future Enhancements

1. **Multi-region Replication**:
   - MinIO supports bucket replication
   - Could replicate to different geographic locations

2. **CDN Integration**:
   - Add CloudFlare or similar CDN
   - Cache popular snapshots at edge

3. **Advanced Analytics**:
   - Track download patterns
   - Popular chains and versions
   - User behavior analytics

4. **API Enhancements**:
   - WebSocket support for real-time updates
   - GraphQL API option
   - Snapshot comparison tools

## Timeline

- **Week 1**: Deploy MinIO and verify functionality
- **Week 2**: Implement and test snapshot processor
- **Week 3**: Deploy Next.js application
- **Week 4**: Testing, monitoring setup, and go-live

## Success Criteria

1. Automated snapshot processing every 6 hours
2. All chains visible in web UI
3. Download speeds match tier specifications
4. 99.9% uptime for snapshot service
5. < 200ms API response times (p95)
6. Successful integration with existing monitoring