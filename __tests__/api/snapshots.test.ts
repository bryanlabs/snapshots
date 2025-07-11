import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/chains/[chainId]/snapshots/route';

describe('/api/v1/chains/[chainId]/snapshots', () => {
  describe('GET', () => {
    it('should return snapshots for a valid chain', async () => {
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
      const chains = ['cosmos-hub', 'osmosis', 'juno'];
      
      for (const chainId of chains) {
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
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub/snapshots');
      const params = Promise.reject(new Error('Database connection failed'));
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch snapshots');
      expect(data.message).toBe('Database connection failed');
    });

    it('should return snapshots with valid types', async () => {
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