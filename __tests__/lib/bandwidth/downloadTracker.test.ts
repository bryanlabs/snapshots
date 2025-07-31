import {
  trackDownloadBandwidth,
  endDownloadConnection,
  getBandwidthStatus,
  resetMonthlyBandwidth,
} from '@/lib/bandwidth/downloadTracker';
import { bandwidthManager } from '@/lib/bandwidth/manager';
import { logBandwidth } from '@/lib/middleware/logger';

// Mock dependencies
jest.mock('@/lib/bandwidth/manager', () => ({
  bandwidthManager: {
    getConnectionStats: jest.fn(),
    updateConnection: jest.fn(),
    hasExceededLimit: jest.fn(),
    getUserBandwidth: jest.fn(),
    endConnection: jest.fn(),
    getAvailableBandwidth: jest.fn(),
    resetMonthlyUsage: jest.fn(),
  },
}));

jest.mock('@/lib/middleware/logger', () => ({
  logBandwidth: jest.fn(),
}));

// Mock console.log
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

describe('downloadTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  describe('trackDownloadBandwidth', () => {
    it('should update connection bandwidth when connection exists', () => {
      const mockConnection = {
        connectionId: 'conn-123',
        userId: 'user-456',
        tier: 'free' as const,
        bytesTransferred: 1000000,
      };

      (bandwidthManager.getConnectionStats as jest.Mock).mockReturnValue(mockConnection);
      (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(false);

      trackDownloadBandwidth('conn-123', 500000);

      expect(bandwidthManager.getConnectionStats).toHaveBeenCalledWith('conn-123');
      expect(bandwidthManager.updateConnection).toHaveBeenCalledWith('conn-123', 500000);
      expect(bandwidthManager.hasExceededLimit).toHaveBeenCalledWith('user-456', 'free');
    });

    it('should log bandwidth when limit exceeded', () => {
      const mockConnection = {
        connectionId: 'conn-123',
        userId: 'user-456',
        tier: 'free' as const,
      };

      (bandwidthManager.getConnectionStats as jest.Mock).mockReturnValue(mockConnection);
      (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(true);
      (bandwidthManager.getUserBandwidth as jest.Mock).mockReturnValue(5368709120); // 5GB

      trackDownloadBandwidth('conn-123', 100000);

      expect(logBandwidth).toHaveBeenCalledWith(
        'user-456',
        'free',
        5368709120,
        true
      );
    });

    it('should not log bandwidth when limit not exceeded', () => {
      const mockConnection = {
        connectionId: 'conn-123',
        userId: 'user-456',
        tier: 'premium' as const,
      };

      (bandwidthManager.getConnectionStats as jest.Mock).mockReturnValue(mockConnection);
      (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(false);

      trackDownloadBandwidth('conn-123', 100000);

      expect(logBandwidth).not.toHaveBeenCalled();
    });

    it('should handle non-existent connection', () => {
      (bandwidthManager.getConnectionStats as jest.Mock).mockReturnValue(null);

      trackDownloadBandwidth('non-existent', 100000);

      expect(bandwidthManager.updateConnection).not.toHaveBeenCalled();
      expect(bandwidthManager.hasExceededLimit).not.toHaveBeenCalled();
      expect(logBandwidth).not.toHaveBeenCalled();
    });

    it('should handle different tier types', () => {
      const tiers = ['free', 'premium'] as const;

      tiers.forEach(tier => {
        const mockConnection = {
          connectionId: `conn-${tier}`,
          userId: `user-${tier}`,
          tier,
        };

        (bandwidthManager.getConnectionStats as jest.Mock).mockReturnValue(mockConnection);
        (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(false);

        trackDownloadBandwidth(`conn-${tier}`, 100000);

        expect(bandwidthManager.hasExceededLimit).toHaveBeenCalledWith(`user-${tier}`, tier);
      });
    });
  });

  describe('endDownloadConnection', () => {
    it('should log bandwidth and end connection when connection exists', () => {
      const mockConnection = {
        connectionId: 'conn-123',
        userId: 'user-456',
        tier: 'free' as const,
      };

      (bandwidthManager.getConnectionStats as jest.Mock).mockReturnValue(mockConnection);
      (bandwidthManager.getUserBandwidth as jest.Mock).mockReturnValue(2147483648); // 2GB

      endDownloadConnection('conn-123');

      expect(bandwidthManager.getConnectionStats).toHaveBeenCalledWith('conn-123');
      expect(bandwidthManager.getUserBandwidth).toHaveBeenCalledWith('user-456');
      expect(logBandwidth).toHaveBeenCalledWith(
        'user-456',
        'free',
        2147483648,
        false
      );
      expect(bandwidthManager.endConnection).toHaveBeenCalledWith('conn-123');
    });

    it('should handle non-existent connection', () => {
      (bandwidthManager.getConnectionStats as jest.Mock).mockReturnValue(null);

      endDownloadConnection('non-existent');

      expect(bandwidthManager.getUserBandwidth).not.toHaveBeenCalled();
      expect(logBandwidth).not.toHaveBeenCalled();
      expect(bandwidthManager.endConnection).not.toHaveBeenCalled();
    });

    it('should handle zero bandwidth usage', () => {
      const mockConnection = {
        connectionId: 'conn-123',
        userId: 'user-456',
        tier: 'premium' as const,
      };

      (bandwidthManager.getConnectionStats as jest.Mock).mockReturnValue(mockConnection);
      (bandwidthManager.getUserBandwidth as jest.Mock).mockReturnValue(0);

      endDownloadConnection('conn-123');

      expect(logBandwidth).toHaveBeenCalledWith(
        'user-456',
        'premium',
        0,
        false
      );
    });
  });

  describe('getBandwidthStatus', () => {
    it('should return bandwidth status for free tier', () => {
      (bandwidthManager.getUserBandwidth as jest.Mock).mockReturnValue(1073741824); // 1GB
      (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(false);
      (bandwidthManager.getAvailableBandwidth as jest.Mock).mockReturnValue(4294967296); // 4GB

      const status = getBandwidthStatus('user-123', 'free');

      expect(status).toEqual({
        currentUsage: 1073741824,
        hasExceeded: false,
        availableBandwidth: 4294967296,
        tier: 'free',
      });

      expect(bandwidthManager.getUserBandwidth).toHaveBeenCalledWith('user-123');
      expect(bandwidthManager.hasExceededLimit).toHaveBeenCalledWith('user-123', 'free');
      expect(bandwidthManager.getAvailableBandwidth).toHaveBeenCalledWith('user-123', 'free');
    });

    it('should return bandwidth status for premium tier', () => {
      (bandwidthManager.getUserBandwidth as jest.Mock).mockReturnValue(10737418240); // 10GB
      (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(false);
      (bandwidthManager.getAvailableBandwidth as jest.Mock).mockReturnValue(-1); // Unlimited

      const status = getBandwidthStatus('user-456', 'premium');

      expect(status).toEqual({
        currentUsage: 10737418240,
        hasExceeded: false,
        availableBandwidth: -1,
        tier: 'premium',
      });
    });

    it('should handle exceeded limit', () => {
      (bandwidthManager.getUserBandwidth as jest.Mock).mockReturnValue(5368709120); // 5GB
      (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(true);
      (bandwidthManager.getAvailableBandwidth as jest.Mock).mockReturnValue(0);

      const status = getBandwidthStatus('user-789', 'free');

      expect(status).toEqual({
        currentUsage: 5368709120,
        hasExceeded: true,
        availableBandwidth: 0,
        tier: 'free',
      });
    });

    it('should handle zero usage', () => {
      (bandwidthManager.getUserBandwidth as jest.Mock).mockReturnValue(0);
      (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(false);
      (bandwidthManager.getAvailableBandwidth as jest.Mock).mockReturnValue(5368709120); // 5GB

      const status = getBandwidthStatus('new-user', 'free');

      expect(status).toEqual({
        currentUsage: 0,
        hasExceeded: false,
        availableBandwidth: 5368709120,
        tier: 'free',
      });
    });
  });

  describe('resetMonthlyBandwidth', () => {
    it('should reset monthly usage and log completion', () => {
      resetMonthlyBandwidth();

      expect(bandwidthManager.resetMonthlyUsage).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Monthly bandwidth usage reset completed');
    });

    it('should handle reset errors gracefully', () => {
      (bandwidthManager.resetMonthlyUsage as jest.Mock).mockImplementation(() => {
        throw new Error('Reset failed');
      });

      expect(() => resetMonthlyBandwidth()).toThrow('Reset failed');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete download lifecycle', () => {
      const connectionId = 'conn-integration';
      const mockConnection = {
        connectionId,
        userId: 'user-int',
        tier: 'free' as const,
      };

      // Start tracking
      (bandwidthManager.getConnectionStats as jest.Mock).mockReturnValue(mockConnection);
      (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(false);

      // Track multiple bandwidth updates
      trackDownloadBandwidth(connectionId, 1000000); // 1MB
      trackDownloadBandwidth(connectionId, 2000000); // 2MB
      trackDownloadBandwidth(connectionId, 3000000); // 3MB

      expect(bandwidthManager.updateConnection).toHaveBeenCalledTimes(3);

      // End connection
      (bandwidthManager.getUserBandwidth as jest.Mock).mockReturnValue(6000000); // 6MB total

      endDownloadConnection(connectionId);

      expect(logBandwidth).toHaveBeenCalledWith(
        'user-int',
        'free',
        6000000,
        false
      );
      expect(bandwidthManager.endConnection).toHaveBeenCalledWith(connectionId);
    });

    it('should handle bandwidth limit exceeded during download', () => {
      const connectionId = 'conn-exceed';
      const mockConnection = {
        connectionId,
        userId: 'user-exceed',
        tier: 'free' as const,
      };

      (bandwidthManager.getConnectionStats as jest.Mock).mockReturnValue(mockConnection);
      
      // First update - under limit
      (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(false);
      trackDownloadBandwidth(connectionId, 4000000000); // 4GB

      expect(logBandwidth).not.toHaveBeenCalled();

      // Second update - exceeds limit
      (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(true);
      (bandwidthManager.getUserBandwidth as jest.Mock).mockReturnValue(5500000000); // 5.5GB

      trackDownloadBandwidth(connectionId, 1500000000); // 1.5GB

      expect(logBandwidth).toHaveBeenCalledWith(
        'user-exceed',
        'free',
        5500000000,
        true
      );
    });

    it('should handle concurrent connections for same user', () => {
      const connections = ['conn-1', 'conn-2', 'conn-3'];
      const userId = 'user-concurrent';

      connections.forEach((connId, index) => {
        const mockConnection = {
          connectionId: connId,
          userId,
          tier: 'premium' as const,
        };

        (bandwidthManager.getConnectionStats as jest.Mock)
          .mockReturnValueOnce(mockConnection);
        (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(false);

        trackDownloadBandwidth(connId, 1000000 * (index + 1));
      });

      expect(bandwidthManager.updateConnection).toHaveBeenCalledTimes(3);

      // Get status after all connections
      (bandwidthManager.getUserBandwidth as jest.Mock).mockReturnValue(6000000); // Total
      (bandwidthManager.hasExceededLimit as jest.Mock).mockReturnValue(false);
      (bandwidthManager.getAvailableBandwidth as jest.Mock).mockReturnValue(-1);

      const status = getBandwidthStatus(userId, 'premium');

      expect(status.currentUsage).toBe(6000000);
      expect(status.hasExceeded).toBe(false);
      expect(status.tier).toBe('premium');
    });
  });
});