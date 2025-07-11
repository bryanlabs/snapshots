# GitHub Issues for Snapshot Service Implementation

## Overview
This document contains detailed GitHub issues for implementing the blockchain snapshot service. Each issue includes acceptance criteria, testing requirements, and implementation guidance.

---

## Epic: Blockchain Snapshot Service
Create a production-grade snapshot hosting service with bandwidth management and user tiers.

### Issues List:

1. [Infrastructure] Deploy MinIO with TopoLVM Storage
2. [Infrastructure] Configure MinIO for Bandwidth Management  
3. [Backend] Create Next.js API Routes for Snapshot Management
4. [Backend] Implement Authentication System
5. [Backend] Create Pre-signed URL Generation with Security
6. [Frontend] Build Snapshot Browsing UI
7. [Frontend] Implement Login and User Management
8. [Frontend] Create Download Experience with Bandwidth Indicators
9. [DevOps] Set Up Monitoring and Metrics
10. [DevOps] Create CI/CD Pipeline
11. [Testing] Implement Comprehensive Test Suite
12. [Documentation] Create User and Operations Documentation

---

## Issue #1: Deploy MinIO with TopoLVM Storage

### Title
Deploy MinIO object storage with TopoLVM persistent volumes

### Description
Set up MinIO in the Kubernetes cluster using TopoLVM for storage. This will replace the nginx file server for hosting snapshot files.

### Acceptance Criteria
- [ ] MinIO deployed with 2+ replicas for HA
- [ ] TopoLVM PVC created with 5TB initial capacity
- [ ] MinIO accessible within cluster at `minio.apps.svc.cluster.local:9000`
- [ ] Prometheus metrics exposed on port 9000 at `/minio/v2/metrics/cluster`
- [ ] Health checks configured and passing
- [ ] Console accessible for debugging (port 9001)

### Implementation Details
1. Create namespace and RBAC if needed
2. Create PVC using TopoLVM storage class
3. Deploy MinIO using official container image
4. Configure environment variables for root credentials
5. Set up services for API and console access
6. Verify deployment with `mc` CLI tool

### Testing
- [ ] Verify MinIO pods are running: `kubectl get pods -n apps | grep minio`
- [ ] Check PVC is bound: `kubectl get pvc -n apps`
- [ ] Test object upload/download with mc CLI
- [ ] Verify metrics endpoint returns data
- [ ] Ensure pods restart correctly after deletion

### Files to Create/Modify
- `/cluster/apps/minio-snapshots/namespace.yaml`
- `/cluster/apps/minio-snapshots/pvc.yaml`
- `/cluster/apps/minio-snapshots/deployment.yaml`
- `/cluster/apps/minio-snapshots/service.yaml`
- `/cluster/apps/minio-snapshots/configmap.yaml`
- `/cluster/apps/minio-snapshots/secrets.yaml`
- `/cluster/apps/minio-snapshots/kustomization.yaml`

---

## Issue #2: Configure MinIO for Bandwidth Management

### Title  
Configure MinIO bandwidth limits and user policies

### Description
Set up MinIO with bandwidth management policies to enforce the 50MB/s free tier and 250MB/s premium tier limits.

### Acceptance Criteria
- [ ] Bucket "snapshots" created with public read access
- [ ] Bandwidth policies configured for tier-based limits
- [ ] Anonymous access limited to 50MB/s total
- [ ] Authenticated access limited to 250MB/s total  
- [ ] Total bandwidth never exceeds 500MB/s
- [ ] Policies persist across restarts

### Implementation Details
1. Create snapshots bucket using mc admin
2. Set up IAM policies for bandwidth tiers
3. Configure server-side bandwidth limits
4. Create service account for Next.js app
5. Test bandwidth limits with concurrent downloads

### Testing
- [ ] Download file anonymously and verify 50MB/s limit
- [ ] Download with premium credentials and verify 250MB/s limit
- [ ] Run 10 concurrent downloads and verify bandwidth sharing
- [ ] Confirm total bandwidth stays under 500MB/s
- [ ] Test policy persistence after pod restart

### Configuration Examples
```bash
# Create bucket
mc mb myminio/snapshots

# Set anonymous read policy
mc anonymous set download myminio/snapshots

# Configure bandwidth limits
mc admin config set myminio api \
  requests_max=500 \
  requests_deadline=1m
```

---

## Issue #3: Create Next.js API Routes for Snapshot Management

