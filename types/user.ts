export type SubscriptionStatus = 'free' | 'active' | 'cancelled' | 'expired' | 'pending';

export type UserTier = 'free' | 'premium' | 'ultra';

export interface User {
  id: string;
  username: string;
  email?: string;
  walletAddress?: string;
  isLoggedIn: boolean;
  
  // Tier and subscription management
  tier: UserTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: Date;
  
  // API rate limiting
  apiUsageThisHour?: number;
  apiRateLimit?: number;
  
  // Display properties
  displayName?: string;
  avatarUrl?: string;
}

export interface TierConfig {
  id: string;
  name: UserTier;
  displayName: string;
  
  // Bandwidth and download limits
  bandwidthMbps: number;
  burstBandwidthMbps?: number;
  dailyDownloadGb: number;
  monthlyDownloadGb: number;
  maxConcurrentDownloads: number;
  
  // API rate limiting
  apiRateLimitHourly: number;
  
  // Queue and priority
  queuePriority: number;
  
  // Features
  canRequestSnapshots: boolean;
  canAccessApi: boolean;
  canCreateTeams: boolean;
  
  // UI
  badgeColor?: string;
  description?: string;
  features?: string[];
}

export interface ApiUsageRecord {
  id: string;
  userId: string;
  hourBucket: Date;
  requestCount: number;
  endpoint?: string;
}