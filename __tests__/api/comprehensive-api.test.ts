import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

// Comprehensive API Test Suite
// This ensures all APIs work correctly before and after improvements

// Skip these tests in CI/unit test environment
if (process.env.NODE_ENV === 'test' && !process.env.RUN_INTEGRATION_TESTS) {
  describe.skip('Snapshots Service API - Comprehensive Tests', () => {
    test('Skipped in unit test environment', () => {
      expect(true).toBe(true);
    });
  });
} else {

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TEST_CHAIN_ID = 'noble-1';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper to make API requests
async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<{ status: number; data: ApiResponse<T> }> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();
  return { status: response.status, data };
}

describe('Snapshots Service API - Comprehensive Tests', () => {
  let jwtToken: string | null = null;
  let sessionCookie: string | null = null;
  let latestSnapshotFilename: string | null = null;

  describe('Public API (v1)', () => {
    test('GET /api/v1/chains - List all chains', async () => {
      const { status, data } = await apiRequest('/api/v1/chains');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      
      // Validate chain structure
      const chain = data.data[0];
      expect(chain).toHaveProperty('id');
      expect(chain).toHaveProperty('name');
      expect(chain).toHaveProperty('network');
      expect(chain).toHaveProperty('type');
    });

    test('GET /api/v1/chains/[chainId] - Get specific chain', async () => {
      const { status, data } = await apiRequest(`/api/v1/chains/${TEST_CHAIN_ID}`);
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id', TEST_CHAIN_ID);
      expect(data.data).toHaveProperty('name');
      expect(data.data).toHaveProperty('latestSnapshot');
    });

    test('GET /api/v1/chains/[chainId]/info - Get chain info', async () => {
      const { status, data } = await apiRequest(`/api/v1/chains/${TEST_CHAIN_ID}/info`);
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('chainId', TEST_CHAIN_ID);
      expect(data.data).toHaveProperty('binaryName');
      expect(data.data).toHaveProperty('minimumGasPrice');
    });

    test('GET /api/v1/chains/[chainId]/snapshots - List snapshots', async () => {
      const { status, data } = await apiRequest(`/api/v1/chains/${TEST_CHAIN_ID}/snapshots`);
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        const snapshot = data.data[0];
        expect(snapshot).toHaveProperty('id');
        expect(snapshot).toHaveProperty('chainId', TEST_CHAIN_ID);
        expect(snapshot).toHaveProperty('height');
        expect(snapshot).toHaveProperty('size');
        expect(snapshot).toHaveProperty('fileName');
        expect(snapshot).toHaveProperty('compression');
        
        // Save for later tests
        latestSnapshotFilename = snapshot.fileName;
      }
    });

    test('GET /api/v1/chains/[chainId]/snapshots?type=pruned - Filter snapshots', async () => {
      const { status, data } = await apiRequest(`/api/v1/chains/${TEST_CHAIN_ID}/snapshots?type=pruned`);
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // All returned snapshots should be pruned type
      data.data.forEach((snapshot: any) => {
        expect(snapshot.type).toBe('pruned');
      });
    });

    test('GET /api/v1/chains/[chainId]/snapshots/latest - Get latest snapshot', async () => {
      const { status, data } = await apiRequest(`/api/v1/chains/${TEST_CHAIN_ID}/snapshots/latest`);
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('chainId', TEST_CHAIN_ID);
      expect(data.data).toHaveProperty('fileName');
    });

    test('POST /api/v1/chains/[chainId]/download - Request download URL (anonymous)', async () => {
      if (!latestSnapshotFilename) {
        console.warn('No snapshot filename available, skipping download test');
        return;
      }

      const { status, data } = await apiRequest(`/api/v1/chains/${TEST_CHAIN_ID}/download`, {
        method: 'POST',
        body: JSON.stringify({ filename: latestSnapshotFilename }),
      });
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('downloadUrl');
      expect(data.data).toHaveProperty('expires');
      expect(data.data).toHaveProperty('tier', 'free');
      expect(data.data).toHaveProperty('bandwidthLimit', '50 Mbps');
      
      // Validate URL structure
      const url = new URL(data.data.downloadUrl);
      expect(url.searchParams.has('md5')).toBe(true);
      expect(url.searchParams.has('expires')).toBe(true);
      expect(url.searchParams.get('tier')).toBe('free');
    });

    test('GET /api/v1/downloads/status - Check download status', async () => {
      const { status, data } = await apiRequest('/api/v1/downloads/status');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('dailyLimit');
      expect(data.data).toHaveProperty('downloadsToday');
      expect(data.data).toHaveProperty('remainingDownloads');
      expect(data.data).toHaveProperty('tier', 'free');
    });
  });

  describe('System Endpoints', () => {
    test('GET /api/health - Health check', async () => {
      const { status, data } = await apiRequest('/api/health');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('status', 'healthy');
      expect(data.data).toHaveProperty('version');
      expect(data.data).toHaveProperty('services');
    });

    test('GET /api/bandwidth/status - Bandwidth status', async () => {
      const { status, data } = await apiRequest('/api/bandwidth/status');
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('current');
      expect(data.data.current).toHaveProperty('free');
      expect(data.data.current).toHaveProperty('premium');
    });

    test('GET /api/metrics - Prometheus metrics', async () => {
      const response = await fetch(`${BASE_URL}/api/metrics`);
      const text = await response.text();
      
      expect(response.status).toBe(200);
      expect(text).toContain('# HELP');
      expect(text).toContain('# TYPE');
      expect(text).toMatch(/http_requests_total/);
    });
  });

  describe('Authentication Endpoints', () => {
    test('GET /api/auth/providers - List providers', async () => {
      const { status, data } = await apiRequest('/api/auth/providers');
      
      expect(status).toBe(200);
      expect(data).toHaveProperty('credentials');
      expect(data).toHaveProperty('keplr');
    });

    test('GET /api/auth/csrf - Get CSRF token', async () => {
      const { status, data } = await apiRequest('/api/auth/csrf');
      
      expect(status).toBe(200);
      expect(data).toHaveProperty('csrfToken');
      expect(typeof data.csrfToken).toBe('string');
      expect(data.csrfToken.length).toBeGreaterThan(0);
    });

    test('GET /api/auth/session - Get session (unauthenticated)', async () => {
      const { status, data } = await apiRequest('/api/auth/session');
      
      expect(status).toBe(200);
      // Unauthenticated session should be empty or have null user
      expect(data.user).toBeUndefined();
    });

    test('POST /api/v1/auth/login - Legacy login (if configured)', async () => {
      // Skip if premium credentials not configured
      if (!process.env.PREMIUM_PASSWORD) {
        console.warn('PREMIUM_PASSWORD not set, skipping legacy auth test');
        return;
      }

      const { status, data } = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'premium_user',
          password: process.env.PREMIUM_PASSWORD,
        }),
      });
      
      if (status === 200) {
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('token');
        expect(data.data).toHaveProperty('user');
        expect(data.data.user).toHaveProperty('tier', 'premium');
        
        jwtToken = data.data.token;
      }
    });
  });

  describe('Protected Endpoints', () => {
    test('GET /api/account/avatar - Should fail without auth', async () => {
      const { status } = await apiRequest('/api/account/avatar');
      
      expect(status).toBe(401);
    });

    test('POST /api/account/link-email - Should fail without auth', async () => {
      const { status } = await apiRequest('/api/account/link-email', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
      
      expect(status).toBe(401);
    });

    test('GET /api/admin/stats - Should fail without admin', async () => {
      const { status } = await apiRequest('/api/admin/stats');
      
      expect(status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/v1/chains/invalid-chain - Should return 404', async () => {
      const { status, data } = await apiRequest('/api/v1/chains/invalid-chain-id');
      
      expect(status).toBe(404);
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    });

    test('POST /api/v1/chains/[chainId]/download - Invalid filename', async () => {
      const { status, data } = await apiRequest(`/api/v1/chains/${TEST_CHAIN_ID}/download`, {
        method: 'POST',
        body: JSON.stringify({ filename: 'invalid-file.tar.gz' }),
      });
      
      expect(status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
    });

    test('GET /api/v1/chains/[chainId]/snapshots - Invalid query params', async () => {
      const { status, data } = await apiRequest(`/api/v1/chains/${TEST_CHAIN_ID}/snapshots?limit=invalid`);
      
      // Should still work but ignore invalid param or return error
      expect(status).toBeLessThan(500); // Not a server error
    });

    test('POST with invalid JSON - Should handle gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/chains/${TEST_CHAIN_ID}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Response Format Validation', () => {
    test('All success responses follow standard format', async () => {
      const endpoints = [
        '/api/v1/chains',
        `/api/v1/chains/${TEST_CHAIN_ID}`,
        '/api/health',
        '/api/bandwidth/status',
      ];

      for (const endpoint of endpoints) {
        const { data } = await apiRequest(endpoint);
        
        expect(data).toHaveProperty('success');
        expect(typeof data.success).toBe('boolean');
        
        if (data.success) {
          expect(data).toHaveProperty('data');
        } else {
          expect(data).toHaveProperty('error');
        }
      }
    });
  });

  describe('Premium Features (if JWT available)', () => {
    test('POST /api/v1/chains/[chainId]/download - Premium tier', async () => {
      if (!jwtToken || !latestSnapshotFilename) {
        console.warn('No JWT token or snapshot filename, skipping premium test');
        return;
      }

      const { status, data } = await apiRequest(`/api/v1/chains/${TEST_CHAIN_ID}/download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ filename: latestSnapshotFilename }),
      });
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('tier', 'premium');
      expect(data.data).toHaveProperty('bandwidthLimit', '250 Mbps');
    });

    test('GET /api/v1/auth/me - Get user info', async () => {
      if (!jwtToken) {
        console.warn('No JWT token, skipping auth test');
        return;
      }

      const { status, data } = await apiRequest('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('tier', 'premium');
    });
  });

  describe('Performance Tests', () => {
    test('API response times should be under 200ms', async () => {
      const endpoints = [
        '/api/v1/chains',
        `/api/v1/chains/${TEST_CHAIN_ID}`,
        '/api/health',
      ];

      for (const endpoint of endpoints) {
        const start = Date.now();
        await apiRequest(endpoint);
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(200);
      }
    });
  });
});

} // Close the else block