### Title
Implement Next.js API routes for listing and downloading snapshots

### Description  
Create the backend API routes in the Next.js application to list chains, browse snapshots, and generate download URLs.

### Acceptance Criteria
- [ ] GET `/api/v1/chains` returns list of all chains
- [ ] GET `/api/v1/chains/[chainId]` returns chain details
- [ ] GET `/api/v1/chains/[chainId]/snapshots` lists snapshots
- [ ] POST `/api/v1/chains/[chainId]/download` generates pre-signed URL
- [ ] All endpoints return proper HTTP status codes
- [ ] Error handling with user-friendly messages
- [ ] Response times under 200ms

### Implementation Details
1. Set up Next.js app with TypeScript
2. Create API route structure
3. Implement MinIO client connection
4. Add data fetching and transformation logic
5. Implement error handling middleware
6. Add request validation

### Testing
- [ ] Unit tests for each API endpoint
- [ ] Integration tests with MinIO
- [ ] Error case testing (404s, 500s)
- [ ] Performance testing for response times
- [ ] Validate response schemas

### Code Structure
```
app/api/v1/
├── chains/
│   ├── route.ts
│   └── [chainId]/
│       ├── route.ts
│       ├── snapshots/
│       │   └── route.ts
│       └── download/
│           └── route.ts
```

---

## Issue #4: Implement Authentication System

### Title
Build JWT-based authentication for premium tier access

### Description
Implement a simple authentication system with a single premium user account that provides access to higher bandwidth limits.

### Acceptance Criteria
- [ ] POST `/api/v1/auth/login` accepts username/password
- [ ] Successful login returns JWT token in httpOnly cookie
- [ ] JWT tokens expire after 7 days
- [ ] GET `/api/v1/auth/me` returns current user info
- [ ] POST `/api/v1/auth/logout` clears session
- [ ] Middleware validates tokens on protected routes
- [ ] Invalid tokens return 401 Unauthorized

### Implementation Details
1. Install bcryptjs for password hashing
2. Install jsonwebtoken for JWT handling  
3. Create auth utilities for token generation/validation
4. Implement login/logout endpoints
5. Create auth middleware
6. Store credentials in environment variables

### Testing
- [ ] Test successful login flow
- [ ] Test invalid credentials rejection
- [ ] Verify JWT token expiration
- [ ] Test middleware on protected routes
- [ ] Verify logout clears session
- [ ] Test concurrent sessions

### Security Considerations
- Use secure httpOnly cookies
- Implement CSRF protection
- Add rate limiting on login endpoint
- Log authentication attempts
- Use strong JWT secret

---

## Issue #5: Create Pre-signed URL Generation with Security

### Title
Implement secure pre-signed URL generation with IP restrictions

### Description
Create the download URL generation system that produces time-limited, IP-restricted URLs with bandwidth tier metadata.

### Acceptance Criteria  
- [ ] URLs expire after 5 minutes
- [ ] URLs restricted to requesting IP address
- [ ] User tier embedded in URL metadata
- [ ] Each URL has unique request ID
- [ ] Generation rate limited to 10/minute per user
- [ ] URLs work with download managers (wget, aria2)
- [ ] Proper CORS headers for browser downloads

### Implementation Details
1. Extract client IP from headers
2. Generate unique request ID for tracking
3. Add metadata to MinIO pre-signed URL
4. Implement rate limiting with memory store
5. Log all URL generation for analytics
6. Handle proxy headers correctly

### Testing  
- [ ] Verify URL expiration after 5 minutes
- [ ] Test IP restriction (different IP = 403)
- [ ] Confirm bandwidth tier in metadata
- [ ] Test rate limiting (11th request = 429)
- [ ] Verify with curl, wget, aria2
- [ ] Test through proxy/load balancer

### Security Testing
- Test URL sharing prevention
- Verify IP spoofing protection  
- Check for timing attacks
- Test rate limit bypass attempts

---

## Issue #6: Build Snapshot Browsing UI

### Title
Create the frontend UI for browsing blockchain snapshots

### Description
Build the Next.js frontend pages for listing chains and browsing available snapshots with a clean, responsive design.

### Acceptance Criteria
- [ ] Homepage lists all available chains
- [ ] Chain page shows all snapshots with metadata
- [ ] File sizes displayed in human-readable format
- [ ] Timestamps shown in local timezone
- [ ] Loading states for all data fetching
- [ ] Error states with retry options
- [ ] Responsive design for mobile/tablet/desktop
- [ ] Dark mode support

