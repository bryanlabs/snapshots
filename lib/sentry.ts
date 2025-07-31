import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception with additional context
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'error'
) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    
    scope.setLevel(level);
    Sentry.captureException(error);
  });
}

/**
 * Capture a message with context
 */
export function captureMessage(
  message: string,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    
    scope.setLevel(level);
    Sentry.captureMessage(message, level);
  });
}

/**
 * Log API errors with request context
 */
export function captureApiError(
  error: Error | unknown,
  request: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
  },
  response?: {
    status?: number;
    statusText?: string;
    body?: any;
  }
) {
  captureException(error, {
    request,
    response,
    api: {
      endpoint: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track user actions
 */
export function trackUserAction(
  action: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message: action,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context for better error tracking
 */
export function setUserContext(user: {
  id?: string;
  email?: string;
  username?: string;
  tier?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    segment: user.tier,
  });
}

/**
 * Clear user context on logout
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Performance monitoring transaction
 */
export function startTransaction(
  name: string,
  op: string,
  data?: Record<string, any>
) {
  return Sentry.startSpan({
    name,
    op,
    data,
  }, () => {
    // Transaction logic here
  });
}

/**
 * Monitor async operations
 */
export async function monitorAsync<T>(
  operation: () => Promise<T>,
  name: string,
  context?: Record<string, any>
): Promise<T> {
  return await Sentry.startSpan({
    name,
    op: 'async'
  }, async () => {
    try {
      return await operation();
    } catch (error) {
      captureException(error, context);
      throw error;
    }
  });
}

/**
 * Create a Sentry-wrapped API route handler
 */
export function withSentry<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    name?: string;
    op?: string;
  }
): T {
  return (async (...args: Parameters<T>) => {
    return await Sentry.startSpan({
      name: options?.name || 'api.request',
      op: options?.op || 'http.server'
    }, async () => {
      try {
        return await handler(...args);
      } catch (error) {
        captureException(error);
        throw error;
      }
    });
  }) as T;
}