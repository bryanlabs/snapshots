# Snapshots Service API Test Plan

## Overview
This test plan covers all API endpoints and authentication flows for the snapshots service.

## Test Environment
- Base URL: `https://snapshots.bryanlabs.net`
- API Base: `https://snapshots.bryanlabs.net/api/v1`

## 1. Authentication Tests

### 1.1 Email/Password Login
```bash
# Test valid login
curl -X POST https://snapshots.bryanlabs.net/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword"}'

# Expected: Set-Cookie header with session token
```

### 1.2 Wallet (Keplr) Login
```bash
# Test wallet authentication
curl -X POST https://snapshots.bryanlabs.net/api/v1/auth/wallet \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "cosmos1...", 
    "signature": "...", 
    "message": "Sign in to Snapshots..."
  }'

# Expected: 200 OK with success: true
```

### 1.3 Session Check
```bash
# Test current session
curl https://snapshots.bryanlabs.net/api/auth/session \
  -H "Cookie: [session-cookie]"

# Expected: User session data with tier info
```

### 1.4 Logout
```bash
# Test logout
curl -X POST https://snapshots.bryanlabs.net/api/auth/signout \
  -H "Cookie: [session-cookie]"

# Expected: Clear session cookie
```

## 2. Public API Tests (No Auth Required)

### 2.1 List All Chains
```bash
curl https://snapshots.bryanlabs.net/api/v1/chains

# Expected: 
{
  "data": [
    {
      "chain_id": "cosmoshub-4",
      "name": "Cosmos Hub",
      "snapshot_count": 5,
      "latest_snapshot": {...}
    },
    ...
  ]
}
```

### 2.2 Get Chain Details
```bash
curl https://snapshots.bryanlabs.net/api/v1/chains/cosmoshub-4

# Expected:
{
  "data": {
    "chain_id": "cosmoshub-4",
    "name": "Cosmos Hub",
    "snapshots": [...]
  }
}
```

### 2.3 List Chain Snapshots
```bash
curl https://snapshots.bryanlabs.net/api/v1/chains/cosmoshub-4/snapshots

# Expected:
{
  "data": [
    {
      "id": "...",
      "fileName": "cosmoshub-4-20240315.tar.lz4",
      "blockHeight": "19500000",
      "size": "150GB",
      "timestamp": "2024-03-15T00:00:00Z"
    }
  ]
}
```

### 2.4 Health Check
```bash
curl https://snapshots.bryanlabs.net/api/v1/health

# Expected:
{
  "status": "healthy",
  "timestamp": "2024-03-15T12:00:00Z"
}
```

## 3. Protected API Tests (Auth Required)

### 3.1 Generate Download URL (Free Tier)
```bash
# First create a free user account or use wallet login
# Then test download URL generation
curl https://snapshots.bryanlabs.net/api/v1/chains/cosmoshub-4/snapshots/[snapshot-id]/download \
  -H "Cookie: [session-cookie]"

# Expected:
{
  "data": {
    "url": "https://snaps.bryanlabs.net/snapshots/cosmoshub-4/file.tar.lz4?md5=...&expires=...",
    "expires_at": "2024-03-15T12:30:00Z",
    "tier": "free",
    "bandwidth_limit": "50 Mbps"
  }
}
```

### 3.2 Get User Dashboard Data
```bash
curl https://snapshots.bryanlabs.net/api/v1/user/dashboard \
  -H "Cookie: [session-cookie]"

# Expected:
{
  "data": {
    "user": {
      "email": "test@example.com",
      "tier": "free",
      "creditBalance": 0
    },
    "stats": {
      "downloads_completed": 5,
      "downloads_active": 0,
      "downloads_queued": 0
    },
    "limits": {
      "daily_gb": 10,
      "monthly_gb": 100,
      "bandwidth_mbps": 50
    }
  }
}
```

## 4. Database Verification

### 4.1 Check User Creation
```sql
-- Connect to SQLite database
sqlite3 prisma/dev.db

-- Check users table
SELECT id, email, walletAddress, personalTierId FROM users;

-- Check tiers
SELECT * FROM tiers;

-- Check system config
SELECT * FROM system_config;
```

## 5. Integration Tests

### 5.1 Full Download Flow
1. Sign in (email or wallet)
2. Browse chains
3. Select snapshot
4. Generate download URL
5. Verify URL works with nginx
6. Check bandwidth limiting

### 5.2 Tier Verification
1. Create free user -> verify 50 Mbps limit
2. Create premium user -> verify 250 Mbps limit
3. Test concurrent downloads

## 6. Error Handling Tests

### 6.1 Invalid Authentication
```bash
# Wrong password
curl -X POST https://snapshots.bryanlabs.net/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'

# Expected: 401 or error message
```

### 6.2 Unauthorized Access
```bash
# Try to generate download URL without auth
curl https://snapshots.bryanlabs.net/api/v1/chains/cosmoshub-4/snapshots/123/download

# Expected: 401 Unauthorized
```

### 6.3 Invalid Chain/Snapshot
```bash
curl https://snapshots.bryanlabs.net/api/v1/chains/invalid-chain

# Expected: 404 Not Found
```

## 7. Performance Tests

### 7.1 API Response Times
- All endpoints should respond < 200ms
- Database queries should be < 50ms
- Session validation should be < 10ms

### 7.2 Concurrent Users
- Test with 10 concurrent free users
- Test with 5 concurrent premium users
- Verify bandwidth allocation

## Test Execution Order

1. **Setup**: Ensure database is seeded with tiers
2. **Public APIs**: Test all public endpoints first
3. **Auth Flow**: Test login/logout for both methods
4. **Protected APIs**: Test with valid sessions
5. **Error Cases**: Test all error scenarios
6. **Integration**: Full user flows
7. **Performance**: Load and response time tests

## Success Criteria

- [ ] All public APIs return expected data
- [ ] Email/password login works
- [ ] Wallet login works with Keplr
- [ ] Sessions persist across requests
- [ ] Protected endpoints require auth
- [ ] Download URLs are generated correctly
- [ ] Bandwidth limits are enforced
- [ ] Error responses are consistent
- [ ] Performance meets targets