### Implementation Details
1. Create page components with TypeScript
2. Implement data fetching with SWR or React Query
3. Build reusable UI components
4. Add loading skeletons
5. Implement error boundaries
6. Style with Tailwind CSS

### Testing
- [ ] Visual regression tests
- [ ] Responsive design testing
- [ ] Loading state testing
- [ ] Error state testing
- [ ] Accessibility testing (WCAG 2.1 AA)
- [ ] Cross-browser testing

### UI Components
- ChainList
- SnapshotTable  
- FileSize formatter
- TimeAgo component
- LoadingSkeleton
- ErrorMessage

---

## Issue #7: Implement Login and User Management

### Title
Create login page and user session management UI

### Description
Build the authentication UI components including login page, user status indicator, and session management.

### Acceptance Criteria
- [ ] Login page with username/password form
- [ ] Form validation with error messages
- [ ] Loading state during authentication
- [ ] Success redirects to previous page
- [ ] User status shown in header
- [ ] Logout button when authenticated
- [ ] Session persists across page refreshes
- [ ] Auto-logout on token expiration

### Implementation Details
1. Create login page with form
2. Implement client-side validation
3. Add auth context provider
4. Build header with user status
5. Handle redirect after login
6. Implement remember me option

### Testing
- [ ] Test form validation
- [ ] Test successful login flow
- [ ] Test error handling
- [ ] Verify session persistence
- [ ] Test logout functionality
- [ ] Test expired token handling

### Security
- Prevent password visibility in dev tools
- Clear sensitive data on logout
- Implement CSRF protection
- Rate limit login attempts client-side

---

## Issue #8: Create Download Experience with Bandwidth Indicators

### Title  
Build download UI with bandwidth tier indicators

### Description
Create the download interface that shows users their bandwidth tier and provides a smooth download experience.

### Acceptance Criteria
- [ ] Download button shows file size
- [ ] Click shows bandwidth tier modal
- [ ] Free users see upgrade prompt
- [ ] Premium users see their benefits
- [ ] Download starts after confirmation
- [ ] Progress tracked by browser
- [ ] Error handling for failed downloads
- [ ] Resume support indicated

### Implementation Details
1. Create DownloadButton component
2. Build bandwidth info modal
3. Implement confirmation flow
4. Add analytics tracking
5. Handle download errors
6. Show post-download options

### Testing
- [ ] Test free user flow
- [ ] Test premium user flow
- [ ] Test download initiation
- [ ] Test error scenarios
- [ ] Verify analytics events
- [ ] Test upgrade prompts

### UX Considerations
- Clear bandwidth information
- Non-intrusive upgrade prompts
- Smooth transition to download
- Clear error messages
- Download manager compatibility

---

## Issue #9: Set Up Monitoring and Metrics

### Title
Configure Prometheus monitoring and Grafana dashboards

### Description  
Set up comprehensive monitoring for the snapshot service including bandwidth usage, API performance, and system health.

### Acceptance Criteria
- [ ] MinIO metrics scraped by Prometheus
- [ ] Next.js custom metrics exposed
- [ ] Bandwidth usage dashboard created
- [ ] API performance dashboard created
- [ ] Alerts configured for key metrics
- [ ] ServiceMonitor resources deployed
- [ ] Dashboards imported to Grafana

### Implementation Details
1. Create ServiceMonitor for MinIO
2. Add custom metrics to Next.js
3. Create bandwidth tracking metrics
4. Build Grafana dashboards
5. Configure alerting rules
6. Set up alert routing

### Testing
- [ ] Verify metrics are being collected
- [ ] Test dashboard data accuracy
- [ ] Trigger alerts and verify delivery
- [ ] Load test and observe metrics
- [ ] Verify metric retention

### Key Metrics
- Current bandwidth by tier
- Active downloads count
- API response times (p50, p95, p99)
- Storage usage and trends
- Error rates by endpoint

---

## Issue #10: Create CI/CD Pipeline

### Title
Set up automated testing and deployment pipeline

### Description
Create GitHub Actions workflow for testing, building, and deploying the snapshot service with GitOps.

