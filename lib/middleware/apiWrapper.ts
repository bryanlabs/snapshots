import { NextRequest, NextResponse } from 'next/server';
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { withRateLimit, RateLimitType } from '@/lib/middleware/rateLimiter';

type ApiHandler<T = any> = (
  request: NextRequest,
  params?: any
) => Promise<NextResponse<T>>;

interface WrapperOptions {
  rateLimit?: RateLimitType;
  requireAuth?: boolean;
}

/**
 * Wraps an API handler with monitoring, logging, and optional rate limiting
 */
export function withApiMonitoring<T = any>(
  handler: ApiHandler<T>,
  route: string,
  options: WrapperOptions = {}
): ApiHandler<T> {
  const wrappedHandler = async (
    request: NextRequest,
    params?: any
  ): Promise<NextResponse<T>> => {
    const method = request.method;
    const endTimer = collectResponseTime(method, route);
    const startTime = Date.now();
    const requestLog = extractRequestMetadata(request);
    
    try {
      const response = await handler(request, params);
      
      // Track metrics
      endTimer();
      trackRequest(method, route, response.status);
      
      // Log request
      logRequest({
        ...requestLog,
        responseStatus: response.status,
        responseTime: Date.now() - startTime,
      });
      
      return response;
    } catch (error) {
      // Handle errors
      endTimer();
      trackRequest(method, route, 500);
      
      logRequest({
        ...requestLog,
        responseStatus: 500,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  };
  
  // Apply rate limiting if specified
  if (options.rateLimit) {
    return withRateLimit(wrappedHandler, options.rateLimit);
  }
  
  return wrappedHandler;
}