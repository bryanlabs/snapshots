# Snapshots Service API Documentation

This document provides comprehensive documentation for all API endpoints in the Snapshots Service. This serves as a baseline for testing and validation after implementing improvements.

## Table of Contents
- [Authentication](#authentication)
- [Public API (v1)](#public-api-v1)
- [NextAuth API](#nextauth-api)
- [Account Management API](#account-management-api)
- [Admin API](#admin-api)
- [System API](#system-api)
- [Response Formats](#response-formats)
- [Error Codes](#error-codes)

## Authentication

The API supports multiple authentication methods:

1. **No Authentication** - For public endpoints (free tier)
2. **JWT Bearer Token** - Legacy authentication for API v1
3. **NextAuth Session** - Cookie-based authentication for web users
4. **Wallet Authentication** - Cosmos wallet signature-based auth

## Public API (v1)

### GET /api/v1/chains
List all available blockchain chains with metadata.

**Authentication:** None required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "noble-1",
      "name": "Noble",
      "network": "mainnet",
      "type": "cosmos",
      "description": "Native asset issuance chain for the Cosmos ecosystem",
      "latestSnapshot": {
        "height": 20250722,
        "size": 7069740384,
        "fileName": "noble-1-20250722-175949.tar.lz4",
        "createdAt": "2025-07-22T17:59:49Z"
      },
      "status": "active",
      "supportedTypes": ["default", "pruned", "archive"],
      "updateFrequency": "daily",
      "avgSnapshotSize": 7000000000
    }
  ]
}
```

### GET /api/v1/chains/[chainId]
Get details for a specific chain.

**Authentication:** None required

**Parameters:**
- `chainId` (path) - The chain ID (e.g., "noble-1")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "noble-1",
    "name": "Noble",
    "network": "mainnet",
    "type": "cosmos",
    "description": "Native asset issuance chain for the Cosmos ecosystem",
    "latestSnapshot": { /* snapshot details */ },
    "status": "active"
  }
}
```

### GET /api/v1/chains/[chainId]/info
Get extended information for a chain including configuration details.

**Authentication:** None required

**Parameters:**
- `chainId` (path) - The chain ID

**Response:**
```json
{
  "success": true,
  "data": {
    "chainId": "noble-1",
    "name": "Noble",
    "binaryName": "nobled",
    "configUrl": "https://github.com/noble-assets/networks/tree/main/mainnet/noble-1",
    "seedNodes": ["seed1@host:26656"],
    "persistentPeers": ["peer1@host:26656"],
    "minimumGasPrice": "0.01uusdc",
    "recommendedPruning": "custom",
    "pruningSettings": {
      "keepRecent": "100",
      "keepEvery": "0",
      "interval": "10"
    }
  }
}
```

### GET /api/v1/chains/[chainId]/snapshots
List all snapshots for a specific chain.

**Authentication:** None required

**Parameters:**
- `chainId` (path) - The chain ID
- `limit` (query) - Maximum number of results (default: 20)
- `offset` (query) - Pagination offset (default: 0)
- `type` (query) - Filter by snapshot type (default, pruned, archive)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "snap_123",
      "chainId": "noble-1",
      "height": 20250722,
      "size": 7069740384,
      "fileName": "noble-1-20250722-175949.tar.lz4",
      "compression": "lz4",
      "type": "pruned",
      "createdAt": "2025-07-22T17:59:49Z",
      "updatedAt": "2025-07-22T17:59:49Z",
      "checksums": {
        "md5": "abc123...",
        "sha256": "def456..."
      }
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0
  }
}
```

### GET /api/v1/chains/[chainId]/snapshots/latest
Get the latest snapshot for a chain.

**Authentication:** None required

**Parameters:**
- `chainId` (path) - The chain ID
- `type` (query) - Snapshot type filter (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "snap_123",
    "chainId": "noble-1",
    "height": 20250722,
    "size": 7069740384,
    "fileName": "noble-1-20250722-175949.tar.lz4",
    "compression": "lz4",
    "type": "pruned",
    "createdAt": "2025-07-22T17:59:49Z"
  }
}
```

### POST /api/v1/chains/[chainId]/download
Generate a secure download URL for a snapshot.

**Authentication:** Optional (determines bandwidth tier)

**Parameters:**
- `chainId` (path) - The chain ID
- Body:
  ```json
  {
    "filename": "noble-1-20250722-175949.tar.lz4",
    "snapshotId": "snap_123", // Optional, alternative to filename
    "email": "user@example.com" // Optional, for tracking
  }
  ```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://snapshots.bryanlabs.net/snapshots/noble-1/noble-1-20250722.tar.lz4?md5=abc123&expires=1234567890&tier=free",
    "expires": "2025-07-22T19:00:00Z",
    "size": 7069740384,
    "tier": "free", // or "premium"
    "bandwidthLimit": "50 Mbps",
    "fileName": "noble-1-20250722-175949.tar.lz4"
  }
}
```

### POST /api/v1/auth/login
Legacy JWT authentication endpoint.

**Authentication:** None

**Body:**
```json
{
  "username": "premium_user",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "username": "premium_user",
      "tier": "premium",
      "email": "user@example.com"
    },
    "expiresIn": 86400
  }
}
```

### POST /api/v1/auth/logout
Logout endpoint (legacy).

**Authentication:** Bearer token

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /api/v1/auth/me
Get current user info (legacy).

**Authentication:** Bearer token

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "premium_user",
    "tier": "premium",
    "email": "user@example.com",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### POST /api/v1/auth/wallet
Authenticate using Cosmos wallet signature.

**Authentication:** None

**Body:**
```json
{
  "address": "cosmos1abc...",
  "pubkey": "...",
  "signature": "...",
  "message": "Sign this message to authenticate with Snapshots Service"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_456",
      "address": "cosmos1abc...",
      "tier": "free"
    }
  }
}
```

### GET /api/v1/downloads/status
Check download status and limits.

**Authentication:** Optional (returns personalized data if authenticated)

**Response:**
```json
{
  "success": true,
  "data": {
    "dailyLimit": 10,
    "downloadsToday": 3,
    "remainingDownloads": 7,
    "tier": "free",
    "bandwidthLimit": "50 Mbps",
    "activeDownloads": 1,
    "resetTime": "2025-07-23T00:00:00Z"
  }
}
```

### GET /api/v1/download-proxy
Legacy proxy endpoint for downloads (deprecated).

**Authentication:** Optional

**Query Parameters:**
- `url` - The snapshot URL to proxy

**Response:** Binary stream of the file

## NextAuth API

### GET /api/auth/providers
List available authentication providers.

**Response:**
```json
{
  "credentials": {
    "id": "credentials",
    "name": "Email and Password",
    "type": "credentials"
  },
  "keplr": {
    "id": "keplr",
    "name": "Keplr Wallet",
    "type": "credentials"
  }
}
```

### POST /api/auth/callback/credentials
Sign in with email/password.

**Body (Form URL Encoded):**
```
csrfToken=abc123...
email=user@example.com
password=password123
```

**Response:** Redirect or JSON based on Accept header

### GET /api/auth/session
Get current session.

**Authentication:** NextAuth session cookie

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "tier": "premium",
    "role": "user"
  },
  "expires": "2025-07-23T00:00:00Z"
}
```

