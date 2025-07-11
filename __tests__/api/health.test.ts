import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';
import * as minioClient from '@/lib/minio/client';

// Mock MinIO client
jest.mock('@/lib/minio/client');

describe('/api/health', () => {
  let mockGetMinioClient: jest.Mock;
  let mockListBuckets: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockListBuckets = jest.fn().mockResolvedValue([]);
    mockGetMinioClient = jest.fn().mockReturnValue({
      listBuckets: mockListBuckets,
    });

    (minioClient.getMinioClient as jest.Mock) = mockGetMinioClient;
  });

  describe('GET', () => {
    it('should return healthy status when all services are working', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
      expect(data.data.services).toEqual({
        database: true,
        minio: true,
      });
      expect(data.data.timestamp).toBeDefined();
    });

    it('should return unhealthy status when MinIO is down', async () => {
      mockListBuckets.mockRejectedValue(new Error('Connection refused'));
      
      const request = new NextRequest('http://localhost:3000/api/health');
      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('unhealthy');
      expect(data.data.services).toEqual({
        database: true,
        minio: false,
      });
    });

    it('should check MinIO connection', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      
      await GET();

      expect(mockGetMinioClient).toHaveBeenCalled();
      expect(mockListBuckets).toHaveBeenCalled();
    });

    it('should include timestamp in ISO format', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      
      const response = await GET();
      const data = await response.json();

      const timestamp = new Date(data.data.timestamp);
      expect(timestamp.toISOString()).toBe(data.data.timestamp);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should handle unexpected errors', async () => {
      // Mock console.error to suppress error output in tests
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      // Force an unexpected error by mocking getMinioClient to throw
      mockGetMinioClient.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const request = new NextRequest('http://localhost:3000/api/health');
      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Health check failed');
      expect(data.message).toBe('Unexpected error');

      consoleError.mockRestore();
    });
  });
});