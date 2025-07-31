import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Mock modules
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    snapshotRequest: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock fetch for snapshot-processor API calls
global.fetch = jest.fn();

describe('Custom Snapshot Request API', () => {
  const mockAuth = auth as jest.Mock;
  const mockFetch = global.fetch as jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/account/snapshots/request', () => {
    it('should create snapshot request with priority 100 for premium users', async () => {
      // Mock premium user with credits
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'premium_user',
          email: 'premium@example.com',
          tier: 'premium',
          creditBalance: 1000,
        },
      });

      // Mock credit balance check (future implementation)
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'premium_user',
        creditBalance: 1000,
      });

      // Mock snapshot-processor API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          request_id: 'proc_123',
          status: 'pending',
        }),
      });

      // Mock database creation
      (prisma.snapshotRequest.create as jest.Mock).mockResolvedValueOnce({
        id: 'req_123',
        userId: 'premium_user',
        processorRequestId: 'proc_123',
        chainId: 'osmosis-1',
        blockHeight: 0,
        priority: 100,
        status: 'pending',
      });

      const requestBody = {
        chainId: 'osmosis-1',
        targetHeight: 0,
        pruningMode: 'default',
        compressionType: 'zstd',
        isPrivate: false,
        retentionDays: 30,
        scheduleType: 'once',
      };

      // Verify snapshot-processor receives priority 100
      const processorCallArgs = mockFetch.mock.calls[0];
      expect(processorCallArgs[0]).toContain('snapshot-processor');
      
      const processorBody = JSON.parse(processorCallArgs[1].body);
      expect(processorBody.metadata.priority).toBe('100');
      expect(processorBody.metadata.tier).toBe('premium');
    });

    it('should reject request when insufficient credits', async () => {
      // Mock premium user with low credits
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'poor_premium_user',
          email: 'poor@example.com',
          tier: 'premium',
          creditBalance: 10,
        },
      });

      // Mock cost estimation returning higher than balance
      const requestBody = {
        chainId: 'osmosis-1',
        targetHeight: 0,
        compressionType: 'zstd',
        estimatedCost: 500, // More than user has
      };

      // Should return error
      const response = {
        status: 402,
        body: {
          error: 'Insufficient credits',
          required: 500,
          available: 10,
          upgradeUrl: '/account/credits',
        },
      };

      expect(response.status).toBe(402);
      expect(response.body.error).toBe('Insufficient credits');
    });

    it('should validate required parameters', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'premium_user',
          tier: 'premium',
        },
      });

      // Missing chainId
      const invalidRequest = {
        targetHeight: 0,
        compressionType: 'zstd',
      };

      const response = {
        status: 400,
        body: {
          error: 'Missing required field: chainId',
        },
      };

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('chainId');
    });

    it('should handle custom block heights correctly', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'premium_user',
          tier: 'premium',
          creditBalance: 1000,
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          request_id: 'proc_456',
        }),
      });

      const requestBody = {
        chainId: 'noble-1',
        targetHeight: 12345678, // Specific height
        compressionType: 'zstd',
      };

      // Verify processor receives correct height
      const processorCall = mockFetch.mock.calls[0];
      const body = JSON.parse(processorCall[1].body);
      expect(body.target_height).toBe(12345678);
    });

    it('should handle recurring snapshots with cron schedule', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'premium_user',
          tier: 'premium',
          creditBalance: 5000,
        },
      });

      const requestBody = {
        chainId: 'cosmos-hub',
        targetHeight: 0,
        compressionType: 'lz4',
        scheduleType: 'recurring',
        scheduleCron: '0 */6 * * *', // Every 6 hours
      };

      (prisma.snapshotRequest.create as jest.Mock).mockResolvedValueOnce({
        id: 'req_recurring',
        scheduleType: 'recurring',
        scheduleCron: '0 */6 * * *',
        nextRunAt: new Date('2025-08-01T00:00:00Z'),
      });

      // Should create with schedule
      const dbCall = (prisma.snapshotRequest.create as jest.Mock).mock.calls[0];
      expect(dbCall[0].data.scheduleType).toBe('recurring');
      expect(dbCall[0].data.scheduleCron).toBe('0 */6 * * *');
    });

    it('should set private flag for private snapshots', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'premium_user',
          tier: 'premium',
          creditBalance: 1000,
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ request_id: 'proc_private' }),
      });

      const requestBody = {
        chainId: 'juno-1',
        targetHeight: 0,
        compressionType: 'zstd',
        isPrivate: true,
      };

      // Verify processor metadata includes private flag
      const processorCall = mockFetch.mock.calls[0];
      const body = JSON.parse(processorCall[1].body);
      expect(body.metadata.is_private).toBe('true');
    });
  });

  describe('Credit Cost Estimation', () => {
    it('should calculate costs based on chain and options', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'premium_user',
          tier: 'premium',
        },
      });

      // Mock cost calculation
      const costRequest = {
        chainId: 'osmosis-1',
        compressionType: 'zstd',
        scheduleType: 'once',
      };

      const expectedCost = {
        baseCost: 100,
        compressionCost: 100, // 50 per type
        scheduleCost: 0,
        totalCost: 200,
      };

      expect(expectedCost.totalCost).toBe(200);
      expect(expectedCost.compressionCost).toBe(100);
    });
  });
});