import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { getDownloadStats, getRecentDownloads } from '@/lib/download/tracker';
import { withAdminAuth } from '@/lib/auth/admin-middleware';

async function handleGetDownloads(request: NextRequest) {
  try {
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId');
    
    // Get download statistics
    const [stats, recentDownloads] = await Promise.all([
      getDownloadStats(),
      chainId ? getRecentDownloads(chainId, 20) : Promise.resolve([]),
    ]);
    
    return NextResponse.json<ApiResponse<{
      stats: any;
      recentDownloads?: any[];
    }>>({
      success: true,
      data: {
        stats,
        ...(chainId && { recentDownloads }),
      },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to get download statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(handleGetDownloads);