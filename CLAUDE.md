# CLAUDE.md - Snapshots Service

This file provides guidance to Claude Code when working with the Blockchain Snapshots Service codebase.

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

**Production Blockchain Snapshot Service** - A Next.js 15 application providing bandwidth-managed blockchain snapshot hosting with tiered user access (free: 50 Mbps, premium: 250 Mbps). Uses nginx for file storage, NextAuth for authentication, and integrates with the snapshot-processor for automated snapshot creation and management.

## Current State (July 2025)

- **Branch**: `feat_realsnaps` - Production-ready implementation
- **Status**: Fully migrated to production with authentication, user management, and tiered access
- **Recent Changes**: 
  - Complete NextAuth v5 integration with database support
  - Nginx storage backend with LZ4 compression
  - Comprehensive test infrastructure
  - API documentation moved to `/docs/`

## Key Architecture

1. **Next.js 15** - Full-stack application with App Router for both UI and API
2. **Nginx Storage** - Static file server with secure_link module for protected downloads
3. **NextAuth.js v5** - Comprehensive auth system supporting email/password and wallet authentication
4. **SQLite + Prisma** - User management and session storage
5. **Redis** - Session caching, rate limiting, and URL tracking
6. **Prometheus/Grafana** - Monitoring and observability

## Nginx Storage Architecture & URL Signing

### How Nginx Hosts Snapshots
Nginx serves as the primary storage backend for all blockchain snapshots:
- **Endpoint**: Internal service at `nginx:32708` in Kubernetes
- **External URL**: `https://snapshots.bryanlabs.net`
- **Storage Path**: `/snapshots/[chain-id]/`
- **Autoindex**: JSON format for directory listings
- **Secure Links**: MD5-based secure_link module for time-limited URLs

The nginx server has direct access to a shared PVC where the snapshot-processor uploads compressed snapshots. When users download, they connect directly to nginx, bypassing the Next.js app for optimal performance.

### Anatomy of a Secure Download URL
```
https://snapshots.bryanlabs.net/snapshots/noble-1/noble-1-20250722.tar.lz4?md5=abc123&expires=1234567890&tier=free
```

**Components:**
- **Base URL**: `https://snapshots.bryanlabs.net/snapshots/`
- **Chain Path**: `noble-1/`
- **Filename**: `noble-1-20250722.tar.lz4`
- **MD5 Hash**: `md5=abc123` - Hash of secret + expires + uri + IP + tier
- **Expiration**: `expires=1234567890` - Unix timestamp (5 minutes from generation)
- **Tier**: `tier=free` or `tier=premium` - Embedded bandwidth tier

### URL Signing Process
1. **Client requests download** via API endpoint
2. **Server generates secure link**:
   ```typescript
   const expires = Math.floor(Date.now() / 1000) + 300; // 5 minutes
   const string = `${expires}${uri}${clientIP}${tier} ${secret}`;
   const md5 = crypto.createHash('md5').update(string).digest('base64url');
   ```
3. **Nginx validates** on request:
   - Checks MD5 hash matches
   - Verifies not expired
   - Applies bandwidth limit based on tier parameter

### Redis URL Tracking
Redis prevents URL reuse and tracks active downloads:
- **Key Format**: `download:${userId}:${filename}`
- **TTL**: Set to URL expiration time
- **Purpose**: 
  - Prevents sharing URLs between users
  - Tracks concurrent downloads
  - Enforces daily download limits
  - Monitors bandwidth usage per tier

### Bandwidth Tiers in URLs
The `tier` parameter in the URL controls nginx bandwidth limiting:
```nginx
map $arg_tier $limit_rate {
    default      50m;  # 50MB/s for free tier
    "free"       50m;
    "premium"    250m; # 250MB/s for premium tier
}
```

## Project Structure