### Acceptance Criteria
- [ ] Tests run on every PR
- [ ] Docker images built on merge to main
- [ ] Images pushed to ghcr.io
- [ ] Kubernetes manifests updated automatically
- [ ] Deployment triggered via GitOps
- [ ] Rollback capability implemented
- [ ] Build status badges added

### Implementation Details  
1. Create test workflow
2. Add Docker build steps
3. Implement semantic versioning
4. Update manifests with new image
5. Configure Flux/ArgoCD sync
6. Add deployment notifications

### Testing
- [ ] Test PR workflow
- [ ] Verify image building
- [ ] Test manifest updates
- [ ] Verify GitOps sync
- [ ] Test rollback procedure
- [ ] Verify notifications

### Workflow Structure
```yaml
- Test (lint, unit, integration)
- Build (Docker image)
- Push (to ghcr.io)
- Update (k8s manifests)
- Deploy (GitOps sync)
```

---

## Issue #11: Implement Comprehensive Test Suite

### Title
Create full test coverage for snapshot service

### Description
Implement unit tests, integration tests, and E2E tests to ensure reliability and catch regressions.

### Acceptance Criteria
- [ ] Unit tests for all API routes (>80% coverage)
- [ ] Integration tests for MinIO operations
- [ ] E2E tests for critical user flows  
- [ ] Load tests for bandwidth limits
- [ ] Security tests for auth system
- [ ] CI runs all tests on PR
- [ ] Test reports generated

### Implementation Details
1. Set up Jest for unit tests
2. Add Supertest for API testing
3. Configure Playwright for E2E
4. Implement k6 for load testing
5. Add security test suite
6. Create test data fixtures

### Testing
- [ ] Run full test suite locally
- [ ] Verify CI test execution
- [ ] Check coverage reports
- [ ] Run load tests
- [ ] Execute security tests
- [ ] Test in multiple browsers

### Test Categories
- Unit: Components, utilities, API logic
- Integration: MinIO, auth, database
- E2E: User flows, download process
- Performance: Load, bandwidth limits
- Security: Auth, URL generation

---

## Issue #12: Create User and Operations Documentation

### Title
Write comprehensive documentation for users and operators

### Description
Create documentation covering user guides, API reference, operations runbooks, and troubleshooting guides.

### Acceptance Criteria
- [ ] User guide for downloading snapshots
- [ ] API reference with examples
- [ ] Operations runbook for maintenance
- [ ] Troubleshooting guide with solutions
- [ ] Architecture diagrams included
- [ ] README.md updated
- [ ] Documentation deployed to site

### Implementation Details
1. Write user-facing guides
2. Document API with examples
3. Create operations procedures
4. Add architecture diagrams
5. Include configuration reference
6. Set up documentation site

### Testing
- [ ] Technical review by team
- [ ] User testing of guides
- [ ] Verify all links work
- [ ] Test code examples
- [ ] Check for completeness
- [ ] Accessibility check

### Documentation Structure
```
docs/
├── user-guide/
│   ├── getting-started.md
│   ├── downloading-snapshots.md
│   └── premium-features.md
├── api-reference/
│   ├── authentication.md
│   └── endpoints.md
├── operations/
│   ├── deployment.md
│   ├── monitoring.md
│   └── troubleshooting.md
└── architecture/
    └── overview.md
```

---

## Implementation Order

### Phase 1: Infrastructure (Week 1)
1. Issue #1: Deploy MinIO
2. Issue #2: Configure MinIO

### Phase 2: Backend (Week 2)  
3. Issue #3: API Routes
4. Issue #4: Authentication
5. Issue #5: URL Generation

### Phase 3: Frontend (Week 3)
6. Issue #6: Browsing UI
7. Issue #7: Login UI
8. Issue #8: Download UX

### Phase 4: Operations (Week 4)
9. Issue #9: Monitoring
10. Issue #10: CI/CD
11. Issue #11: Testing
12. Issue #12: Documentation

---

## Notes for Implementation

1. Each issue should be created as a separate GitHub issue
2. Add appropriate labels: `enhancement`, `infrastructure`, `frontend`, `backend`, `devops`
3. Assign to milestone: "Snapshot Service v1.0"
4. Link dependencies between issues
5. Create a project board to track progress
6. Regular progress updates in issue comments
7. PR should reference issue number

## Success Metrics

- All issues completed within 4 weeks
- Zero critical bugs in production
- API response time <200ms p95
- 99.9% uptime in first month
- Bandwidth limits accurate to ±5%
- User satisfaction >90%