import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { checkDownloadAllowed } from '@/lib/download/tracker';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    // Get user session from NextAuth
    const session = await auth();
    const tier = session?.user?.tier || 'free';
    
    // Get client IP
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') ||
                    'unknown';
    
    // Check download status
    const DAILY_LIMIT = parseInt(process.env.DAILY_DOWNLOAD_LIMIT || '5');
    const status = await checkDownloadAllowed(clientIp, tier as 'free' | 'premium' | 'unlimited', DAILY_LIMIT);
    
    return NextResponse.json<ApiResponse<{
      allowed: boolean;
      remaining: number;
      limit: number;
      resetTime: string;
      tier: string;
    }>>({
      success: true,
      data: {
        allowed: status.allowed,
        remaining: status.remaining,
        limit: (tier === 'premium' || tier === 'unlimited') ? -1 : DAILY_LIMIT,
        resetTime: status.resetTime.toISOString(),
        tier,
      },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to get download status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}