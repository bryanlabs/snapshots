import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/chains/[chainId]/snapshots/route';
import * as nginxOperations from '@/lib/nginx/operations';

// Mock dependencies
jest.mock('@/lib/nginx/operations');
jest.mock('@/lib/cache/redis-cache', () => ({
  cache: {
    getOrSet: jest.fn(),
  },
  cacheKeys: {
    chainSnapshots: jest.fn((chainId) => `snapshots:${chainId}`),
  },
}));

describe('/api/v1/chains/[chainId]/snapshots', () => {
  let mockListSnapshots: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock nginx operations
    mockListSnapshots = jest.fn();
    (nginxOperations.listSnapshots as jest.Mock) = mockListSnapshots;

    // Mock cache to call the function directly
    const { cache } = require('@/lib/cache/redis-cache');
    cache.getOrSet.mockImplementation(async (key: string, fn: () => Promise<any>) => {
      return await fn();
    });
  });

  describe('GET', () => {
    it('should return snapshots for a valid chain', async () => {
      // Mock nginx snapshots
      mockListSnapshots.mockResolvedValue([
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

      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/snapshots');
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      
      // Verify snapshot structure
      const firstSnapshot = data.data[0];
      expect(firstSnapshot).toHaveProperty('id');
      expect(firstSnapshot).toHaveProperty('chainId', 'cosmos-hub');
      expect(firstSnapshot).toHaveProperty('height');
      expect(firstSnapshot).toHaveProperty('size');
      expect(firstSnapshot).toHaveProperty('fileName');
      expect(firstSnapshot).toHaveProperty('createdAt');
      expect(firstSnapshot).toHaveProperty('updatedAt');
      expect(firstSnapshot).toHaveProperty('type');
      expect(firstSnapshot).toHaveProperty('compressionType');
    });

    it('should return empty array for chain with no snapshots', async () => {
      // Mock empty snapshots
      mockListSnapshots.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/v1/chains/unknown-chain/snapshots');
      const params = Promise.resolve({ chainId: 'unknown-chain' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(0);
    });

    it('should return snapshots for different chains', async () => {
      const chains = ['cosmoshub-4', 'osmosis-1', 'juno-1'];
      
      for (const chainId of chains) {
        // Mock snapshots for each chain
        mockListSnapshots.mockResolvedValue([
          {
            filename: `${chainId}-20250130.tar.lz4`,
            size: 1000000000,
            lastModified: new Date('2025-01-30'),
            height: 20250130,
            compressionType: 'lz4',
          },
        ]);

        const request = new NextRequest(`http://localhost:3000/api/v1/chains/${chainId}/snapshots`);
        const params = Promise.resolve({ chainId });
        
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
        
        // All snapshots should belong to the requested chain
        data.data.forEach((snapshot: any) => {
          expect(snapshot.chainId).toBe(chainId);
        });
      }
    });

    it('should handle errors gracefully', async () => {
      // Mock error
      mockListSnapshots.mockRejectedValue(new Error('Nginx connection failed'));

      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/snapshots');
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch snapshots');
      expect(data.message).toBe('Nginx connection failed');
    });

    it('should return snapshots with valid types', async () => {
      // Mock snapshots
      mockListSnapshots.mockResolvedValue([
        {
          filename: 'cosmos-hub-20250130.tar.lz4',
          size: 1000000000,
          lastModified: new Date('2025-01-30'),
          height: 20250130,
          compressionType: 'lz4',
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/snapshots');
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      const validTypes = ['pruned', 'archive'];
      data.data.forEach((snapshot: any) => {
        expect(validTypes).toContain(snapshot.type);
      });
    });

    it('should return snapshots with valid compression types', async () => {
      // Mock snapshots with different compression types
      mockListSnapshots.mockResolvedValue([
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

      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/snapshots');
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      const validCompressionTypes = ['lz4', 'zst', 'gz'];
      data.data.forEach((snapshot: any) => {
        expect(validCompressionTypes).toContain(snapshot.compressionType);
      });
    });
  });
});