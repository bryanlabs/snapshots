import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/chains/route';
import * as metrics from '@/lib/monitoring/metrics';
import * as logger from '@/lib/middleware/logger';

// Mock the monitoring and logging modules
jest.mock('@/lib/monitoring/metrics');
jest.mock('@/lib/middleware/logger');

describe('/api/v1/chains', () => {
  let mockCollectResponseTime: jest.Mock;
  let mockTrackRequest: jest.Mock;
  let mockExtractRequestMetadata: jest.Mock;
  let mockLogRequest: jest.Mock;

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

    (metrics.collectResponseTime as jest.Mock) = mockCollectResponseTime;
    (metrics.trackRequest as jest.Mock) = mockTrackRequest;
    (logger.extractRequestMetadata as jest.Mock) = mockExtractRequestMetadata;
    (logger.logRequest as jest.Mock) = mockLogRequest;
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
      expect(firstChain).toHaveProperty('description');
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
      expect(chainIds).toContain('cosmos-hub');
      expect(chainIds).toContain('osmosis');
      expect(chainIds).toContain('juno');
    });
  });
});