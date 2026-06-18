import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { generateDownloadUrl } from '@/lib/nginx/operations';
import { z } from 'zod';
import {
  collectResponseTime,
  trackRequest,
  trackDownload,
  trackSnapshotDownloadUrlRequest,
} from '@/lib/monitoring/metrics';
import { logDownload as logDownloadMetric, extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { auth } from '@/auth';
import { checkDownloadAllowed, incrementDailyDownload, logDownload } from '@/lib/download/tracker';
import { downloadTokenHashFromUrl, recordDownloadEvent } from '@/lib/download/events';
import { getSnapshotFromCatalog } from '@/lib/snapshots/custom-catalog';
import { getCanonicalChainId } from '@/lib/config/chains';
import { getEffectiveAccessTier, getTierDownloadExpiry } from '@/lib/utils/tier';

const downloadRequestSchema = z.object({
  snapshotId: z.string().min(1),
  email: z.string().email().optional(),
});

function snapshotVisibility(snapshot: { isCustom?: boolean; customVisibility?: string; isCommunity?: boolean }) {
  if (!snapshot.isCustom) return 'scheduled';
  if (snapshot.customVisibility === 'public' || snapshot.isCommunity) return 'public';
  if (snapshot.customVisibility === 'private') return 'private';
  return 'unknown';
}

function snapshotIdFromBody(body: unknown) {
  if (!body || typeof body !== 'object' || !('snapshotId' in body)) return 'unknown';
  const snapshotId = (body as { snapshotId?: unknown }).snapshotId;
  return typeof snapshotId === 'string' && snapshotId.trim() ? snapshotId : 'unknown';
}

function requestClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor ? forwardedFor.split(',')[0].trim() :
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         'unknown';
}

