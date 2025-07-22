# Snapshots API Documentation

## Base URL

- Production: `https://snapshots.bryanlabs.net`
- Local: `http://localhost:3000`

## Authentication

The API supports two authentication methods:
1. **NextAuth Session**: Cookie-based sessions for web users
2. **JWT Tokens**: For programmatic access (legacy support)

## Endpoints

### Authentication

#### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "displayName": "John Doe" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "userId": "cmdahjws00001l001rsmkgfm9"
}
```

**Error Response:**
```json
{
  "error": "User with this email already exists"
}
```

#### POST /api/auth/callback/credentials
Sign in with email and password (NextAuth).

**Request:**
- Requires CSRF token (obtain from `/api/auth/csrf`)
- Content-Type: `application/x-www-form-urlencoded`

**Form Data:**
```
csrfToken=<token>
email=user@example.com
password=password123
```

#### GET /api/auth/session
Get current user session.

**Response:**
```json
{
  "user": {
    "name": "John Doe",
    "email": "user@example.com",
    "image": null,
    "id": "user-id",
    "tier": "free",
    "tierId": "free-tier-id",
    "creditBalance": 0,
    "teams": []
  },
  "expires": "2025-07-26T16:20:23.310Z"
}
```

#### POST /api/auth/signout
Sign out the current user.

#### DELETE /api/auth/delete-account
Delete the current user's account.

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### Legacy Authentication (V1 API)

#### POST /api/v1/auth/login
Legacy login endpoint.

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
    "username": "premium_user",
    "tier": "premium"
  }
}
```

#### POST /api/v1/auth/logout
Legacy logout endpoint.

#### GET /api/v1/auth/me
Get current user info (legacy).

### Chains & Snapshots

#### GET /api/v1/chains
List all available blockchain chains.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "osmosis",
      "name": "Osmosis",
      "chainId": "osmosis-1",
      "snapshotCount": 5,
      "latestSnapshot": {
        "fileName": "osmosis-1-pruned-20240320.tar.gz",
        "fileSize": 125829120000,
        "blockHeight": 18500000,
        "snapshotTime": "2024-03-20T00:00:00Z"
      }
    }
  ]
}
```

#### GET /api/v1/chains/[chainId]/snapshots
List snapshots for a specific chain.

**Parameters:**
- `chainId`: The chain identifier (e.g., "osmosis")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "fileName": "osmosis-1-pruned-20240320.tar.gz",
      "fileSize": 125829120000,
      "fileSizeDisplay": "117.20 GB",
      "blockHeight": 18500000,
      "pruningMode": "pruned",
      "compressionType": "gzip",
      "snapshotTime": "2024-03-20T00:00:00Z",
      "regions": ["us-east", "eu-west"]
    }
  ]
}
```

#### GET /api/v1/chains/[chainId]/snapshots/latest
Get the latest snapshot for a chain.

**Response:**
Same as single snapshot in the list above.

#### POST /api/v1/chains/[chainId]/download
Generate a download URL for a snapshot.

**Request Body:**
```json
{
  "fileName": "osmosis-1-pruned-20240320.tar.gz"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://snapshots.bryanlabs.net/download/...",
    "expiresAt": "2024-03-20T12:30:00Z",
    "estimatedDownloadTime": {
      "seconds": 4000,
      "display": "1h 6m 40s"
    },
    "bandwidth": {
      "allocatedMbps": 50,
      "tier": "free"
    }
  }
}
```

### Download Management

#### GET /api/v1/downloads/status
Get current download queue status.

**Response:**
```json
{
  "success": true,
  "data": {
    "queueLength": 5,
    "estimatedWaitTime": 300,
    "userPosition": 3,
    "bandwidth": {
      "total": 500,
      "freeUsed": 150,
      "premiumUsed": 200,
      "available": 150
    }
  }
}
```

### Health & Monitoring

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-20T12:00:00Z"
}
```

#### GET /api/metrics
Prometheus-format metrics endpoint.

**Response:**
```
# HELP nodejs_version_info Node.js version info
# TYPE nodejs_version_info gauge
nodejs_version_info{version="20.11.0"} 1

# HELP snapshots_downloads_total Total number of downloads
# TYPE snapshots_downloads_total counter
snapshots_downloads_total{tier="free"} 150
snapshots_downloads_total{tier="premium"} 50
```

### Admin Endpoints

#### GET /api/admin/stats
Get system statistics (requires admin auth).

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1250,
      "free": 1200,
      "premium": 50
    },
    "downloads": {
      "today": 150,
      "week": 890,
      "month": 3500
    },
    "bandwidth": {
      "currentUsage": 350,
      "peakToday": 485,
      "averageToday": 275
    }
  }
}
```

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "error": "Error message",
  "status": 400
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- Download URL generation: 10 requests per minute
- Other endpoints: 60 requests per minute

## Testing

See [Testing Guide](./testing.md) for information on running API tests.