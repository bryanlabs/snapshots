import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/chains/[chainId]/download/route';
import * as minioClient from '@/lib/minio/client';
import * as metrics from '@/lib/monitoring/metrics';
import * as logger from '@/lib/middleware/logger';
import * as bandwidthManager from '@/lib/bandwidth/manager';
import { getIronSession } from 'iron-session';

// Mock dependencies
jest.mock('@/lib/minio/client');
jest.mock('@/lib/monitoring/metrics');
jest.mock('@/lib/middleware/logger');
jest.mock('@/lib/bandwidth/manager');
jest.mock('iron-session');
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

describe('/api/v1/chains/[chainId]/download', () => {
  let mockGetPresignedUrl: jest.Mock;
  let mockCollectResponseTime: jest.Mock;
  let mockTrackRequest: jest.Mock;
  let mockTrackDownload: jest.Mock;
  let mockExtractRequestMetadata: jest.Mock;
  let mockLogRequest: jest.Mock;
  let mockLogDownload: jest.Mock;
  let mockBandwidthManager: any;
  let mockGetIronSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockGetPresignedUrl = jest.fn().mockResolvedValue('https://minio.example.com/download-url');
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
      hasExceededLimit: jest.fn().mockReturnValue(false),
      startConnection: jest.fn(),
    };
    
    mockGetIronSession = jest.fn().mockResolvedValue({
      username: 'testuser',
      tier: 'free',
    });

    (minioClient.getPresignedUrl as jest.Mock) = mockGetPresignedUrl;
    (metrics.collectResponseTime as jest.Mock) = mockCollectResponseTime;
    (metrics.trackRequest as jest.Mock) = mockTrackRequest;
    (metrics.trackDownload as jest.Mock) = mockTrackDownload;
    (logger.extractRequestMetadata as jest.Mock) = mockExtractRequestMetadata;
    (logger.logRequest as jest.Mock) = mockLogRequest;
    (logger.logDownload as jest.Mock) = mockLogDownload;
    (bandwidthManager.bandwidthManager as any) = mockBandwidthManager;
    (getIronSession as jest.Mock) = mockGetIronSession;
  });

  describe('POST', () => {
    it('should generate download URL successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: 'snapshot-123',
          email: 'user@example.com',
        }),
      });
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.downloadUrl).toBe('https://minio.example.com/download-url');
      expect(data.message).toBe('Download URL generated successfully');
    });

    it('should validate request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          // Missing snapshotId
          email: 'user@example.com',
        }),
      });
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request');
    });

    it('should validate email format when provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: 'snapshot-123',
          email: 'invalid-email',
        }),
      });
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request');
    });

    it('should handle bandwidth limit exceeded', async () => {
      mockBandwidthManager.hasExceededLimit.mockReturnValue(true);
      
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: 'snapshot-123',
        }),
      });
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Bandwidth limit exceeded');
      expect(data.message).toBe('You have exceeded your monthly bandwidth limit');
    });

    it('should work without email', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: 'snapshot-123',
        }),
      });
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.downloadUrl).toBe('https://minio.example.com/download-url');
    });

    it('should track download metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: 'snapshot-123',
        }),
      });
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      await POST(request, { params });

      expect(mockTrackDownload).toHaveBeenCalledWith('free', 'snapshot-123');
      expect(mockLogDownload).toHaveBeenCalledWith('testuser', 'snapshot-123', 'free', true);
    });

    it('should start bandwidth connection tracking', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: 'snapshot-123',
        }),
      });
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      await POST(request, { params });

      expect(mockBandwidthManager.startConnection).toHaveBeenCalledWith(
        expect.stringContaining('testuser-snapshot-123-'),
        'testuser',
        'free'
      );
    });

    it('should handle anonymous users', async () => {
      mockGetIronSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: 'snapshot-123',
        }),
      });
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockBandwidthManager.hasExceededLimit).toHaveBeenCalledWith('anonymous', 'free');
    });

    it('should handle errors gracefully', async () => {
      mockGetPresignedUrl.mockRejectedValue(new Error('MinIO connection failed'));
      
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: 'snapshot-123',
        }),
      });
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to generate download URL');
      expect(data.message).toBe('MinIO connection failed');
    });
  });
});