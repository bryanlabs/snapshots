# Sentry Error Tracking Implementation

This document describes the Sentry error tracking implementation for the Snapshots Service.

## Overview

We've implemented comprehensive error tracking using Sentry, which provides:
- Automatic error capture and reporting
- Performance monitoring
- User context tracking
- Session replay
- Custom error handling utilities

## Setup

### 1. Installation

```bash
npm install @sentry/nextjs
```

### 2. Configuration Files

- **sentry.client.config.ts**: Client-side configuration
- **sentry.server.config.ts**: Server-side configuration  
- **sentry.edge.config.ts**: Edge runtime configuration
- **next.config.ts**: Wrapped with Sentry webpack plugin
- **.sentryclirc**: Sentry CLI configuration

### 3. Environment Variables

Required environment variables:

```bash
# Public DSN for client-side
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_DSN@sentry.io/PROJECT_ID

# Build-time variables
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token
```

## Features Implemented

### 1. Automatic Error Capture

All unhandled errors are automatically captured:
- Client-side JavaScript errors
- Server-side Node.js errors
- API route errors
- Edge runtime errors

### 2. Performance Monitoring

- Traces sample rate: 10% in production, 100% in development
- Automatic instrumentation for:
  - API routes
  - Database queries (Prisma)
  - Page loads
  - Navigation

### 3. Session Replay

Records user sessions when errors occur:
- 100% replay on errors
- 10% sample rate for all sessions
- Masks sensitive text
- Blocks media content

### 4. User Context

Automatically tracks user information:
- User ID, email, and tier
- Set on login, cleared on logout
- Component: `SentryUserContext`

### 5. Custom Error Handling

Utility functions in `lib/sentry.ts`:

```typescript
// Capture exception with context
captureException(error, {
  user: { id: userId },
  request: { url, method }
});

// Track user actions
trackUserAction('download_snapshot', 'user_interaction', {
  chainId: 'noble-1',
  size: '1.5GB'
});

// Monitor async operations
await monitorAsync(
  async () => await fetchData(),
  'fetch_snapshots'
);

// Wrap API handlers
export const GET = withSentry(handler);
```

### 6. Error Boundaries

- **Global Error Boundary**: `app/global-error.tsx`
- **Page Error Boundary**: `app/error.tsx`
- **Component Error Boundary**: `components/error/ErrorBoundary.tsx`

## Usage Examples

### 1. API Route Error Handling

```typescript
import { withSentry, captureApiError } from '@/lib/sentry';

async function handler(req: NextRequest) {
  try {
    // Your API logic
  } catch (error) {
    captureApiError(error, {
      method: req.method,
      url: req.url,
    });
    throw error;
  }
}

export const GET = withSentry(handler);
```

### 2. Component Error Boundary

```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export function MyComponent() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### 3. Manual Error Capture

```typescript
import { captureException, captureMessage } from '@/lib/sentry';

// Capture an error
try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    operation: 'snapshot_download',
    chainId,
  });
}

// Log a message
captureMessage('Unusual condition detected', {
  condition: 'high_memory_usage',
  value: memoryUsage,
}, 'warning');
```

### 4. Performance Monitoring

```typescript
import { startTransaction } from '@/lib/sentry';

const transaction = startTransaction('process_snapshot', 'task');

try {
  await processSnapshot();
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

## Filtered Errors

The following errors are filtered out to reduce noise:
- Browser extension errors
- ResizeObserver loop errors
- Network errors
- Next.js navigation errors (NEXT_NOT_FOUND, NEXT_REDIRECT)

## Testing Sentry

Test endpoint available at `/api/test-error`:

```bash
# Test error capture
curl http://localhost:3000/api/test-error?type=error

# Test warning
curl http://localhost:3000/api/test-error?type=warning

# Test custom context
curl http://localhost:3000/api/test-error?type=custom
```

## Monitoring & Alerts

### Sentry Dashboard

1. **Issues**: View all errors grouped by similarity
2. **Performance**: Monitor transaction times
3. **Releases**: Track errors by deployment
4. **User Feedback**: See user-submitted error reports

### Alert Rules

Configure alerts for:
- Error rate spikes
- New error types
- Performance degradation
- Specific error conditions

## Best Practices

1. **Add Context**: Always include relevant context when capturing errors
2. **Use Breadcrumbs**: Track user actions leading to errors
3. **Set User Context**: Ensure user info is set for better debugging
4. **Filter Noise**: Configure ignoreErrors for known issues
5. **Monitor Performance**: Use transactions for critical operations

## Security Considerations

1. **Sensitive Data**: 
   - Session replay masks all text by default
   - Don't log sensitive information in error context
   - Review what data is sent to Sentry

2. **Source Maps**:
   - Hidden from production bundles
   - Only uploaded to Sentry during build

3. **Tunneling**:
   - Configured to route through `/monitoring` to bypass ad blockers
   - Increases server load but improves data collection

## Troubleshooting

### Common Issues

1. **Errors not appearing in Sentry**:
   - Check NEXT_PUBLIC_SENTRY_DSN is set
   - Verify error isn't filtered by ignoreErrors
   - Check browser console for Sentry initialization

2. **Source maps not working**:
   - Ensure SENTRY_AUTH_TOKEN is set during build
   - Check SENTRY_ORG and SENTRY_PROJECT match

3. **Performance issues**:
   - Reduce tracesSampleRate in production
   - Disable session replay if not needed

## Future Enhancements

1. **Custom Dashboards**: Build error dashboards in the app
2. **Slack Integration**: Send critical errors to Slack
3. **Error Analytics**: Track error trends over time
4. **User Feedback**: Allow users to submit error reports
5. **Proactive Monitoring**: Alert before errors impact users