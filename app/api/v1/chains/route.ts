import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Chain } from '@/lib/types';
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { listChains } from '@/lib/nginx/operations';
import { config } from '@/lib/config';
import { cache, cacheKeys } from '@/lib/cache/redis-cache';
import { getChainConfig } from '@/lib/config/chains';

export async function GET(request: NextRequest) {
  const endTimer = collectResponseTime('GET', '/api/v1/chains');
  const startTime = Date.now();
  const requestLog = extractRequestMetadata(request);
  
  try {
    // Use cache with stale-while-revalidate pattern
    const chains = await cache.staleWhileRevalidate<Chain[]>(
      cacheKeys.chains(),
      async () => {
        // Fetch from nginx
        console.log('Fetching chains from nginx...');
        const chainInfos = await listChains();
        console.log('Chain infos from nginx:', chainInfos);
        
        // Map chain infos to Chain objects with metadata from centralized config
        return chainInfos.map((chainInfo) => {
          const config = getChainConfig(chainInfo.chainId);
          
          return {
            id: chainInfo.chainId,
            name: config.name,
            network: chainInfo.chainId,
            logoUrl: config.logoUrl,
            accentColor: config.accentColor,
            // Include basic snapshot info for the chain card
            snapshotCount: chainInfo.snapshotCount,
            latestSnapshot: chainInfo.latestSnapshot ? {
              size: chainInfo.latestSnapshot.size,
              lastModified: chainInfo.latestSnapshot.lastModified.toISOString(),
              compressionType: chainInfo.latestSnapshot.compressionType || 'zst',
            } : undefined,
          };
        });
      },
      {
        ttl: 300, // 5 minutes fresh
        staleTime: 3600, // 1 hour stale
        tags: ['chains'],
      }
    );
    
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