```
app/
├── api/                        # API routes
│   ├── account/               # Account management
│   ├── admin/                 # Admin endpoints
│   ├── auth/                  # NextAuth endpoints
│   ├── bandwidth/             # Bandwidth status
│   ├── cron/                  # Scheduled tasks
│   ├── metrics/               # Prometheus metrics
│   ├── v1/                    # Public API v1
│   │   ├── auth/             # Legacy JWT auth
│   │   ├── chains/           # Chain management
│   │   └── downloads/        # Download tracking
│   └── health/               # Health check
├── (auth)/                   # Auth pages layout group
│   ├── signin/              # Sign in page
│   └── signup/              # Sign up page
├── (public)/                # Public pages layout group
│   └── chains/              # Chain browsing
├── account/                 # User account pages
├── layout.tsx              # Root layout with providers
└── page.tsx               # Homepage

lib/
├── auth/                    # Authentication logic
│   ├── session.ts          # Session management
│   ├── jwt.ts              # JWT utilities
│   └── middleware.ts       # Auth middleware
├── nginx/                  # Nginx integration
│   ├── client.ts          # Nginx client for autoindex
│   └── operations.ts      # Snapshot operations
├── bandwidth/             # Bandwidth management
│   ├── manager.ts        # Dynamic bandwidth calculation
│   └── tracker.ts        # Download tracking
├── prisma.ts             # Database client
├── config/               # Configuration
└── types/               # TypeScript types

components/
├── auth/                 # Auth components
├── account/             # Account components
├── chains/              # Chain browsing components
├── snapshots/          # Snapshot UI components
│   ├── SnapshotList.tsx
│   ├── SnapshotItem.tsx
│   └── DownloadButton.tsx
├── common/             # Shared components
└── ui/                # Base UI components

prisma/
├── schema.prisma       # Database schema
├── migrations/         # Database migrations
└── seed.ts            # Seed data
```

## Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests with Playwright
npm run test:coverage # Generate coverage report

# Database Management
npx prisma migrate dev    # Run migrations
npx prisma studio        # Open database GUI
npx prisma generate      # Generate Prisma client
./scripts/init-db-proper.sh  # Initialize database with test data

# Docker Build and Deploy (IMPORTANT)
# Always use these flags for building Docker images:
docker buildx build --builder cloud-bryanlabs-builder --platform linux/amd64 -t ghcr.io/bryanlabs/snapshots:VERSION --push .
# This ensures the image is built for the correct platform (linux/amd64) using the cloud builder
# IMPORTANT: Always use semantic versioning (e.g., v1.5.0) - NEVER use "latest" tag
# Increment version numbers properly: v1.4.9 → v1.5.0 → v1.5.1
```

## Key Features

1. **Tiered Bandwidth**: Free (50 Mbps) and Premium (250 Mbps) tiers
2. **Authentication**: Email/password and Cosmos wallet support
3. **Download Tracking**: Real-time bandwidth monitoring
4. **Secure Downloads**: Pre-signed URLs with nginx secure_link
5. **API Access**: Full REST API with OpenAPI documentation
6. **Admin Dashboard**: User management and system statistics

## API Routes Overview

### Public API (v1)
- `GET /api/v1/chains` - List all chains with metadata
- `GET /api/v1/chains/[chainId]` - Get specific chain info
- `GET /api/v1/chains/[chainId]/snapshots` - List snapshots (with compression type)
- `GET /api/v1/chains/[chainId]/snapshots/latest` - Get latest snapshot
- `POST /api/v1/chains/[chainId]/download` - Generate secure download URL
- `POST /api/v1/auth/login` - Legacy JWT authentication
- `POST /api/v1/auth/wallet` - Wallet-based authentication
- `GET /api/v1/downloads/status` - Check download status

### NextAuth API
- `GET /api/auth/providers` - List auth providers
- `POST /api/auth/signin` - Sign in endpoint
- `GET /api/auth/signout` - Sign out endpoint
- `GET /api/auth/session` - Get current session
- `POST /api/auth/register` - Register new account
- `GET /api/auth/csrf` - Get CSRF token

### Account Management
- `GET /api/account/avatar` - Get user avatar
- `POST /api/account/link-email` - Link email to wallet account

### Admin API
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/downloads` - Download analytics

### System API
- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - Prometheus metrics
- `GET /api/bandwidth/status` - Current bandwidth usage
- `POST /api/cron/reset-bandwidth` - Reset daily limits (cron)

## Programmatic API Access

### Requesting Download URLs as Free User
```bash
# 1. List available snapshots for a chain
curl https://snapshots.bryanlabs.net/api/v1/chains/noble-1/snapshots

# 2. Request download URL for specific snapshot (no auth required)
curl -X POST https://snapshots.bryanlabs.net/api/v1/chains/noble-1/download \
  -H "Content-Type: application/json" \
  -d '{"filename": "noble-1-20250722-175949.tar.lz4"}'

# Response:
{
  "success": true,
  "data": {
    "url": "https://snapshots.bryanlabs.net/snapshots/noble-1/noble-1-20250722-175949.tar.lz4?md5=abc123&expires=1234567890&tier=free",
    "expires": "2025-07-22T19:00:00Z",
    "size": 7069740384,
    "tier": "free"
  }
}

# 3. Download the file (50 Mbps limit)
curl -O "[generated-url]"
```

