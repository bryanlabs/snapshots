# Deployment Guide - Connecting Real Snapshots

This guide explains how to deploy the snapshot service with your existing Kubernetes infrastructure that creates VolumeSnapshots.

## Architecture Overview

```
ScheduledVolumeSnapshot (CRD) → VolumeSnapshot → Processing Pod → tar.lz4 → Nginx Server → Next.js App
```

## Prerequisites

- Kubernetes cluster with TopoLVM CSI driver
- ScheduledVolumeSnapshot CRDs already creating snapshots
- 5-10TB storage for processed snapshots
- Docker registry for the cosmos-snapshotter image

## Step 1: Build the Cosmos Snapshotter Image

First, create the Docker image that includes cosmprund and lz4 tools:

```dockerfile
# Dockerfile.cosmos-snapshotter
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make gcc musl-dev

# Clone and build cosmprund
RUN git clone https://github.com/binaryholdings/cosmprund /cosmprund && \
    cd /cosmprund && \
    go build -o /usr/local/bin/cosmprund ./cmd/cosmprund

FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache \
    bash \
    lz4 \
    jq \
    curl \
    bc \
    kubectl

# Copy cosmprund from builder
COPY --from=builder /usr/local/bin/cosmprund /usr/local/bin/cosmprund

# Make sure cosmprund is executable
RUN chmod +x /usr/local/bin/cosmprund

ENTRYPOINT ["/bin/bash"]
```

Build and push:

```bash
docker build -f Dockerfile.cosmos-snapshotter -t ghcr.io/bryanlabs/cosmos-snapshotter:v1.0.0 .
docker push ghcr.io/bryanlabs/cosmos-snapshotter:v1.0.0
```

## Step 2: Deploy the Snapshot Processing Infrastructure

Deploy all the Kubernetes resources:

```bash
cd kubernetes/snapshot-processor
kubectl apply -k .
```

This creates:
- `snapshots` namespace with resource quotas
- RBAC for snapshot processing
- 5TB storage PVC for processed snapshots
- Nginx server to serve snapshots
- Processing scripts as ConfigMaps
- CronJob to process snapshots every 6 hours

## Step 3: Configure the Next.js Application

Update your `.env` file to use real snapshots:

```env
# Existing MinIO config (keep as fallback)
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Enable real snapshots
USE_REAL_SNAPSHOTS=true
SNAPSHOT_SERVER_URL=http://snapshot-server.snapshots.svc.cluster.local

# Or if deploying outside the cluster
# SNAPSHOT_SERVER_URL=https://snapshots.yourdomain.com
```

## Step 4: Update Kubernetes Deployment

Create a Kubernetes deployment for the Next.js app:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: snapshot-ui
  namespace: snapshots
spec:
  replicas: 2
  selector:
    matchLabels:
      app: snapshot-ui
  template:
    metadata:
      labels:
        app: snapshot-ui
    spec:
      containers:
      - name: app
        image: ghcr.io/bryanlabs/snapshots:latest
        ports:
        - containerPort: 3000
        env:
        - name: USE_REAL_SNAPSHOTS
          value: "true"
        - name: SNAPSHOT_SERVER_URL
          value: "http://snapshot-server.snapshots.svc.cluster.local"
        - name: PREMIUM_USERNAME
          value: "admin@example.com"
        - name: PREMIUM_PASSWORD_HASH
          value: "$2a$10$YourHashHere"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        resources:
          requests:
            cpu: 200m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: snapshot-ui
  namespace: snapshots
spec:
  selector:
    app: snapshot-ui
  ports:
  - port: 80
    targetPort: 3000
```

## Step 5: Create Ingress for External Access

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: snapshots
  namespace: snapshots
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "0"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  ingressClassName: nginx
  rules:
  - host: snapshots.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: snapshot-ui
            port:
              number: 80
  - host: files.snapshots.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: snapshot-server
            port:
              number: 80
```

## Step 6: Configure Bandwidth Limiting (Optional)

To implement bandwidth limiting at the ingress level:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: snapshot-files
  namespace: snapshots
  annotations:
    nginx.ingress.kubernetes.io/limit-rate: "52428800" # 50MB/s for free tier
    nginx.ingress.kubernetes.io/limit-rate-after: "104857600" # After 100MB
spec:
  ingressClassName: nginx
  rules:
  - host: files.snapshots.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: snapshot-server
            port:
              number: 80
```

## Step 7: Manual Snapshot Processing

To manually process existing VolumeSnapshots:

```bash
# Process a specific snapshot
kubectl exec -n snapshots deployment/snapshot-server -- \
  /scripts/process-single-snapshot.sh "osmosis-daily-20240111" "fullnodes"

# Process all pending snapshots
kubectl create job --from=cronjob/scheduled-snapshot-processor manual-process-$(date +%s) -n snapshots
```

## Step 8: Monitoring

Check the status of snapshot processing:

```bash
# View processing jobs
kubectl get jobs -n snapshots

# Check logs
kubectl logs -n snapshots job/scheduled-snapshot-processor-xxxxx

# View available snapshots
kubectl exec -n snapshots deployment/snapshot-server -- ls -la /usr/share/nginx/html/

# Check snapshot metadata
curl http://snapshot-server.snapshots.svc.cluster.local/osmosis-1/metadata.json | jq
```

## Troubleshooting

### VolumeSnapshots not being processed

1. Check if the CronJob is running:
   ```bash
   kubectl get cronjobs -n snapshots
   kubectl describe cronjob scheduled-snapshot-processor -n snapshots
   ```

2. Check RBAC permissions:
   ```bash
   kubectl auth can-i get volumesnapshots -n fullnodes --as=system:serviceaccount:snapshots:snapshot-creator
   ```

3. Check if VolumeSnapshots exist:
   ```bash
   kubectl get volumesnapshots -n fullnodes
   ```

### Storage filling up

1. Adjust retention in the cleanup script
2. Manually clean old snapshots:
   ```bash
   kubectl exec -n snapshots deployment/snapshot-server -- \
     find /usr/share/nginx/html -name "*.tar.lz4" -mtime +7 -delete
   ```

### Next.js app not showing snapshots

1. Check connectivity:
   ```bash
   kubectl exec -n snapshots deployment/snapshot-ui -- \
     curl -I http://snapshot-server.snapshots.svc.cluster.local/
   ```

2. Check environment variables:
   ```bash
   kubectl describe deployment snapshot-ui -n snapshots
   ```

## Migration from Mock Data

To transition from mock data to real snapshots:

1. Deploy the infrastructure (Steps 1-4)
2. Let the CronJob process existing VolumeSnapshots
3. Update Next.js app environment to `USE_REAL_SNAPSHOTS=true`
4. Redeploy the Next.js app
5. Verify snapshots appear in the UI

## Production Considerations

1. **Storage**: Monitor storage usage and adjust retention policies
2. **Backup**: Consider backing up processed snapshots to object storage
3. **Security**: Implement proper authentication for snapshot downloads
4. **Performance**: Use CDN for serving large snapshot files
5. **Monitoring**: Set up alerts for failed processing jobs