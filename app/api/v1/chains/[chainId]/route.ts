import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Chain } from '@/lib/types';

// Mock data - replace with actual database queries
const mockChains: Record<string, Chain> = {
  'cosmos-hub': {
    id: 'cosmos-hub',
    name: 'Cosmos Hub',
    network: 'cosmoshub-4',
    description: 'The Cosmos Hub is the first of thousands of interconnected blockchains.',
    logoUrl: '/chains/cosmos.png',
  },
  'osmosis': {
    id: 'osmosis',
    name: 'Osmosis',
    network: 'osmosis-1',
    description: 'Osmosis is an advanced AMM protocol for interchain assets.',
    logoUrl: '/chains/osmosis.png',
  },
  'juno': {
    id: 'juno',
    name: 'Juno',
    network: 'juno-1',
    description: 'Juno is a sovereign public blockchain in the Cosmos ecosystem.',
    logoUrl: '/chains/juno.png',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    
    // TODO: Implement actual database query
    // const chain = await db.chain.findUnique({ where: { id: chainId } });
    
    const chain = mockChains[chainId];
    
    if (!chain) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Chain not found',
          message: `Chain with ID ${chainId} not found`,
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json<ApiResponse<Chain>>({
      success: true,
      data: chain,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch chain',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}