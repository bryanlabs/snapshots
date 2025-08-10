# Authentication API Reference

This document covers the authentication endpoints and security mechanisms for the BryanLabs Snapshot Service API.

## Overview

The API supports two authentication methods:
1. **Cookie-based authentication** - For web applications
2. **Bearer token authentication** - For programmatic API access

Premium users can authenticate to access enhanced features and faster download speeds.

### Cookie Authentication Flow

1. User sends credentials to `/api/v1/auth/login`
2. Server validates credentials and returns JWT token in secure cookie
3. Subsequent requests include the cookie automatically
4. Token is validated on each request requiring authentication

### Bearer Token Authentication Flow

1. User sends credentials to `/api/v1/auth/login` with `return_token: true`
2. Server validates credentials and returns JWT token in response body
3. Client includes token in `Authorization: Bearer <token>` header
4. Token is validated on each request requiring authentication

## Endpoints

### POST /api/v1/auth/login

Authenticate a user and create a session.

#### Request

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "your-secure-password",
  "return_token": false  // Optional, set to true for Bearer token
}
```

#### Response

**Success (200 OK) - Cookie Authentication**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "premium",
    "tier": "premium"
  },
  "message": "Login successful"
}
```

**Success (200 OK) - Bearer Token Authentication**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "premium",
      "tier": "premium"
    },
    "token": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": 604800
    }
  },
  "message": "Login successful"
}
```

**Error (401 Unauthorized)**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid email or password"
}
```

#### Response Headers
```http
Set-Cookie: auth-token=eyJhbGc...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

### POST /api/v1/auth/logout

End the current user session.

#### Request

```http
POST /api/v1/auth/logout
Cookie: auth-token=eyJhbGc...
```

#### Response

**Success (200 OK)**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Response Headers
```http
Set-Cookie: auth-token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0
```

### GET /api/v1/auth/me

Get the current authenticated user's information.

#### Request

```http
GET /api/v1/auth/me
Cookie: auth-token=eyJhbGc...
```

#### Response

**Authenticated (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "premium",
    "tier": "premium",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Not Authenticated (401 Unauthorized)**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No valid session found"
}
```

## Security Details

### JWT Token Structure

The JWT token contains the following claims:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "premium",
  "tier": "premium",
  "iat": 1704067200,
  "exp": 1704672000
}
```

### Token Expiration

- Default expiration: 7 days
- Tokens are automatically renewed on activity
- Expired tokens require re-authentication

### Cookie Security

Authentication cookies are set with the following flags:
- `HttpOnly`: Prevents JavaScript access
- `Secure`: HTTPS only (in production)
- `SameSite=Lax`: CSRF protection
- `Max-Age=604800`: 7-day expiration

## Bearer Token Usage

### Including Bearer Token in Requests

Once you have obtained a Bearer token, include it in the `Authorization` header:

```http
GET /api/v1/chains/osmosis/snapshots/latest
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### POST /api/v1/auth/token

Generate a new API token for the currently authenticated user (requires cookie authentication).

#### Request

```http
POST /api/v1/auth/token
Cookie: auth-token=eyJhbGc...
```

#### Response

**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 604800,
    "token_type": "Bearer"
  },
  "message": "API token generated successfully"
}
```

## Client Examples

### JavaScript/Fetch

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return response.json();
};

// Check current user
const getCurrentUser = async () => {
  const response = await fetch('/api/v1/auth/me', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
};

// Logout
const logout = async () => {
  await fetch('/api/v1/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
};
```

### cURL

```bash
# Cookie Authentication
# Login and save cookies
curl -c cookies.txt -X POST https://snapshots.bryanlabs.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use saved cookies for authenticated requests
curl -b cookies.txt https://snapshots.bryanlabs.net/api/v1/auth/me

# Logout
curl -b cookies.txt -X POST https://snapshots.bryanlabs.net/api/v1/auth/logout

# Bearer Token Authentication
# Login and get token
TOKEN=$(curl -s -X POST https://snapshots.bryanlabs.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password","return_token":true}' \
  | jq -r '.data.token.access_token')

# Use token for authenticated requests
curl -H "Authorization: Bearer $TOKEN" \
  https://snapshots.bryanlabs.net/api/v1/chains/osmosis/snapshots/latest
```

