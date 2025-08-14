import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Snapshot } from '@/lib/types';
import { listSnapshots } from '@/lib/nginx/operations';
import { extractHeightFromFilename } from '@/lib/config/supported-formats';
import { config } from '@/lib/config';
import { getUserSession, getGuestUserTier } from '@/lib/auth/user-session';
import { canAccessSnapshot } from '@/lib/utils/tier';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    
    // Get user session and tier
    const userSession = await getUserSession();
    const userTier = userSession.user?.tier || getGuestUserTier();
    
    // Fetch real snapshots from nginx
    console.log(`Fetching snapshots for chain: ${chainId}`);
    const nginxSnapshots = await listSnapshots(chainId);
    console.log(`Found ${nginxSnapshots.length} snapshots from nginx`);
    
    // Transform nginx snapshots to match our Snapshot type
    const allSnapshots = nginxSnapshots
      .map((s, index) => {
        // Extract height from filename (e.g., noble-1-0.tar.zst -> 0)
        const height = extractHeightFromFilename(s.filename) || s.height || 0;
        
        return {
          id: `${chainId}-snapshot-${index}`,
          chainId: chainId,
          height: height,
          size: s.size,
          fileName: s.filename,
          createdAt: s.lastModified.toISOString(),
          updatedAt: s.lastModified.toISOString(),
          type: 'pruned' as const, // Default to pruned, could be determined from metadata
          compressionType: s.compressionType || 'zst' as const,
        };
      })
      .sort((a, b) => {
        // Sort by createdAt (newest first)
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    
    // Filter snapshots based on user tier access
    const accessibleSnapshots = allSnapshots.filter(snapshot => 
      canAccessSnapshot(snapshot, userTier)
    );
    
    // Add access metadata to snapshots for UI
    const snapshotsWithAccessInfo = allSnapshots.map(snapshot => ({
      ...snapshot,
      isAccessible: canAccessSnapshot(snapshot, userTier),
      userTier: userTier,
    }));
    
    return NextResponse.json<ApiResponse<Snapshot[]>>({
      success: true,
      data: snapshotsWithAccessInfo,
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