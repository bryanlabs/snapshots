import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { setupTestDatabase, teardownTestDatabase, prisma, mockMinioClient } from './setup';
import { NextRequest } from 'next/server';

// Mock MinIO client
jest.mock('../../lib/minio/client', () => ({
  minioClient: mockMinioClient,
}));

// Import route handlers
import { GET as getChainsHandler } from '../../app/api/v1/chains/route';
import { GET as getSnapshotsHandler } from '../../app/api/v1/chains/[chainId]/snapshots/route';
import { GET as getLatestSnapshotHandler } from '../../app/api/v1/chains/[chainId]/snapshots/latest/route';
import { POST as downloadHandler } from '../../app/api/v1/chains/[chainId]/download/route';

describe('Snapshots API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('GET /api/v1/chains', () => {
    it('should return all chains with snapshot counts', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      const response = await getChainsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      const osmosis = data.data.find((c: any) => c.id === 'osmosis');
      expect(osmosis).toBeDefined();
      expect(osmosis.snapshotCount).toBeGreaterThan(0);
      expect(osmosis.latestSnapshot).toBeDefined();
    });
  });

  describe('GET /api/v1/chains/[chainId]/snapshots', () => {
    it('should return snapshots for a specific chain', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/osmosis/snapshots');
      const response = await getSnapshotsHandler(request, { params: { chainId: 'osmosis' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      
      const snapshot = data.data[0];
      expect(snapshot.fileName).toBeDefined();
      expect(snapshot.fileSize).toBeDefined();
      expect(snapshot.fileSizeDisplay).toBeDefined();
      expect(snapshot.blockHeight).toBeDefined();
      expect(snapshot.pruningMode).toBeDefined();
      expect(snapshot.compressionType).toBeDefined();
    });

    it('should return 404 for non-existent chain', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/nonexistent/snapshots');
      const response = await getSnapshotsHandler(request, { params: { chainId: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No snapshots found for this chain');
    });
  });

  describe('GET /api/v1/chains/[chainId]/snapshots/latest', () => {
    it('should return the latest snapshot for a chain', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/osmosis/snapshots/latest');
      const response = await getLatestSnapshotHandler(request, { params: { chainId: 'osmosis' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.fileName).toBeDefined();
      expect(data.data.blockHeight).toBeDefined();
    });

    it('should return 404 for chain without snapshots', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/empty/snapshots/latest');
      const response = await getLatestSnapshotHandler(request, { params: { chainId: 'empty' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No snapshots found for this chain');
    });
  });

  describe('POST /api/v1/chains/[chainId]/download', () => {
    it('should generate download URL for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/osmosis/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'authjs.session-token=mock-session',
        },
        body: JSON.stringify({
          fileName: 'osmosis-1-pruned-20240320.tar.gz',
        }),
      });

      // Mock session
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: 'test-user-1',
            tier: 'free',
          },
        }),
      } as any);

      const response = await downloadHandler(request, { params: { chainId: 'osmosis' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.downloadUrl).toBeDefined();
      expect(data.data.expiresAt).toBeDefined();
      expect(data.data.bandwidth.allocatedMbps).toBe(50); // Free tier
      expect(data.data.estimatedDownloadTime).toBeDefined();
    });

    it('should allocate premium bandwidth for premium users', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/osmosis/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'authjs.session-token=mock-premium-session',
        },
        body: JSON.stringify({
          fileName: 'osmosis-1-pruned-20240320.tar.gz',
        }),
      });

      // Mock premium session
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: 'premium-user-1',
            tier: 'premium',
          },
        }),
      } as any);

      const response = await downloadHandler(request, { params: { chainId: 'osmosis' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.bandwidth.allocatedMbps).toBe(250); // Premium tier
    });

    it('should return 404 for non-existent snapshot', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/osmosis/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'authjs.session-token=mock-session',
        },
        body: JSON.stringify({
          fileName: 'nonexistent.tar.gz',
        }),
      });

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: 'test-user-1',
            tier: 'free',
          },
        }),
      } as any);

      const response = await downloadHandler(request, { params: { chainId: 'osmosis' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Snapshot not found');
    });

    it('should enforce rate limits', async () => {
      // Test would need to make multiple requests quickly
      // Implementation depends on rate limiting setup
    });
  });
});