import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { listSnapshots } from '@/lib/nginx/operations';
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { extractRequestMetadata, logRequest } from '@/lib/middleware/logger';

interface ChainMetadata {
  chain_id: string;
  latest_snapshot: {
    height: number;
    size: number;
    age_hours: number;
  } | null;
  snapshot_schedule: string;
  average_size: number;
  compression_ratio: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  const endTimer = collectResponseTime('GET', '/api/v1/chains/{chainId}/info');
  const startTime = Date.now();
  const requestLog = extractRequestMetadata(request);
  
  try {
    const { chainId } = await params;
    
    // Fetch all snapshots for this chain from nginx
    console.log(`Fetching chain metadata for: ${chainId}`);
    const nginxSnapshots = await listSnapshots(chainId);
    
    // Filter only actual snapshot files
    const validSnapshots = nginxSnapshots.filter(s => 
      s.filename.endsWith('.tar.zst') || s.filename.endsWith('.tar.lz4')
    );
    
    if (validSnapshots.length === 0) {
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Chain not found',
          message: `No snapshots found for chain ID ${chainId}`,
        },
        { status: 404 }
      );
      
      endTimer();
      trackRequest('GET', '/api/v1/chains/{chainId}/info', 404);
      logRequest({
        ...requestLog,
        responseStatus: 404,
        responseTime: Date.now() - startTime,
      });
      
      return response;
    }
    
    // Sort snapshots by last modified date (newest first)
    validSnapshots.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    
    // Get latest snapshot info
    const latestSnapshot = validSnapshots[0];
    const heightMatch = latestSnapshot.filename.match(/(\d+)\.tar\.(zst|lz4)$/);
    const height = heightMatch ? parseInt(heightMatch[1]) : 0;
    
    // Calculate age in hours
    const ageMs = Date.now() - latestSnapshot.lastModified.getTime();
    const ageHours = Math.round(ageMs / (1000 * 60 * 60));
    
    // Calculate average size
    const totalSize = validSnapshots.reduce((sum, snapshot) => sum + snapshot.size, 0);
    const averageSize = Math.round(totalSize / validSnapshots.length);
    
    // Estimate compression ratio
    // Typical blockchain data compresses to about 30-40% of original size
    // We'll use the file extension to provide a more accurate estimate
    let compressionRatio = 0.35; // Default 35%
    if (latestSnapshot.filename.endsWith('.zst')) {
      compressionRatio = 0.30; // Zstandard typically achieves better compression
    } else if (latestSnapshot.filename.endsWith('.lz4')) {
      compressionRatio = 0.40; // LZ4 prioritizes speed over compression ratio
    }
    
    const metadata: ChainMetadata = {
      chain_id: chainId,
      latest_snapshot: {
        height,
        size: latestSnapshot.size,
        age_hours: ageHours,
      },
      snapshot_schedule: 'every 6 hours', // Hardcoded as requested
      average_size: averageSize,
      compression_ratio: compressionRatio,
    };
    
    const response = NextResponse.json<ApiResponse<ChainMetadata>>({
      success: true,
      data: metadata,
    });
    
    endTimer();
    trackRequest('GET', '/api/v1/chains/{chainId}/info', 200);
    logRequest({
      ...requestLog,
      responseStatus: 200,
      responseTime: Date.now() - startTime,
    });
    
    return response;
  } catch (error) {
    const response = NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch chain metadata',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
    
    endTimer();
    trackRequest('GET', '/api/v1/chains/{chainId}/info', 500);
    logRequest({
      ...requestLog,
      responseStatus: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return response;
  }
}