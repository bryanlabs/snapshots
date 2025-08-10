/**
 * API Rate Limiting Middleware (Tier-Based)
 * 
 * Implements hourly API rate limiting using the api_usage_records table.
 * Rate limits are based on user tiers: Free (50/h), Premium (500/h), Ultra (2000/h).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getApiRateLimit } from '@/lib/utils/tier';
import { getEffectiveTier, isSubscriptionActive } from '@/lib/utils/subscription';
import type { SubscriptionStatus } from '@/types/user';

/**
 * Get the current hour bucket for rate limiting
 */
function getCurrentHourBucket(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
}

/**
 * Get or create API usage record for the current hour
 */
async function getOrCreateUsageRecord(
  userId: string,
  hourBucket: Date,
  endpoint?: string
) {
  // Try to find existing record
  let usageRecord = await prisma.apiUsageRecord.findUnique({
    where: {
      userId_hourBucket_endpoint: {
        userId,
        hourBucket,
        endpoint: endpoint || null,
      },
    },
  });

  // Create if doesn't exist
  if (!usageRecord) {
    usageRecord = await prisma.apiUsageRecord.create({
      data: {
        userId,
        hourBucket,
        endpoint: endpoint || null,
        requestCount: 0,
      },
    });
  }

  return usageRecord;
}

/**
 * Get user's effective tier and rate limit
 */
async function getUserRateLimit(userId: string): Promise<{
  effectiveTier: string;
  rateLimit: number;
  currentUsage: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      personalTier: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get effective tier considering subscription status
  const effectiveTier = getEffectiveTier(
    user.personalTier?.name || 'free',
    user.subscriptionStatus as SubscriptionStatus,
    user.subscriptionExpiresAt
  );

  // Get rate limit for effective tier
  const rateLimit = getApiRateLimit(effectiveTier);

  // Get current usage for this hour
  const hourBucket = getCurrentHourBucket();
  const currentUsage = await prisma.apiUsageRecord.aggregate({
    where: {
      userId,
      hourBucket,
    },
    _sum: {
      requestCount: true,
    },
  });

  return {
    effectiveTier,
    rateLimit,
    currentUsage: currentUsage._sum.requestCount || 0,
  };
}

/**
 * Increment usage counter for user
 */
async function incrementUsage(
  userId: string,
  endpoint?: string
): Promise<number> {
  const hourBucket = getCurrentHourBucket();
  
  // Use upsert to increment or create
  const usageRecord = await prisma.apiUsageRecord.upsert({
    where: {
      userId_hourBucket_endpoint: {
        userId,
        hourBucket,
        endpoint: endpoint || null,
      },
    },
    update: {
      requestCount: {
        increment: 1,
      },
    },
    create: {
      userId,
      hourBucket,
      endpoint: endpoint || null,
      requestCount: 1,
    },
  });

  return usageRecord.requestCount;
}

/**
 * Main API rate limiting middleware
 */
export async function apiRateLimitMiddleware(
  request: NextRequest,
  options: {
    endpoint?: string;
    skipForPublic?: boolean;
  } = {}
): Promise<NextResponse | null> {
  try {
    // Get user session
    const session = await auth();
    
    // If no user and skipForPublic is true, allow request
    if (!session?.user?.id && options.skipForPublic) {
      return null; // Allow request
    }
    
    // If no user and not skipping for public, deny
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'API access requires authentication',
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const endpoint = options.endpoint || request.nextUrl.pathname;

    // Get user's rate limit and current usage
    const { effectiveTier, rateLimit, currentUsage } = await getUserRateLimit(userId);

    // Check if user has exceeded rate limit
    if (currentUsage >= rateLimit) {
      const hourBucket = getCurrentHourBucket();
      const resetTime = new Date(hourBucket.getTime() + 60 * 60 * 1000); // Next hour
      const minutesUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60));

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `API rate limit exceeded. Limit: ${rateLimit} requests/hour for ${effectiveTier} tier`,
          rateLimit: {
            limit: rateLimit,
            used: currentUsage,
            remaining: 0,
            resetAt: resetTime.toISOString(),
            resetInMinutes: minutesUntilReset,
          },
          tier: effectiveTier,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(minutesUntilReset * 60), // seconds
            'X-RateLimit-Limit': String(rateLimit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toISOString(),
            'X-RateLimit-Tier': effectiveTier,
          },
        }
      );
    }

    // Increment usage counter
    const newCount = await incrementUsage(userId, endpoint);
    const remaining = Math.max(0, rateLimit - newCount);
    
    // Add rate limit headers to the response that will be returned
    const headers = {
      'X-RateLimit-Limit': String(rateLimit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': new Date(getCurrentHourBucket().getTime() + 60 * 60 * 1000).toISOString(),
      'X-RateLimit-Tier': effectiveTier,
    };

    // Store headers in request for later use
    (request as any).rateLimitHeaders = headers;

    return null; // Allow request to proceed

  } catch (error) {
    console.error('API rate limit middleware error:', error);
    
    // In case of error, allow the request but log it
    // This prevents rate limiting from breaking the API
    return null;
  }
}

/**
 * Helper function to create rate limited API handler
 */
export function withApiRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    endpoint?: string;
    skipForPublic?: boolean;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit first
    const rateLimitResponse = await apiRateLimitMiddleware(request, options);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Execute the handler
    const response = await handler(request);

    // Add rate limit headers if they were set
    const rateLimitHeaders = (request as any).rateLimitHeaders;
    if (rateLimitHeaders) {
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value as string);
      });
    }

    return response;
  };
}

/**
 * Clean up old API usage records (should be run as a cron job)
 */
export async function cleanupOldUsageRecords(daysToKeep: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const deleted = await prisma.apiUsageRecord.deleteMany({
    where: {
      hourBucket: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`Cleaned up ${deleted.count} old API usage records`);
  return deleted.count;
}

/**
 * Get API usage analytics for a user
 */
export async function getUserApiUsage(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const usage = await prisma.apiUsageRecord.findMany({
    where: {
      userId,
      hourBucket: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      hourBucket: 'asc',
    },
  });

  const totalRequests = usage.reduce((sum, record) => sum + record.requestCount, 0);
  const averagePerHour = usage.length > 0 ? totalRequests / usage.length : 0;
  
  const endpointBreakdown = usage.reduce((acc, record) => {
    const endpoint = record.endpoint || 'unknown';
    acc[endpoint] = (acc[endpoint] || 0) + record.requestCount;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRequests,
    averagePerHour: Math.round(averagePerHour * 100) / 100,
    hoursWithActivity: usage.length,
    endpointBreakdown,
    hourlyData: usage.map(record => ({
      hour: record.hourBucket,
      requests: record.requestCount,
      endpoint: record.endpoint,
    })),
  };
}