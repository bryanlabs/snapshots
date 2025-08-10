# API Testing Baseline Documentation

This document summarizes the API testing baseline we've created for the Snapshots Service. Use these resources to ensure no functionality is broken during the improvement implementation.

## Created Documentation

### 1. **API-DOCUMENTATION.md**
Comprehensive documentation of all API endpoints including:
- Complete endpoint list with methods and parameters
- Request/response examples for every endpoint
- Authentication requirements
- Error codes and response formats
- Rate limiting information
- Testing checklist

### 2. **test-all-apis.sh**
Bash script for quick API testing:
- Tests all public endpoints
- Validates authentication flows
- Checks error handling
- Verifies response formats
- Can be run before and after changes

Usage:
```bash
# Run locally
./scripts/test-all-apis.sh

# Run against production
BASE_URL=https://snapshots.bryanlabs.net ./scripts/test-all-apis.sh
```

### 3. **comprehensive-api.test.ts**
Jest test suite with TypeScript for thorough testing:
- Type-safe API testing
- Response validation
- Performance benchmarks
- Error scenario coverage
- Premium feature testing

Usage:
```bash
# Run API tests
npm test -- __tests__/api/comprehensive-api.test.ts

# Run with coverage
npm run test:coverage -- __tests__/api/comprehensive-api.test.ts
```

### 4. **snapshots-api.postman_collection.json**
Postman collection for manual testing:
- All endpoints organized by category
- Variable management for tokens
- Pre-request scripts for auth
- Test scripts for validation
- Error testing scenarios

Import into Postman:
1. Open Postman
2. Import > Upload Files
3. Select `docs/snapshots-api.postman_collection.json`
4. Set environment variables as needed

## Key API Categories to Test

### Public APIs (No Auth Required)
- Chain listing and details
- Snapshot listing and filtering
- Download URL generation (free tier)
- Health and status checks

### Authenticated APIs
- Legacy JWT authentication
- NextAuth session management
- Premium download URLs
- User profile management

### Admin APIs
- System statistics
- Download analytics
- User management

### System APIs
- Health checks
- Prometheus metrics
- Bandwidth monitoring
- CRON endpoints

## Testing Strategy

### Before Making Changes
1. Run `./scripts/test-all-apis.sh` and save output
2. Run Jest tests: `npm test -- __tests__/api/comprehensive-api.test.ts`
3. Import Postman collection and run full collection
4. Document any existing failures

### After Each Major Change
1. Re-run all tests
2. Compare results with baseline
3. Fix any regressions immediately
4. Update tests if API behavior intentionally changed

### Before Deployment
1. Full test suite must pass
2. Performance benchmarks met (<200ms response times)
3. All authentication flows working
4. Error handling verified
5. Rate limiting functional

## Critical APIs to Monitor

These endpoints are most critical and should be tested thoroughly:

1. **POST /api/v1/chains/[chainId]/download**
   - Core functionality for downloads
   - Must handle both free and premium tiers
   - Secure URL generation critical

2. **GET /api/v1/chains/[chainId]/snapshots**
   - Main data listing endpoint
   - Performance critical
   - Filtering must work correctly

3. **Authentication Endpoints**
   - Both legacy and NextAuth must work
   - Session management critical
   - Token expiration handling

4. **GET /api/health**
   - Monitoring depends on this
   - Must reflect actual system state

## Expected Behaviors

### Download URLs
- Expire after 5 minutes
- Include correct tier parameter
- Use secure_link format
- Different bandwidth limits by tier

### Authentication
- JWT tokens valid for 24 hours
- NextAuth sessions persist
- CSRF protection on auth endpoints
- Proper role enforcement

### Rate Limiting
- 100 req/min for public endpoints
- 200 req/min for authenticated
- 10 req/min for download endpoints

### Response Times
- All endpoints < 200ms
- Snapshot listing < 100ms
- Health check < 50ms

## Next Steps

1. Run baseline tests now before any changes
2. Keep test results for comparison
3. Update tests when adding new features
4. Document any API changes
5. Ensure backward compatibility

Remember: These tests are your safety net. Run them frequently during development!