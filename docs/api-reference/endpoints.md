# API Endpoints Reference

Complete reference for all API endpoints in the BryanLabs Snapshot Service.

## Base URL

- **Production**: `https://snapshots.bryanlabs.net/api`
- **Development**: `http://localhost:3000/api`

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## Health & Status

### GET /health

Check the health status of the application and its services.

#### Request
```http
GET /api/health
```

#### Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:00:00Z",
    "services": {
      "database": true,
      "nginx": true,
      "redis": true
    },
    "version": "1.0.0"
  }
}
```

#### Status Codes
- `200 OK` - All services healthy
- `503 Service Unavailable` - One or more services unhealthy

### GET /metrics

Prometheus-compatible metrics endpoint.

#### Request
```http
GET /api/metrics
```

#### Response
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/api/v1/chains",status="200"} 1234

# HELP download_bandwidth_bytes Current bandwidth usage in bytes per second
# TYPE download_bandwidth_bytes gauge
download_bandwidth_bytes{tier="free"} 45678901
download_bandwidth_bytes{tier="premium"} 234567890
```

## Blockchain Chains

### GET /v1/chains

Get a list of all supported blockchain networks.

#### Request
```http
GET /api/v1/chains
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| search | string | Search chains by name or ID | - |
| network | string | Filter by network type (mainnet, testnet) | - |
| sort | string | Sort by: name, updated, size | updated |
| limit | number | Results per page | 50 |
| offset | number | Pagination offset | 0 |

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "cosmos-hub",
      "name": "Cosmos Hub",
      "network": "cosmoshub-4",
      "description": "The Cosmos Hub is the first of thousands of interconnected blockchains.",
      "logoUrl": "/chains/cosmos.png",
      "latestSnapshot": {
        "height": 19234567,
        "size": 483183820800,
        "sizeHuman": "450.0 GB",
        "updatedAt": "2024-01-15T00:00:00Z"
      },
      "stats": {
        "totalSnapshots": 7,
        "oldestSnapshot": "2024-01-08T00:00:00Z",
        "averageSize": 450000000000
      }
    }
  ],
  "pagination": {
    "total": 35,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### GET /v1/chains/[chainId]

Get detailed information for a specific chain.

#### Request
```http
GET /api/v1/chains/cosmos-hub
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "cosmos-hub",
    "name": "Cosmos Hub",
    "network": "cosmoshub-4",
    "description": "The Cosmos Hub is the first of thousands of interconnected blockchains.",
    "logoUrl": "/chains/cosmos.png",
    "documentation": {
      "website": "https://cosmos.network",
      "github": "https://github.com/cosmos/gaia",
      "docs": "https://hub.cosmos.network"
    },
    "technical": {
      "binaryName": "gaiad",
      "homeDir": ".gaia",
      "defaultPorts": {
        "p2p": 26656,
        "rpc": 26657,
        "api": 1317,
        "grpc": 9090
      },
      "minimumGasPrice": "0.0025uatom",
      "denomUnits": {
        "uatom": {
          "exponent": 0
        },
        "atom": {
          "exponent": 6
        }
      }
    },
    "requirements": {
      "minStorage": "500GB",
      "recommendedStorage": "1TB",
      "minRAM": "16GB",
      "recommendedRAM": "32GB"
    },
    "latestSnapshot": {
      "id": "cosmos-snapshot-latest",
      "height": 19234567,
      "size": 483183820800,
      "sizeHuman": "450.0 GB",
      "fileName": "cosmoshub-4-19234567.tar.lz4",
      "sha256": "abcdef1234567890...",
      "createdAt": "2024-01-15T00:00:00Z"
    }
  }
}
```

#### Status Codes
- `200 OK` - Chain found
- `404 Not Found` - Chain not found

## Snapshots

### GET /v1/chains/[chainId]/snapshots

Get available snapshots for a specific chain.

#### Request
```http
GET /api/v1/chains/cosmos-hub/snapshots
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| type | string | Filter by type: pruned, archive | all |
| limit | number | Results per page | 10 |
| offset | number | Pagination offset | 0 |

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "cosmos-snapshot-19234567",
      "chainId": "cosmos-hub",
      "height": 19234567,
      "size": 483183820800,
      "sizeHuman": "450.0 GB",
      "fileName": "cosmoshub-4-19234567.tar.lz4",
      "type": "pruned",
      "compressionType": "lz4",
      "compressionOptions": ["zst", "lz4"],
      "compressionRatio": 0.65,
      "sha256": "d2d2a8c2e45f1d9c3a4e5b6f7e8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7",
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z",
      "metadata": {
        "pruningKeepRecent": "100",
        "pruningKeepEvery": "0",
        "pruningInterval": "10",
        "indexer": "null"
      }
    },
    {
      "id": "cosmos-snapshot-latest",
      "chainId": "cosmos-hub",
      "fileName": "latest.tar.lz4",
      "isSymlink": true,
      "linkedTo": "cosmos-snapshot-19234567",
      "compressionType": "lz4",
      "size": 483183820800,
      "sizeHuman": "450.0 GB",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 7,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

### GET /v1/chains/[chainId]/snapshots/latest

Get the latest snapshot for a chain with a pre-signed download URL.

#### Request
```http
GET /api/v1/chains/cosmos-hub/snapshots/latest
Authorization: Bearer <token>  // Optional, for premium tier
```

#### Response
```json
{
  "success": true,
  "data": {
    "chain_id": "cosmos-hub",
    "height": 19234567,
    "size": 483183820800,
    "compression": "lz4",
    "url": "https://snapshots.bryanlabs.net/snapshots/cosmos-hub/cosmoshub-4-19234567.tar.lz4?md5=abc123&expires=1234567890&tier=free",
    "expires_at": "2024-01-15T11:00:00.000Z",
    "tier": "free",
    "checksum": "d2d2a8c2e45f1d9c3a4e5b6f7e8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7"
  },
  "message": "Latest snapshot URL generated successfully"
}
```

#### Authentication
- **No Authorization header**: Free tier (URL expires in 1 hour)
- **Bearer token**: Premium tier (URL expires in 24 hours)

#### Status Codes
- `200 OK` - URL generated successfully
- `404 Not Found` - No snapshots available for chain
- `500 Internal Server Error` - Failed to generate URL

### POST /v1/chains/[chainId]/download

Generate a secure download URL for a snapshot file.

#### Request
```http
POST /api/v1/chains/cosmos-hub/download
Content-Type: application/json
Cookie: auth-token=... (optional for premium)
```

```json
{
  "fileName": "cosmoshub-4-19234567.tar.lz4",
  "email": "user@example.com"  // Optional, for tracking
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://snapshots.bryanlabs.net/snapshots/cosmos-hub/cosmoshub-4-19234567.tar.lz4?md5=abc123&expires=1234567890&tier=premium",
    "expiresIn": 300,
    "expiresAt": "2024-01-15T10:05:00Z",
    "tier": "premium",
    "bandwidthLimit": "250MB/s shared",
    "fileInfo": {
      "fileName": "cosmoshub-4-19234567.tar.lz4",
      "size": 483183820800,
      "sizeHuman": "450.0 GB",
      "sha256": "d2d2a8c2e45f1d9c3a4e5b6f7e8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7"
    },
    "downloadInstructions": {
      "wget": "wget -c \"[downloadUrl]\"",
      "curl": "curl -C - -O \"[downloadUrl]\"",
      "aria2": "aria2c -x 4 -s 4 \"[downloadUrl]\""
    }
  },
  "message": "Download URL generated successfully"
}
```

#### Status Codes
- `200 OK` - URL generated successfully
- `404 Not Found` - Snapshot not found
- `429 Too Many Requests` - Rate limit exceeded

## Admin Endpoints

### GET /admin/stats

Get service statistics (requires admin authentication).

#### Request
```http
GET /api/admin/stats
Cookie: auth-token=... (admin required)
```

#### Response
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalChains": 35,
      "totalSnapshots": 245,
      "totalSize": 15995116277760,
      "totalSizeHuman": "14.5 TB",
      "lastUpdate": "2024-01-15T09:00:00Z"
    },
    "bandwidth": {
      "current": {
        "free": {
          "bytesPerSecond": 41943040,
          "humanReadable": "40 MB/s",
          "connections": 3
        },
        "premium": {
          "bytesPerSecond": 157286400,
          "humanReadable": "150 MB/s",
          "connections": 2
        }
      },
      "daily": {
        "totalBytes": 3221225472000,
        "totalHuman": "3.0 TB",
        "freeBytes": 1073741824000,
        "premiumBytes": 2147483648000
      }
    },
    "users": {
      "totalRegistered": 145,
      "premiumUsers": 23,
      "activeSessions": 5
    },
    "downloads": {
      "today": 127,
      "week": 892,
      "month": 3547,
      "topChains": [
        {
          "chainId": "cosmos-hub",
          "downloads": 1234
        },
        {
          "chainId": "osmosis",
          "downloads": 987
        }
      ]
    }
  }
}
```

## Rate Limiting

All endpoints are rate-limited to ensure fair usage:

| Endpoint Type | Free Tier | Premium Tier |
|--------------|-----------|--------------|
| Read endpoints | 60/minute | 300/minute |
| Download URL generation | 10/minute | 60/minute |
| Authentication | 5/minute | 5/minute |

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067260
```

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Application Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| INVALID_CHAIN | Chain ID not found | Check available chains |
| SNAPSHOT_NOT_FOUND | Requested snapshot doesn't exist | List available snapshots |
| DOWNLOAD_EXPIRED | Download URL has expired | Generate new URL |
| BANDWIDTH_EXCEEDED | Bandwidth limit reached | Try again later |
| AUTH_REQUIRED | Authentication needed | Login first |
| INVALID_CREDENTIALS | Wrong email/password | Check credentials |

