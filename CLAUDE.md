# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design System & UI Theme

### Authentication Pages Theme
The authentication pages (signin/signup) use a consistent split-screen design:

**Layout:**
- Left side (50%): Feature showcase with gradient overlay
- Right side (50%): Authentication form centered in viewport
- Mobile: Stacks vertically with form only

**Color Palette:**
- Background: Gradient from gray-900 via gray-800 to gray-900
- Left panel overlay: Blue-600/20 to purple-600/20 gradient
- Card background: Gray-800/50 with backdrop blur
- Primary accents: Blue-500 to purple-600 gradients
- Success accents: Green-500 to blue-600 gradients

**Design Elements:**
- Glassmorphic cards with backdrop-blur-xl
- Rounded corners (rounded-lg, rounded-2xl)
- Subtle shadows (shadow-2xl)
- Gradient text for emphasis
- Decorative blur circles for depth

**Typography:**
- Headers: Bold, white text
- Subheaders: Gray-400
- Body text: Gray-300/400
- Interactive elements: Blue-400 hover:blue-300

**Interactive Components:**
- Buttons with gradient backgrounds
- Hover states with color transitions
- Loading states with spinners
- Form inputs with gray-700/50 backgrounds

Apply this theme consistently across all authentication-related pages and similar full-page experiences.

## Project Overview

**Blockchain Snapshot Service** - A production-grade Next.js application that provides bandwidth-managed blockchain snapshot hosting with tiered user access (free: 50 Mbps shared, premium: 250 Mbps shared). Uses MinIO for object storage and implements comprehensive monitoring, security, and user management.

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

# Docker Build and Deploy (IMPORTANT)
# Always use these flags for building Docker images:
docker buildx build --builder cloud-bryanlabs-builder --platform linux/amd64 -t ghcr.io/bryanlabs/snapshots:VERSION --push .
# This ensures the image is built for the correct platform (linux/amd64) using the cloud builder
# IMPORTANT: Always use semantic versioning (e.g., v1.3.0) - NEVER use "latest" tag
# Increment version numbers properly: v1.2.9 → v1.3.0 → v1.3.1
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
- NextAuth.js v5 with dual authentication:
  - Email/password (credentials provider)
  - Cosmos wallet (Keplr integration)
- SQLite database with Prisma ORM
- Sessions stored in JWT tokens
- 7-day session duration
- Middleware validates on protected routes

### Testing NextAuth Authentication with CSRF
When testing NextAuth authentication endpoints, you must obtain and use CSRF tokens:

```bash
# 1. Get CSRF token from the API
curl -s -c cookies.txt -L https://snapshots.bryanlabs.net/api/auth/csrf
# Response: {"csrfToken":"abc123..."}

# 2. Extract CSRF token from cookies (alternative method)
cat cookies.txt | grep csrf-token | awk -F'\t' '{print $7}' | cut -d'%' -f1 > csrf.txt

# 3. Use CSRF token in authentication request
curl -X POST https://snapshots.bryanlabs.net/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -b cookies.txt \
  -c cookies.txt \
  -L \
  -d "csrfToken=$(cat csrf.txt)&email=test@example.com&password=password123"
```

**Important**: NextAuth requires CSRF tokens for all authentication requests. The token is stored in the `__Host-authjs.csrf-token` cookie and must be included in the request body.

### Bandwidth Management
- Free tier: 50 Mbps shared among all free users (~6.25 MB/s)
- Premium tier: 250 Mbps shared among all premium users (~31.25 MB/s)
- Total cap: 500 Mbps
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

# Auth (NextAuth)
NEXTAUTH_SECRET=<generated>
NEXTAUTH_URL=https://snapshots.bryanlabs.net
DATABASE_URL=file:/app/prisma/dev.db

# Legacy Auth (for API compatibility)
PREMIUM_USERNAME=premium_user
PREMIUM_PASSWORD_HASH=<bcrypt-hash>
JWT_SECRET=<generated>

# Config
BANDWIDTH_FREE_TOTAL=50
BANDWIDTH_PREMIUM_TOTAL=250
AUTH_SESSION_DURATION=7d
DOWNLOAD_URL_EXPIRY=5m
```

### Database Initialization
The app uses SQLite with Prisma ORM. The database schema includes:
- Users (email/wallet auth)
- Teams with role-based access
- Tiers (free, premium, enterprise)
- Download tracking and analytics
- Snapshot requests and access control

**Important**: The database is initialized automatically via `scripts/init-db-proper.sh` which creates all required tables with correct column names and includes a test user (test@example.com / snapshot123).

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

1. **MinIO Storage** - All snapshot data comes from MinIO object storage
2. **BryanLabs Style** - Maintain professional design aesthetic
3. **Performance First** - Optimize for speed and reliability
4. **Security Critical** - Properly implement auth and access controls