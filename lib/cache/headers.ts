/**
 * Cache control headers for different response types
 */

export const cacheHeaders = {
  // Static data that rarely changes
  static: {
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // 1 day, stale for 1 week
    'CDN-Cache-Control': 'max-age=86400',
  },

  // Dynamic data with short cache
  dynamic: {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300', // 1 min, stale for 5 min
    'CDN-Cache-Control': 'max-age=60',
  },

  // Real-time data
  realtime: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },

  // User-specific data
  private: {
    'Cache-Control': 'private, max-age=0, must-revalidate',
  },

  // API responses with conditional caching
  api: (maxAge: number = 300) => ({
    'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
    'Vary': 'Accept-Encoding, Authorization',
  }),

  // Immutable resources (with hash in filename)
  immutable: {
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
  },
};

/**
 * Add cache headers to a NextResponse
 */
export function withCacheHeaders(
  response: Response,
  headers: Record<string, string>
): Response {
  const newHeaders = new Headers(response.headers);
  
  Object.entries(headers).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}