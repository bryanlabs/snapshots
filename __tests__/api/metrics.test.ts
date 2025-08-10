import { NextRequest } from 'next/server';

// Mock dependencies before imports
jest.mock('@/lib/monitoring/metrics');
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

import { GET } from '@/app/api/metrics/route';
import { register } from '@/lib/monitoring/metrics';
import { auth } from '@/auth';

describe('/api/metrics', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockRegister = register as jest.MockedObject<typeof register>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementations
    mockRegister.contentType = 'text/plain; version=0.0.4; charset=utf-8';
    mockRegister.metrics = jest.fn();
  });

  describe('GET', () => {
    it('should return Prometheus metrics', async () => {
      const metricsData = `# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1024
http_requests_total{method="POST",status="201"} 256`;

      mockAuth.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' },
      });
      mockRegister.metrics.mockResolvedValue(metricsData);

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain; version=0.0.4; charset=utf-8');
      expect(text).toBe(metricsData);
      expect(mockAuth).toHaveBeenCalled();
      expect(mockRegister.metrics).toHaveBeenCalled();
    });

    it('should work without authentication', async () => {
      const metricsData = `# HELP process_cpu_seconds_total CPU time
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total 123.45`;

      mockAuth.mockResolvedValue(null);
      mockRegister.metrics.mockResolvedValue(metricsData);

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe(metricsData);
    });

    it('should handle metrics collection errors', async () => {
      mockAuth.mockResolvedValue(null);
      mockRegister.metrics.mockRejectedValue(new Error('Metrics collection failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to collect metrics');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error collecting metrics:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle auth errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service unavailable'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to collect metrics');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return proper content type header', async () => {
      mockAuth.mockResolvedValue(null);
      mockRegister.metrics.mockResolvedValue('# metrics data');
      mockRegister.contentType = 'text/plain; version=0.0.4; charset=utf-8';

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('text/plain; version=0.0.4; charset=utf-8');
    });
  });
});