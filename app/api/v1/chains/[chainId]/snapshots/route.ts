import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Snapshot } from '@/lib/types';
import { getUserSession, getGuestUserTier } from '@/lib/auth/user-session';
import { getCanonicalChainId } from '@/lib/config/chains';
import { buildSnapshotCatalog } from '@/lib/snapshots/custom-catalog';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    const canonicalChainId = getCanonicalChainId(chainId);
    
    // Get user session and tier
    const userSession = await getUserSession();
    const userTier = userSession.user?.tier || getGuestUserTier();
    
    console.log(`Fetching snapshots for chain: ${canonicalChainId}`);
    const snapshots = await buildSnapshotCatalog(canonicalChainId, userSession.user);
    console.log(`Found ${snapshots.length} visible snapshots for ${canonicalChainId}`);
    
    return NextResponse.json<ApiResponse<Snapshot[]>>({
      success: true,
      data: snapshots.map((snapshot) => ({
        ...snapshot,
        createdAt: new Date(snapshot.createdAt),
        updatedAt: new Date(snapshot.updatedAt),
        userTier,
      })),
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch snapshots',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
