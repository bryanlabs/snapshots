import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { getPresignedUrl } from '@/lib/minio/client';
import { listSnapshots } from '@/lib/minio/operations';
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
    
    // Fetch snapshots from MinIO
    console.log(`Fetching latest snapshot for chain: ${chainId}`);
    const minioSnapshots = await listSnapshots(config.minio.bucketName, chainId);
    
    if (minioSnapshots.length === 0) {
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
    
    // Filter valid snapshots and sort by height (extracted from filename)
    const validSnapshots = minioSnapshots
      .filter(s => s.fileName.endsWith('.tar.zst') || s.fileName.endsWith('.tar.lz4'))
      .map(s => {
        const heightMatch = s.fileName.match(/(\d+)\.tar\.(zst|lz4)$/);
        const height = heightMatch ? parseInt(heightMatch[1]) : 0;
        const compressionType = heightMatch ? heightMatch[2] : 'none';
        
        return {
          ...s,
          height,
          compressionType: compressionType as 'lz4' | 'zst' | 'none',
        };
      })
      .sort((a, b) => b.height - a.height);
    
    if (validSnapshots.length === 0) {
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No valid snapshots found',
          message: `No valid snapshots available for chain ${chainId}`,
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
        error: 'No valid snapshots found',
      });
      
      return response;
    }
    
    // Get the latest snapshot (highest height)
    const latestSnapshot = validSnapshots[0];
    const objectName = `${chainId}/${latestSnapshot.fileName}`;
    
    // Generate presigned URL
    // Use different expiry times based on tier
    const expirySeconds = tier === 'premium' ? 86400 : 3600; // 24 hours for premium, 1 hour for free
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);
    
    const downloadUrl = await getPresignedUrl(
      config.minio.bucketName,
      objectName,
      expirySeconds,
      {
        tier,
        userId,
      }
    );
    
    console.log(`Generated presigned URL for ${objectName}, tier: ${tier}, expires: ${expiresAt.toISOString()}`);
    
    // Prepare response
    const responseData: LatestSnapshotResponse = {
      chain_id: chainId,
      height: latestSnapshot.height,
      size: latestSnapshot.size,
      compression: latestSnapshot.compressionType,
      url: downloadUrl,
      expires_at: expiresAt.toISOString(),
      tier,
      checksum: latestSnapshot.etag, // Using etag as checksum
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