### POST /api/auth/register
Register a new account.

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "New User"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_789",
      "email": "newuser@example.com",
      "name": "New User",
      "tier": "free"
    }
  }
}
```

### POST /api/auth/signout
Sign out current user.

**Authentication:** NextAuth session

**Response:** Redirect to homepage

### GET /api/auth/csrf
Get CSRF token for authentication.

**Response:**
```json
{
  "csrfToken": "abc123..."
}
```

### POST /api/auth/sync-session
Sync session data (internal use).

**Authentication:** NextAuth session

**Response:**
```json
{
  "success": true,
  "synced": true
}
```

### POST /api/auth/delete-account
Delete user account.

**Authentication:** NextAuth session

**Body:**
```json
{
  "confirmEmail": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

## Account Management API

### GET /api/account/avatar
Get user avatar URL or generate one.

**Authentication:** NextAuth session

**Response:**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://api.dicebear.com/7.x/initials/svg?seed=JD",
    "initials": "JD"
  }
}
```

### POST /api/account/link-email
Link email to wallet-based account.

**Authentication:** NextAuth session

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "walletAddress": "cosmos1abc..."
    }
  }
}
```

## Admin API

### GET /api/admin/stats
Get system statistics (admin only).

**Authentication:** NextAuth session with admin role

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1523,
    "premiumUsers": 47,
    "totalDownloads": 15234,
    "downloadsToday": 234,
    "totalBandwidth": "1.5 TB",
    "bandwidthToday": "150 GB",
    "activeChains": 9,
    "totalSnapshots": 450,
    "storageUsed": "5.2 TB",
    "systemHealth": {
      "nginx": "healthy",
      "redis": "healthy",
      "database": "healthy"
    }
  }
}
```

### GET /api/admin/downloads
Get detailed download analytics.

**Authentication:** NextAuth session with admin role

**Query Parameters:**
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `groupBy` - Group results by (hour, day, week, month)

**Response:**
```json
{
  "success": true,
  "data": {
    "downloads": [
      {
        "date": "2025-07-22",
        "count": 234,
        "bandwidth": "150 GB",
        "uniqueUsers": 187,
        "byTier": {
          "free": 200,
          "premium": 34
        },
        "byChain": {
          "noble-1": 89,
          "osmosis-1": 67,
          "cosmoshub-4": 78
        }
      }
    ],
    "summary": {
      "totalDownloads": 1523,
      "totalBandwidth": "950 GB",
      "avgDownloadSize": "640 MB"
    }
  }
}
```

## System API

### GET /api/health
Health check endpoint.

**Authentication:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-07-22T18:00:00Z",
    "version": "1.5.0",
    "services": {
      "database": "connected",
      "redis": "connected",
      "nginx": "reachable"
    }
  }
}
```

