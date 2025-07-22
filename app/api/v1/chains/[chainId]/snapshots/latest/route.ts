import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { getLatestSnapshot, generateDownloadUrl } from '@/lib/nginx/operations';
import { config } from '@/lib/config';
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { getUserFromJWT } from '@/lib/auth/jwt';

interface LatestSnapshotResponse {
  chain_id: string;
  height: number;
  size: number;
  compression: 'lz4' | 'zst' | 'none';
  url: string;
  expires_at: string;
  tier: 'free' | 'premium';
  checksum?: string;
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
    
    // Determine tier based on authentication
    let tier: 'free' | 'premium' = 'free';
    let userId = 'anonymous';
    
    // Check for JWT Bearer token
    const jwtUser = await getUserFromJWT(request);
    if (jwtUser) {
      tier = jwtUser.tier || 'premium';
      userId = jwtUser.id;
    }
    
    // Fetch latest snapshot from nginx
    console.log(`Fetching latest snapshot for chain: ${chainId}`);
    const latestSnapshot = await getLatestSnapshot(chainId);
    
    if (!latestSnapshot) {
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No snapshots found',
          message: `No snapshots available for chain ${chainId}`,
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
    const expiryHours = tier === 'premium' ? 24 : 1; // 24 hours for premium, 1 hour for free
    const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000);
    
    const downloadUrl = await generateDownloadUrl(
      chainId,
      latestSnapshot.filename,
      tier,
      userId
    );
    
    console.log(`Generated secure link for ${chainId}/${latestSnapshot.filename}, tier: ${tier}, expires: ${expiresAt.toISOString()}`);
    
    // Extract height from snapshot if not already set
    let height = latestSnapshot.height || 0;
    if (!height) {
      const heightMatch = latestSnapshot.filename.match(/(\d+)\.tar\.(zst|lz4)$/);
      height = heightMatch ? parseInt(heightMatch[1]) : 0;
    }
    
    // Prepare response
    const responseData: LatestSnapshotResponse = {
      chain_id: chainId,
      height,
      size: latestSnapshot.size,
      compression: latestSnapshot.compressionType || 'zst',
      url: downloadUrl,
      expires_at: expiresAt.toISOString(),
      tier,
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