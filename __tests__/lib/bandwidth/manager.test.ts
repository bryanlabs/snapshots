import { bandwidthManager } from '@/lib/bandwidth/manager';
import * as metrics from '@/lib/monitoring/metrics';

// Mock monitoring metrics
jest.mock('@/lib/monitoring/metrics');

describe('BandwidthManager', () => {
  let mockUpdateBandwidthUsage: jest.Mock;
  let mockUpdateActiveConnections: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset bandwidth manager state
    bandwidthManager.resetMonthlyUsage();
    
    // Setup mocks
    mockUpdateBandwidthUsage = jest.fn();
    mockUpdateActiveConnections = jest.fn();
    
    (metrics.updateBandwidthUsage as jest.Mock) = mockUpdateBandwidthUsage;
    (metrics.updateActiveConnections as jest.Mock) = mockUpdateActiveConnections;
  });

  describe('startConnection', () => {
    it('should start tracking a new connection', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      
      const stats = bandwidthManager.getConnectionStats('conn-1');
      expect(stats).toBeDefined();
      expect(stats?.userId).toBe('user-1');
      expect(stats?.tier).toBe('free');
      expect(stats?.bytesTransferred).toBe(0);
      expect(stats?.startTime).toBeLessThanOrEqual(Date.now());
    });

    it('should update connection metrics', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      
      expect(mockUpdateActiveConnections).toHaveBeenCalledWith('free', 1);
      expect(mockUpdateActiveConnections).toHaveBeenCalledWith('premium', 0);
    });

    it('should handle multiple connections', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      bandwidthManager.startConnection('conn-2', 'user-2', 'premium');
      bandwidthManager.startConnection('conn-3', 'user-1', 'free');
      
      const stats = bandwidthManager.getStats();
      expect(stats.activeConnections).toBe(3);
      expect(stats.connectionsByTier.free).toBe(2);
      expect(stats.connectionsByTier.premium).toBe(1);
    });
  });

  describe('updateConnection', () => {
    it('should update bytes transferred for a connection', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      bandwidthManager.updateConnection('conn-1', 1024);
      
      const stats = bandwidthManager.getConnectionStats('conn-1');
      expect(stats?.bytesTransferred).toBe(1024);
    });

    it('should accumulate bandwidth usage for user', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      bandwidthManager.updateConnection('conn-1', 1024);
      bandwidthManager.updateConnection('conn-1', 2048);
      
      const usage = bandwidthManager.getUserBandwidth('user-1');
      expect(usage).toBe(3072);
    });

    it('should update bandwidth metrics', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'premium');
      bandwidthManager.updateConnection('conn-1', 5000);
      
      expect(mockUpdateBandwidthUsage).toHaveBeenCalledWith('premium', 'user-1', 5000);
    });

    it('should handle non-existent connection gracefully', () => {
      bandwidthManager.updateConnection('non-existent', 1024);
      // Should not throw error
      expect(mockUpdateBandwidthUsage).not.toHaveBeenCalled();
    });
  });

  describe('endConnection', () => {
    it('should remove connection from tracking', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      bandwidthManager.endConnection('conn-1');
      
      const stats = bandwidthManager.getConnectionStats('conn-1');
      expect(stats).toBeUndefined();
    });

    it('should update connection count metrics', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      bandwidthManager.startConnection('conn-2', 'user-2', 'free');
      
      mockUpdateActiveConnections.mockClear();
      bandwidthManager.endConnection('conn-1');
      
      expect(mockUpdateActiveConnections).toHaveBeenCalledWith('free', 1);
      expect(mockUpdateActiveConnections).toHaveBeenCalledWith('premium', 0);
    });
  });

  describe('hasExceededLimit', () => {
    it('should return false when under limit', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      bandwidthManager.updateConnection('conn-1', 1024 * 1024); // 1 MB
      
      const exceeded = bandwidthManager.hasExceededLimit('user-1', 'free');
      expect(exceeded).toBe(false);
    });

    it('should return true when limit exceeded', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      // Free tier limit is 5 GB
      bandwidthManager.updateConnection('conn-1', 6 * 1024 * 1024 * 1024);
      
      const exceeded = bandwidthManager.hasExceededLimit('user-1', 'free');
      expect(exceeded).toBe(true);
    });

    it('should use correct limits for premium tier', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'premium');
      // Premium tier limit is 100 GB
      bandwidthManager.updateConnection('conn-1', 50 * 1024 * 1024 * 1024);
      
      const exceeded = bandwidthManager.hasExceededLimit('user-1', 'premium');
      expect(exceeded).toBe(false);
    });
  });

  describe('getAvailableBandwidth', () => {
    it('should return full bandwidth when no active connections', () => {
      const bandwidth = bandwidthManager.getAvailableBandwidth('user-1', 'free');
      expect(bandwidth).toBe(1024 * 1024); // 1 MB/s
    });

    it('should divide bandwidth among active connections', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      bandwidthManager.startConnection('conn-2', 'user-1', 'free');
      
      const bandwidth = bandwidthManager.getAvailableBandwidth('user-1', 'free');
      expect(bandwidth).toBe(512 * 1024); // 512 KB/s per connection
    });

    it('should return correct bandwidth for premium tier', () => {
      const bandwidth = bandwidthManager.getAvailableBandwidth('user-1', 'premium');
      expect(bandwidth).toBe(10 * 1024 * 1024); // 10 MB/s
    });
  });

  describe('getUserConnections', () => {
    it('should return all connections for a user', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      bandwidthManager.startConnection('conn-2', 'user-2', 'free');
      bandwidthManager.startConnection('conn-3', 'user-1', 'free');
      
      const connections = bandwidthManager.getUserConnections('user-1');
      expect(connections).toHaveLength(2);
      expect(connections.every(c => c.userId === 'user-1')).toBe(true);
    });

    it('should return empty array for user with no connections', () => {
      const connections = bandwidthManager.getUserConnections('user-999');
      expect(connections).toHaveLength(0);
    });
  });

  describe('resetMonthlyUsage', () => {
    it('should reset all bandwidth usage', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      bandwidthManager.updateConnection('conn-1', 1024 * 1024);
      
      bandwidthManager.resetMonthlyUsage();
      
      const usage = bandwidthManager.getUserBandwidth('user-1');
      expect(usage).toBe(0);
    });

    it('should update metrics for active connections', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      bandwidthManager.startConnection('conn-2', 'user-2', 'premium');
      
      mockUpdateBandwidthUsage.mockClear();
      bandwidthManager.resetMonthlyUsage();
      
      expect(mockUpdateBandwidthUsage).toHaveBeenCalledWith('free', 'user-1', 0);
      expect(mockUpdateBandwidthUsage).toHaveBeenCalledWith('premium', 'user-2', 0);
    });
  });

  describe('getStats', () => {
    it('should return comprehensive statistics', () => {
      bandwidthManager.startConnection('conn-1', 'user-1', 'free');
      bandwidthManager.startConnection('conn-2', 'user-2', 'premium');
      bandwidthManager.updateConnection('conn-1', 1000);
      bandwidthManager.updateConnection('conn-2', 2000);
      
      const stats = bandwidthManager.getStats();
      
      expect(stats).toEqual({
        activeConnections: 2,
        connectionsByTier: { free: 1, premium: 1 },
        totalBandwidthUsage: 3000,
        userCount: 2,
      });
    });
  });
});