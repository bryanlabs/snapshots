/**
 * Enterprise-grade tier management utility
 * Provides centralized, type-safe tier validation following mag-7 engineering standards
 */

import { cache } from 'react';
import type { Session } from 'next-auth';

/**
 * Tier types supported by the system
 */
export type TierType = 'free' | 'premium' | 'ultra' | null | undefined;
export type PremiumTier = 'premium' | 'ultra';
export type BillingMode = 'enabled' | 'full-access-preview';

/**
 * Comprehensive capability matrix for each tier
 */
export interface TierCapabilities {
  isPaid: boolean;
  isUltra: boolean;
  canRequestCustomSnapshots: boolean;
  hasPremiumFeatures: boolean;
  hasTelegramAccess: boolean;
  hasUltraVIPAccess: boolean;
  bandwidthMbps: number;
  apiRateLimit: number;
  downloadExpiryHours: number;
  maxConcurrentDownloads: number;
  canAccessAllChains: boolean;
  canScheduleSnapshots: boolean;
  hasAPIAccess: boolean;
  maxDownloadsPerDay: number;
}

/**
 * Memoization cache for tier capabilities
 */
const capabilityCache = new Map<string, TierCapabilities>();

function parseBooleanFlag(value?: string | null): boolean {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.toLowerCase().trim());
}

/**
 * Billing is intentionally opt-in. Until a real payment gateway is enabled,
 * users keep their stored account tier but receive ultra-equivalent access.
 */
export function isBillingEnabled(): boolean {
  return parseBooleanFlag(process.env.BILLING_ENABLED ?? process.env.NEXT_PUBLIC_BILLING_ENABLED);
}

export function getBillingMode(): BillingMode {
  return isBillingEnabled() ? 'enabled' : 'full-access-preview';
}

/**
 * Normalize legacy tier names to standard names
 * Handles all variations: unlimited, enterprise, ultimate -> ultra
 */
export function normalizeTierName(tier?: string | null): TierType {
  if (!tier) return null;
  
  const normalized = tier.toLowerCase().trim();
  
  // Map legacy names to standard names
  switch (normalized) {
    case 'unlimited':
    case 'enterprise':
    case 'ultimate':
    case 'ultra':
      return 'ultra';
    case 'premium':
      return 'premium';
    case 'free':
      return 'free';
    default:
      return null;
  }
}

/**
 * Get comprehensive capabilities for a tier
 * Memoized for performance optimization
 */
export function getTierCapabilities(tier?: string | null): TierCapabilities {
  const normalizedTier = normalizeTierName(tier);
  const cacheKey = normalizedTier || 'null';
  
  // Return cached result if available
  if (capabilityCache.has(cacheKey)) {
    return capabilityCache.get(cacheKey)!;
  }
  
  let capabilities: TierCapabilities;
  
  switch (normalizedTier) {
    case 'ultra':
      capabilities = {
        isPaid: true,
        isUltra: true,
        canRequestCustomSnapshots: true,
        hasPremiumFeatures: true,
        hasTelegramAccess: true,
        hasUltraVIPAccess: true,
        bandwidthMbps: 500,
        apiRateLimit: 2000,
        downloadExpiryHours: 48,
        maxConcurrentDownloads: 10,
        canAccessAllChains: true,
        canScheduleSnapshots: true,
        hasAPIAccess: true,
        maxDownloadsPerDay: 1000,
      };
      break;
      
    case 'premium':
      capabilities = {
        isPaid: true,
        isUltra: false,
        canRequestCustomSnapshots: true,
        hasPremiumFeatures: true,
        hasTelegramAccess: true,
        hasUltraVIPAccess: false,
        bandwidthMbps: 250,
        apiRateLimit: 500,
        downloadExpiryHours: 24,
        maxConcurrentDownloads: 5,
        canAccessAllChains: true,
        canScheduleSnapshots: false,
        hasAPIAccess: true,
        maxDownloadsPerDay: 100,
      };
      break;
      
    case 'free':
    default:
      capabilities = {
        isPaid: false,
        isUltra: false,
        canRequestCustomSnapshots: false,
        hasPremiumFeatures: false,
        hasTelegramAccess: false,
        hasUltraVIPAccess: false,
        bandwidthMbps: 50,
        apiRateLimit: 50,
        downloadExpiryHours: 12,
        maxConcurrentDownloads: 1,
        canAccessAllChains: false,
        canScheduleSnapshots: false,
        hasAPIAccess: false,
        maxDownloadsPerDay: 10,
      };
      break;
  }
  
  // Cache the result
  capabilityCache.set(cacheKey, capabilities);
  return capabilities;
}

export function getEffectiveAccessTier(tier?: string | null): NonNullable<TierType> {
  if (!isBillingEnabled()) {
    return 'ultra';
  }

  return normalizeTierName(tier) || 'free';
}

export function getEffectiveTierCapabilities(tier?: string | null): TierCapabilities {
  return getTierCapabilities(getEffectiveAccessTier(tier));
}

