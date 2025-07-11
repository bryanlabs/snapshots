import { NextRequest } from 'next/server';
import { GET as getChainsGET } from '@/app/api/v1/chains/route';
import { GET as getChainGET } from '@/app/api/v1/chains/[chainId]/route';
import { GET as getSnapshotsGET } from '@/app/api/v1/chains/[chainId]/snapshots/route';
import { POST as downloadPOST } from '@/app/api/v1/chains/[chainId]/download/route';
import * as minioClient from '@/lib/minio/client';
import * as bandwidthManager from '@/lib/bandwidth/manager';
import { getIronSession } from 'iron-session';

// Mock dependencies
jest.mock('@/lib/minio/client');
jest.mock('@/lib/bandwidth/manager');
jest.mock('iron-session');
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

describe('Download Flow Integration', () => {
  let mockGetPresignedUrl: jest.Mock;
  let mockBandwidthManager: any;
  let mockGetIronSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockGetPresignedUrl = jest.fn().mockResolvedValue('https://minio.example.com/download-url');
    mockBandwidthManager = {
      hasExceededLimit: jest.fn().mockReturnValue(false),
      startConnection: jest.fn(),
      getUserBandwidth: jest.fn().mockReturnValue(1024 * 1024), // 1 MB used
    };
    mockGetIronSession = jest.fn().mockResolvedValue({
      username: 'testuser',
      tier: 'free',
    });

    (minioClient.getPresignedUrl as jest.Mock) = mockGetPresignedUrl;
    (bandwidthManager.bandwidthManager as any) = mockBandwidthManager;
    (getIronSession as jest.Mock) = mockGetIronSession;
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
      
      // Skip if no snapshots available
      if (snapshotsData.data.length === 0) {
        return;
      }
      
      const firstSnapshot = snapshotsData.data[0];
      
      // Step 4: Request download URL
      const downloadRequest = new NextRequest(`http://localhost:3000/api/v1/chains/${firstChain.id}/download`, {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: firstSnapshot.id,
          email: 'user@example.com',
        }),
      });
      const downloadParams = Promise.resolve({ chainId: firstChain.id });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(200);
      expect(downloadData.success).toBe(true);
      expect(downloadData.data.downloadUrl).toBe('https://minio.example.com/download-url');
      
      // Verify bandwidth tracking was initiated
      expect(mockBandwidthManager.startConnection).toHaveBeenCalledWith(
        expect.stringContaining('testuser'),
        'testuser',
        'free'
      );
    });

    it('should handle anonymous user download flow', async () => {
      // Set up anonymous session
      mockGetIronSession.mockResolvedValue(null);
      
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
        body: JSON.stringify({
          snapshotId: snapshot.id,
        }),
      });
      const downloadParams = Promise.resolve({ chainId });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(200);
      expect(downloadData.success).toBe(true);
      
      // Verify anonymous user handling
      expect(mockBandwidthManager.hasExceededLimit).toHaveBeenCalledWith('anonymous', 'free');
      expect(mockBandwidthManager.startConnection).toHaveBeenCalledWith(
        expect.stringContaining('anonymous'),
        'anonymous',
        'free'
      );
    });

    it('should enforce bandwidth limits', async () => {
      // Set user as exceeding bandwidth limit
      mockBandwidthManager.hasExceededLimit.mockReturnValue(true);
      
      const downloadRequest = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: 'snapshot-123',
        }),
      });
      const downloadParams = Promise.resolve({ chainId: 'cosmos-hub' });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(429);
      expect(downloadData.success).toBe(false);
      expect(downloadData.error).toBe('Bandwidth limit exceeded');
      expect(mockBandwidthManager.startConnection).not.toHaveBeenCalled();
    });

    it('should handle premium user with higher limits', async () => {
      // Set up premium user session
      mockGetIronSession.mockResolvedValue({
        username: 'premiumuser',
        tier: 'premium',
      });
      
      const downloadRequest = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: 'snapshot-123',
          email: 'premium@example.com',
        }),
      });
      const downloadParams = Promise.resolve({ chainId: 'cosmos-hub' });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(200);
      expect(downloadData.success).toBe(true);
      
      // Verify premium tier handling
      expect(mockBandwidthManager.hasExceededLimit).toHaveBeenCalledWith('premiumuser', 'premium');
      expect(mockBandwidthManager.startConnection).toHaveBeenCalledWith(
        expect.stringContaining('premiumuser'),
        'premiumuser',
        'premium'
      );
    });
  });

  describe('Error handling in download flow', () => {
    it('should handle invalid chain ID', async () => {
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
        body: JSON.stringify({
          snapshotId: '', // Invalid: empty snapshot ID
        }),
      });
      const downloadParams = Promise.resolve({ chainId: 'cosmos-hub' });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(400);
      expect(downloadData.success).toBe(false);
      expect(downloadData.error).toBe('Invalid request');
    });

    it('should handle MinIO service errors', async () => {
      mockGetPresignedUrl.mockRejectedValue(new Error('MinIO service unavailable'));
      
      const downloadRequest = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/download', {
        method: 'POST',
        body: JSON.stringify({
          snapshotId: 'snapshot-123',
        }),
      });
      const downloadParams = Promise.resolve({ chainId: 'cosmos-hub' });
      const downloadResponse = await downloadPOST(downloadRequest, { params: downloadParams });
      const downloadData = await downloadResponse.json();
      
      expect(downloadResponse.status).toBe(500);
      expect(downloadData.success).toBe(false);
      expect(downloadData.error).toBe('Failed to generate download URL');
      expect(downloadData.message).toBe('MinIO service unavailable');
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
          body: JSON.stringify({
            snapshotId: `snapshot-${i}`,
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
      
      // Verify all connections were tracked
      expect(mockBandwidthManager.startConnection).toHaveBeenCalledTimes(3);
    });

    it('should track bandwidth across multiple downloads', async () => {
      // Simulate bandwidth usage increasing with each download
      let totalBandwidth = 0;
      mockBandwidthManager.getUserBandwidth.mockImplementation(() => {
        totalBandwidth += 1024 * 1024 * 100; // 100 MB per download
        return totalBandwidth;
      });
      
      const chainId = 'cosmos-hub';
      
      // First download
      const download1Request = new NextRequest(`http://localhost:3000/api/v1/chains/${chainId}/download`, {
        method: 'POST',
        body: JSON.stringify({ snapshotId: 'snapshot-1' }),
      });
      const download1Params = Promise.resolve({ chainId });
      await downloadPOST(download1Request, { params: download1Params });
      
      // Second download
      const download2Request = new NextRequest(`http://localhost:3000/api/v1/chains/${chainId}/download`, {
        method: 'POST',
        body: JSON.stringify({ snapshotId: 'snapshot-2' }),
      });
      const download2Params = Promise.resolve({ chainId });
      await downloadPOST(download2Request, { params: download2Params });
      
      // Verify bandwidth tracking
      expect(mockBandwidthManager.getUserBandwidth).toHaveBeenCalled();
      expect(mockBandwidthManager.startConnection).toHaveBeenCalledTimes(2);
    });
  });
});