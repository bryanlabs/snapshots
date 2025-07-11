import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';
import { trackRateLimitHit } from '@/lib/monitoring/metrics';
import { getIronSession } from 'iron-session';
import { User } from '@/types/user';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

// Rate limiter for download URL generation - 10 requests per minute
const downloadRateLimiter = new RateLimiterMemory({
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60, // Block for 1 minute
});

// Rate limiter for auth endpoints - 5 attempts per 15 minutes
const authRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900, // 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

// General API rate limiter - 100 requests per minute
const generalRateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
  blockDuration: 60,
});

// Premium tier rate limiter - 200 requests per minute
const premiumRateLimiter = new RateLimiterMemory({
  points: 200,
  duration: 60,
  blockDuration: 60,
});

export type RateLimitType = 'download' | 'auth' | 'general';

function getRateLimiter(type: RateLimitType, isPremium: boolean = false) {
  switch (type) {
    case 'download':
      return downloadRateLimiter;
    case 'auth':
      return authRateLimiter;
    case 'general':
      return isPremium ? premiumRateLimiter : generalRateLimiter;
    default:
      return generalRateLimiter;
  }
}

export async function rateLimitMiddleware(
  request: NextRequest,
  type: RateLimitType = 'general'
): Promise<NextResponse | null> {
  try {
    // Get user session to determine tier
    const cookieStore = await cookies();
    const session = await getIronSession<User>(cookieStore, sessionOptions);
    const isPremium = session?.tier === 'premium';
    
    // Get client identifier (user ID if logged in, otherwise IP)
    const clientId = session?.username || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'anonymous';
    
    const rateLimiter = getRateLimiter(type, isPremium);
    
    try {
      await rateLimiter.consume(clientId);
      return null; // Request allowed
    } catch (rateLimiterRes) {
      // Rate limit exceeded
      const retrySecs = Math.round((rateLimiterRes as RateLimiterRes).msBeforeNext / 1000) || 60;
      
      // Track rate limit hit
      trackRateLimitHit(
        request.nextUrl.pathname,
        isPremium ? 'premium' : 'free'
      );
      
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: retrySecs,
          message: `Please try again in ${retrySecs} seconds`
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retrySecs),
            'X-RateLimit-Limit': String(rateLimiter.points),
            'X-RateLimit-Remaining': String((rateLimiterRes as RateLimiterRes).remainingPoints || 0),
            'X-RateLimit-Reset': new Date(Date.now() + (rateLimiterRes as RateLimiterRes).msBeforeNext).toISOString()
          }
        }
      );
    }
  } catch (error) {
    console.error('Rate limiter error:', error);
    // In case of error, allow the request but log it
    return null;
  }
}

// Helper function to create rate limited handler
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  type: RateLimitType = 'general'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimitMiddleware(request, type);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request);
  };
}