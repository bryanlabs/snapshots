import { updateBandwidthUsage, updateActiveConnections } from '@/lib/monitoring/metrics';

interface Connection {
  userId: string;
  tier: 'free' | 'premium';
  startTime: number;
  bytesTransferred: number;
}

class BandwidthManager {
  private activeConnections: Map<string, Connection> = new Map();
  private userBandwidthUsage: Map<string, number> = new Map();
  
  // Bandwidth limits in bytes per second (shared among all users of the same tier)
  // Note: We advertise in Mbps but store in bytes/second for calculations
  // 50 Mbps = 50/8 MB/s = 6.25 MB/s = 6.25 * 1024 * 1024 bytes/second
  // 250 Mbps = 250/8 MB/s = 31.25 MB/s = 31.25 * 1024 * 1024 bytes/second
  private readonly BANDWIDTH_LIMITS = {
    free: (parseInt(process.env.BANDWIDTH_FREE_TOTAL || '6.25')) * 1024 * 1024, // 50 Mbps = 6.25 MB/s for free tier (shared)
    premium: (parseInt(process.env.BANDWIDTH_PREMIUM_TOTAL || '31.25')) * 1024 * 1024, // 250 Mbps = 31.25 MB/s for premium tier (shared)
  };
  
  // Monthly bandwidth limits in bytes
  private readonly MONTHLY_LIMITS = {
    free: 5 * 1024 * 1024 * 1024, // 5 GB per month
    premium: 100 * 1024 * 1024 * 1024, // 100 GB per month
  };

  // Start tracking a connection
  startConnection(connectionId: string, userId: string, tier: 'free' | 'premium'): void {
    this.activeConnections.set(connectionId, {
      userId,
      tier,
      startTime: Date.now(),
      bytesTransferred: 0,
    });
    
    this.updateMetrics();
  }

  // Update bytes transferred for a connection
  updateConnection(connectionId: string, bytes: number): void {
    const connection = this.activeConnections.get(connectionId);
    if (connection) {
      connection.bytesTransferred += bytes;
      
      // Update user total bandwidth usage
      const currentUsage = this.userBandwidthUsage.get(connection.userId) || 0;
      this.userBandwidthUsage.set(connection.userId, currentUsage + bytes);
      
      // Update metrics
      updateBandwidthUsage(connection.tier, connection.userId, currentUsage + bytes);
    }
  }

  // End a connection
  endConnection(connectionId: string): void {
    this.activeConnections.delete(connectionId);
    this.updateMetrics();
  }

  // Get current bandwidth usage for a user
  getUserBandwidth(userId: string): number {
    return this.userBandwidthUsage.get(userId) || 0;
  }

  // Check if user has exceeded bandwidth limit
  hasExceededLimit(userId: string, tier: 'free' | 'premium'): boolean {
    const usage = this.getUserBandwidth(userId);
    return usage >= this.MONTHLY_LIMITS[tier];
  }

  // Calculate available bandwidth for a user based on active connections in the same tier
  getAvailableBandwidth(userId: string, tier: 'free' | 'premium'): number {
    // Get all connections of the same tier (bandwidth is shared among all users of same tier)
    const tierConnections = Array.from(this.activeConnections.values())
      .filter(conn => conn.tier === tier);
    
    if (tierConnections.length === 0) {
      return this.BANDWIDTH_LIMITS[tier];
    }
    
    // Divide tier bandwidth equally among all active connections of that tier
    return Math.floor(this.BANDWIDTH_LIMITS[tier] / tierConnections.length);
  }

  // Get connection stats
  getConnectionStats(connectionId: string): Connection | undefined {
    return this.activeConnections.get(connectionId);
  }

  // Get all active connections for a user
  getUserConnections(userId: string): Connection[] {
    return Array.from(this.activeConnections.values())
      .filter(conn => conn.userId === userId);
  }

  // Reset monthly bandwidth usage (call this via cron job)
  resetMonthlyUsage(): void {
    this.userBandwidthUsage.clear();
    
    // Update metrics to reflect reset
    for (const [userId, connection] of this.activeConnections) {
      updateBandwidthUsage(connection.tier, connection.userId, 0);
    }
  }

  // Update connection count metrics
  private updateMetrics(): void {
    const tierCounts = { free: 0, premium: 0 };
    
    for (const connection of this.activeConnections.values()) {
      tierCounts[connection.tier]++;
    }
    
    updateActiveConnections('free', tierCounts.free);
    updateActiveConnections('premium', tierCounts.premium);
  }

  // Get bandwidth statistics
  getStats() {
    const stats = {
      activeConnections: this.activeConnections.size,
      connectionsByTier: { free: 0, premium: 0 },
      totalBandwidthUsage: 0,
      userCount: this.userBandwidthUsage.size,
    };
    
    for (const connection of this.activeConnections.values()) {
      stats.connectionsByTier[connection.tier]++;
    }
    
    for (const usage of this.userBandwidthUsage.values()) {
      stats.totalBandwidthUsage += usage;
    }
    
    return stats;
  }
}

// Export singleton instance
export const bandwidthManager = new BandwidthManager();