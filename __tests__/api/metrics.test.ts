import { NextRequest } from 'next/server';

// Mock dependencies before imports
jest.mock('@/lib/monitoring/metrics');

import { GET } from '@/app/api/metrics/route';
import { refreshCustomSnapshotMetrics, register } from '@/lib/monitoring/metrics';

describe('/api/metrics', () => {
  const mockRegister = register as jest.MockedObject<typeof register>;
  const mockRefreshCustomSnapshotMetrics = refreshCustomSnapshotMetrics as jest.MockedFunction<typeof refreshCustomSnapshotMetrics>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementations
    mockRegister.contentType = 'text/plain; version=0.0.4; charset=utf-8';
    mockRegister.metrics = jest.fn();
    mockRefreshCustomSnapshotMetrics.mockResolvedValue();
  });

  describe('GET', () => {
    it('should return Prometheus metrics', async () => {
      const metricsData = `# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1024
http_requests_total{method="POST",status="201"} 256`;
      mockRegister.metrics.mockResolvedValue(metricsData);

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain; version=0.0.4; charset=utf-8');
      expect(text).toBe(metricsData);
      expect(mockRefreshCustomSnapshotMetrics).toHaveBeenCalled();
      expect(mockRegister.metrics).toHaveBeenCalled();
    });

    it('should work without authentication', async () => {
      const metricsData = `# HELP process_cpu_seconds_total CPU time
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total 123.45`;

      mockRegister.metrics.mockResolvedValue(metricsData);

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe(metricsData);
    });

    it('should handle metrics collection errors', async () => {
      mockRegister.metrics.mockRejectedValue(new Error('Metrics collection failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('text/plain; version=0.0.4; charset=utf-8');
      expect(text).toBe('# Failed to collect metrics\n');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error collecting metrics:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should return proper content type header', async () => {
      mockRegister.metrics.mockResolvedValue('# metrics data');
      mockRegister.contentType = 'text/plain; version=0.0.4; charset=utf-8';

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('text/plain; version=0.0.4; charset=utf-8');
    });
  });
});
