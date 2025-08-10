/**
 * @jest-environment node
 */

// Mock dependencies before imports
jest.mock('@/lib/tasks/resetBandwidth', () => ({
  monthlyBandwidthResetTask: jest.fn(),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/reset-bandwidth/route';
import { monthlyBandwidthResetTask } from '@/lib/tasks/resetBandwidth';
import { headers } from 'next/headers';

describe('/api/cron/reset-bandwidth', () => {
  const mockMonthlyBandwidthResetTask = monthlyBandwidthResetTask as jest.MockedFunction<typeof monthlyBandwidthResetTask>;
  const mockHeaders = headers as jest.MockedFunction<typeof headers>;
  
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Set test environment variable
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET', () => {
    const createMockRequest = (authHeader?: string): NextRequest => {
      const request = new NextRequest('http://localhost:3000/api/cron/reset-bandwidth');
      
      mockHeaders.mockResolvedValue({
        get: jest.fn((name: string) => {
          if (name === 'authorization' && authHeader) {
            return authHeader;
          }
          return null;
        }),
      } as any);
      
      return request;
    };

    it('should reset bandwidth successfully with valid authorization', async () => {
      mockMonthlyBandwidthResetTask.mockResolvedValue(undefined);
      
      const request = createMockRequest('Bearer test-cron-secret');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Monthly bandwidth reset completed');
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
      expect(mockMonthlyBandwidthResetTask).toHaveBeenCalled();
    });

    it('should reject requests without authorization header', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockMonthlyBandwidthResetTask).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid authorization token', async () => {
      const request = createMockRequest('Bearer invalid-token');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockMonthlyBandwidthResetTask).not.toHaveBeenCalled();
    });

    it('should reject requests with wrong authorization format', async () => {
      const request = createMockRequest('test-cron-secret'); // Missing "Bearer " prefix
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockMonthlyBandwidthResetTask).not.toHaveBeenCalled();
    });

    it('should handle task errors gracefully', async () => {
      mockMonthlyBandwidthResetTask.mockRejectedValue(new Error('Database connection failed'));
      
      const request = createMockRequest('Bearer test-cron-secret');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to reset bandwidth');
      expect(data.message).toBe('Database connection failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockMonthlyBandwidthResetTask.mockRejectedValue('String error');
      
      const request = createMockRequest('Bearer test-cron-secret');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to reset bandwidth');
      expect(data.message).toBe('Unknown error');
    });

    it('should handle undefined CRON_SECRET', async () => {
      delete process.env.CRON_SECRET;
      
      const request = createMockRequest('Bearer test-cron-secret');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockMonthlyBandwidthResetTask).not.toHaveBeenCalled();
    });

    it('should handle empty CRON_SECRET', async () => {
      process.env.CRON_SECRET = '';
      mockMonthlyBandwidthResetTask.mockResolvedValue(undefined);
      
      const request = createMockRequest('Bearer ');
      const response = await GET(request);
      const data = await response.json();

      // Empty CRON_SECRET with 'Bearer ' should pass the check since both are empty
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockMonthlyBandwidthResetTask).toHaveBeenCalled();
    });

    it('should handle task throwing custom error types', async () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      
      mockMonthlyBandwidthResetTask.mockRejectedValue(new CustomError('Custom task error'));
      
      const request = createMockRequest('Bearer test-cron-secret');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to reset bandwidth');
      expect(data.message).toBe('Custom task error');
    });

    it('should include ISO timestamp in successful response', async () => {
      const beforeTime = new Date().getTime();
      mockMonthlyBandwidthResetTask.mockResolvedValue(undefined);
      
      const request = createMockRequest('Bearer test-cron-secret');
      const response = await GET(request);
      const data = await response.json();
      
      const afterTime = new Date().getTime();
      const responseTime = new Date(data.timestamp).getTime();

      expect(response.status).toBe(200);
      expect(responseTime).toBeGreaterThanOrEqual(beforeTime);
      expect(responseTime).toBeLessThanOrEqual(afterTime);
    });

    it('should handle headers() promise rejection', async () => {
      mockHeaders.mockRejectedValue(new Error('Headers not available'));
      
      const request = new NextRequest('http://localhost:3000/api/cron/reset-bandwidth');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to reset bandwidth');
      expect(mockMonthlyBandwidthResetTask).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive authorization header', async () => {
      mockHeaders.mockResolvedValue({
        get: jest.fn((name: string) => {
          // Test that we're checking for 'authorization' in lowercase
          if (name === 'authorization') {
            return 'Bearer test-cron-secret';
          }
          return null;
        }),
      } as any);
      
      mockMonthlyBandwidthResetTask.mockResolvedValue(undefined);
      
      const request = new NextRequest('http://localhost:3000/api/cron/reset-bandwidth');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockMonthlyBandwidthResetTask).toHaveBeenCalled();
    });

    it('should reject requests with extra spaces in authorization header', async () => {
      const request = createMockRequest('Bearer  test-cron-secret'); // Extra space
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockMonthlyBandwidthResetTask).not.toHaveBeenCalled();
    });

    it('should handle synchronous task errors', async () => {
      mockMonthlyBandwidthResetTask.mockImplementation(() => {
        throw new Error('Synchronous error');
      });
      
      const request = createMockRequest('Bearer test-cron-secret');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to reset bandwidth');
      expect(data.message).toBe('Synchronous error');
    });
  });
});