# Kubernetes Integration for Bare-Metal Repository

This document describes the Kubernetes manifests and scripts created for processing VolumeSnapshots in the bare-metal repository. These should be created in the actual bare-metal repo.

## Files to Create

### 1. `/kubernetes/snapshot-processor/namespace.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: snapshots
  labels:
    tier: infrastructure
    purpose: snapshot-creation
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: snapshot-quota
  namespace: snapshots
spec:
  hard:
    requests.cpu: "50"
    requests.memory: "200Gi"
    requests.storage: "10Ti"
    persistentvolumeclaims: "20"
```

### 2. `/kubernetes/snapshot-processor/rbac.yaml`
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: snapshot-creator
  namespace: snapshots
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: snapshot-creator
rules:
- apiGroups: ["snapshot.storage.k8s.io"]
  resources: ["volumesnapshots"]
  verbs: ["create", "get", "list", "watch", "delete"]
- apiGroups: [""]
  resources: ["persistentvolumeclaims"]
  verbs: ["create", "get", "list", "watch", "delete"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["create", "get", "list", "watch", "delete"]
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create"]
- apiGroups: ["batch"]
  resources: ["jobs"]
  verbs: ["create", "get", "list", "watch", "delete"]
- apiGroups: ["cosmos.strange.love"]
  resources: ["scheduledvolumesnapshots"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: snapshot-creator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: snapshot-creator
subjects:
- kind: ServiceAccount
  name: snapshot-creator
  namespace: snapshots
```

### 3. `/kubernetes/snapshot-processor/storage.yaml`
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: snapshot-storage
  namespace: snapshots
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: topolvm-ssd-xfs
  resources:
    requests:
      storage: 5Ti
```

### 4. `/kubernetes/snapshot-processor/nginx-server.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
  namespace: snapshots
data:
  default.conf: |
    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;

        location / {
            autoindex on;
            autoindex_exact_size off;
            autoindex_localtime on;
            autoindex_format json;

            # Enable CORS for API access
            add_header Access-Control-Allow-Origin *;

            # Cache control
            add_header Cache-Control "public, max-age=3600";

            # Custom headers for snapshot metadata
            location ~ \.json$ {
                add_header Content-Type application/json;
            }
        }

        # Health check endpoint
        location /health {
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }

        # Snapshot listing API endpoint
        location /api/snapshots {
            default_type application/json;
            autoindex on;
            autoindex_format json;
        }
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: snapshot-server
  namespace: snapshots
spec:
  replicas: 2
  selector:
    matchLabels:
      app: snapshot-server
  template:
    metadata:
      labels:
        app: snapshot-server
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: snapshots
          mountPath: /usr/share/nginx/html
          readOnly: true
        - name: config
          mountPath: /etc/nginx/conf.d
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          periodSeconds: 5
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
      volumes:
      - name: snapshots
        persistentVolumeClaim:
          claimName: snapshot-storage
      - name: config
        configMap:
          name: nginx-config
---
apiVersion: v1
kind: Service
metadata:
  name: snapshot-server
  namespace: snapshots
spec:
  selector:
    app: snapshot-server
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

### 5. `/kubernetes/snapshot-processor/scheduled-cronjob.yaml`
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scheduled-snapshot-processor
  namespace: snapshots
spec:
  schedule: "0 */6 * * *"  # Every 6 hours
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: snapshot-creator
          containers:
          - name: snapshot-processor
            image: ghcr.io/bryanlabs/cosmos-snapshotter:v1.0.0
            command: ["/scripts/process-snapshots.sh"]
            env:
            - name: MIN_RETAIN_BLOCKS
              value: "1000"
            - name: MIN_RETAIN_VERSIONS
              value: "1000"
            - name: COMPRESSION_LEVEL
              value: "9"
            volumeMounts:
            - name: storage
              mountPath: /storage
            - name: scripts
              mountPath: /scripts
            resources:
              requests:
                cpu: 2
                memory: 8Gi
              limits:
                cpu: 8
                memory: 32Gi
          volumes:
          - name: storage
            persistentVolumeClaim:
              claimName: snapshot-storage
          - name: scripts
            configMap:
              name: snapshot-scripts
              defaultMode: 0755
          restartPolicy: OnFailure
```

### 6. `/kubernetes/snapshot-processor/scripts-configmap.yaml`
This is a large file containing the processing scripts. Key scripts:
- `process-snapshots.sh`: Main script that finds and processes VolumeSnapshots
- `process-single-snapshot.sh`: Processes individual snapshots
- `cleanup-old-snapshots.sh`: Removes old snapshots based on retention

The scripts:
1. Find VolumeSnapshots in the `fullnodes` namespace
2. Create a PVC from the snapshot
3. Mount it in a processing pod
4. Run cosmprund to prune the data
5. Create tar.lz4 archive
6. Store in the snapshot-storage PVC
7. Generate metadata JSON files
8. Update symlinks for latest snapshots

### 7. `/kubernetes/snapshot-processor/kustomization.yaml`
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: snapshots

resources:
  - namespace.yaml
  - rbac.yaml
  - storage.yaml
  - nginx-server.yaml
  - scripts-configmap.yaml
  - scheduled-cronjob.yaml
```

## Docker Image Required

Create `Dockerfile.cosmos-snapshotter`:
```dockerfile
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache git make gcc musl-dev

RUN git clone https://github.com/binaryholdings/cosmprund /cosmprund && \
    cd /cosmprund && \
    go build -o /usr/local/bin/cosmprund ./cmd/cosmprund

FROM alpine:3.19

RUN apk add --no-cache \
    bash \
    lz4 \
    jq \
    curl \
    bc

RUN wget https://dl.k8s.io/release/v1.28.0/bin/linux/amd64/kubectl && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

COPY --from=builder /usr/local/bin/cosmprund /usr/local/bin/cosmprund

RUN chmod +x /usr/local/bin/cosmprund

ENTRYPOINT ["/bin/bash"]
```

## Integration with Next.js App

The Next.js app connects to this infrastructure by:
1. Setting `USE_REAL_SNAPSHOTS=true` environment variable
2. Setting `SNAPSHOT_SERVER_URL=http://snapshot-server.snapshots.svc.cluster.local`
3. The app will then fetch snapshot data from the nginx server instead of MinIO

## Key Design Decisions

1. **Namespace**: Uses `snapshots` namespace to isolate from other workloads
2. **Storage**: 5TB PVC for processed snapshots (adjustable)
3. **Processing**: Runs every 6 hours via CronJob
4. **Pruning**: Uses cosmprund with configurable block/version retention
5. **Format**: tar.lz4 compression for efficient storage
6. **Serving**: nginx with JSON autoindex for easy API consumption
7. **Metadata**: Each chain gets a metadata.json with all snapshots listed

## How It Works

1. Your existing ScheduledVolumeSnapshots create VolumeSnapshots
2. The CronJob finds these snapshots
3. For each snapshot:
   - Creates a temporary PVC from the snapshot
   - Mounts it in a processing pod
   - Runs cosmprund to prune unnecessary data
   - Compresses to tar.lz4
   - Stores in central storage with metadata
4. Nginx serves the files with directory listing
5. Next.js app reads the JSON metadata and provides UI

This integrates seamlessly with your existing infrastructure while providing the modern UI requested in the PRD.