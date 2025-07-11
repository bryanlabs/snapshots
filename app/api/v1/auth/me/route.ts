import { NextResponse } from 'next/server';
import { ApiResponse, User } from '@/lib/types';
import { getUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Not authenticated',
          message: 'No active session found',
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: user,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to get user info',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}