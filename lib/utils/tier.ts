/**
 * Enhanced Tier Access System for Next.js 15
 * 
 * Follows mag-7 engineering standards:
 * - Type-safe tier access validation
 * - Performance optimized with React.cache() for server components
 * - Centralized business logic for tier-based features
 * - Supports all authentication contexts (NextAuth, API routes, server components)
 * 
 * BUSINESS RULES:
 * - Free tier: Basic features, ads, limited bandwidth
 * - Premium tier: Enhanced features, no ads, custom snapshots
 * - Ultra tier: All premium features + highest priority, unlimited downloads
 */

// =============================================================================
// TYPE DEFINITIONS - Single source of truth for all tier types
// =============================================================================

/** All possible user tiers in the system */
export type UserTier = 'free' | 'premium' | 'ultra';

/** Valid premium tier names that provide paid features */
export type PremiumTier = 'premium' | 'ultra';

/** Session user object shape - compatible with NextAuth */
export interface TierUser {
  tier?: string | null;
  id?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: Date | null;
}

/** Tier capability flags - drives feature access throughout app */
export interface TierCapabilities {
  // Core access rights
  isPaid: boolean;
  isUltra: boolean;
  
  // Feature flags
  canRequestCustomSnapshots: boolean;
  canAccessPremiumFeatures: boolean;
  hasTelegramAccess: boolean;
  hasUltraVipAccess: boolean;
  showAds: boolean;
  
  // Performance limits
  bandwidthMbps: number;
  apiRateLimit: number;
  downloadExpiryHours: number;
  queuePriority: number;
  
  // UI presentation
  displayName: string;
  badgeColor: string;
  upgradePromptEnabled: boolean;
}

// =============================================================================
// TIER NORMALIZATION - Handle legacy tier names and edge cases
// =============================================================================

/**
 * Normalizes any tier string to a valid UserTier
 * Handles legacy tier names like 'unlimited', 'enterprise', etc.
 */
export function normalizeTierName(tier?: string | null): UserTier {
  if (!tier) return 'free';
  
  const lowerTier = tier.toLowerCase().trim();
  
  // Handle legacy tier names that should map to current tiers
  switch (lowerTier) {
    case 'premium':
      return 'premium';
    case 'ultra':
    case 'unlimited': // Legacy name that should map to ultra
    case 'enterprise': // Legacy name that should map to ultra
    case 'ultimate': // Another legacy name
      return 'ultra';
    case 'free':
    default:
      return 'free';
  }
}

// =============================================================================
// CORE TIER VALIDATION - Performance optimized business logic
// =============================================================================

/**
 * Type guard to check if tier is premium (paid tier)
 * @param tier - User tier string (nullable)
 * @returns true if user has any paid tier features
 */
export function isPremiumTier(tier?: string | null): tier is PremiumTier {
  const normalizedTier = normalizeTierName(tier);
  return normalizedTier === 'premium' || normalizedTier === 'ultra';
}

/**
 * Type guard to check if tier is ultra (highest tier)
 * @param tier - User tier string (nullable)
 * @returns true if user has ultra tier features
 */
export function isUltraTier(tier?: string | null): boolean {
  const normalizedTier = normalizeTierName(tier);
  return normalizedTier === 'ultra';
}

/**
 * Type guard to check if tier is free (unpaid)
 * @param tier - User tier string (nullable)
 * @returns true if user is on free tier
 */
export function isFreeTier(tier?: string | null): boolean {
  const normalizedTier = normalizeTierName(tier);
  return normalizedTier === 'free';
}

// =============================================================================
// LEGACY COMPATIBILITY - Maintain backward compatibility
// =============================================================================

/** @deprecated Use isPremiumTier() instead */
export function hasPremiumFeatures(tier?: string | null): boolean {
  return isPremiumTier(tier);
}

/** @deprecated Use isUltraTier() instead */
export function hasUltraFeatures(tier?: string | null): boolean {
  return isUltraTier(tier);
}

/** @deprecated Use isFreeTier() instead */
export function isFreeUser(tier?: string | null): boolean {
  return isFreeTier(tier);
}

