# API Routes Documentation

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Health Check
### GET /health
Check the health status of the application and its services.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:00:00Z",
    "services": {
      "database": true,
      "minio": true
    }
  }
}
```

## Authentication

### POST /v1/auth/login
Authenticate a user and create a session.

**Request Body:**
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
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "message": "Login successful"
}
```

### POST /v1/auth/logout
End the current user session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /v1/auth/me
Get the current authenticated user's information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

## Chains

### GET /v1/chains
Get a list of all supported blockchain networks.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cosmos-hub",
      "name": "Cosmos Hub",
      "network": "cosmoshub-4",
      "description": "The Cosmos Hub is the first of thousands of interconnected blockchains.",
      "logoUrl": "/chains/cosmos.png"
    }
  ]
}
```

### GET /v1/chains/[chainId]
Get details for a specific chain.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cosmos-hub",
    "name": "Cosmos Hub",
    "network": "cosmoshub-4",
    "description": "The Cosmos Hub is the first of thousands of interconnected blockchains.",
    "logoUrl": "/chains/cosmos.png"
  }
}
```

### GET /v1/chains/[chainId]/snapshots
Get available snapshots for a specific chain.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cosmos-snapshot-1",
      "chainId": "cosmos-hub",
      "height": 19234567,
      "size": 483183820800,
      "fileName": "cosmoshub-4-19234567.tar.lz4",
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z",
      "type": "pruned",
      "compressionType": "lz4"
    }
  ]
}
```

### GET /v1/chains/[chainId]/info
Get metadata and statistics for a specific chain.

**Response:**
```json
{
  "success": true,
  "data": {
    "chain_id": "cosmoshub-4",
    "latest_snapshot": {
      "height": 19234567,
      "size": 483183820800,
      "age_hours": 6
    },
    "snapshot_schedule": "every 6 hours",
    "average_size": 450000000000,
    "compression_ratio": 0.35
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Chain not found",
  "message": "No snapshots found for chain ID invalid-chain"
}
```

### POST /v1/chains/[chainId]/download
Generate a presigned download URL for a snapshot.

**Request Body:**
```json
{
  "snapshotId": "cosmos-snapshot-1",
  "email": "user@example.com" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://minio.example.com/snapshots/cosmoshub-4-19234567.tar.lz4?..."
  },
  "message": "Download URL generated successfully"
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

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error