### Requesting Download URLs as Premium User

#### Option 1: Legacy JWT Authentication
```bash
# 1. Login with credentials to get JWT token
curl -X POST https://snapshots.bryanlabs.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "premium_user", "password": "your_password"}'

# Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {"username": "premium_user", "tier": "premium"}
  }
}

# 2. Request download URL with JWT token
curl -X POST https://snapshots.bryanlabs.net/api/v1/chains/noble-1/download \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"filename": "noble-1-20250722-175949.tar.lz4"}'

# Response includes tier=premium URL with 250 Mbps limit
```

#### Option 2: Wallet Authentication
```bash
# 1. Sign message with Keplr wallet and authenticate
curl -X POST https://snapshots.bryanlabs.net/api/v1/auth/wallet \
  -H "Content-Type: application/json" \
  -d '{
    "address": "cosmos1...",
    "pubkey": "...",
    "signature": "...",
    "message": "Sign this message to authenticate with Snapshots Service"
  }'

# 2. Use returned JWT token for download requests
```

#### Option 3: NextAuth Session (Web Browser)
```bash
# 1. Get CSRF token
CSRF=$(curl -s -c cookies.txt https://snapshots.bryanlabs.net/api/auth/csrf | jq -r .csrfToken)

# 2. Sign in with email/password
curl -X POST https://snapshots.bryanlabs.net/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -b cookies.txt \
  -c cookies.txt \
  -L \
  -d "csrfToken=$CSRF&email=premium@example.com&password=password123"

# 3. Request download URL with session cookie
curl -X POST https://snapshots.bryanlabs.net/api/v1/chains/noble-1/download \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"filename": "noble-1-20250722-175949.tar.lz4"}'
```

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

## Environment Variables

```bash
# Nginx Storage
NGINX_ENDPOINT=nginx
NGINX_PORT=32708
NGINX_USE_SSL=false
NGINX_EXTERNAL_URL=https://snapshots.bryanlabs.net
SECURE_LINK_SECRET=<secret-for-secure-links>

# Auth (NextAuth)
NEXTAUTH_SECRET=<generated>
NEXTAUTH_URL=https://snapshots.bryanlabs.net
DATABASE_URL=file:/app/prisma/dev.db

# Legacy Auth (for API compatibility)
PREMIUM_USERNAME=premium_user
PREMIUM_PASSWORD_HASH=<bcrypt-hash>
JWT_SECRET=<generated>

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Config
BANDWIDTH_FREE_TOTAL=50
BANDWIDTH_PREMIUM_TOTAL=250
DAILY_DOWNLOAD_LIMIT=10
NODE_ENV=production
```

## API Response Format
```typescript
// Success response
{
  data: any,
  success: true
}

// Error response
{
  error: string,
  success: false,
  message?: string  // Optional detailed message
}
```

## Database Schema
The app uses SQLite with Prisma ORM. Key tables:
- **User**: Authentication and profile data
- **Account**: OAuth/wallet account links
- **Session**: Active user sessions
- **Download**: Download history and tracking
- **Team**: Multi-user organizations (future)

**Important**: Database initialized via `scripts/init-db-proper.sh` with test user (test@example.com / snapshot123).

## Common Tasks

### Adding a New Chain
1. Update `config/chains.ts` with chain metadata
2. Add logo to `public/chains/[chain-id].png`
3. Ensure snapshot-processor is configured for the chain

### Updating Bandwidth Limits
1. Update environment variables
2. Update nginx ConfigMap in Kubernetes
3. Restart nginx pods

### Database Schema Changes
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Update relevant API endpoints

## Integration with Snapshot Processor

The webapp expects snapshots in the nginx storage with this structure:
```
/snapshots/
├── [chain-id]/
│   ├── [chain-id]-[height].tar.zst
│   ├── [chain-id]-[height].tar.lz4
│   └── latest.json
```

The `latest.json` file should contain:
```json
{
  "chain_id": "noble-1",
  "height": 20250722,
  "size": 7069740384,
  "created_at": "2025-07-22T17:59:49Z",
  "filename": "noble-1-20250722.tar.lz4",
  "compression": "lz4"
}
```

## Security Considerations

