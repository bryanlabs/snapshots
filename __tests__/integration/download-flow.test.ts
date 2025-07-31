import { NextRequest } from 'next/server';
import { GET as getChainsGET } from '@/app/api/v1/chains/route';
import { GET as getChainGET } from '@/app/api/v1/chains/[chainId]/route';
import { GET as getSnapshotsGET } from '@/app/api/v1/chains/[chainId]/snapshots/route';
import { POST as downloadPOST } from '@/app/api/v1/chains/[chainId]/download/route';
import * as nginxOperations from '@/lib/nginx/operations';
import * as bandwidthManager from '@/lib/bandwidth/manager';
import * as downloadTracker from '@/lib/download/tracker';
import { auth } from '@/auth';

// Mock dependencies
jest.mock('@/lib/nginx/operations');
jest.mock('@/lib/bandwidth/manager');
jest.mock('@/lib/download/tracker');
jest.mock('@/auth');
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

describe('Download Flow Integration', () => {
  let mockGenerateDownloadUrl: jest.Mock;
  let mockListChains: jest.Mock;
  let mockListSnapshots: jest.Mock;
  let mockBandwidthManager: any;
  let mockAuth: jest.Mock;
  let mockCheckDownloadAllowed: jest.Mock;
  let mockIncrementDailyDownload: jest.Mock;
  let mockLogDownload: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup nginx mocks
    mockListChains = jest.fn().mockResolvedValue([
      {
        chainId: 'cosmos-hub',
        snapshotCount: 2,
        latestSnapshot: {
          filename: 'cosmos-hub-20250130.tar.lz4',
          size: 1000000000,
          lastModified: new Date('2025-01-30'),
        },
        totalSize: 2000000000,
      },
      {
        chainId: 'osmosis',
        snapshotCount: 1,
        latestSnapshot: {
          filename: 'osmosis-20250130.tar.lz4',
          size: 500000000,
          lastModified: new Date('2025-01-30'),
        },
        totalSize: 500000000,
      },
    ]);

    mockListSnapshots = jest.fn().mockResolvedValue([
      {
        filename: 'cosmos-hub-20250130.tar.lz4',
        size: 1000000000,
        lastModified: new Date('2025-01-30'),
        height: 20250130,
        compressionType: 'lz4',
      },
      {
        filename: 'cosmos-hub-20250129.tar.zst',
        size: 900000000,
        lastModified: new Date('2025-01-29'),
        height: 20250129,
        compressionType: 'zst',
      },
    ]);

    mockGenerateDownloadUrl = jest.fn().mockResolvedValue({
      url: 'https://snapshots.bryanlabs.net/snapshots/cosmos-hub/cosmos-hub-20250130.tar.lz4?md5=abc123&expires=1234567890&tier=free',
      expires: '2025-01-30T12:00:00Z',
      size: 1000000000,
    });

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
    });

    mockIncrementDailyDownload = jest.fn().mockResolvedValue(true);
    mockLogDownload = jest.fn().mockResolvedValue(true);

    // Assign mocks
    (nginxOperations.listChains as jest.Mock) = mockListChains;
    (nginxOperations.listSnapshots as jest.Mock) = mockListSnapshots;
    (nginxOperations.generateDownloadUrl as jest.Mock) = mockGenerateDownloadUrl;
    (bandwidthManager.bandwidthManager as any) = mockBandwidthManager;
    (auth as jest.Mock) = mockAuth;
    (downloadTracker.checkDownloadAllowed as jest.Mock) = mockCheckDownloadAllowed;
    (downloadTracker.incrementDailyDownload as jest.Mock) = mockIncrementDailyDownload;
    (downloadTracker.logDownload as jest.Mock) = mockLogDownload;
  });

  describe('Complete download flow', () => {
    it('should handle chain discovery -> snapshot selection -> download flow', async () => {
      // Step 1: Get list of chains
      const chainsRequest = new NextRequest('http://localhost:3000/api/v1/chains');
      const chainsResponse = await getChainsGET(chainsRequest);
      const chainsData = await chainsResponse.json();
      
      expect(chainsResponse.status).toBe(200);
      expect(chainsData.success).toBe(true);
      expect(Array.isArray(chainsData.data)).toBe(true);
      expect(chainsData.data.length).toBeGreaterThan(0);
      
      const firstChain = chainsData.data[0];
      
      // Step 2: Get specific chain details
      const chainRequest = new NextRequest(`http://localhost:3000/api/v1/chains/${firstChain.id}`);
      const chainParams = Promise.resolve({ chainId: firstChain.id });
      const chainResponse = await getChainGET(chainRequest, { params: chainParams });
      const chainData = await chainResponse.json();
      
      expect(chainResponse.status).toBe(200);
      expect(chainData.success).toBe(true);
      expect(chainData.data.id).toBe(firstChain.id);
      
      // Step 3: Get snapshots for the chain
      const snapshotsRequest = new NextRequest(`http://localhost:3000/api/v1/chains/${firstChain.id}/snapshots`);
      const snapshotsParams = Promise.resolve({ chainId: firstChain.id });
      const snapshotsResponse = await getSnapshotsGET(snapshotsRequest, { params: snapshotsParams });
      const snapshotsData = await snapshotsResponse.json();
      
      expect(snapshotsResponse.status).toBe(200);
      expect(snapshotsData.success).toBe(true);
      expect(Array.isArray(snapshotsData.data)).toBe(true);
      expect(snapshotsData.data.length).toBeGreaterThan(0);
      
      const firstSnapshot = snapshotsData.data[0];
      
      // Step 4: Request download URL
      const downloadRequest = new NextRequest(`http://localhost:3000/api/v1/chains/${firstChain.id}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          snapshotId: firstSnapshot.filename,
        }),
      });
      const downloadParams = Promise.resolve({ chainId: firstChain.id });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(200);
      expect(downloadData.success).toBe(true);
      expect(downloadData.data.url).toContain('https://snapshots.bryanlabs.net');
      expect(downloadData.data.url).toContain('tier=free');
      expect(downloadData.data.expires).toBeDefined();
      expect(downloadData.data.size).toBe(firstSnapshot.size);
      
      // Verify download tracking was initiated
      expect(mockCheckDownloadAllowed).toHaveBeenCalled();
      expect(mockIncrementDailyDownload).toHaveBeenCalled();
      expect(mockLogDownload).toHaveBeenCalled();
    });

    it('should handle anonymous user download flow', async () => {
      // Set up anonymous session
      mockAuth.mockResolvedValue(null);
      
      // Get chain and snapshot info
      const chainId = 'cosmos-hub';
      const snapshotsRequest = new NextRequest(`http://localhost:3000/api/v1/chains/${chainId}/snapshots`);
      const snapshotsParams = Promise.resolve({ chainId });
      const snapshotsResponse = await getSnapshotsGET(snapshotsRequest, { params: snapshotsParams });
      const snapshotsData = await snapshotsResponse.json();
      
      const snapshot = snapshotsData.data[0];
      
      // Request download as anonymous user
      const downloadRequest = new NextRequest(`http://localhost:3000/api/v1/chains/${chainId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          snapshotId: snapshot.filename,
        }),
      });
      const downloadParams = Promise.resolve({ chainId });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(200);
      expect(downloadData.success).toBe(true);
      expect(downloadData.data.tier).toBe('free');
      
      // Verify anonymous user handling with IP-based tracking
      expect(mockCheckDownloadAllowed).toHaveBeenCalledWith(
        '192.168.1.1',
        'free',
        expect.any(Number)
      );
    });

    it('should enforce daily download limits', async () => {
      // Set user as exceeding download limit
      mockCheckDownloadAllowed.mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 5,
      });
      
      const downloadRequest = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250130.tar.lz4',
        }),
      });
      const downloadParams = Promise.resolve({ chainId: 'cosmos-hub' });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(429);
      expect(downloadData.success).toBe(false);
      expect(downloadData.error).toContain('Daily download limit exceeded');
      expect(mockIncrementDailyDownload).not.toHaveBeenCalled();
    });

    it('should handle premium user with higher limits', async () => {
      // Set up premium user session
      mockAuth.mockResolvedValue({
        user: {
          id: 'premium123',
          email: 'premium@example.com',
          tier: 'premium',
        },
      });
      
      const downloadRequest = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250130.tar.lz4',
        }),
      });
      const downloadParams = Promise.resolve({ chainId: 'cosmos-hub' });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(200);
      expect(downloadData.success).toBe(true);
      expect(downloadData.data.tier).toBe('premium');
      
      // Verify premium tier handling
      expect(mockGenerateDownloadUrl).toHaveBeenCalledWith(
        'cosmos-hub',
        'cosmos-hub-20250130.tar.lz4',
        'premium',
        expect.any(String)
      );
      expect(downloadData.data.url).toContain('tier=premium');
    });
  });

  describe('Error handling in download flow', () => {
    it('should handle invalid chain ID', async () => {
      mockListChains.mockResolvedValue([]);
      
      const chainRequest = new NextRequest('http://localhost:3000/api/v1/chains/invalid-chain');
      const chainParams = Promise.resolve({ chainId: 'invalid-chain' });
      const chainResponse = await getChainGET(chainRequest, { params: chainParams });
      const chainData = await chainResponse.json();
      
      expect(chainResponse.status).toBe(404);
      expect(chainData.success).toBe(false);
      expect(chainData.error).toBe('Chain not found');
    });

    it('should handle invalid snapshot ID', async () => {
      const downloadRequest = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotId: '', // Invalid: empty snapshot ID
        }),
      });
      const downloadParams = Promise.resolve({ chainId: 'cosmos-hub' });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(400);
      expect(downloadData.success).toBe(false);
      expect(downloadData.error).toContain('Invalid request');
    });

    it('should handle nginx service errors', async () => {
      mockGenerateDownloadUrl.mockRejectedValue(new Error('nginx service unavailable'));
      
      const downloadRequest = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250130.tar.lz4',
        }),
      });
      const downloadParams = Promise.resolve({ chainId: 'cosmos-hub' });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(500);
      expect(downloadData.success).toBe(false);
      expect(downloadData.error).toBe('Failed to generate download URL');
      expect(downloadData.message).toBe('nginx service unavailable');
    });

    it('should handle bandwidth allocation failure', async () => {
      mockBandwidthManager.canAllocate.mockReturnValue({
        canAllocate: false,
        queuePosition: 5,
      });

      const downloadRequest = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250130.tar.lz4',
        }),
      });
      const downloadParams = Promise.resolve({ chainId: 'cosmos-hub' });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(503);
      expect(downloadData.success).toBe(false);
      expect(downloadData.error).toContain('bandwidth capacity');
      expect(downloadData.message).toContain('Queue position: 5');
    });
  });

  describe('Concurrent download requests', () => {
    it('should handle multiple download requests from same user', async () => {
      const chainId = 'cosmos-hub';
      const requests = [];
      
      // Make 3 concurrent download requests
      for (let i = 0; i < 3; i++) {
        const downloadRequest = new NextRequest(`http://localhost:3000/api/v1/chains/${chainId}/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
          },
          body: JSON.stringify({
            snapshotId: `cosmos-hub-2025013${i}.tar.lz4`,
          }),
        });
        const downloadParams = Promise.resolve({ chainId });
        requests.push(downloadPOST(downloadRequest, { params: downloadParams }));
      }
      
      const responses = await Promise.all(requests);
      const data = await Promise.all(responses.map(r => r.json()));
      
      // All requests should succeed
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(data.every(d => d.success)).toBe(true);
      
      // Verify all downloads were tracked
      expect(mockIncrementDailyDownload).toHaveBeenCalledTimes(3);
      expect(mockLogDownload).toHaveBeenCalledTimes(3);
    });

    it('should track bandwidth across multiple downloads', async () => {
      const chainId = 'cosmos-hub';
      
      // First download
      const download1Request = new NextRequest(`http://localhost:3000/api/v1/chains/${chainId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ snapshotId: 'cosmos-hub-20250130.tar.lz4' }),
      });
      const download1Params = Promise.resolve({ chainId });
      await downloadPOST(download1Request, { params: download1Params });
      
      // Second download - should still be allowed
      const download2Request = new NextRequest(`http://localhost:3000/api/v1/chains/${chainId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ snapshotId: 'cosmos-hub-20250129.tar.zst' }),
      });
      const download2Params = Promise.resolve({ chainId });
      const response2 = await downloadPOST(download2Request, { params: download2Params });
      const data2 = await response2.json();
      
      expect(response2.status).toBe(200);
      expect(data2.success).toBe(true);
      
      // Verify bandwidth tracking
      expect(mockBandwidthManager.canAllocate).toHaveBeenCalledTimes(2);
      expect(mockBandwidthManager.allocate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Nginx integration specifics', () => {
    it('should generate secure download URLs with proper parameters', async () => {
      const downloadRequest = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250130.tar.lz4',
        }),
      });
      const downloadParams = Promise.resolve({ chainId: 'cosmos-hub' });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadData.data.url).toMatch(/md5=[a-zA-Z0-9_-]+/);
      expect(downloadData.data.url).toMatch(/expires=\d+/);
      expect(downloadData.data.url).toMatch(/tier=(free|premium)/);
    });

    it('should handle different compression types', async () => {
      // Test lz4 compression
      const lz4Request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250130.tar.lz4',
        }),
      });
      const lz4Params = Promise.resolve({ chainId: 'cosmos-hub' });
      const lz4Response = await downloadPOST(lz4Request, { params: lz4Params });
      const lz4Data = await lz4Response.json();
      
      expect(lz4Response.status).toBe(200);
      expect(lz4Data.data.url).toContain('.tar.lz4');
      
      // Test zst compression
      const zstRequest = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          snapshotId: 'cosmos-hub-20250129.tar.zst',
        }),
      });
      const zstParams = Promise.resolve({ chainId: 'cosmos-hub' });
      const zstResponse = await downloadPOST(zstRequest, { params: zstParams });
      const zstData = await zstResponse.json();
      
      expect(zstResponse.status).toBe(200);
      expect(zstData.data.url).toContain('.tar.zst');
    });
  });
});