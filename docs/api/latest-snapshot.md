# Latest Snapshot API

## Overview

The Latest Snapshot API provides programmatic access to retrieve the most recent snapshot for a specific blockchain with a pre-signed download URL.

## Endpoint

```
GET /api/v1/chains/{chainId}/snapshots/latest
```

## Authentication

The API supports two tiers:

- **Free Tier**: No authentication required. URLs expire in 1 hour.
- **Premium Tier**: Requires Bearer token authentication. URLs expire in 24 hours.

### Getting a Bearer Token

Premium users can obtain a JWT Bearer token by logging in:

```bash
curl -X POST https://snapshots.bryanlabs.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "premium_user",
    "password": "your_password"
  }'
```

Response:
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

## Request

### Path Parameters

- `chainId` (string, required): The blockchain identifier (e.g., "osmosis", "cosmos", "juno")

### Headers

- `Authorization` (string, optional): Bearer token for premium tier access
  - Format: `Authorization: Bearer <token>`

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "chain_id": "osmosis",
    "height": 12345678,
    "size": 1234567890,
    "compression": "zst",
    "url": "https://snapshots.bryanlabs.net/snapshots/osmosis/osmosis-1-12345678.tar.zst?md5=abc123&expires=1234567890&tier=free",
    "expires_at": "2025-07-17T12:00:00.000Z",
    "tier": "free",
    "checksum": "d41d8cd98f00b204e9800998ecf8427e"
  },
  "message": "Latest snapshot URL generated successfully"
}
```

### Response Fields

- `chain_id`: The blockchain identifier
- `height`: Block height of the snapshot
- `size`: File size in bytes
- `compression`: Compression type ("lz4" or "zst")
- `url`: Pre-signed download URL
- `expires_at`: ISO 8601 timestamp when the URL expires
- `tier`: Access tier used ("free" or "premium")
- `checksum`: File checksum (ETag)

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "error": "No snapshots found",
  "message": "No snapshots available for chain osmosis"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to generate snapshot URL",
  "message": "Error details..."
}
```

## Example Usage

### Free Tier (No Authentication)

```bash
curl https://snapshots.bryanlabs.net/api/v1/chains/osmosis/snapshots/latest
```

### Premium Tier (With Authentication)

```bash
# First, get a token
TOKEN=$(curl -s -X POST https://snapshots.bryanlabs.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "premium_user", "password": "your_password"}' \
  | jq -r '.data.token')

# Then use the token
curl https://snapshots.bryanlabs.net/api/v1/chains/osmosis/snapshots/latest \
  -H "Authorization: Bearer $TOKEN"
```

### Python Example

```python
import requests

# Free tier
response = requests.get('https://snapshots.bryanlabs.net/api/v1/chains/osmosis/snapshots/latest')
data = response.json()
if data['success']:
    download_url = data['data']['url']
    print(f"Download URL: {download_url}")

# Premium tier
login_response = requests.post('https://snapshots.bryanlabs.net/api/v1/auth/login', json={
    'username': 'premium_user',
    'password': 'your_password'
})
token = login_response.json()['data']['token']

response = requests.get(
    'https://snapshots.bryanlabs.net/api/v1/chains/osmosis/snapshots/latest',
    headers={'Authorization': f'Bearer {token}'}
)
data = response.json()
print(f"Premium download URL: {data['data']['url']}")
```

## Rate Limiting

The API is subject to rate limiting:
- Free tier: Limited requests per hour
- Premium tier: Higher rate limits

## Notes

- The returned URL is a pre-signed URL that can be used directly to download the snapshot
- URLs have different expiration times based on tier (1 hour for free, 24 hours for premium)
- The latest snapshot is determined by the highest block height available
- Both ZST and LZ4 compressed snapshots are supported (.tar.zst or .tar.lz4)
- Download URLs use nginx secure_link module for protection
- Bandwidth limits are enforced based on tier (50 Mbps for free, 250 Mbps for premium)