// =============================================================================
// TIER CAPABILITIES - Complete feature matrix per tier
// =============================================================================

/**
 * Get complete tier capabilities object - single source of truth for all tier logic
 * Performance optimized with memoization for repeated calls
 */
const tierCapabilitiesCache = new Map<UserTier, TierCapabilities>();

export function getTierCapabilities(tier?: string | null): TierCapabilities {
  const normalizedTier = normalizeTierName(tier);
  
  // Check cache first for performance
  const cached = tierCapabilitiesCache.get(normalizedTier);
  if (cached) return cached;
  
  // Define capabilities based on tier
  const capabilities: TierCapabilities = (() => {
    switch (normalizedTier) {
      case 'ultra':
        return {
          // Access rights
          isPaid: true,
          isUltra: true,
          
          // Features
          canRequestCustomSnapshots: true,
          canAccessPremiumFeatures: true,
          hasTelegramAccess: true,
          hasUltraVipAccess: true,
          showAds: false,
          
          // Limits
          bandwidthMbps: 500,
          apiRateLimit: 2000,
          downloadExpiryHours: 48,
          queuePriority: 100,
          
          // UI
          displayName: 'Ultra',
          badgeColor: '#10B981',
          upgradePromptEnabled: false,
        };
      
      case 'premium':
        return {
          // Access rights
          isPaid: true,
          isUltra: false,
          
          // Features  
          canRequestCustomSnapshots: true,
          canAccessPremiumFeatures: true,
          hasTelegramAccess: true,
          hasUltraVipAccess: false,
          showAds: false,
          
          // Limits
          bandwidthMbps: 250,
          apiRateLimit: 500,
          downloadExpiryHours: 24,
          queuePriority: 10,
          
          // UI
          displayName: 'Premium',
          badgeColor: '#3B82F6',
          upgradePromptEnabled: false,
        };
      
      case 'free':
      default:
        return {
          // Access rights
          isPaid: false,
          isUltra: false,
          
          // Features
          canRequestCustomSnapshots: false,
          canAccessPremiumFeatures: false,
          hasTelegramAccess: false,
          hasUltraVipAccess: false,
          showAds: true,
          
          // Limits
          bandwidthMbps: 50,
          apiRateLimit: 50,
          downloadExpiryHours: 12,
          queuePriority: 0,
          
          // UI
          displayName: 'Free',
          badgeColor: '#6B7280',
          upgradePromptEnabled: true,
        };
    }
  })();
  
  // Cache the result
  tierCapabilitiesCache.set(normalizedTier, capabilities);
  return capabilities;
}

// =============================================================================
// FEATURE-SPECIFIC ACCESS HELPERS
// =============================================================================

/**
 * Get bandwidth limit in Mbps for a user tier
 */
export function getBandwidthLimit(tier?: string | null): number {
  return getTierCapabilities(tier).bandwidthMbps;
}

/**
 * Get API rate limit per hour for a user tier  
 */
export function getApiRateLimit(tier?: string | null): number {
  return getTierCapabilities(tier).apiRateLimit;
}

/**
 * Get download URL expiry hours for a user tier
 */
export function getDownloadExpiryHours(tier?: string | null): number {
  return getTierCapabilities(tier).downloadExpiryHours;
}

/**
 * Check if user can request custom snapshots
 */
export function canRequestCustomSnapshots(tier?: string | null): boolean {
  return getTierCapabilities(tier).canRequestCustomSnapshots;
}

/**
 * Check if user has access to Telegram premium group
 */
export function hasTelegramPremiumAccess(tier?: string | null): boolean {
  return getTierCapabilities(tier).hasTelegramAccess;
}

/**
 * Check if user has access to Telegram ultra VIP group
 */
export function hasTelegramUltraAccess(tier?: string | null): boolean {
  return getTierCapabilities(tier).hasUltraVipAccess;
}

// =============================================================================
// NEXT.JS 15 OPTIMIZED ACCESS PATTERNS
// =============================================================================