### GET /api/metrics
Prometheus metrics endpoint.

**Authentication:** None (internal use)

**Response:** Prometheus text format
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 12543
http_requests_total{method="POST",status="200"} 3421

# HELP download_bandwidth_bytes Total download bandwidth
# TYPE download_bandwidth_bytes counter
download_bandwidth_bytes{tier="free"} 543210987654
download_bandwidth_bytes{tier="premium"} 123456789012
```

### GET /api/bandwidth/status
Get current bandwidth usage across the system.

**Authentication:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "current": {
      "free": {
        "used": "25 Mbps",
        "total": "50 Mbps",
        "percentage": 50,
        "activeConnections": 3
      },
      "premium": {
        "used": "100 Mbps",
        "total": "250 Mbps",
        "percentage": 40,
        "activeConnections": 2
      }
    },
    "daily": {
      "free": {
        "downloaded": "500 GB",
        "connections": 234
      },
      "premium": {
        "downloaded": "1.2 TB",
        "connections": 47
      }
    }
  }
}
```

### POST /api/cron/reset-bandwidth
Reset daily bandwidth limits (cron job).

**Authentication:** Cron secret header

**Headers:**
- `X-Cron-Secret`: Secret token

**Response:**
```json
{
  "success": true,
  "data": {
    "reset": true,
    "usersReset": 1523,
    "timestamp": "2025-07-23T00:00:00Z"
  }
}
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMITED` | Rate limit exceeded |
| `INVALID_REQUEST` | Invalid request parameters |
| `DOWNLOAD_LIMIT_EXCEEDED` | Daily download limit reached |
| `BANDWIDTH_LIMIT_EXCEEDED` | Bandwidth limit reached |
| `INTERNAL_ERROR` | Internal server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

## Rate Limiting

- **Public endpoints**: 100 requests per minute per IP
- **Authenticated endpoints**: 200 requests per minute per user
- **Download endpoints**: 10 requests per minute per user
- **Admin endpoints**: No rate limiting

## Testing Checklist

- [ ] All GET endpoints return correct data format
- [ ] All POST endpoints validate input correctly
- [ ] Authentication works for all protected endpoints
- [ ] Error responses follow consistent format
- [ ] Rate limiting is applied correctly
- [ ] CORS headers are set properly
- [ ] Response times are under 200ms
- [ ] Pagination works correctly
- [ ] Download URLs expire after 5 minutes
- [ ] Bandwidth limits are enforced
- [ ] Admin endpoints require proper role
- [ ] Health check reflects actual service status
- [ ] Metrics are collected accurately
- [ ] All endpoints handle missing parameters gracefully
- [ ] JWT tokens expire correctly
- [ ] Session management works across endpoints