## Client SDKs

### JavaScript/TypeScript

```typescript
import { SnapshotClient } from '@bryanlabs/snapshot-client';

const client = new SnapshotClient({
  baseUrl: 'https://snapshots.bryanlabs.net',
  credentials: {
    email: 'user@example.com',
    password: 'password'
  }
});

// Get chains
const chains = await client.getChains();

// Get snapshots
const snapshots = await client.getSnapshots('cosmos-hub');

// Generate download URL
const download = await client.generateDownloadUrl('cosmos-hub', 'latest');
```

### Python

```python
from bryanlabs_snapshots import SnapshotClient

client = SnapshotClient(
    base_url='https://snapshots.bryanlabs.net',
    email='user@example.com',
    password='password'
)

# Get chains
chains = client.get_chains()

# Get snapshots
snapshots = client.get_snapshots('cosmos-hub')

# Generate download URL
download = client.generate_download_url('cosmos-hub', 'latest')
```

## Webhooks (Coming Soon)

Future support for webhooks to notify about:
- New snapshot availability
- Download completion
- Chain updates

## API Versioning

The API uses URL versioning:
- Current version: `v1`
- Version in URL: `/api/v1/...`
- Deprecated versions will be supported for 6 months

## Support

For API support:
- Email: api-support@bryanlabs.net
- Discord: #api-help channel
- GitHub: [API Issues](https://github.com/bryanlabs/snapshots/labels/api)