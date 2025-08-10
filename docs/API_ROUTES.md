# API Routes Documentation

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://snapshots.bryanlabs.net/api`

## Table of Contents
- [System Endpoints](#system-endpoints)
- [Public API v1](#public-api-v1)
- [NextAuth Endpoints](#nextauth-endpoints)
- [Account Management](#account-management)
- [Admin Endpoints](#admin-endpoints)
- [Error Responses](#error-responses)

## System Endpoints

### GET /health
Check the health status of the application and its services.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-07-22T10:00:00Z",
    "services": {
      "database": true,
      "nginx": true,
      "redis": true
    },
    "version": "1.5.0"
  }
}
```

### GET /metrics
Prometheus-compatible metrics endpoint.

**Response:** Plain text Prometheus metrics format
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/v1/chains"} 1234
```

### GET /bandwidth/status
Get current bandwidth usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "free": {
      "current": 25.5,
      "total": 50,
      "connections": 3
    },
    "premium": {
      "current": 125.0,
      "total": 250,
      "connections": 2
    }
  }
}
```

### POST /cron/reset-bandwidth
Reset daily bandwidth limits (requires cron secret).

**Headers:**
```
X-Cron-Secret: your-cron-secret
```

**Response:**
```json
{
  "success": true,
  "message": "Bandwidth limits reset successfully"
}
```

## Public API v1

### Authentication

#### POST /v1/auth/login
Legacy JWT authentication for API compatibility.

**Request Body:**
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
      "username": "premium_user",
      "tier": "premium"
    }
  }
}
```

#### POST /v1/auth/logout
End the current session (JWT invalidation).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /v1/auth/me
Get current user info from JWT token.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "username": "premium_user",
    "tier": "premium"
  }
}
```

#### POST /v1/auth/token
Refresh JWT token.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /v1/auth/wallet
Authenticate with Cosmos wallet signature.

**Request Body:**
```json
{
  "address": "cosmos1...",
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
      "address": "cosmos1...",
      "tier": "free"
    }
  }
}
```

### Chains

#### GET /v1/chains
Get a list of all chains with available snapshots.

**Query Parameters:**
- `includeEmpty` (boolean): Include chains without snapshots

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "noble-1",
      "name": "Noble",
      "description": "Native asset issuance chain for the Cosmos ecosystem",
      "logoUrl": "/chains/noble.png",
      "snapshotCount": 14,
      "latestSnapshot": {
        "height": 20250722,
        "size": 7069740384,
        "lastModified": "2025-07-22T18:03:00Z",
        "compressionType": "lz4"
      },
      "totalSize": 98765432100
    }
  ]
}
```

#### GET /v1/chains/[chainId]
Get details for a specific chain.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "noble-1",
    "name": "Noble",
    "description": "Native asset issuance chain for the Cosmos ecosystem",
    "logoUrl": "/chains/noble.png",
    "snapshotCount": 14,
    "latestSnapshot": {
      "height": 20250722,
      "size": 7069740384,
      "lastModified": "2025-07-22T18:03:00Z",
      "compressionType": "lz4"
    }
  }
}
```

#### GET /v1/chains/[chainId]/snapshots
Get available snapshots for a specific chain.

**Query Parameters:**
- `type` (string): Filter by type (pruned, archive)
- `compression` (string): Filter by compression (zst, lz4)
- `limit` (number): Maximum results to return
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "noble-1-snapshot-1",
      "chainId": "noble-1",
      "height": 20250722,
      "size": 7069740384,
      "fileName": "noble-1-20250722-175949.tar.lz4",
      "createdAt": "2025-07-22T17:59:49Z",
      "updatedAt": "2025-07-22T18:03:00Z",
      "type": "pruned",
      "compressionType": "lz4"
    },
    {
      "id": "noble-1-snapshot-2",
      "chainId": "noble-1",
      "height": 20250722,
      "size": 4929377924,
      "fileName": "noble-1-20250722-174634.tar.zst",
      "createdAt": "2025-07-22T17:46:34Z",
      "updatedAt": "2025-07-22T17:47:00Z",
      "type": "pruned",
      "compressionType": "zst"
    }
  ]
}
```

