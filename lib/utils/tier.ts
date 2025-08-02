/**
 * Utility functions for checking user tier privileges
 * 
 * This follows the mag-7 company pattern where:
 * - Free tier users see ads and have limited features
 * - All paid tiers (premium, unlimited, enterprise, etc.) get premium features
 * - Only free tier users should see upgrade prompts
 */

export type UserTier = 'free' | 'premium' | 'ultra';

/**
 * Check if user is on the free tier (default/unpaid)
 * Free tier users see ads and have limited features
 */
export function isFreeUser(tier?: string | null): boolean {
  return !tier || tier === 'free';
}

/**
 * Check if user has premium features (any paid tier)
 * Premium features include: no ads, higher bandwidth, custom snapshots, etc.
 */
export function hasPremiumFeatures(tier?: string | null): boolean {
  return !isFreeUser(tier);
}

/**
 * Check if user has ultra features (ultra tier)
 * Ultra features include: highest bandwidth, 6-hour snapshots, custom requests, etc.
 */
export function hasUltraFeatures(tier?: string | null): boolean {
  return tier === 'ultra';
}

/**
 * Get bandwidth limit in Mbps for a user tier
 */
export function getBandwidthLimit(tier?: string | null): number {
  if (hasUltraFeatures(tier)) return 500; // 500 Mbps for ultra
  if (hasPremiumFeatures(tier)) return 250; // 250 Mbps for premium
  return 50; // 50 Mbps for free
}

/**
 * Get API rate limit per hour for a user tier
 */
export function getApiRateLimit(tier?: string | null): number {
  if (hasUltraFeatures(tier)) return 2000; // 2000 requests/hour for ultra
  if (hasPremiumFeatures(tier)) return 500; // 500 requests/hour for premium
  return 50; // 50 requests/hour for free
}

/**
 * Get download URL expiry hours for a user tier
 */
export function getDownloadExpiryHours(tier?: string | null): number {
  if (hasUltraFeatures(tier)) return 48; // 48 hours
  if (hasPremiumFeatures(tier)) return 24; // 24 hours
  return 12; // 12 hours for free
}

/**
 * Check if user can request custom snapshots
 */
export function canRequestCustomSnapshots(tier?: string | null): boolean {
  return hasPremiumFeatures(tier);
}

/**
 * Check if user has access to Telegram premium group
 */
export function hasTelegramPremiumAccess(tier?: string | null): boolean {
  return hasPremiumFeatures(tier);
}

/**
 * Check if user has access to Telegram ultra VIP group
 */
export function hasTelegramUltraAccess(tier?: string | null): boolean {
  return hasUltraFeatures(tier);
}

/**
 * Get available Telegram groups for a user tier
 */
export function getAvailableTelegramGroups(tier?: string | null): string[] {
  const groups: string[] = [];
  
  if (hasTelegramPremiumAccess(tier)) {
    groups.push('premium');
  }
  
  if (hasTelegramUltraAccess(tier)) {
    groups.push('ultra');
  }
  
  return groups;
}

/**
 * Get Telegram group description for a tier
 */
export function getTelegramGroupDescription(groupType: string): string {
  const descriptions = {
    premium: 'Access to "Premium Users" Telegram group with priority support and networking',
    ultra: 'Private Telegram group with Dan directly for personalized infrastructure consulting'
  };
  
  return descriptions[groupType as keyof typeof descriptions] || 'Community forums only';
}

/**
 * Check if user can access snapshots generated at a specific hour
 * FREE: 12:00 UTC only (daily snapshots)
 * PREMIUM: 0:00, 12:00 UTC (twice daily)
 * ULTRA: 0, 6, 12, 18 UTC (every 6 hours)
 */
export function canAccessSnapshotByHour(tier?: string | null, hourGenerated?: number): boolean {
  if (hourGenerated === undefined) return true; // If no hour specified, allow access
  
  if (hasUltraFeatures(tier)) {
    // Ultra: All 6-hour snapshots (0, 6, 12, 18)
    return [0, 6, 12, 18].includes(hourGenerated);
  }
  
  if (hasPremiumFeatures(tier)) {
    // Premium: Twice daily (0, 12)
    return [0, 12].includes(hourGenerated);
  }
  
  // Free: Daily only (12)
  return hourGenerated === 12;
}

/**
 * Get snapshot access summary for a user tier
 */
export function getSnapshotAccessSummary(tier?: string | null): {
  schedule: string;
  hours: number[];
  frequency: string;
  description: string;
} {
  if (hasUltraFeatures(tier)) {
    return {
      schedule: 'Every 6 hours',
      hours: [0, 6, 12, 18],
      frequency: '4x daily',
      description: 'Fresh snapshots every 6 hours for maximum sync speed'
    };
  }
  
  if (hasPremiumFeatures(tier)) {
    return {
      schedule: 'Twice daily',
      hours: [0, 12],
      frequency: '2x daily',
      description: 'Morning and evening snapshots for regular sync needs'
    };
  }
  
  return {
    schedule: 'Daily',
    hours: [12],
    frequency: '1x daily',
    description: 'Daily midday snapshots'
  };
}

/**
 * Get next snapshot time for user tier
 */
export function getNextSnapshotTime(tier?: string | null): Date {
  const now = new Date();
  const currentHour = now.getUTCHours();
  
  const accessHours = getSnapshotAccessSummary(tier).hours;
  
  // Find next available hour
  let nextHour = accessHours.find(hour => hour > currentHour);
  
  if (!nextHour) {
    // Next available hour is tomorrow
    nextHour = accessHours[0];
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(nextHour, 0, 0, 0);
    return tomorrow;
  }
  
  // Next hour is today
  const nextSnapshot = new Date(now);
  nextSnapshot.setUTCHours(nextHour, 0, 0, 0);
  return nextSnapshot;
}

/**
 * Check if snapshot is accessible by user tier
 */
export function canAccessSnapshot(snapshot: {
  minimumTier?: string;
  hourGenerated?: number;
  isRestricted?: boolean;
}, userTier?: string | null): boolean {
  // If snapshot is not restricted, allow access
  if (!snapshot.isRestricted) return true;
  
  // Check minimum tier requirement
  if (snapshot.minimumTier) {
    if (snapshot.minimumTier === 'ultra' && !hasUltraFeatures(userTier)) {
      return false;
    }
    if (snapshot.minimumTier === 'premium' && !hasPremiumFeatures(userTier)) {
      return false;
    }
  }
  
  // Check hour-based access
  return canAccessSnapshotByHour(userTier, snapshot.hourGenerated);
}