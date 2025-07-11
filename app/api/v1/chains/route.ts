import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Chain } from '@/lib/types';
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { extractRequestMetadata, logRequest } from '@/lib/middleware/logger';

// Mock data - replace with actual database queries
const mockChains: Chain[] = [
  {
    id: 'cosmos-hub',
    name: 'Cosmos Hub',
    network: 'cosmoshub-4',
    description: 'The Cosmos Hub is the first of thousands of interconnected blockchains.',
    logoUrl: '/chains/cosmos.png',
  },
  {
    id: 'osmosis',
    name: 'Osmosis',
    network: 'osmosis-1',
    description: 'Osmosis is an advanced AMM protocol for interchain assets.',
    logoUrl: '/chains/osmosis.png',
  },
  {
    id: 'juno',
    name: 'Juno',
    network: 'juno-1',
    description: 'Juno is a sovereign public blockchain in the Cosmos ecosystem.',
    logoUrl: '/chains/juno.png',
  },
];

export async function GET(request: NextRequest) {
  const endTimer = collectResponseTime('GET', '/api/v1/chains');
  const startTime = Date.now();
  const requestLog = extractRequestMetadata(request);
  
  try {
    // TODO: Implement actual database query
    // const chains = await db.chain.findMany();
    
    const response = NextResponse.json<ApiResponse<Chain[]>>({
      success: true,
      data: mockChains,
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