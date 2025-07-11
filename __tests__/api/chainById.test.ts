import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/chains/[chainId]/route';

describe('/api/v1/chains/[chainId]', () => {
  describe('GET', () => {
    it('should return a specific chain by ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub');
      const params = Promise.resolve({ chainId: 'cosmos-hub' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: 'cosmos-hub',
        name: 'Cosmos Hub',
        network: 'cosmoshub-4',
        description: expect.any(String),
        logoUrl: expect.any(String),
      });
    });

    it('should return 404 for non-existent chain', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/non-existent');
      const params = Promise.resolve({ chainId: 'non-existent' });
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Chain not found');
      expect(data.message).toContain('non-existent');
    });

    it('should handle different valid chain IDs', async () => {
      const chainIds = ['cosmos-hub', 'osmosis', 'juno'];
      
      for (const chainId of chainIds) {
        const request = new NextRequest(`http://localhost:3000/api/v1/chains/${chainId}`);
        const params = Promise.resolve({ chainId });
        
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.id).toBe(chainId);
      }
    });

    it('should handle errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chains/cosmos-hub');
      // Simulate an error by passing a rejected promise
      const params = Promise.reject(new Error('Database connection failed'));
      
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch chain');
      expect(data.message).toBe('Database connection failed');
    });
  });
});