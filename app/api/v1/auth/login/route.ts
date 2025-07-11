import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, LoginRequest, User } from '@/lib/types';
import { login } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withRateLimit } from '@/lib/middleware/rateLimiter';
import { collectResponseTime, trackRequest, trackAuthAttempt } from '@/lib/monitoring/metrics';
import { logAuth, extractRequestMetadata, logRequest } from '@/lib/middleware/logger';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Mock user data - replace with actual database queries
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: '$2a$10$YourHashedPasswordHere', // Use bcrypt.hash('password', 10) to generate
    name: 'Admin User',
    role: 'admin' as const,
  },
  {
    id: '2',
    email: 'user@example.com',
    password: '$2a$10$YourHashedPasswordHere',
    name: 'Regular User',
    role: 'user' as const,
  },
];

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
    
    const { email, password } = validationResult.data;
    
    // TODO: Implement actual database query
    // const user = await db.user.findUnique({ where: { email } });
    
    // Mock authentication
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        },
        { status: 401 }
      );
      
      endTimer();
      trackRequest('POST', '/api/v1/auth/login', 401);
      trackAuthAttempt('login', false);
      logAuth('login', email, false, 'Invalid credentials');
      logRequest({
        ...requestLog,
        responseStatus: 401,
        responseTime: Date.now() - startTime,
        error: 'Invalid credentials',
      });
      
      return response;
    }
    
    // For demo purposes, accept any password
    // In production, use: const isValidPassword = await bcrypt.compare(password, user.password);
    const isValidPassword = true;
    
    if (!isValidPassword) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        },
        { status: 401 }
      );
    }
    
    // Create session
    const sessionUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    await login(sessionUser);
    
    const response = NextResponse.json<ApiResponse<User>>({
      success: true,
      data: sessionUser,
      message: 'Login successful',
    });
    
    endTimer();
    trackRequest('POST', '/api/v1/auth/login', 200);
    trackAuthAttempt('login', true);
    logAuth('login', email, true);
    logRequest({
      ...requestLog,
      userId: user.id,
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