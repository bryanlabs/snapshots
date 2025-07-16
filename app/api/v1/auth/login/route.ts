import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, LoginRequest, User } from '@/lib/types';
import { login } from '@/lib/auth/session';
import { createJWT } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withRateLimit } from '@/lib/middleware/rateLimiter';
import { collectResponseTime, trackRequest, trackAuthAttempt } from '@/lib/monitoring/metrics';
import { logAuth, extractRequestMetadata, logRequest } from '@/lib/middleware/logger';

const loginSchema = z.object({
  email: z.string(), // Accept any string, not just email format
  password: z.string().min(1),
  return_token: z.boolean().optional(), // Optional flag to return JWT token
});

// Get premium user credentials from environment variables
const PREMIUM_USERNAME = process.env.PREMIUM_USERNAME || 'premium_user';
const PREMIUM_PASSWORD_HASH = process.env.PREMIUM_PASSWORD_HASH || '';

async function handleLogin(request: NextRequest) {
  const endTimer = collectResponseTime('POST', '/api/v1/auth/login');
  const startTime = Date.now();
  const requestLog = extractRequestMetadata(request);
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid request',
          message: validationResult.error.errors.map(e => e.message).join(', '),
        },
        { status: 400 }
      );
    }
    
    const { email: username, password, return_token } = validationResult.data;
    
    // Check if username matches premium user
    if (username !== PREMIUM_USERNAME) {
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Username or password is incorrect',
        },
        { status: 401 }
      );
      
      endTimer();
      trackRequest('POST', '/api/v1/auth/login', 401);
      trackAuthAttempt('login', false);
      logAuth('login', username, false, 'Invalid credentials');
      logRequest({
        ...requestLog,
        responseStatus: 401,
        responseTime: Date.now() - startTime,
        error: 'Invalid credentials',
      });
      
      return response;
    }
    
    // Verify password against hash
    const isValidPassword = await bcrypt.compare(password, PREMIUM_PASSWORD_HASH);
    
    if (!isValidPassword) {
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Username or password is incorrect',
        },
        { status: 401 }
      );
      
      endTimer();
      trackRequest('POST', '/api/v1/auth/login', 401);
      trackAuthAttempt('login', false);
      logAuth('login', username, false, 'Invalid password');
      logRequest({
        ...requestLog,
        responseStatus: 401,
        responseTime: Date.now() - startTime,
        error: 'Invalid password',
      });
      
      return response;
    }
    
    // Create session for premium user
    const sessionUser: User = {
      id: 'premium-user',
      email: `${username}@snapshots.bryanlabs.net`, // Create a fake email for compatibility
      name: 'Premium User',
      role: 'admin', // Premium users get admin role for full access
      tier: 'premium', // Set premium tier for bandwidth benefits
    };
    
    await login(sessionUser);
    
    // Generate JWT token if requested
    let responseData: any = sessionUser;
    if (return_token) {
      const token = await createJWT(sessionUser);
      responseData = {
        user: sessionUser,
        token: {
          access_token: token,
          token_type: 'Bearer',
          expires_in: 604800, // 7 days in seconds
        },
      };
    }
    
    const response = NextResponse.json<ApiResponse<typeof responseData>>({
      success: true,
      data: responseData,
      message: 'Login successful',
    });
    
    endTimer();
    trackRequest('POST', '/api/v1/auth/login', 200);
    trackAuthAttempt('login', true);
    logAuth('login', username, true);
    logRequest({
      ...requestLog,
      userId: sessionUser.id,
      responseStatus: 200,
      responseTime: Date.now() - startTime,
    });
    
    return response;
  } catch (error) {
    const response = NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
    
    endTimer();
    trackRequest('POST', '/api/v1/auth/login', 500);
    logRequest({
      ...requestLog,
      responseStatus: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return response;
  }
}

// Apply rate limiting to the login endpoint
export const POST = withRateLimit(handleLogin, 'auth');