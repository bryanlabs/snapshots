import { NextRequest } from 'next/server';

// Mock dependencies before imports
jest.mock('@/lib/download/tracker');
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Import after mocks
import { GET } from '@/app/api/v1/downloads/status/route';
import { checkDownloadAllowed } from '@/lib/download/tracker';
import { auth } from '@/auth';

describe('/api/v1/downloads/status', () => {
  let mockCheckDownloadAllowed: jest.Mock;
  let mockAuth: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCheckDownloadAllowed = checkDownloadAllowed as jest.Mock;
    mockAuth = auth as jest.Mock;
    
    // Default mocks
    mockAuth.mockResolvedValue({
      user: {
        id: 'user123',
        email: 'test@example.com',
        tier: 'free',
      },
    });
  });

  describe('GET', () => {
    it('should return download status for free tier user', async () => {
      const resetTime = new Date(Date.now() + 86400000); // Tomorrow
      mockCheckDownloadAllowed.mockResolvedValue({
        allowed: true,
        remaining: 3,
        limit: 5,
        resetTime,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/downloads/status', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        allowed: true,
        remaining: 3,
        limit: 5,
        resetTime: resetTime.toISOString(),
        tier: 'free',
      });
      expect(mockCheckDownloadAllowed).toHaveBeenCalledWith('192.168.1.1', 'free', 5);
    });

    it('should return unlimited limit for premium users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'premium123',
          email: 'premium@example.com',
          tier: 'premium',
        },
      });
      
      const resetTime = new Date(Date.now() + 86400000);
      mockCheckDownloadAllowed.mockResolvedValue({
        allowed: true,
        remaining: 999,
        limit: 999,
        resetTime,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/downloads/status');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.limit).toBe(-1); // -1 indicates unlimited for premium
      expect(data.data.tier).toBe('premium');
      expect(mockCheckDownloadAllowed).toHaveBeenCalledWith('unknown', 'premium', 5);
    });

    it('should return unlimited limit for unlimited users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'unlimited123',
          email: 'ultimate_user@example.com',
          tier: 'unlimited',
        },
      });
      
      const resetTime = new Date(Date.now() + 86400000);
      mockCheckDownloadAllowed.mockResolvedValue({
        allowed: true,
        remaining: -1,
        resetTime,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/downloads/status');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.limit).toBe(-1); // -1 indicates unlimited for unlimited tier
      expect(data.data.tier).toBe('unlimited');
      expect(mockCheckDownloadAllowed).toHaveBeenCalledWith('unknown', 'unlimited', 5);
    });

    it('should handle anonymous users', async () => {
      mockAuth.mockResolvedValue(null);
      
      const resetTime = new Date(Date.now() + 86400000);
      mockCheckDownloadAllowed.mockResolvedValue({
        allowed: true,
        remaining: 5,
        limit: 5,
        resetTime,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/downloads/status');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.tier).toBe('free');
      expect(data.data.limit).toBe(5);
    });

    it('should show not allowed when limit exceeded', async () => {
      const resetTime = new Date(Date.now() + 43200000); // 12 hours from now
      mockCheckDownloadAllowed.mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 5,
        resetTime,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/downloads/status');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.allowed).toBe(false);
      expect(data.data.remaining).toBe(0);
      expect(data.data.resetTime).toBe(resetTime.toISOString());
    });

    it('should extract IP from various headers', async () => {
      const resetTime = new Date();
      mockCheckDownloadAllowed.mockResolvedValue({
        allowed: true,
        remaining: 5,
        limit: 5,
        resetTime,
      });

      // Test x-real-ip header
      let request = new NextRequest('http://localhost:3000/api/v1/downloads/status', {
        headers: {
          'x-real-ip': '10.0.0.1',
        },
      });

      await GET(request);
      expect(mockCheckDownloadAllowed).toHaveBeenCalledWith('10.0.0.1', 'free', 5);

      // Test cf-connecting-ip header
      jest.clearAllMocks();
      mockCheckDownloadAllowed.mockResolvedValue({
        allowed: true,
        remaining: 5,
        limit: 5,
        resetTime,
      });
      
      request = new NextRequest('http://localhost:3000/api/v1/downloads/status', {
        headers: {
          'cf-connecting-ip': '172.16.0.1',
        },
      });

      await GET(request);
      expect(mockCheckDownloadAllowed).toHaveBeenCalledWith('172.16.0.1', 'free', 5);
    });

    it('should use custom daily limit from environment', async () => {
      // Set custom limit
      process.env.DAILY_DOWNLOAD_LIMIT = '10';
      
      const resetTime = new Date();
      mockCheckDownloadAllowed.mockResolvedValue({
        allowed: true,
        remaining: 8,
        limit: 10,
        resetTime,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/downloads/status');

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.limit).toBe(10);
      expect(mockCheckDownloadAllowed).toHaveBeenCalledWith('unknown', 'free', 10);
      
      // Clean up
      delete process.env.DAILY_DOWNLOAD_LIMIT;
    });

    it('should handle errors gracefully', async () => {
      mockCheckDownloadAllowed.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/v1/downloads/status');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to get download status');
      expect(data.message).toBe('Database error');
    });
  });
});