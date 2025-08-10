/**
 * @jest-environment node
 */

// Mock dependencies before imports
jest.mock('@/lib/monitoring/metrics');
jest.mock('@/lib/middleware/logger');
jest.mock('@/lib/nginx/operations');
jest.mock('@/lib/cache/redis-cache', () => ({
  cache: {
    staleWhileRevalidate: jest.fn(),
  },
  cacheKeys: {
    chains: jest.fn().mockReturnValue('chains-cache-key'),
  },
}));
jest.mock('@/lib/config', () => ({
  config: {
    nginx: {
      baseUrl: 'http://nginx',
    },
  },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/chains/route';
import * as metrics from '@/lib/monitoring/metrics';
import * as logger from '@/lib/middleware/logger';
import * as nginxOperations from '@/lib/nginx/operations';

describe('/api/v1/chains', () => {
  let mockCollectResponseTime: jest.Mock;
  let mockTrackRequest: jest.Mock;
  let mockExtractRequestMetadata: jest.Mock;
  let mockLogRequest: jest.Mock;
  let mockListChains: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockCollectResponseTime = jest.fn().mockReturnValue(jest.fn());
    mockTrackRequest = jest.fn();
    mockExtractRequestMetadata = jest.fn().mockReturnValue({
      method: 'GET',
      path: '/api/v1/chains',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    });
    mockLogRequest = jest.fn();

    // Mock nginx operations
    mockListChains = jest.fn().mockResolvedValue([
      {
        chainId: 'cosmoshub-4',
        snapshotCount: 2,
        latestSnapshot: {
          filename: 'cosmoshub-4-20250130.tar.lz4',
          size: 1000000000,
          lastModified: new Date('2025-01-30'),
          compressionType: 'lz4',
        },
        totalSize: 2000000000,
      },
      {
        chainId: 'osmosis-1',
        snapshotCount: 1,
        latestSnapshot: {
          filename: 'osmosis-1-20250130.tar.lz4',
          size: 500000000,
          lastModified: new Date('2025-01-30'),
          compressionType: 'lz4',
        },
        totalSize: 500000000,
      },
      {
        chainId: 'juno-1',
        snapshotCount: 1,
        latestSnapshot: {
          filename: 'juno-1-20250130.tar.zst',
          size: 300000000,
          lastModified: new Date('2025-01-30'),
          compressionType: 'zst',
        },
        totalSize: 300000000,
      },
    ]);

    // Set up cache mock to call the function directly
    const { cache } = require('@/lib/cache/redis-cache');
    cache.staleWhileRevalidate.mockImplementation(async (key: string, fn: () => Promise<any>) => {
      return await fn();
    });

    (metrics.collectResponseTime as jest.Mock) = mockCollectResponseTime;
    (metrics.trackRequest as jest.Mock) = mockTrackRequest;
    (logger.extractRequestMetadata as jest.Mock) = mockExtractRequestMetadata;
    (logger.logRequest as jest.Mock) = mockLogRequest;
    (nginxOperations.listChains as jest.Mock) = mockListChains;
  });

  describe('GET', () => {
    it('should return a list of chains successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      
      // Verify the structure of chain objects
      const firstChain = data.data[0];
      expect(firstChain).toHaveProperty('id');
      expect(firstChain).toHaveProperty('name');
      expect(firstChain).toHaveProperty('network');
      expect(firstChain).toHaveProperty('logoUrl');
    });

    it('should call monitoring metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      await GET(request);

      expect(mockCollectResponseTime).toHaveBeenCalledWith('GET', '/api/v1/chains');
      expect(mockTrackRequest).toHaveBeenCalledWith('GET', '/api/v1/chains', 200);
    });

    it('should log the request', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      await GET(request);

      expect(mockExtractRequestMetadata).toHaveBeenCalledWith(request);
      expect(mockLogRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          path: '/api/v1/chains',
          responseStatus: 200,
          responseTime: expect.any(Number),
        })
      );
    });

    it('should return known chain IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      const chainIds = data.data.map((chain: any) => chain.id);
      expect(chainIds).toContain('cosmoshub-4');
      expect(chainIds).toContain('osmosis-1');
      expect(chainIds).toContain('juno-1');
    });

    it('should handle nginx errors', async () => {
      mockListChains.mockRejectedValue(new Error('Nginx connection failed'));

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch chains');
      expect(data.message).toBe('Nginx connection failed');
      expect(mockTrackRequest).toHaveBeenCalledWith('GET', '/api/v1/chains', 500);
    });

    it('should handle non-Error exceptions', async () => {
      mockListChains.mockRejectedValue('String error');

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch chains');
      expect(data.message).toBe('Unknown error');
    });

    it('should include chain metadata with correct properties', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      // Check Cosmos Hub metadata
      const cosmosHub = data.data.find((chain: any) => chain.id === 'cosmoshub-4');
      expect(cosmosHub).toBeDefined();
      expect(cosmosHub.name).toBe('Cosmos Hub');
      expect(cosmosHub.logoUrl).toBe('/chains/cosmos.png');
      expect(cosmosHub.accentColor).toBe('#5E72E4');
      expect(cosmosHub.network).toBe('cosmoshub-4');

      // Check Osmosis metadata
      const osmosis = data.data.find((chain: any) => chain.id === 'osmosis-1');
      expect(osmosis).toBeDefined();
      expect(osmosis.name).toBe('Osmosis');
      expect(osmosis.logoUrl).toBe('/chains/osmosis.png');
      expect(osmosis.accentColor).toBe('#9945FF');
    });

    it('should use default metadata for unknown chains', async () => {
      mockListChains.mockResolvedValue([
        {
          chainId: 'unknown-chain',
          snapshotCount: 1,
          latestSnapshot: {
            filename: 'unknown-chain-20250130.tar.lz4',
            size: 100000000,
            lastModified: new Date('2025-01-30'),
            compressionType: 'lz4',
          },
          totalSize: 100000000,
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      const unknownChain = data.data[0];
      expect(unknownChain.id).toBe('unknown-chain');
      expect(unknownChain.name).toBe('unknown-chain'); // Uses chainId as name
      expect(unknownChain.logoUrl).toBe('/chains/placeholder.svg');
      expect(unknownChain.accentColor).toBe('#3B82F6'); // Default blue
    });

    it('should include snapshot information in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      const cosmosHub = data.data.find((chain: any) => chain.id === 'cosmoshub-4');
      expect(cosmosHub.snapshotCount).toBe(2);
      expect(cosmosHub.latestSnapshot).toBeDefined();
      expect(cosmosHub.latestSnapshot.size).toBe(1000000000);
      expect(cosmosHub.latestSnapshot.lastModified).toBe('2025-01-30T00:00:00.000Z');
      expect(cosmosHub.latestSnapshot.compressionType).toBe('lz4');
    });

    it('should handle chains without latest snapshot', async () => {
      mockListChains.mockResolvedValue([
        {
          chainId: 'empty-chain',
          snapshotCount: 0,
          latestSnapshot: undefined,
          totalSize: 0,
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      const emptyChain = data.data[0];
      expect(emptyChain.snapshotCount).toBe(0);
      expect(emptyChain.latestSnapshot).toBeUndefined();
    });

    it('should use stale-while-revalidate caching', async () => {
      const { cache } = require('@/lib/cache/redis-cache');
      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      await GET(request);

      expect(cache.staleWhileRevalidate).toHaveBeenCalledWith(
        'chains-cache-key',
        expect.any(Function),
        {
          ttl: 300, // 5 minutes fresh
          staleTime: 3600, // 1 hour stale
          tags: ['chains'],
        }
      );
    });

    it('should handle empty chains list', async () => {
      mockListChains.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should log errors with correct metadata', async () => {
      const testError = new Error('Test error');
      mockListChains.mockRejectedValue(testError);

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      await GET(request);

      expect(mockLogRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          path: '/api/v1/chains',
          responseStatus: 500,
          responseTime: expect.any(Number),
          error: 'Test error',
        })
      );
    });

    it('should handle chains with missing compression type', async () => {
      mockListChains.mockResolvedValue([
        {
          chainId: 'test-chain',
          snapshotCount: 1,
          latestSnapshot: {
            filename: 'test-chain-20250130.tar.lz4',
            size: 100000000,
            lastModified: new Date('2025-01-30'),
            compressionType: undefined,
          },
          totalSize: 100000000,
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      const testChain = data.data[0];
      expect(testChain.latestSnapshot.compressionType).toBe('zst'); // Default compression
    });

    it('should handle all known chain metadata', async () => {
      const knownChains = [
        { id: 'noble-1', name: 'Noble', color: '#FFB800' },
        { id: 'cosmoshub-4', name: 'Cosmos Hub', color: '#5E72E4' },
        { id: 'osmosis-1', name: 'Osmosis', color: '#9945FF' },
        { id: 'juno-1', name: 'Juno', color: '#3B82F6' },
        { id: 'kaiyo-1', name: 'Kujira', color: '#DC3545' },
        { id: 'columbus-5', name: 'Terra Classic', color: '#FF6B6B' },
        { id: 'phoenix-1', name: 'Terra', color: '#FF6B6B' },
        { id: 'thorchain-1', name: 'THORChain', color: '#00D4AA' },
        { id: 'agoric-3', name: 'Agoric', color: '#DB2777' },
      ];

      mockListChains.mockResolvedValue(
        knownChains.map(chain => ({
          chainId: chain.id,
          snapshotCount: 1,
          latestSnapshot: {
            filename: `${chain.id}-20250130.tar.lz4`,
            size: 100000000,
            lastModified: new Date('2025-01-30'),
            compressionType: 'lz4',
          },
          totalSize: 100000000,
        }))
      );

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.length).toBe(knownChains.length);
      
      knownChains.forEach(expectedChain => {
        const actualChain = data.data.find((c: any) => c.id === expectedChain.id);
        expect(actualChain).toBeDefined();
        expect(actualChain.name).toBe(expectedChain.name);
        expect(actualChain.accentColor).toBe(expectedChain.color);
        expect(actualChain.logoUrl).toContain(`.png`);
      });
    });

    it('should measure response time correctly', async () => {
      const endTimerMock = jest.fn();
      mockCollectResponseTime.mockReturnValue(endTimerMock);

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      await GET(request);

      expect(mockCollectResponseTime).toHaveBeenCalledWith('GET', '/api/v1/chains');
      expect(endTimerMock).toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      const { cache } = require('@/lib/cache/redis-cache');
      cache.staleWhileRevalidate.mockRejectedValue(new Error('Cache error'));

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch chains');
    });

    it('should extract request metadata', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains', {
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '192.168.1.1',
        },
      });
      
      await GET(request);

      expect(mockExtractRequestMetadata).toHaveBeenCalledWith(request);
    });

    it('should handle synchronous errors in nginx operations', async () => {
      mockListChains.mockImplementation(() => {
        throw new Error('Synchronous error');
      });

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch chains');
      expect(data.message).toBe('Synchronous error');
    });

    it('should format date strings correctly in latestSnapshot', async () => {
      const testDate = new Date('2025-01-30T12:34:56.789Z');
      mockListChains.mockResolvedValue([
        {
          chainId: 'test-chain',
          snapshotCount: 1,
          latestSnapshot: {
            filename: 'test-chain-20250130.tar.lz4',
            size: 100000000,
            lastModified: testDate,
            compressionType: 'lz4',
          },
          totalSize: 100000000,
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/v1/chains');
      
      const response = await GET(request);
      const data = await response.json();

      const testChain = data.data[0];
      expect(testChain.latestSnapshot.lastModified).toBe('2025-01-30T12:34:56.789Z');
    });

  });
});