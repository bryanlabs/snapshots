import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { getLatestSnapshot, generateDownloadUrl } from '@/lib/nginx/operations';
import { extractHeightFromFilename } from '@/lib/config/supported-formats';
import { config } from '@/lib/config';
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { auth } from '@/auth';
import { getCanonicalChainId } from '@/lib/config/chains';

interface LatestSnapshotResponse {
  chain_id: string;
  height: number;
  size: number;
  compression: 'lz4' | 'zst' | 'none';
  url: string;
  expires_at: string;
  tier: 'free' | 'premium' | 'unlimited';
  checksum?: string;
  database_backend?: string;
  database_label?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  const endTimer = collectResponseTime('GET', '/api/v1/chains/[chainId]/snapshots/latest');
  const startTime = Date.now();
  const requestLog = extractRequestMetadata(request);
  
  try {
    const { chainId } = await params;
    const canonicalChainId = getCanonicalChainId(chainId);
    
    // Determine tier based on authentication
    const session = await auth();
    const tier = session?.user?.tier || 'free';
    const userId = session?.user?.id || 'anonymous';
    
    // Fetch latest snapshot from nginx
    console.log(`Fetching latest snapshot for chain: ${canonicalChainId}`);
    const latestSnapshot = await getLatestSnapshot(canonicalChainId);
    
    if (!latestSnapshot) {
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No snapshots found',
          message: `No snapshots available for chain ${canonicalChainId}`,
        },
        { status: 404 }
      );
      
      endTimer();
      trackRequest('GET', '/api/v1/chains/[chainId]/snapshots/latest', 404);
      logRequest({
        ...requestLog,
        userId,
        tier,
        responseStatus: 404,
        responseTime: Date.now() - startTime,
        error: 'No snapshots found',
      });
      
      return response;
    }
    
    // Generate secure link URL
    // Use different expiry times based on tier
    const expiryHours = (tier === 'premium' || tier === 'unlimited') ? 24 : 1; // 24 hours for premium/unlimited, 1 hour for free
    const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000);
    
    const downloadUrl = await generateDownloadUrl(
      latestSnapshot.storageChainId || canonicalChainId,
      latestSnapshot.filename,
      tier,
      userId
    );
    
    console.log(`Generated secure link for ${latestSnapshot.storageChainId || canonicalChainId}/${latestSnapshot.filename}, tier: ${tier}, expires: ${expiresAt.toISOString()}`);
    
    // Extract height from snapshot if not already set
    const height = latestSnapshot.height || extractHeightFromFilename(latestSnapshot.filename) || 0;
    
    // Prepare response
    const responseData: LatestSnapshotResponse = {
      chain_id: canonicalChainId,
      height,
      size: latestSnapshot.size,
      compression: latestSnapshot.compressionType || 'zst',
      url: downloadUrl,
      expires_at: expiresAt.toISOString(),
      tier,
      database_backend: latestSnapshot.databaseBackend,
      database_label: latestSnapshot.databaseLabel,
    };
    
    const response = NextResponse.json<ApiResponse<LatestSnapshotResponse>>({
      success: true,
      data: responseData,
      message: 'Latest snapshot URL generated successfully',
    });
    
    endTimer();
    trackRequest('GET', '/api/v1/chains/[chainId]/snapshots/latest', 200);
    logRequest({
      ...requestLog,
      userId,
      tier,
      responseStatus: 200,
      responseTime: Date.now() - startTime,
    });
    
    return response;
  } catch (error) {
    console.error('Error generating latest snapshot URL:', error);
    
    const response = NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to generate snapshot URL',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
    
    endTimer();
    trackRequest('GET', '/api/v1/chains/[chainId]/snapshots/latest', 500);
    logRequest({
      ...requestLog,
      responseStatus: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return response;
  }
}
