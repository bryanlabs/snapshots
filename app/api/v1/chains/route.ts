import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Chain } from '@/lib/types';
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { listChains } from '@/lib/nginx/operations';
import { config } from '@/lib/config';
import { getChainConfig } from '@/lib/config/chains';

export async function GET(request: NextRequest) {
  const endTimer = collectResponseTime('GET', '/api/v1/chains');
  const startTime = Date.now();
  const requestLog = extractRequestMetadata(request);
  
  try {
    // Fetch from nginx
    console.log('Fetching chains from nginx...');
    const chainInfos = await listChains();
    console.log('Chain infos from nginx:', chainInfos);
    
    // Map chain infos to Chain objects with metadata from centralized config
    const chains = chainInfos.map((chainInfo) => {
      const chainConfig = getChainConfig(chainInfo.chainId);
      
      return {
        id: chainInfo.chainId,
        name: chainConfig.name,
        network: chainInfo.chainId,
        logoUrl: chainConfig.logoUrl,
        accentColor: chainConfig.accentColor,
        // Include basic snapshot info for the chain card
        snapshotCount: chainInfo.snapshotCount,
        latestSnapshot: chainInfo.latestSnapshot ? {
          size: chainInfo.latestSnapshot.size,
          lastModified: chainInfo.latestSnapshot.lastModified.toISOString(),
          compressionType: chainInfo.latestSnapshot.compressionType || 'zst',
        } : undefined,
      };
    });

    // Filter out empty chains if configured to hide them
    const filteredChains = config.features.showEmptyChains 
      ? chains 
      : chains.filter(chain => chain.snapshotCount > 0);
    
    const response = NextResponse.json<ApiResponse<Chain[]>>({
      success: true,
      data: filteredChains,
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