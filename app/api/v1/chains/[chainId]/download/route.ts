import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, DownloadRequest } from '@/lib/types';
import { generateDownloadUrl } from '@/lib/nginx/operations';
import { config } from '@/lib/config';
import { z } from 'zod';
import { withRateLimit } from '@/lib/middleware/rateLimiter';
import { collectResponseTime, trackRequest, trackDownload } from '@/lib/monitoring/metrics';
import { logDownload as logDownloadMetric, extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { bandwidthManager } from '@/lib/bandwidth/manager';
import { auth } from '@/auth';
import { checkDownloadAllowed, incrementDailyDownload, logDownload } from '@/lib/download/tracker';

const downloadRequestSchema = z.object({
  snapshotId: z.string().min(1),
  email: z.string().email().optional(),
});

async function handleDownload(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  const endTimer = collectResponseTime('POST', '/api/v1/chains/[chainId]/download');
  const startTime = Date.now();
  const requestLog = extractRequestMetadata(request);
  
  try {
    const { chainId } = await params;
    const body = await request.json();
    
    // Get user session from NextAuth
    const session = await auth();
    const userId = session?.user?.id || 'anonymous';
    const tier = session?.user?.tier || 'free';
    
    // Get client IP for restriction and download limits
    // Extract first IP from x-forwarded-for (can contain multiple IPs)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() :
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') ||
                    'unknown';
    
    // Check download limits
    const DAILY_LIMIT = parseInt(process.env.DAILY_DOWNLOAD_LIMIT || '5');
    const downloadCheck = await checkDownloadAllowed(clientIp, tier as 'free' | 'premium', DAILY_LIMIT);
    
    if (!downloadCheck.allowed) {
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Daily download limit exceeded',
          message: `Free tier is limited to ${DAILY_LIMIT} downloads per day. You have ${downloadCheck.remaining} downloads remaining. Limit resets at ${downloadCheck.resetTime.toUTCString()}. Upgrade to premium for unlimited downloads.`,
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': DAILY_LIMIT.toString(),
            'X-RateLimit-Remaining': downloadCheck.remaining.toString(),
            'X-RateLimit-Reset': downloadCheck.resetTime.toISOString(),
          }
        }
      );
      
      endTimer();
      trackRequest('POST', '/api/v1/chains/[chainId]/download', 429);
      logRequest({
        ...requestLog,
        userId,
        tier,
        responseStatus: 429,
        responseTime: Date.now() - startTime,
        error: 'Daily download limit exceeded',
      });
      
      return response;
    }
    
    // Validate request body
    const validationResult = downloadRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid request',
          message: validationResult.error.errors.map(e => e.message).join(', '),
        },
        { status: 400 }
      );
    }
    
    const { snapshotId, email } = validationResult.data;
    
    // Get snapshot details from our snapshots API
    // Use internal URL for server-side API calls
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'http://webapp:3000'
      : 'http://localhost:3000';
    const snapshotsResponse = await fetch(`${apiUrl}/api/v1/chains/${chainId}/snapshots`);
    
    if (!snapshotsResponse.ok) {
      throw new Error('Failed to fetch snapshots');
    }
    
    const snapshotsData = await snapshotsResponse.json();
    const snapshot = snapshotsData.success ? 
      snapshotsData.data.find((s: any) => s.id === snapshotId) : null;
    
    if (!snapshot) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Snapshot not found',
          message: `Snapshot ${snapshotId} not found for chain ${chainId}`,
        },
        { status: 404 }
      );
    }
    
    // Generate secure link URL with nginx (12 hour expiry by default)
    const downloadUrl = await generateDownloadUrl(
      chainId,
      snapshot.fileName,
      tier as 'free' | 'premium',
      userId
    );
    
    console.log(`Generated secure link URL for file: ${chainId}/${snapshot.fileName}`);
    
    // Increment download counter for free tier
    if (tier === 'free') {
      await incrementDailyDownload(clientIp);
    }
    
    // Log download for analytics
    await logDownload({
      snapshotId,
      chainId,
      userId,
      ip: clientIp,
      tier: tier as 'free' | 'premium',
      timestamp: new Date(),
    });
    
    // Track download metrics
    trackDownload(tier, snapshotId);
    
    // Log download event for monitoring
    logDownloadMetric(userId, snapshotId, tier, true);
    
    // TODO: Log download request if email provided
    if (email) {
      // await db.downloadLog.create({
      //   data: {
      //     snapshotId,
      //     email,
      //     chainId,
      //     timestamp: new Date(),
      //   }
      // });
    }
    
    const response = NextResponse.json<ApiResponse<{ downloadUrl: string }>>({
      success: true,
      data: { downloadUrl },
      message: 'Download URL generated successfully',
    });
    
    endTimer();
    trackRequest('POST', '/api/v1/chains/[chainId]/download', 200);
    logRequest({
      ...requestLog,
      userId,
      tier,
      responseStatus: 200,
      responseTime: Date.now() - startTime,
    });
    
    return response;
  } catch (error) {
    const response = NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to generate download URL',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
    
    endTimer();
    trackRequest('POST', '/api/v1/chains/[chainId]/download', 500);
    logRequest({
      ...requestLog,
      responseStatus: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return response;
  }
}

// Apply rate limiting to the download endpoint
// TODO: Fix withRateLimit to properly pass params in Next.js 15
export const POST = handleDownload;