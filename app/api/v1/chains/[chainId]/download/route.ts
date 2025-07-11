import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, DownloadRequest } from '@/lib/types';
import { getPresignedUrl } from '@/lib/minio/client';
import { config } from '@/lib/config';
import { z } from 'zod';
import { withRateLimit } from '@/lib/middleware/rateLimiter';
import { collectResponseTime, trackRequest, trackDownload } from '@/lib/monitoring/metrics';
import { logDownload, extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { bandwidthManager } from '@/lib/bandwidth/manager';
import { getIronSession } from 'iron-session';
import { User } from '@/types/user';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

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
    
    // Get user session
    const cookieStore = await cookies();
    const session = await getIronSession<User>(cookieStore, sessionOptions);
    const userId = session?.username || 'anonymous';
    const tier = session?.tier || 'free';
    
    // Check bandwidth limits
    if (bandwidthManager.hasExceededLimit(userId, tier as 'free' | 'premium')) {
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Bandwidth limit exceeded',
          message: 'You have exceeded your monthly bandwidth limit',
        },
        { status: 429 }
      );
      
      endTimer();
      trackRequest('POST', '/api/v1/chains/[chainId]/download', 429);
      logRequest({
        ...requestLog,
        userId,
        tier,
        responseStatus: 429,
        responseTime: Date.now() - startTime,
        error: 'Bandwidth limit exceeded',
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
    
    // TODO: Implement actual database query to get snapshot details
    // const snapshot = await db.snapshot.findUnique({ 
    //   where: { id: snapshotId, chainId } 
    // });
    
    // Mock snapshot for demonstration
    const snapshot = {
      id: snapshotId,
      chainId,
      fileName: `${chainId}-snapshot.tar.lz4`,
    };
    
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
    
    // Get client IP for restriction
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') ||
                    'unknown';
    
    // Generate presigned URL for download with metadata and IP restriction
    const downloadUrl = await getPresignedUrl(
      config.minio.bucketName,
      snapshot.fileName,
      300, // 5 minutes expiry as per PRD
      {
        tier,
        ip: clientIp.split(',')[0].trim(), // Use first IP if multiple
        userId
      }
    );
    
    // Track download metrics
    trackDownload(tier, snapshotId);
    
    // Log download event
    logDownload(userId, snapshotId, tier, true);
    
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
    
    // Create connection ID for bandwidth tracking
    const connectionId = `${userId}-${snapshotId}-${Date.now()}`;
    bandwidthManager.startConnection(connectionId, userId, tier as 'free' | 'premium');
    
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
export const POST = withRateLimit(handleDownload, 'download');