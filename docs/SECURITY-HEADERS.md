# Security Headers Documentation

This document describes the security headers implemented in the Snapshots Service to protect against common web vulnerabilities.

## Implemented Headers

### 1. **Strict-Transport-Security (HSTS)**
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
- Forces HTTPS connections for 2 years
- Includes all subdomains
- Eligible for browser preload lists
- **Protects against**: Protocol downgrade attacks, cookie hijacking

### 2. **X-Frame-Options**
```
X-Frame-Options: DENY
```
- Prevents the site from being embedded in frames
- **Protects against**: Clickjacking attacks

### 3. **X-Content-Type-Options**
```
X-Content-Type-Options: nosniff
```
- Prevents browsers from MIME-sniffing
- **Protects against**: MIME confusion attacks

### 4. **X-XSS-Protection**
```
X-XSS-Protection: 1; mode=block
```
- Enables browser's XSS filter and blocks rendering
- **Protects against**: Reflected XSS attacks (legacy browsers)

### 5. **Referrer-Policy**
```
Referrer-Policy: strict-origin-when-cross-origin
```
- Controls referrer information sent with requests
- Sends full URL for same-origin, only origin for cross-origin
- **Protects against**: Information leakage

### 6. **Permissions-Policy**
```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()
```
- Disables browser features not needed by the app
- **Protects against**: Malicious use of browser APIs

### 7. **Content-Security-Policy (CSP)**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https://vercel.live wss://ws-us3.pusher.com https://sockjs-us3.pusher.com; media-src 'self'; object-src 'none'; child-src 'self'; frame-src 'self' https://vercel.live; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; manifest-src 'self'; upgrade-insecure-requests
```

#### CSP Directives Explained:
- **default-src 'self'**: Only allow resources from same origin by default
- **script-src**: Allows inline scripts (required for Next.js) and Vercel Live
- **style-src**: Allows inline styles (required for Tailwind)
- **img-src**: Allows images from any HTTPS source, data URIs, and blobs
- **font-src 'self'**: Only allow fonts from same origin
- **connect-src**: Allows API calls to self and required services
- **object-src 'none'**: Blocks Flash, Java, and other plugins
- **frame-ancestors 'none'**: Prevents framing (redundant with X-Frame-Options)
- **form-action 'self'**: Forms can only submit to same origin
- **base-uri 'self'**: Prevents base tag injection
- **upgrade-insecure-requests**: Upgrades HTTP to HTTPS

## API-Specific Headers

For `/api/*` routes, we add:
- **Cache-Control**: `public, max-age=300, stale-while-revalidate=60`
- **Content-Type**: `application/json; charset=utf-8`

## Testing Security Headers

You can test the security headers using:

1. **Browser Developer Tools**
   - Open Network tab
   - Check response headers for any request

2. **Security Headers Test**
   - Visit: https://securityheaders.com
   - Enter your domain

3. **curl Command**
   ```bash
   curl -I https://snapshots.bryanlabs.net
   ```

## Future Improvements

1. **CSP Nonces**: Implement nonces for inline scripts instead of 'unsafe-inline'
2. **Report-Only Mode**: Add CSP reporting to monitor violations
3. **Feature Policy**: Expand Permissions-Policy for more granular control

## Notes

- The CSP currently allows 'unsafe-inline' and 'unsafe-eval' for compatibility with Next.js and third-party libraries
- Consider tightening these restrictions after auditing all inline scripts
- Monitor for CSP violations and adjust policy as needed