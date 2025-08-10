import { NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';

// This endpoint is deprecated - use NextAuth endpoints instead
export async function POST() {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: 'Deprecated endpoint',
      message: 'This legacy authentication endpoint is deprecated. Please use the NextAuth endpoints at /api/auth/*',
    },
    { status: 410 } // 410 Gone
  );
}