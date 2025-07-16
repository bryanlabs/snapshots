import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { checkDownloadAllowed } from '@/lib/download/tracker';
import { getIronSession } from 'iron-session';
import { User } from '@/types/user';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const cookieStore = await cookies();
    const session = await getIronSession<User>(cookieStore, sessionOptions);
    const tier = session?.tier || 'free';
    
    // Get client IP
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') ||
                    'unknown';
    
    // Check download status
    const DAILY_LIMIT = parseInt(process.env.DAILY_DOWNLOAD_LIMIT || '5');
    const status = await checkDownloadAllowed(clientIp, tier as 'free' | 'premium', DAILY_LIMIT);
    
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
        limit: tier === 'premium' ? -1 : DAILY_LIMIT,
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