/**
 * Utility functions for checking user tier privileges
 * 
 * This follows the mag-7 company pattern where:
 * - Free tier users see ads and have limited features
 * - All paid tiers (premium, unlimited, enterprise, etc.) get premium features
 * - Only free tier users should see upgrade prompts
 */

export type UserTier = 'free' | 'premium' | 'unlimited' | 'enterprise';

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
 * Check if user has unlimited features (unlimited tier or higher)
 * Unlimited features include: no bandwidth limits, longer download expiry, etc.
 */
export function hasUnlimitedFeatures(tier?: string | null): boolean {
  return tier === 'unlimited' || tier === 'enterprise';
}

/**
 * Get bandwidth limit in Mbps for a user tier
 */
export function getBandwidthLimit(tier?: string | null): number {
  if (hasUnlimitedFeatures(tier)) return 0; // 0 = unlimited
  if (hasPremiumFeatures(tier)) return 250; // 250 Mbps
  return 50; // 50 Mbps for free
}

/**
 * Get download URL expiry hours for a user tier
 */
export function getDownloadExpiryHours(tier?: string | null): number {
  if (hasUnlimitedFeatures(tier)) return 48; // 48 hours
  if (hasPremiumFeatures(tier)) return 24; // 24 hours
  return 12; // 12 hours for free
}

/**
 * Check if user can request custom snapshots
 */
export function canRequestCustomSnapshots(tier?: string | null): boolean {
  return hasPremiumFeatures(tier);
}