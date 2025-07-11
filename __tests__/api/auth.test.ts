import { NextRequest } from 'next/server';
import { POST as loginPOST } from '@/app/api/v1/auth/login/route';
import { POST as logoutPOST } from '@/app/api/v1/auth/logout/route';
import { GET as meGET } from '@/app/api/v1/auth/me/route';
import * as authSession from '@/lib/auth/session';
import * as metrics from '@/lib/monitoring/metrics';
import * as logger from '@/lib/middleware/logger';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/lib/auth/session');
jest.mock('@/lib/monitoring/metrics');
jest.mock('@/lib/middleware/logger');
jest.mock('bcryptjs');

describe('Auth API Routes', () => {
  let mockLogin: jest.Mock;
  let mockLogout: jest.Mock;
  let mockGetCurrentUser: jest.Mock;
  let mockCollectResponseTime: jest.Mock;
  let mockTrackRequest: jest.Mock;
  let mockTrackAuthAttempt: jest.Mock;
  let mockExtractRequestMetadata: jest.Mock;
  let mockLogRequest: jest.Mock;
  let mockLogAuth: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockLogin = jest.fn().mockResolvedValue(undefined);
    mockLogout = jest.fn().mockResolvedValue(undefined);
    mockGetCurrentUser = jest.fn().mockResolvedValue(null);
    mockCollectResponseTime = jest.fn().mockReturnValue(jest.fn());
    mockTrackRequest = jest.fn();
    mockTrackAuthAttempt = jest.fn();
    mockExtractRequestMetadata = jest.fn().mockReturnValue({
      method: 'POST',
      path: '/api/v1/auth/login',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    });
    mockLogRequest = jest.fn();
    mockLogAuth = jest.fn();

    (authSession.login as jest.Mock) = mockLogin;
    (authSession.logout as jest.Mock) = mockLogout;
    (authSession.getCurrentUser as jest.Mock) = mockGetCurrentUser;
    (metrics.collectResponseTime as jest.Mock) = mockCollectResponseTime;
    (metrics.trackRequest as jest.Mock) = mockTrackRequest;
    (metrics.trackAuthAttempt as jest.Mock) = mockTrackAuthAttempt;
    (logger.extractRequestMetadata as jest.Mock) = mockExtractRequestMetadata;
    (logger.logRequest as jest.Mock) = mockLogRequest;
    (logger.logAuth as jest.Mock) = mockLogAuth;
    (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(true);
  });

  describe('/api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'password123',
        }),
      });
      
      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Login successful');
      expect(data.data).toMatchObject({
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      });
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'admin@example.com',
          role: 'admin',
        })
      );
    });

    it('should validate email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123',
        }),
      });
      
      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request');
    });

    it('should validate password length', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: '12345', // Too short
        }),
      });
      
      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request');
    });

    it('should reject invalid credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      });
      
      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid credentials');
      expect(data.message).toBe('Email or password is incorrect');
      expect(mockTrackAuthAttempt).toHaveBeenCalledWith('login', false);
    });

    it('should track successful auth attempts', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'password123',
        }),
      });
      
      await loginPOST(request);

      expect(mockTrackAuthAttempt).toHaveBeenCalledWith('login', true);
      expect(mockLogAuth).toHaveBeenCalledWith('login', 'admin@example.com', true);
    });

    it('should handle errors gracefully', async () => {
      mockLogin.mockRejectedValue(new Error('Session creation failed'));
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'password123',
        }),
      });
      
      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Login failed');
      expect(data.message).toBe('Session creation failed');
    });
  });

  describe('/api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/logout', {
        method: 'POST',
      });
      
      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logout successful');
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should track logout attempts', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/logout', {
        method: 'POST',
      });
      
      await logoutPOST(request);

      expect(mockTrackAuthAttempt).toHaveBeenCalledWith('logout', true);
      expect(mockLogAuth).toHaveBeenCalledWith('logout', 'anonymous', true);
    });

    it('should handle logout errors', async () => {
      mockLogout.mockRejectedValue(new Error('Session destruction failed'));
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/logout', {
        method: 'POST',
      });
      
      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Logout failed');
    });
  });

  describe('/api/v1/auth/me', () => {
    it('should return current user when authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      });
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/me');
      
      const response = await meGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      });
    });

    it('should return 401 when not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/me');
      
      const response = await meGET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not authenticated');
      expect(data.message).toBe('Please login to access this resource');
    });

    it('should handle errors gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Session validation failed'));
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/me');
      
      const response = await meGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to get user info');
    });
  });
});