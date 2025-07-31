import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Chain } from '@/lib/types';
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { listChains } from '@/lib/nginx/operations';
import { config } from '@/lib/config';
import { cache, cacheKeys } from '@/lib/cache/redis-cache';


// Chain metadata mapping - enhance nginx data with names and logos
const chainMetadata: Record<string, { name: string; logoUrl: string; accentColor: string }> = {
  'noble-1': {
    name: 'Noble',
    logoUrl: '/chains/noble.png',
    accentColor: '#FFB800', // gold
  },
  'cosmoshub-4': {
    name: 'Cosmos Hub',
    logoUrl: '/chains/cosmos.png',
    accentColor: '#5E72E4', // indigo
  },
  'osmosis-1': {
    name: 'Osmosis',
    logoUrl: '/chains/osmosis.png',
    accentColor: '#9945FF', // purple
  },
  'juno-1': {
    name: 'Juno',
    logoUrl: '/chains/juno.png',
    accentColor: '#3B82F6', // blue (default)
  },
  'kaiyo-1': {
    name: 'Kujira',
    logoUrl: '/chains/kujira.png',
    accentColor: '#DC3545', // red
  },
  'columbus-5': {
    name: 'Terra Classic',
    logoUrl: '/chains/terra.png',
    accentColor: '#FF6B6B', // orange
  },
  'phoenix-1': {
    name: 'Terra',
    logoUrl: '/chains/terra2.png',
    accentColor: '#FF6B6B', // orange
  },
  'thorchain-1': {
    name: 'THORChain',
    logoUrl: '/chains/thorchain.png',
    accentColor: '#00D4AA', // teal
  },
  'agoric-3': {
    name: 'Agoric',
    logoUrl: '/chains/agoric.png',
    accentColor: '#DB2777', // pink
  },
};

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
        
        // Map chain infos to Chain objects with metadata
        return chainInfos.map((chainInfo) => {
          const metadata = chainMetadata[chainInfo.chainId] || {
            name: chainInfo.chainId,
            logoUrl: '/chains/placeholder.svg',
            accentColor: '#3B82F6', // default blue
          };
          
          return {
            id: chainInfo.chainId,
            name: metadata.name,
            network: chainInfo.chainId,
            logoUrl: metadata.logoUrl,
            accentColor: metadata.accentColor,
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