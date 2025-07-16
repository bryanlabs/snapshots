import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Snapshot } from '@/lib/types';
import { listSnapshots } from '@/lib/minio/operations';
import { config } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    
    // Fetch real snapshots from MinIO
    console.log(`Fetching snapshots for chain: ${chainId} from bucket: ${config.minio.bucketName}`);
    const minioSnapshots = await listSnapshots(config.minio.bucketName, chainId);
    console.log(`Found ${minioSnapshots.length} snapshots from MinIO`);
    
    // Transform MinIO snapshots to match our Snapshot type
    const snapshots = minioSnapshots
      .filter(s => s.fileName.endsWith('.tar.zst') || s.fileName.endsWith('.tar.lz4'))
      .map((s, index) => {
        // Extract height from filename (e.g., noble-1-0.tar.zst -> 0)
        const heightMatch = s.fileName.match(/(\d+)\.tar\.(zst|lz4)$/);
        const height = heightMatch ? parseInt(heightMatch[1]) : 0;
        
        return {
          id: `${chainId}-snapshot-${index}`,
          chainId: chainId,
          height: height,
          size: s.size,
          fileName: s.fileName,
          createdAt: s.lastModified,
          updatedAt: s.lastModified,
          type: 'pruned' as const, // Default to pruned, could be determined from metadata
          compressionType: s.fileName.endsWith('.zst') ? 'zst' as const : 'lz4' as const,
        };
      })
      .sort((a, b) => b.height - a.height); // Sort by height descending
    
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