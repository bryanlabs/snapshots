import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Chain } from '@/lib/types';
import { getCanonicalChainId, getChainConfig, isSnapshotChainConfigured } from '@/lib/config/chains';
import { listChains } from '@/lib/nginx/operations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    const canonicalChainId = getCanonicalChainId(chainId);

    if (!isSnapshotChainConfigured(canonicalChainId)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Chain not found',
          message: `Chain with ID ${chainId} not found`,
        },
        { status: 404 }
      );
    }

    const chains = await listChains();
    const chain = chains.find((entry) => entry.chainId === canonicalChainId);
    
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
    
    return NextResponse.json<ApiResponse<Chain & { totalSize: number }>>({
      success: true,
      data: {
        id: chain.chainId,
        name: getChainConfig(chain.chainId).name,
        network: chain.chainId,
        logoUrl: getChainConfig(chain.chainId).logoUrl,
        accentColor: getChainConfig(chain.chainId).accentColor,
        snapshotCount: chain.snapshotCount,
        latestSnapshot: chain.latestSnapshot ? {
          size: chain.latestSnapshot.size,
          lastModified: chain.latestSnapshot.lastModified.toISOString(),
          compressionType: (chain.latestSnapshot.compressionType || 'zst') as NonNullable<Chain['latestSnapshot']>['compressionType'],
        } : undefined,
        totalSize: chain.totalSize,
      },
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