async function handleDownload(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  const endTimer = collectResponseTime('POST', '/api/v1/chains/[chainId]/download');
  const startTime = Date.now();
  const requestLog = extractRequestMetadata(request);
  let canonicalChainId = 'unknown';
  let requestedSnapshotId = 'unknown';
  let userId = 'anonymous';
  let tier = 'unknown';
  let clientIp = requestClientIp(request);
  
  try {
    const { chainId } = await params;
    canonicalChainId = getCanonicalChainId(chainId);
    const body = await request.json();
    requestedSnapshotId = snapshotIdFromBody(body);
    
    // Get user session from NextAuth
    const session = await auth();
    userId = session?.user?.id || 'anonymous';
    tier = getEffectiveAccessTier(session?.user?.tier || 'free');
    
    // Get client IP for restriction and download limits
    // Extract first IP from x-forwarded-for (can contain multiple IPs)
    clientIp = requestClientIp(request);
    
    // Check download limits
    const DAILY_LIMIT = parseInt(process.env.DAILY_DOWNLOAD_LIMIT || '5');
    const downloadCheck = await checkDownloadAllowed(clientIp, tier as 'free' | 'premium' | 'ultra' | 'unlimited', DAILY_LIMIT);
    
    if (!downloadCheck.allowed) {
      trackSnapshotDownloadUrlRequest(canonicalChainId, 'unknown', tier, 'unknown', 'rate_limited');
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Daily download limit exceeded',
          message: `This download pool is limited to ${DAILY_LIMIT} downloads per day. You have ${downloadCheck.remaining} downloads remaining. Limit resets at ${downloadCheck.resetTime.toUTCString()}.`,
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
      
      const responseTime = Date.now() - startTime;
      await recordDownloadEvent({
        eventType: 'url_denied',
        result: 'rate_limited',
        chainId: canonicalChainId,
        snapshotId: requestedSnapshotId,
        userId,
        tier,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        requestPath: request.nextUrl.pathname,
        requestMethod: request.method,
        httpStatus: 429,
        responseTimeMs: responseTime,
      });
      endTimer();
      trackRequest('POST', '/api/v1/chains/[chainId]/download', 429);
      logRequest({
        ...requestLog,
        method: request.method,
        userId,
        tier,
        responseStatus: 429,
        responseTime,
        error: 'Daily download limit exceeded',
      });
      
      return response;
    }
    
    // Validate request body
    const validationResult = downloadRequestSchema.safeParse(body);
    if (!validationResult.success) {
      trackSnapshotDownloadUrlRequest(canonicalChainId, 'unknown', tier, 'unknown', 'invalid');
      await recordDownloadEvent({
        eventType: 'url_failed',
        result: 'invalid',
        chainId: canonicalChainId,
        snapshotId: requestedSnapshotId,
        userId,
        tier,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        requestPath: request.nextUrl.pathname,
        requestMethod: request.method,
        httpStatus: 400,
        responseTimeMs: Date.now() - startTime,
        metadata: {
          validationErrors: validationResult.error.errors.map((error) => error.message),
        },
      });
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
    
    const snapshot = await getSnapshotFromCatalog(canonicalChainId, snapshotId, {
      id: session?.user?.id,
      role: session?.user?.role,
      tier,
    });
    
    if (!snapshot) {
      trackSnapshotDownloadUrlRequest(canonicalChainId, 'unknown', tier, 'unknown', 'not_found');
      await recordDownloadEvent({
        eventType: 'url_denied',
        result: 'not_found',
        chainId: canonicalChainId,
        snapshotId,
        userId,
        tier,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        requestPath: request.nextUrl.pathname,
        requestMethod: request.method,
        httpStatus: 404,
        responseTimeMs: Date.now() - startTime,
      });
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Snapshot not found',
          message: `Snapshot ${snapshotId} not found for chain ${chainId}`,
        },
        { status: 404 }
      );
    }
    if (!snapshot.isAccessible) {
      trackSnapshotDownloadUrlRequest(
        canonicalChainId,
        snapshot.databaseBackend,
        tier,
        snapshotVisibility(snapshot),
        'denied'
      );
      await recordDownloadEvent({
        eventType: 'url_denied',
        result: 'access_denied',
        chainId: canonicalChainId,
        storageChainId: snapshot.storageChainId || snapshot.chainId || canonicalChainId,
        snapshotId,
        fileName: snapshot.fileName,
        databaseBackend: snapshot.databaseBackend,
        visibility: snapshotVisibility(snapshot),
        snapshotHeight: snapshot.height,
        fileSizeBytes: snapshot.size,
        userId,
        tier,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        requestPath: request.nextUrl.pathname,
        requestMethod: request.method,
        httpStatus: 403,
        responseTimeMs: Date.now() - startTime,
      });
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Snapshot access denied',
          message: 'Your current tier or account does not have access to this snapshot.',
        },
        { status: 403 }
      );
    }

    const storageChainId = snapshot.storageChainId || snapshot.chainId || canonicalChainId;
    
    // Generate secure link URL with nginx (12 hour expiry by default)
    const downloadUrl = await generateDownloadUrl(
      storageChainId,
      snapshot.fileName,
      tier as 'free' | 'premium' | 'ultra' | 'unlimited',
      userId
    );
    const expiryHours = getTierDownloadExpiry(tier);
    const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000).toISOString();
    
    console.log(`Generated secure link URL for file: ${storageChainId}/${snapshot.fileName}`);
    
    // Increment download counter for free tier
    if (tier === 'free') {
      await incrementDailyDownload(clientIp);
    }
    
    // Log download for analytics
    await logDownload({
      snapshotId,
      chainId: canonicalChainId,
      userId,
      ip: clientIp,
      tier: tier as 'free' | 'premium' | 'ultra' | 'unlimited',
      timestamp: new Date(),
    });
    
    // Track download metrics
    trackDownload(tier, snapshotId);
    trackSnapshotDownloadUrlRequest(
      canonicalChainId,
      snapshot.databaseBackend,
      tier,
      snapshotVisibility(snapshot),
      'success'
    );

    await recordDownloadEvent({
      eventType: 'url_issued',
      result: 'success',
      chainId: canonicalChainId,
      storageChainId,
      snapshotId,
      fileName: snapshot.fileName,
      databaseBackend: snapshot.databaseBackend,
      visibility: snapshotVisibility(snapshot),
      snapshotHeight: snapshot.height,
      fileSizeBytes: snapshot.size,
      userId,
      tier,
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      requestPath: request.nextUrl.pathname,
      requestMethod: request.method,
      httpStatus: 200,
      responseTimeMs: Date.now() - startTime,
      downloadTokenHash: downloadTokenHashFromUrl(downloadUrl),
      signedUrlExpiresAt: expiresAt,
      metadata: {
        emailProvided: Boolean(email),
      },
    });
    
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
    
    const response = NextResponse.json<ApiResponse<{ downloadUrl: string; expiresAt: string }>>({
      success: true,
      data: { downloadUrl, expiresAt },
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
    const chainId = canonicalChainId === 'unknown'
      ? (await params.catch(() => ({ chainId: 'unknown' }))).chainId
      : canonicalChainId;
    trackSnapshotDownloadUrlRequest(chainId, 'unknown', tier, 'unknown', 'error');
    const response = NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to generate download URL',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
    
    await recordDownloadEvent({
      eventType: 'url_failed',
      result: 'error',
      chainId,
      snapshotId: requestedSnapshotId,
      userId,
      tier,
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      requestPath: request.nextUrl.pathname,
      requestMethod: request.method,
      httpStatus: 500,
      responseTimeMs: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
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
