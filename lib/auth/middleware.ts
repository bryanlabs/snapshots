import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './session';
import { ApiResponse } from '../types';

export async function requireAuth(request: NextRequest) {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
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

export async function requireAdmin(request: NextRequest) {
  const session = await getSession();
  
  if (!session.isLoggedIn || session.user?.role !== 'admin') {
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