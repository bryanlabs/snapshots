import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { getDownloadStats, getRecentDownloads } from '@/lib/download/tracker';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated as premium (admin)
    const session = await auth();
    
    if (!session?.user || session.user.tier !== 'premium') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Admin access required',
        },
        { status: 401 }
      );
    }
    
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