/**
 * Server Component optimized tier check with React.cache()
 * Use this in Server Components for optimal performance
 */
export const getServerTierCapabilities = (() => {
  if (typeof window !== 'undefined') {
    // Client-side fallback
    return getTierCapabilities;
  }
  
  // Server-side with React.cache()
  try {
    const { cache } = require('react');
    return cache((tier?: string | null) => getTierCapabilities(tier));
  } catch {
    // React 18 fallback
    return getTierCapabilities;
  }
})();

/**
 * NextAuth session-aware tier validation
 * Handles session object directly for convenience
 */
export function validateSessionTierAccess(
  session: { user?: TierUser } | null,
  requiredCapability: keyof TierCapabilities
): boolean {
  if (!session?.user) return false;
  
  const capabilities = getTierCapabilities(session.user.tier);
  const value = capabilities[requiredCapability];
  
  // Handle boolean capabilities
  if (typeof value === 'boolean') return value;
  
  // Handle numeric capabilities (non-zero = has capability)
  if (typeof value === 'number') return value > 0;
  
  // Handle string capabilities (non-empty = has capability)
  if (typeof value === 'string') return value.length > 0;
  
  return false;
}

/**
 * API Route helper for tier-based access control
 * Returns standardized error responses for consistency
 */
export function createTierAccessError(
  tier?: string | null,
  requiredFeature: string = 'premium features'
): { error: string; code: 'TIER_INSUFFICIENT'; status: 403 } {
  const capabilities = getTierCapabilities(tier);
  
  return {
    error: `Access denied. ${requiredFeature} require${requiredFeature.includes('feature') ? '' : 's'} a ${capabilities.isPaid ? 'higher' : 'paid'} subscription tier.`,
    code: 'TIER_INSUFFICIENT' as const,
    status: 403 as const
  };
}

// =============================================================================
// PERFORMANCE MONITORING & DEBUGGING
// =============================================================================

/**
 * Debug helper to log tier access patterns in development
 */
export function debugTierAccess(
  context: string,
  tier?: string | null,
  feature?: string
): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const normalized = normalizeTierName(tier);
  const capabilities = getTierCapabilities(tier);
  
  console.debug(`[TierDebug] ${context}:`, {
    original: tier,
    normalized,
    feature,
    isPaid: capabilities.isPaid,
    capabilities: Object.entries(capabilities)
      .filter(([_, value]) => typeof value === 'boolean' && value)
      .map(([key]) => key)
  });
}

/**
 * Get available Telegram groups for a user tier
 */
export function getAvailableTelegramGroups(tier?: string | null): string[] {
  const capabilities = getTierCapabilities(tier);
  const groups: string[] = [];
  
  if (capabilities.hasTelegramAccess) {
    groups.push('premium');
  }
  
  if (capabilities.hasUltraVipAccess) {
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
  
  const capabilities = getTierCapabilities(tier);
  
  if (capabilities.isUltra) {
    // Ultra: All 6-hour snapshots (0, 6, 12, 18)
    return [0, 6, 12, 18].includes(hourGenerated);
  }
  
  if (capabilities.isPaid) {
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
  const capabilities = getTierCapabilities(tier);
  
  if (capabilities.isUltra) {
    return {
      schedule: 'Every 6 hours',
      hours: [0, 6, 12, 18],
      frequency: '4x daily',
      description: 'Fresh snapshots every 6 hours for maximum sync speed'
    };
  }
  
  if (capabilities.isPaid) {
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
  
  const userCapabilities = getTierCapabilities(userTier);
  
  // Check minimum tier requirement
  if (snapshot.minimumTier) {
    const requiredCapabilities = getTierCapabilities(snapshot.minimumTier);
    
    // User must have at least the required tier level
    if (requiredCapabilities.isUltra && !userCapabilities.isUltra) {
      return false;
    }
    if (requiredCapabilities.isPaid && !userCapabilities.isPaid) {
      return false;
    }
  }
  
  // Check hour-based access
  return canAccessSnapshotByHour(userTier, snapshot.hourGenerated);
}