import { NextRequest, NextResponse } from 'next/server';
import { cache, cacheKeys } from './redis-cache';

interface CacheMiddlewareOptions {
  ttl?: number;
  tags?: string[];
  key?: (req: NextRequest) => string;
  condition?: (req: NextRequest) => boolean;
}

/**
 * Cache middleware for API routes
 */
export function withCache(options: CacheMiddlewareOptions = {}) {
  return function (
    handler: (req: NextRequest, context: any) => Promise<NextResponse>
  ) {
    return async function cachedHandler(
      req: NextRequest,
      context: any
    ): Promise<NextResponse> {
      // Check if caching should be applied
      if (options.condition && !options.condition(req)) {
        return handler(req, context);
      }

      // Only cache GET requests by default
      if (req.method !== 'GET') {
        return handler(req, context);
      }

      // Generate cache key
      const cacheKey = options.key 
        ? options.key(req) 
        : cacheKeys.apiResponse(req.nextUrl.pathname, req.nextUrl.search);

      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': `public, max-age=${options.ttl || 300}`,
          },
        });
      }

      // Execute handler
      const response = await handler(req, context);
      
      // Only cache successful responses
      if (response.status === 200) {
        try {
          const data = await response.json();
          
          // Cache the response
          await cache.set(cacheKey, data, {
            ttl: options.ttl,
            tags: options.tags,
          });

          // Return new response with cache headers
          return NextResponse.json(data, {
            headers: {
              'X-Cache': 'MISS',
              'Cache-Control': `public, max-age=${options.ttl || 300}`,
            },
          });
        } catch (error) {
          // If response is not JSON, return as-is
          return response;
        }
      }

      return response;
    };
  };
}

/**
 * Invalidate cache middleware for mutations
 */
export function withCacheInvalidation(tags: string[]) {
  return function (
    handler: (req: NextRequest, context: any) => Promise<NextResponse>
  ) {
    return async function (
      req: NextRequest,
      context: any
    ): Promise<NextResponse> {
      const response = await handler(req, context);
      
      // Invalidate cache tags on successful mutations
      if (
        response.status >= 200 && 
        response.status < 300 && 
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
      ) {
        await Promise.all(tags.map(tag => cache.invalidateTag(tag)));
      }

      return response;
    };
  };
}