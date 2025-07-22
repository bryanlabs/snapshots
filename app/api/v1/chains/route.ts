import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Chain } from '@/lib/types';
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { listChains } from '@/lib/nginx/operations';
import { config } from '@/lib/config';


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
};

export async function GET(request: NextRequest) {
  const endTimer = collectResponseTime('GET', '/api/v1/chains');
  const startTime = Date.now();
  const requestLog = extractRequestMetadata(request);
  
  try {
    let chains: Chain[];
    
    // Always try to fetch from nginx first
    try {
      console.log('Attempting to fetch chains from nginx...');
      console.log('nginx config:', {
        endpoint: process.env.NGINX_ENDPOINT,
        port: process.env.NGINX_PORT,
      });
      const chainInfos = await listChains();
      console.log('Chain infos from nginx:', chainInfos);
      
      // Map chain infos to Chain objects with metadata
      chains = chainInfos.map((chainInfo) => {
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
    } catch (nginxError) {
      console.error('Error fetching from nginx:', nginxError);
      console.error('Stack:', nginxError instanceof Error ? nginxError.stack : 'No stack');
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