#### GET /v1/chains/[chainId]/snapshots/latest
Get the latest snapshot for a chain.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "noble-1-latest",
    "chainId": "noble-1",
    "height": 20250722,
    "size": 7069740384,
    "fileName": "noble-1-20250722-175949.tar.lz4",
    "createdAt": "2025-07-22T17:59:49Z",
    "type": "pruned",
    "compressionType": "lz4"
  }
}
```

#### GET /v1/chains/[chainId]/info
Get metadata and statistics for a specific chain.

**Response:**
```json
{
  "success": true,
  "data": {
    "chainId": "noble-1",
    "name": "Noble",
    "latestHeight": 20250722,
    "snapshotSchedule": "Every 3 hours",
    "averageSize": 5899559154,
    "compressionRatio": {
      "zst": 0.45,
      "lz4": 0.64
    },
    "totalSnapshots": 14,
    "oldestSnapshot": "2025-07-20T18:09:38Z"
  }
}
```

#### POST /v1/chains/[chainId]/download
Generate a secure download URL for a snapshot.

**Request Body:**
```json
{
  "filename": "noble-1-20250722-175949.tar.lz4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://snapshots.bryanlabs.net/snapshots/noble-1/noble-1-20250722-175949.tar.lz4?md5=abc123&expires=1234567890&tier=free",
    "expires": "2025-07-22T19:00:00Z",
    "size": 7069740384,
    "tier": "free"
  }
}
```

### Downloads

#### GET /v1/downloads/status
Get download status for current user.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dailyLimit": 10,
    "downloadsToday": 3,
    "remainingDownloads": 7,
    "resetTime": "2025-07-23T00:00:00Z"
  }
}
```

#### POST /v1/download-proxy
Proxy download with authentication and tracking.

**Request Body:**
```json
{
  "url": "https://snapshots.bryanlabs.net/snapshots/..."
}
```

**Response:** Binary stream of file content

## NextAuth Endpoints

### GET /auth/providers
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
    "type": "oauth"
  }
}
```

### GET /auth/csrf
Get CSRF token for authentication.

**Response:**
```json
{
  "csrfToken": "abc123..."
}
```

### POST /auth/signin/credentials
Sign in with email and password.

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "snapshot123",
  "csrfToken": "abc123..."
}
```

**Response:** Redirect to callback URL or error page

### GET /auth/session
Get current NextAuth session.

**Response:**
```json
{
  "user": {
    "id": "1",
    "email": "test@example.com",
    "name": "Test User",
    "image": "/avatars/1.png"
  },
  "expires": "2025-07-29T10:00:00Z"
}
```

### POST /auth/signout
Sign out and clear session.

**Request Body:**
```json
{
  "csrfToken": "abc123..."
}
```

**Response:** Redirect to home page

### POST /auth/register
Register a new account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "name": "New User"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully"
}
```

## Account Management

### GET /account/avatar
Get user avatar image.

**Response:** Binary image data (PNG/JPEG)

### POST /account/link-email
Link email to wallet account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "verificationCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email linked successfully"
}
```

### DELETE /auth/delete-account
Delete user account and all data.

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

## Admin Endpoints

### GET /admin/stats
Get system statistics (requires admin role).

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1234,
      "premium": 56,
      "active24h": 234
    },
    "downloads": {
      "total": 45678,
      "today": 234,
      "bandwidth": "2.5 TB"
    },
    "storage": {
      "used": "45 TB",
      "available": "155 TB",
      "chains": 8
    }
  }
}
```

### GET /admin/downloads
Get download analytics (requires admin role).

**Query Parameters:**
- `startDate` (string): ISO date string
- `endDate` (string): ISO date string
- `chainId` (string): Filter by chain
- `tier` (string): Filter by tier (free/premium)

**Response:**
```json
{
  "success": true,
  "data": {
    "downloads": [
      {
        "id": "1",
        "userId": "123",
        "chainId": "noble-1",
        "filename": "noble-1-20250722-175949.tar.lz4",
        "size": 7069740384,
        "tier": "premium",
        "downloadedAt": "2025-07-22T18:15:00Z",
        "duration": 120,
        "completed": true
      }
    ],
    "summary": {
      "totalDownloads": 234,
      "totalBandwidth": "2.5 TB",
      "averageSpeed": "125 Mbps"
    }
  }
}
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request - Invalid input or parameters
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error
- `503`: Service Unavailable - Service temporarily down

### Error Examples

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid email format"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Please sign in to access this resource"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Chain 'invalid-chain' not found"
}
```

**429 Rate Limited:**
```json
{
  "success": false,
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please try again in 60 seconds"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later"
}
```