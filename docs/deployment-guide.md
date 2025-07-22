# Deployment Guide - Snapshot Service Web Application

This guide explains how to deploy the snapshot service web application alongside your existing Kubernetes infrastructure that processes VolumeSnapshots.

## Architecture Overview

```
VolumeSnapshot → Processor CronJob → Nginx Storage → Next.js Web App → Users
                                          ↓
                                       Redis Cache
```

## Current Infrastructure

The snapshot service infrastructure consists of:

1. **Nginx Storage Service** - Serves processed snapshot files
2. **Processor CronJob** - Converts VolumeSnapshots to downloadable files
3. **Redis** - Caching and session storage
4. **Web Application** - Next.js UI for browsing and downloading snapshots

## Prerequisites

- Kubernetes cluster with existing snapshot infrastructure deployed
- Access to `fullnodes` namespace where snapshots are processed
- Docker registry access (ghcr.io/bryanlabs)

## Step 1: Build and Push the Web Application

```bash
# Build and push the Docker image
docker buildx build --builder cloud-bryanlabs-builder \
  --platform linux/amd64 \
  -t ghcr.io/bryanlabs/snapshots:latest \
  --push .
```

## Step 2: Create Kubernetes Resources

Create the deployment directory:

```bash
mkdir -p k8s
```

### Create the Deployment (k8s/deployment.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: snapshots
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: snapshots
  template:
    metadata:
      labels:
        app: snapshots
    spec:
      containers:
      - name: app
        image: ghcr.io/bryanlabs/snapshots:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: HOSTNAME
          value: "0.0.0.0"
        - name: PORT
          value: "3000"
        - name: DATABASE_URL
          value: "file:/app/prisma/dev.db"
        - name: NEXTAUTH_URL
          value: "https://snapshots.bryanlabs.net"
        - name: NEXTAUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: snapshots-secrets
              key: nextauth-secret
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: snapshots-secrets
              key: jwt-secret
        - name: SNAPSHOT_SERVER_URL
          value: "http://nginx-service.fullnodes.svc.cluster.local:32708"
        - name: REDIS_URL
          value: "redis://redis-service.fullnodes.svc.cluster.local:6379"
        resources:
          requests:
            cpu: 200m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        volumeMounts:
        - name: db-storage
          mountPath: /app/prisma
        - name: avatars-storage
          mountPath: /app/public/avatars
        lifecycle:
          postStart:
            exec:
              command: ["/bin/sh", "-c", "cd /app && ./scripts/init-db-proper.sh"]
      volumes:
      - name: db-storage
        persistentVolumeClaim:
          claimName: snapshots-db-pvc
      - name: avatars-storage
        persistentVolumeClaim:
          claimName: snapshots-avatars-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: snapshots
  namespace: default
spec:
  selector:
    app: snapshots
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: snapshots-db-pvc
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: topolvm-ssd-xfs
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: snapshots-avatars-pvc
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: topolvm-ssd-xfs
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: snapshots
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
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
              number: 80
```

### Create Secrets (k8s/secrets.yaml)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: snapshots-secrets
  namespace: default
type: Opaque
stringData:
  nextauth-secret: "your-secure-nextauth-secret-here"
  jwt-secret: "your-secure-jwt-secret-here"
```

### Create Kustomization (k8s/kustomization.yaml)

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - secrets.yaml

images:
  - name: ghcr.io/bryanlabs/snapshots
    newTag: latest
```

## Step 3: Deploy to Kubernetes

```bash
# Apply the configuration
cd k8s
kubectl apply -k .

# Check deployment status
kubectl get pods -l app=snapshots
kubectl get svc snapshots
kubectl get ingress snapshots
```

## Step 4: Integration with Existing Infrastructure

The web application integrates with the existing snapshot infrastructure:

1. **Nginx Storage Access**: The app connects to `nginx-service.fullnodes.svc.cluster.local:32708` to fetch snapshot metadata and generate download URLs

2. **Redis Integration**: Uses `redis-service.fullnodes.svc.cluster.local:6379` for caching and session management

3. **File Structure**: Expects snapshots to be organized as:
   ```
   /snapshots/{chain-id}/
     ├── {snapshot-file}.tar.lz4
     └── latest.json (pointer to latest snapshot)
   ```

## Step 5: Verify Deployment

```bash
# Check if the app is running
kubectl logs -l app=snapshots

# Test the service internally
kubectl port-forward svc/snapshots 8080:80
# Visit http://localhost:8080

# Check ingress is working
curl -I https://snapshots.bryanlabs.net
```

## Environment Variables

Key environment variables for the web application:

- `SNAPSHOT_SERVER_URL`: URL to the Nginx service serving snapshot files
- `REDIS_URL`: Redis connection string for caching
- `NEXTAUTH_URL`: Public URL of the application
- `NEXTAUTH_SECRET`: Secret for NextAuth.js session encryption
- `JWT_SECRET`: Secret for JWT token generation
- `DATABASE_URL`: SQLite database path (persisted via PVC)

## Features Implemented

The deployed application includes:

1. **User Authentication**: Email/password signup and signin
2. **Profile Management**: User avatars and account settings
3. **Credit System**: 5 credits/day for free users (replacing GB limits)
4. **Toast Notifications**: User feedback for actions
5. **Responsive UI**: Mobile-friendly design
6. **Download Management**: Track download history
7. **Billing Placeholder**: Credits and billing page

## Monitoring

Check application health:

```bash
# View logs
kubectl logs -f -l app=snapshots

# Check resource usage
kubectl top pod -l app=snapshots

# Access metrics endpoint
kubectl port-forward svc/snapshots 8080:80
curl http://localhost:8080/api/health
```

## Troubleshooting

### Pod not starting

```bash
# Check pod events
kubectl describe pod -l app=snapshots

# Check if secrets exist
kubectl get secret snapshots-secrets
```

### Database initialization issues

```bash
# Manually run database initialization
kubectl exec -it deployment/snapshots -- /bin/sh
cd /app && ./scripts/init-db-proper.sh
```

### Cannot access snapshots

```bash
# Test connectivity to Nginx service
kubectl exec deployment/snapshots -- wget -O- http://nginx-service.fullnodes.svc.cluster.local:32708/cosmos/latest.json
```

## Security Considerations

1. **Secrets**: Ensure strong values for NEXTAUTH_SECRET and JWT_SECRET
2. **Database**: SQLite database is persisted on a PVC with restricted access
3. **Avatars**: User-uploaded avatars are stored on a separate PVC
4. **HTTPS**: Ingress configured with TLS using cert-manager

## Next Steps

1. Configure email verification or OAuth providers for enhanced security
2. Set up admin panel for user management
3. Implement actual payment processing for premium tiers
4. Add monitoring and alerting for the application