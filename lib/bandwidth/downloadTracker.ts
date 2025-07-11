import { bandwidthManager } from './manager';
import { logBandwidth } from '@/lib/middleware/logger';

/**
 * Track bandwidth usage for a download connection
 * This would typically be called by your CDN or file server
 */
export function trackDownloadBandwidth(
  connectionId: string,
  bytesTransferred: number
): void {
  const connection = bandwidthManager.getConnectionStats(connectionId);
  
  if (connection) {
    bandwidthManager.updateConnection(connectionId, bytesTransferred);
    
    // Check if user has exceeded limit
    const hasExceeded = bandwidthManager.hasExceededLimit(
      connection.userId,
      connection.tier
    );
    
    if (hasExceeded) {
      logBandwidth(
        connection.userId,
        connection.tier,
        bandwidthManager.getUserBandwidth(connection.userId),
        true
      );
    }
  }
}

/**
 * End a download connection
 * This should be called when a download completes or is interrupted
 */
export function endDownloadConnection(connectionId: string): void {
  const connection = bandwidthManager.getConnectionStats(connectionId);
  
  if (connection) {
    const totalBandwidth = bandwidthManager.getUserBandwidth(connection.userId);
    
    logBandwidth(
      connection.userId,
      connection.tier,
      totalBandwidth,
      false
    );
    
    bandwidthManager.endConnection(connectionId);
  }
}

/**
 * Get bandwidth limit status for a user
 */
export function getBandwidthStatus(userId: string, tier: 'free' | 'premium') {
  const currentUsage = bandwidthManager.getUserBandwidth(userId);
  const hasExceeded = bandwidthManager.hasExceededLimit(userId, tier);
  const availableBandwidth = bandwidthManager.getAvailableBandwidth(userId, tier);
  
  return {
    currentUsage,
    hasExceeded,
    availableBandwidth,
    tier,
  };
}

/**
 * Reset monthly bandwidth usage
 * This should be called by a cron job at the start of each month
 */
export function resetMonthlyBandwidth(): void {
  bandwidthManager.resetMonthlyUsage();
  console.log('Monthly bandwidth usage reset completed');
}