1. **Authentication**: Always use NextAuth session for user identification
2. **Download URLs**: Pre-signed with expiration and tier metadata
3. **Rate Limiting**: Implemented at nginx level
4. **Input Validation**: Use Zod schemas for all API inputs
5. **Database Queries**: Use Prisma ORM to prevent SQL injection

## Monitoring

- Health endpoint: `/api/health`
- Metrics endpoint: `/api/metrics` (Prometheus format)
- Bandwidth status: `/api/bandwidth/status`
- Admin stats: `/api/admin/stats` (requires admin role)

## Deployment

Production deployment uses Kubernetes:
```bash
# Build and push image
docker buildx build --platform linux/amd64 -t ghcr.io/bryanlabs/snapshots:latest .
docker push ghcr.io/bryanlabs/snapshots:latest

# Deploy to Kubernetes
kubectl apply -f deploy/k8s/
```

## Troubleshooting

1. **Download Issues**: Check nginx logs and secure_link configuration
2. **Auth Problems**: Verify NEXTAUTH_SECRET and database connection
3. **Performance**: Monitor Redis connection and nginx worker limits
4. **Storage**: Ensure nginx PVC has sufficient space

## Design System

### UI Theme
- Dark theme with gray-900 backgrounds
- Blue-500 to purple-600 gradient accents
- Glassmorphic cards with backdrop blur
- Consistent spacing and rounded corners

### Component Library
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- Custom components in `components/ui/`
- Consistent loading and error states

## Common Development Tasks

### Adding a New Chain
1. Snapshot processor creates files in nginx storage
2. Files follow naming: `[chain-id]-[timestamp].tar.[compression]`
3. Web app automatically discovers via nginx autoindex

### Testing Download URLs
```bash
# Generate download URL
curl -X POST http://localhost:3000/api/v1/chains/noble-1/download \
  -H "Content-Type: application/json" \
  -d '{"filename": "noble-1-20250722-174634.tar.zst"}'

# Test download with bandwidth limit
curl -O "[generated-url]"
```

### Debugging Nginx Connection
```bash
# Check nginx autoindex
curl http://nginx:32708/snapshots/noble-1/

# Test secure link generation
node -e "console.log(require('./lib/nginx/client').generateSecureLink('/noble-1/snapshot.tar.zst'))"
```

## Deployment Notes

### Kubernetes Deployment
- Deployed in `fullnodes` namespace
- Uses Kustomize for configuration management
- Manifests in: `bare-metal/cluster/chains/cosmos/fullnode/snapshot-service/webapp/`
- PVC for SQLite database persistence
- ConfigMap for non-sensitive config
- Secrets for sensitive values

### Required Resources
- **CPU**: 200m request, 1000m limit
- **Memory**: 512Mi request, 1Gi limit
- **Storage**: 10Gi PVC for database
- **Replicas**: 1 (SQLite limitation)

### Integration Points
1. **Nginx Storage**: Mounted at `/snapshots` in processor
2. **Redis**: For session storage and rate limiting
3. **Snapshot Processor**: Creates and uploads snapshots
4. **Prometheus**: Scrapes `/api/metrics`
5. **Grafana**: Visualizes metrics

## Development Guidelines

### API Development
- Use Next.js Route Handlers (App Router)
- Implement proper error handling with try/catch
- Return consistent response formats
- Add zod validation for request bodies
- Keep response times <200ms
- Use proper HTTP status codes

### Frontend Development
- Use TypeScript for all components
- Implement loading and error states
- Make components responsive-first
- Follow accessibility standards (WCAG)
- Use Tailwind CSS utility classes
- Implement proper SEO with metadata

### Testing Requirements
- Unit tests for all API routes
- Component tests with React Testing Library
- Integration tests for auth flows
- E2E tests for critical user journeys
- Maintain >80% code coverage

## Security Features
- NextAuth.js authentication with CSRF protection
- Secure download URLs with expiration
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection protection via Prisma
- XSS protection via React

## Monitoring
- Prometheus metrics at `/api/metrics`
- Health endpoint at `/api/health`
- Download analytics tracking
- Error rate monitoring
- Bandwidth usage metrics

## Important Notes

1. **Compression Support** - Must handle both .tar.zst and .tar.lz4 files
2. **Performance First** - Optimize for fast page loads and downloads
3. **Security Critical** - Properly implement auth and access controls
4. **User Experience** - Maintain clean, professional design
5. **Database Limits** - SQLite limits to single replica deployment
6. **Docker Versioning** - NEVER use "latest" tag, always semantic versioning

Always run `npm run lint` and `npm run typecheck` before committing changes.