/**
 * Type guard to check if a tier has premium features
 */
export function isPremiumTier(tier?: string | null): tier is PremiumTier {
  const capabilities = getTierCapabilities(tier);
  return capabilities.isPaid;
}

/**
 * Type guard to check if a tier is ultra/unlimited
 */
export function isUltraTier(tier?: string | null): boolean {
  const capabilities = getTierCapabilities(tier);
  return capabilities.isUltra;
}

/**
 * Check if a tier is free
 */
export function isFreeTier(tier?: string | null): boolean {
  const capabilities = getTierCapabilities(tier);
  return !capabilities.isPaid;
}

/**
 * Validate if a NextAuth session has access to a specific capability
 */
export function validateSessionTierAccess(
  session: Session | null,
  capability: keyof TierCapabilities
): boolean {
  if (!session?.user?.tier) return false;
  
  const capabilities = getTierCapabilities(session.user.tier);
  const value = capabilities[capability];
  
  // For boolean capabilities, return the value directly
  if (typeof value === 'boolean') {
    return value;
  }
  
  // For numeric capabilities, return true if > 0
  return value > 0;
}

/**
 * Server Component optimized version with React.cache()
 * Falls back gracefully if React.cache is not available
 */
export const getServerTierCapabilities = (() => {
  // Don't use cache on client side
  if (typeof window !== 'undefined') {
    return getEffectiveTierCapabilities;
  }

  return cache((tier?: string | null) => getEffectiveTierCapabilities(tier));
})();

/**
 * Create standardized tier access error for API routes
 */
export function createTierAccessError(
  tier?: string | null,
  feature: string = 'this feature'
): { error: string; code: string; status: number } {
  const capabilities = getTierCapabilities(tier);
  
  if (!capabilities.isPaid) {
    return {
      error: `Access denied. ${feature} requires a premium subscription.`,
      code: 'TIER_INSUFFICIENT',
      status: 403,
    };
  }
  
  if (!capabilities.isUltra && feature.toLowerCase().includes('ultra')) {
    return {
      error: `Access denied. ${feature} requires an ultra subscription.`,
      code: 'TIER_INSUFFICIENT_ULTRA',
      status: 403,
    };
  }
  
  return {
    error: `Access denied. You don't have permission to access ${feature}.`,
    code: 'PERMISSION_DENIED',
    status: 403,
  };
}

/**
 * Get bandwidth limit in Mbps for a tier
 */
export function getTierBandwidth(tier?: string | null): number {
  const capabilities = getTierCapabilities(tier);
  return capabilities.bandwidthMbps;
}

/**
 * Get API rate limit for a tier
 */
export function getTierRateLimit(tier?: string | null): number {
  const capabilities = getTierCapabilities(tier);
  return capabilities.apiRateLimit;
}

/**
 * Get download expiry time in hours for a tier
 */
export function getTierDownloadExpiry(tier?: string | null): number {
  const capabilities = getTierCapabilities(tier);
  return capabilities.downloadExpiryHours;
}

export function getSnapshotAccessSummary(tier?: string | null) {
  const normalizedTier = normalizeTierName(tier) || 'free';

  if (normalizedTier === 'ultra') {
    return {
      description: 'Ultra access with the freshest snapshots and fastest downloads',
      frequency: '6-hourly',
      hours: [0, 6, 12, 18],
    };
  }

  if (normalizedTier === 'premium') {
    return {
      description: 'Premium access with twice-daily snapshots',
      frequency: 'twice-daily',
      hours: [0, 12],
    };
  }

  return {
    description: 'Free public access with daily snapshots',
    frequency: 'daily',
    hours: [0],
  };
}

export function getNextSnapshotTime(tier?: string | null): Date {
  const now = new Date();
  const { hours } = getSnapshotAccessSummary(tier);
  const currentHour = now.getUTCHours();
  const nextHour = hours.find((hour) => hour > currentHour);
  const next = new Date(now);

  if (nextHour === undefined) {
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(hours[0], 0, 0, 0);
    return next;
  }

  next.setUTCHours(nextHour, 0, 0, 0);
  return next;
}

/**
 * Legacy compatibility functions
 * @deprecated Use isPremiumTier() instead
 */
export function hasPremiumFeatures(tier?: string | null): boolean {
  return isPremiumTier(tier);
}

/**
 * @deprecated Use isUltraTier() instead
 */
export function hasUltraFeatures(tier?: string | null): boolean {
  return isUltraTier(tier);
}

/**
 * @deprecated Use isFreeTier() instead
 */
export function isFreeUser(tier?: string | null): boolean {
  return isFreeTier(tier);
}

/**
 * Check if a user can access a specific snapshot based on their tier
 */
export function canAccessSnapshot(_snapshot: unknown, _tier?: string | null): boolean {
  // For now, all snapshots are accessible to all tiers
  // This can be modified later to restrict certain snapshots to premium users
  return true;
}

/**
 * Clear the capability cache (useful for testing)
 */
export function clearCapabilityCache(): void {
  capabilityCache.clear();
}