### Python

```python
import requests

class SnapshotClient:
    def __init__(self, base_url='https://snapshots.bryanlabs.net'):
        self.base_url = base_url
        self.session = requests.Session()
    
    def login(self, email, password):
        response = self.session.post(
            f'{self.base_url}/api/v1/auth/login',
            json={'email': email, 'password': password}
        )
        response.raise_for_status()
        return response.json()
    
    def get_current_user(self):
        response = self.session.get(f'{self.base_url}/api/v1/auth/me')
        if response.status_code == 401:
            return None
        response.raise_for_status()
        return response.json()
    
    def logout(self):
        response = self.session.post(f'{self.base_url}/api/v1/auth/logout')
        response.raise_for_status()

# Usage
client = SnapshotClient()
client.login('user@example.com', 'password')
user = client.get_current_user()
print(f"Logged in as: {user['data']['email']}")
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/cookiejar"
)

type Client struct {
    BaseURL string
    client  *http.Client
}

func NewClient(baseURL string) *Client {
    jar, _ := cookiejar.New(nil)
    return &Client{
        BaseURL: baseURL,
        client: &http.Client{Jar: jar},
    }
}

func (c *Client) Login(email, password string) error {
    payload := map[string]string{
        "email":    email,
        "password": password,
    }
    
    data, _ := json.Marshal(payload)
    resp, err := c.client.Post(
        c.BaseURL+"/api/v1/auth/login",
        "application/json",
        bytes.NewBuffer(data),
    )
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("login failed: %d", resp.StatusCode)
    }
    
    return nil
}
```

## Error Handling

### Common Error Responses

#### Invalid Credentials (401)
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid email or password"
}
```

#### Missing Required Fields (400)
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Email and password are required"
}
```

#### Rate Limited (429)
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Too many login attempts. Please try again later."
}
```

#### Server Error (500)
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

Authentication endpoints are rate-limited to prevent brute force attacks:

- **Login endpoint**: 5 attempts per minute per IP
- **Other auth endpoints**: 30 requests per minute per IP

Exceeded limits return HTTP 429 with retry information:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067260
```

## Best Practices

### 1. Secure Password Storage
Never store passwords in plain text. Always use secure password managers or environment variables.

### 2. HTTPS Only
Always use HTTPS in production to prevent token interception.

### 3. Token Refresh
Implement token refresh logic to handle expiration gracefully:

```javascript
const makeAuthenticatedRequest = async (url, options = {}) => {
  let response = await fetch(url, {
    ...options,
    credentials: 'include',
  });
  
  if (response.status === 401) {
    // Token expired, redirect to login
    window.location.href = '/login';
    return;
  }
  
  return response;
};
```

### 4. Logout on Security Events
Always logout users on:
- Password change
- Suspicious activity detection
- Manual security reset

### 5. Session Management
- Clear sessions on logout
- Implement "Remember Me" functionality carefully
- Use secure session storage

## Troubleshooting

### "Invalid Credentials" Error
1. Verify email and password are correct
2. Check for extra spaces in credentials
3. Ensure account is active
4. Contact support if issue persists

### "No Valid Session" Error
1. Check if cookies are enabled
2. Verify you're including credentials in requests
3. Check if token has expired
4. Try logging in again

### CORS Issues
For cross-origin requests:
1. Ensure `credentials: 'include'` is set
2. Verify CORS headers are configured
3. Use proxy in development if needed

## Migration Guide

### From API Keys to JWT
If migrating from API key authentication:

1. Obtain JWT token via login
2. Replace API key headers with cookie authentication
3. Update request configuration to include credentials
4. Handle token expiration appropriately

### Session Migration
For existing sessions:
1. Sessions are automatically migrated
2. Users may need to re-authenticate once
3. Old session formats are deprecated

## Security Considerations

### Token Storage
- Tokens are stored as HttpOnly cookies
- Never store tokens in localStorage
- Avoid exposing tokens in URLs

### XSS Protection
- All user input is sanitized
- Content Security Policy headers enforced
- HttpOnly cookies prevent JS access

### CSRF Protection
- SameSite cookie attribute
- Origin validation on state-changing operations
- Referer header checks

For additional security concerns or to report vulnerabilities, please contact security@bryanlabs.net.