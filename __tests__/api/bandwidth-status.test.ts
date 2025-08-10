import { NextRequest } from 'next/server';

// Mock dependencies before imports
jest.mock('@/lib/bandwidth/manager');
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

import { GET } from '@/app/api/bandwidth/status/route';
import { bandwidthManager } from '@/lib/bandwidth/manager';
import { auth } from '@/auth';

describe('/api/bandwidth/status', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockGetStats = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (bandwidthManager.getStats as jest.Mock) = mockGetStats;
  });

  describe('GET', () => {
    it('should return bandwidth status for free tier user', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user123',
          email: 'test@example.com',
          tier: 'free',
        },
      });

      mockGetStats.mockReturnValue({
        activeConnections: 5,
        connectionsByTier: {
          free: 3,
          premium: 2,
        },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        tier: 'free',
        currentSpeed: 16.666666666666668, // 50 / 3
        maxSpeed: 50,
        activeConnections: 3,
        totalActiveConnections: 5,
      });
      expect(mockGetStats).toHaveBeenCalled();
    });

    it('should return bandwidth status for premium tier user', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'premium123',
          email: 'premium@example.com',
          tier: 'premium',
        },
      });

      mockGetStats.mockReturnValue({
        activeConnections: 4,
        connectionsByTier: {
          free: 2,
          premium: 2,
        },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        tier: 'premium',
        currentSpeed: 125, // 250 / 2
        maxSpeed: 250,
        activeConnections: 2,
        totalActiveConnections: 4,
      });
    });

    it('should handle anonymous users as free tier', async () => {
      mockAuth.mockResolvedValue(null);

      mockGetStats.mockReturnValue({
        activeConnections: 1,
        connectionsByTier: {
          free: 1,
          premium: 0,
        },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tier).toBe('free');
      expect(data.maxSpeed).toBe(50);
      expect(data.currentSpeed).toBe(50); // 50 / 1
    });

    it('should return 0 current speed when no active connections', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user123',
          email: 'test@example.com',
          tier: 'free',
        },
      });

      mockGetStats.mockReturnValue({
        activeConnections: 0,
        connectionsByTier: {
          free: 0,
          premium: 0,
        },
      });

      const response = await GET();
      const data = await response.json();

      expect(data.currentSpeed).toBe(0);
      expect(data.activeConnections).toBe(0);
    });

    it('should handle bandwidth manager errors', async () => {
      mockAuth.mockResolvedValue(null);
      mockGetStats.mockImplementation(() => {
        throw new Error('Bandwidth manager error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get bandwidth status');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get bandwidth status:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle auth errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service unavailable'));

      mockGetStats.mockReturnValue({
        activeConnections: 1,
        connectionsByTier: {
          free: 1,
          premium: 0,
        },
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get bandwidth status');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});