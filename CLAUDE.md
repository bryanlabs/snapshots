# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Blockchain Snapshot Service** - A production-grade Next.js application that provides bandwidth-managed blockchain snapshot hosting with tiered user access (free: 50MB/s shared, premium: 250MB/s shared). Uses MinIO for object storage and implements comprehensive monitoring, security, and user management.

## Key Architecture Components

1. **Next.js 15** - Full-stack application with App Router for both UI and API
2. **MinIO Object Storage** - S3-compatible storage for snapshot files
3. **JWT Authentication** - Simple auth system for premium tier access
4. **Bandwidth Management** - Tiered speed limits enforced at MinIO level
5. **Prometheus/Grafana** - Monitoring and observability

## Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing (to be implemented)
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests with Playwright
npm run test:load    # Run load tests with k6
```

## Project Structure

```
app/
├── api/v1/                     # API routes
│   ├── chains/                 # Chain management endpoints
│   │   └── [chainId]/         # Dynamic chain routes
│   │       ├── snapshots/     # List snapshots
│   │       └── download/      # Generate download URLs
│   ├── auth/                  # Authentication endpoints
│   │   ├── login/            # JWT login
│   │   └── logout/           # Clear session
│   └── health/               # Health check
├── chains/                    # UI pages
│   └── [chainId]/            # Chain-specific snapshot listing
├── login/                     # Login page
├── layout.tsx                # Root layout with auth context
└── page.tsx                  # Homepage

lib/
├── auth/                     # Authentication utilities
│   ├── session.ts           # Session management
│   └── middleware.ts        # Auth middleware
├── minio/                   # MinIO integration
│   ├── client.ts           # MinIO client setup
│   └── operations.ts       # MinIO operations
├── bandwidth/              # Bandwidth management
│   └── manager.ts         # Dynamic bandwidth calculation
├── config/                # Configuration
└── types/                # TypeScript types

components/
├── auth/                  # Auth components
├── snapshots/            # Snapshot UI components
│   ├── SnapshotList.tsx
│   └── DownloadButton.tsx
└── common/               # Shared components
```

## Implementation Order (From GitHub Issues)

### Phase 1: Backend API (Priority)
1. **API Routes** - Implement all `/api/v1/*` endpoints
2. **MinIO Integration** - Connect to MinIO for object operations
3. **Authentication** - JWT-based auth system
4. **URL Generation** - Pre-signed URLs with security

### Phase 2: Frontend UI
5. **Snapshot Browsing** - List chains and snapshots
6. **Login/Auth UI** - User authentication interface
7. **Download Experience** - Bandwidth indicators and UX

### Phase 3: Infrastructure
8. **Monitoring** - Prometheus metrics and Grafana dashboards
9. **CI/CD** - GitHub Actions pipeline
10. **Testing** - Comprehensive test suite
11. **Documentation** - User and ops docs

## Critical Implementation Details

### MinIO Configuration
- Endpoint: `http://minio.apps.svc.cluster.local:9000` (K8s internal)
- Bucket: `snapshots`
- Pre-signed URLs: 5-minute expiration, IP-restricted

### Authentication Flow
- Single premium user (credentials in env vars)
- JWT tokens in httpOnly cookies
- 7-day session duration
- Middleware validates on protected routes

### Bandwidth Management
- Free tier: 50MB/s shared among all free users
- Premium tier: 250MB/s shared among all premium users
- Total cap: 500MB/s
- Enforced at MinIO level via metadata

### API Response Format
```typescript
// Success response
{
  data: any,
  success: true
}

// Error response
{
  error: string,
  status: number
}
```

### Environment Variables
```bash
# MinIO
MINIO_ENDPOINT=http://minio.apps.svc.cluster.local:9000
MINIO_ACCESS_KEY=<from-secret>
MINIO_SECRET_KEY=<from-secret>

# Auth
PREMIUM_USERNAME=premium_user
PREMIUM_PASSWORD_HASH=<bcrypt-hash>
JWT_SECRET=<generated>

# Config
BANDWIDTH_FREE_TOTAL=50
BANDWIDTH_PREMIUM_TOTAL=250
AUTH_SESSION_DURATION=7d
DOWNLOAD_URL_EXPIRY=5m
```

## Key Features to Implement

### Core Features
1. **List all chains with snapshots** - Homepage showing available chains
2. **Browse chain snapshots** - Detailed view with metadata
3. **Generate download URLs** - Secure, time-limited URLs
4. **User authentication** - Login for premium tier access
5. **Bandwidth enforcement** - Tier-based speed limits

### Security Features
- JWT authentication with secure cookies
- Pre-signed URLs with IP restriction
- Rate limiting (10 downloads/minute)
- CORS configuration
- Input validation on all endpoints

### Monitoring
- API request metrics
- Bandwidth usage tracking
- Download analytics
- Error rate monitoring
- Storage usage alerts

## Development Guidelines

### API Development
- Use Next.js Route Handlers (App Router)
- Implement proper error handling
- Return consistent response formats
- Add request validation
- Keep response times <200ms

### Frontend Development
- Use TypeScript for type safety
- Implement loading and error states
- Make responsive for all devices
- Follow accessibility standards
- Use Tailwind CSS for styling

### Testing Requirements
- Unit tests for API logic (>80% coverage)
- Integration tests with MinIO
- E2E tests for critical flows
- Load tests for bandwidth limits
- Security tests for auth system

## Common Tasks

### Adding a New Chain
1. Upload snapshot files to MinIO bucket
2. Create metadata JSON file
3. Chain will appear automatically in API/UI

### Testing Bandwidth Limits
```bash
# Test free tier (should be ~50MB/s)
curl -O [generated-url]

# Test premium tier (should be ~250MB/s)
curl -H "Cookie: auth-token=[jwt]" -O [generated-url]
```

### Debugging MinIO Connection
```bash
# Check MinIO health
curl http://minio.apps.svc.cluster.local:9000/minio/health/live

# List buckets (with mc CLI)
mc ls myminio/
```

## Important Notes

1. **No Polkachu API** - This replaces the prototype. All data comes from MinIO
2. **BryanLabs Style** - Maintain professional design aesthetic
3. **Performance First** - Optimize for speed and reliability
4. **Security Critical** - Properly implement auth and access controls