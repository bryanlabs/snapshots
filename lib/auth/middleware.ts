import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiResponse } from '../types';

export async function requireAuth(_request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Please login to access this resource',
      },
      { status: 401 }
    );
  }
  
  return null; // Continue with the request
}

export async function requireAdmin(_request: NextRequest) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Forbidden',
        message: 'Admin access required',
      },
      { status: 403 }
    );
  }
  
  return null; // Continue with the request
}
