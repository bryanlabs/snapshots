import { NextRequest } from 'next/server';

// Mock dependencies before imports
jest.mock('@/lib/nginx/operations');
jest.mock('@/lib/monitoring/metrics');
jest.mock('@/lib/middleware/logger');
jest.mock('@/lib/bandwidth/manager');
jest.mock('@/lib/download/tracker');
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

// Import after mocks
import { POST } from '@/app/api/v1/chains/[chainId]/download/route';
import * as nginxOperations from '@/lib/nginx/operations';
import * as metrics from '@/lib/monitoring/metrics';
import * as logger from '@/lib/middleware/logger';
import * as bandwidthManager from '@/lib/bandwidth/manager';
import * as downloadTracker from '@/lib/download/tracker';
import { auth } from '@/auth';

describe('/api/v1/chains/[chainId]/download', () => {
  let mockGenerateDownloadUrl: jest.Mock;
  let mockCollectResponseTime: jest.Mock;
  let mockTrackRequest: jest.Mock;
  let mockTrackDownload: jest.Mock;
  let mockExtractRequestMetadata: jest.Mock;
  let mockLogRequest: jest.Mock;
  let mockLogDownload: jest.Mock;
  let mockBandwidthManager: any;
  let mockAuth: jest.Mock;
  let mockCheckDownloadAllowed: jest.Mock;
  let mockIncrementDailyDownload: jest.Mock;
  let mockLogDownloadDb: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockGenerateDownloadUrl = jest.fn().mockResolvedValue('https://snapshots.bryanlabs.net/download-url');
    mockCollectResponseTime = jest.fn().mockReturnValue(jest.fn());
    mockTrackRequest = jest.fn();
    mockTrackDownload = jest.fn();
    mockExtractRequestMetadata = jest.fn().mockReturnValue({
      method: 'POST',
      path: '/api/v1/chains/cosmos-hub/download',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    });
    mockLogRequest = jest.fn();
    mockLogDownload = jest.fn();
    
    mockBandwidthManager = {
      canAllocate: jest.fn().mockReturnValue({ canAllocate: true, queuePosition: 0 }),
      allocate: jest.fn().mockReturnValue({ allocated: 50 }),
      getStats: jest.fn().mockReturnValue({
        totalBandwidth: 1000,
        allocatedBandwidth: 500,
        queueLength: 0,
      }),
    };

    mockAuth = jest.fn().mockResolvedValue({
      user: {
        id: 'user123',
        email: 'test@example.com',
        tier: 'free',
      },
    });

    mockCheckDownloadAllowed = jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 4,
      limit: 5,
      resetTime: new Date(Date.now() + 86400000), // Tomorrow
    });
    
    mockIncrementDailyDownload = jest.fn().mockResolvedValue(true);
    mockLogDownloadDb = jest.fn().mockResolvedValue(true);
    
    // Mock global fetch for snapshot API calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [{
          id: 'cosmos-hub-20250130.tar.lz4',
          fileName: 'cosmos-hub-20250130.tar.lz4',
          size: 1000000,
          chainId: 'cosmos-hub',
        }],
      }),
    });

    // Assign mocks
    (nginxOperations.generateDownloadUrl as jest.Mock) = mockGenerateDownloadUrl;
    (metrics.collectResponseTime as jest.Mock) = mockCollectResponseTime;
    (metrics.trackRequest as jest.Mock) = mockTrackRequest;
    (metrics.trackDownload as jest.Mock) = mockTrackDownload;
    (logger.extractRequestMetadata as jest.Mock) = mockExtractRequestMetadata;
    (logger.logRequest as jest.Mock) = mockLogRequest;
    (logger.logDownload as jest.Mock) = mockLogDownload;
    (bandwidthManager.bandwidthManager as any) = mockBandwidthManager;
    (auth as jest.Mock) = mockAuth;
    (downloadTracker.checkDownloadAllowed as jest.Mock) = mockCheckDownloadAllowed;
    (downloadTracker.incrementDailyDownload as jest.Mock) = mockIncrementDailyDownload;
    (downloadTracker.logDownload as jest.Mock) = mockLogDownloadDb;
  });

  describe('POST', () => {
    it('should generate download URL for valid request', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250130.tar.lz4',
        }),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue({
        snapshotId: 'cosmos-hub-20250130.tar.lz4',
      });

      const response = await POST(request, { params: Promise.resolve({ chainId: 'cosmos-hub' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.downloadUrl).toBe('https://snapshots.bryanlabs.net/download-url');
      expect(data.message).toBe('Download URL generated successfully');
    });

    it('should reject request when daily limit exceeded', async () => {
      mockCheckDownloadAllowed.mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 5,
        resetTime: new Date(Date.now() + 86400000), // Tomorrow
      });

      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250130.tar.lz4',
        }),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue({
        snapshotId: 'cosmos-hub-20250130.tar.lz4',
      });

      const response = await POST(request, { params: Promise.resolve({ chainId: 'cosmos-hub' }) });
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Daily download limit exceeded');
    });


    it('should use premium tier for authenticated premium users', async () => {
      // Update the auth mock for this test
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: 'premium123',
          email: 'premium@example.com',
          tier: 'premium',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250130.tar.lz4',
        }),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue({
        snapshotId: 'cosmos-hub-20250130.tar.lz4',
      });

      const response = await POST(request, { params: Promise.resolve({ chainId: 'cosmos-hub' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGenerateDownloadUrl).toHaveBeenCalledWith(
        'cosmos-hub',
        'cosmos-hub-20250130.tar.lz4',
        'premium',
        expect.any(String)
      );
    });

    it('should track metrics for successful download', async () => {
      // Reset auth mock to free tier
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: 'user123',
          email: 'test@example.com',
          tier: 'free',
        },
      });
      
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250130.tar.lz4',
        }),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue({
        snapshotId: 'cosmos-hub-20250130.tar.lz4',
      });

      await POST(request, { params: Promise.resolve({ chainId: 'cosmos-hub' }) });

      expect(mockTrackRequest).toHaveBeenCalledWith('POST', '/api/v1/chains/[chainId]/download', 200);
      expect(mockTrackDownload).toHaveBeenCalledWith('free', 'cosmos-hub-20250130.tar.lz4');
      expect(mockLogDownload).toHaveBeenCalled();
      expect(mockLogDownloadDb).toHaveBeenCalled();
    });

    it('should handle invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required snapshotId
        }),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue({
        // Missing required snapshotId
      });

      const response = await POST(request, { params: Promise.resolve({ chainId: 'cosmos-hub' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid request');
    });

    it('should extract client IP from headers correctly', async () => {
      // Reset auth mock to free tier
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: 'user123',
          email: 'test@example.com',
          tier: 'free',
        },
      });
      
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250130.tar.lz4',
        }),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue({
        snapshotId: 'cosmos-hub-20250130.tar.lz4',
      });

      await POST(request, { params: Promise.resolve({ chainId: 'cosmos-hub' }) });

      expect(mockCheckDownloadAllowed).toHaveBeenCalledWith(
        '192.168.1.1',
        'free',
        expect.any(Number)
      );
    });
  });
});