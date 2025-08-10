# Baseline Test Summary

## Date: July 30, 2025

### API Test Results (bash script)

#### Working Endpoints ✅
- GET /api/v1/chains - Returns list of chains with metadata
- GET /api/v1/chains/[chainId]/info - Returns chain info
- GET /api/v1/chains/[chainId]/snapshots - Returns snapshot list
- GET /api/v1/chains/[chainId]/snapshots/latest - Returns latest snapshot with download URL
- GET /api/auth/providers - Returns auth providers (credentials, wallet)
- GET /api/auth/csrf - Returns CSRF token
- GET /api/auth/session - Returns null for unauthenticated
- GET /api/health - Returns healthy status
- GET /api/bandwidth/status - Returns bandwidth info
- GET /api/v1/downloads/status - Returns download status

#### Issues Found ❌
1. **GET /api/v1/chains/[chainId]** - Returns 404 (endpoint may not exist)
2. **POST /api/v1/chains/[chainId]/download** - Returns 400 "Required" (validation issue)
3. **Legacy JWT auth** - Not configured/working
4. **GET /api/account/avatar** - Returns 405 Method Not Allowed
5. **Admin endpoints** - Return 401 as expected (no admin auth)

### Key Observations

1. **API Response Formats**:
   - Most endpoints use `{ success: true/false, data: {...} }` format
   - Some endpoints don't follow this pattern (e.g., bandwidth/status)
   - Error responses vary in structure

2. **Authentication**:
   - NextAuth is configured with credentials and wallet providers
   - Legacy JWT auth appears to be disabled or not configured
   - CSRF protection is active

3. **Data Status**:
   - Only noble-1 chain has snapshots (1 snapshot)
   - Other chains have 0 snapshots
   - Snapshot format: `noble-1-20250730-022059.tar.zst`

4. **Missing/Issues**:
   - Download endpoint requires proper request body validation
   - Some expected endpoints don't exist or return unexpected status codes
   - Jest tests need environment setup (fetch polyfill)

### Baseline Metrics
- Health check: Working ✅
- Database: Connected ✅
- Minio: Connected ✅
- Active connections: 0
- Rate limiting: Not triggered in tests

### Next Steps Before Improvements
1. Fix Jest test environment (add fetch polyfill)
2. Document which endpoints are intentionally missing vs broken
3. Clarify expected behavior for download endpoint validation
4. Set up proper test data for comprehensive testing

This baseline will be used to ensure no regressions during implementation of improvements.