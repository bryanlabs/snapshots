import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Snapshot } from '@/lib/types';
import { listSnapshots } from '@/lib/nginx/operations';
import { config } from '@/lib/config';
import { cache, cacheKeys } from '@/lib/cache/redis-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    
    // Use cache for snapshots with shorter TTL
    const snapshots = await cache.getOrSet<Snapshot[]>(
      cacheKeys.chainSnapshots(chainId),
      async () => {
        // Fetch real snapshots from nginx
        console.log(`Fetching snapshots for chain: ${chainId}`);
        const nginxSnapshots = await listSnapshots(chainId);
        console.log(`Found ${nginxSnapshots.length} snapshots from nginx`);
        
        // Transform nginx snapshots to match our Snapshot type
        return nginxSnapshots
          .map((s, index) => {
            // Extract height from filename (e.g., noble-1-0.tar.zst -> 0)
            const heightMatch = s.filename.match(/(\d+)\.tar\.(zst|lz4)$/);
            const height = heightMatch ? parseInt(heightMatch[1]) : s.height || 0;
            
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
          .sort((a, b) => b.height - a.height); // Sort by height descending
      },
      {
        ttl: 60, // 1 minute cache for snapshot lists
        tags: ['snapshots', `chain:${chainId}`],
      }
    );
    
    return NextResponse.json<ApiResponse<Snapshot[]>>({
      success: true,
      data: snapshots,
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