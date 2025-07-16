import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Chain } from '@/lib/types';
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { listChains, listSnapshots } from '@/lib/minio/operations';
import { config } from '@/lib/config';


// Chain metadata mapping - enhance MinIO data with names and logos
const chainMetadata: Record<string, { name: string; logoUrl: string }> = {
  'noble-1': {
    name: 'Noble',
    logoUrl: '/chains/noble.png',
  },
  'cosmoshub-4': {
    name: 'Cosmos Hub',
    logoUrl: '/chains/cosmos.png',
  },
  'osmosis-1': {
    name: 'Osmosis',
    logoUrl: '/chains/osmosis.png',
  },
  'juno-1': {
    name: 'Juno',
    logoUrl: '/chains/juno.png',
  },
  'kaiyo-1': {
    name: 'Kujira',
    logoUrl: '/chains/kujira.png',
  },
  'columbus-5': {
    name: 'Terra Classic',
    logoUrl: '/chains/terra.png',
  },
  'phoenix-1': {
    name: 'Terra',
    logoUrl: '/chains/terra2.png',
  },
  'thorchain-1': {
    name: 'THORChain',
    logoUrl: '/chains/thorchain.png',
  },
};

export async function GET(request: NextRequest) {
  const endTimer = collectResponseTime('GET', '/api/v1/chains');
  const startTime = Date.now();
  const requestLog = extractRequestMetadata(request);
  
  try {
    let chains: Chain[];
    
    // Always try to fetch from MinIO first
    try {
      console.log('Attempting to fetch chains from MinIO...');
      console.log('MinIO config:', {
        endpoint: config.minio.endPoint,
        port: config.minio.port,
        bucket: config.minio.bucketName,
      });
      const chainIds = await listChains(config.minio.bucketName);
      console.log('Chain IDs from MinIO:', chainIds);
      
      // Map chain IDs to Chain objects with metadata and snapshot counts
      chains = await Promise.all(chainIds.map(async (chainId) => {
        const metadata = chainMetadata[chainId] || {
          name: chainId,
          logoUrl: '/chains/placeholder.svg',
        };
        
        // Fetch snapshots for this chain to get count and latest info
        let snapshotCount = 0;
        let latestSnapshot = undefined;
        try {
          const snapshots = await listSnapshots(config.minio.bucketName, chainId);
          // Only count actual snapshot files (.tar.zst or .tar.lz4)
          const validSnapshots = snapshots.filter(s => 
            s.fileName.endsWith('.tar.zst') || s.fileName.endsWith('.tar.lz4')
          );
          snapshotCount = validSnapshots.length;
          
          // Get latest snapshot info
          if (validSnapshots.length > 0) {
            // Sort by last modified date to find the most recent
            const sortedSnapshots = validSnapshots.sort((a, b) => 
              new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
            );
            
            const latest = sortedSnapshots[0];
            const compressionMatch = latest.fileName.match(/\.tar\.(zst|lz4)$/);
            const compressionType = compressionMatch ? compressionMatch[1] : 'none';
            
            latestSnapshot = {
              size: latest.size,
              lastModified: latest.lastModified,
              compressionType: compressionType as 'lz4' | 'zst' | 'none',
            };
          }
        } catch (error) {
          console.error(`Error fetching snapshots for ${chainId}:`, error);
        }
        
        return {
          id: chainId,
          name: metadata.name,
          network: chainId,
          logoUrl: metadata.logoUrl,
          // Include basic snapshot info for the chain card
          snapshotCount: snapshotCount,
          latestSnapshot: latestSnapshot,
        };
      }));
    } catch (minioError) {
      console.error('Error fetching from MinIO:', minioError);
      console.error('Stack:', minioError instanceof Error ? minioError.stack : 'No stack');
      // Return empty array on error
      chains = [];
    }
    
    const response = NextResponse.json<ApiResponse<Chain[]>>({
      success: true,
      data: chains,
    });
    
    endTimer();
    trackRequest('GET', '/api/v1/chains', 200);
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
        error: 'Failed to fetch chains',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
    
    endTimer();
    trackRequest('GET', '/api/v1/chains', 500);
    logRequest({
      ...requestLog,
      responseStatus: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return response;
  }
}