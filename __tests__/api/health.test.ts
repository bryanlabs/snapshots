import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';
import { listChains } from '@/lib/nginx/operations';

// Mock dependencies
jest.mock('@/lib/nginx/operations');

describe('/api/health', () => {
  const mockListChains = listChains as jest.MockedFunction<typeof listChains>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return healthy status when nginx is accessible', async () => {
      mockListChains.mockResolvedValue([
        { id: 'cosmos-hub', name: 'Cosmos Hub' },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
      expect(data.data.services.database).toBe(true);
      expect(data.data.services.minio).toBe(true); // Actually nginx, but kept for compatibility
      expect(data.data.timestamp).toBeDefined();
      expect(mockListChains).toHaveBeenCalled();
    });

    it('should return unhealthy status when nginx is not accessible', async () => {
      mockListChains.mockRejectedValue(new Error('Connection refused'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('unhealthy');
      expect(data.data.services.database).toBe(true);
      expect(data.data.services.minio).toBe(false);
      expect(mockListChains).toHaveBeenCalled();
    });

    it('should include timestamp in ISO format', async () => {
      mockListChains.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      const timestamp = new Date(data.data.timestamp);
      expect(timestamp.toISOString()).toBe(data.data.timestamp);
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock listChains to throw synchronously inside the try block
      mockListChains.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await GET();
      const data = await response.json();

      // The error is caught in the inner try-catch, so it returns unhealthy status
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('unhealthy');
      expect(data.data.services.minio).toBe(false);
    });

    it('should log nginx health check failures', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockListChains.mockRejectedValue(new Error('Network timeout'));

      await GET();

      expect(consoleSpy).toHaveBeenCalledWith(
        'nginx health check failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});