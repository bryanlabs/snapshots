import { NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { logout } from '@/lib/auth/session';

export async function POST() {
  try {
    await logout();
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}