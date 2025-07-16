import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { createJWT } from '@/lib/auth/jwt';
import { getSession } from '@/lib/auth/session';

interface TokenResponse {
  token: string;
  expires_in: number;
  token_type: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is logged in via session
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Please login to generate API token',
        },
        { status: 401 }
      );
    }
    
    // Generate JWT token for the logged-in user
    const token = await createJWT(session.user);
    
    const response: TokenResponse = {
      token,
      expires_in: 604800, // 7 days in seconds
      token_type: 'Bearer',
    };
    
    return NextResponse.json<ApiResponse<TokenResponse>>({
      success: true,
      data: response,
      message: 'API token generated successfully',
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to generate token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}