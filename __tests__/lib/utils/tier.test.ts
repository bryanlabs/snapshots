/**
 * Comprehensive test suite for tier utility
 */

import {
  normalizeTierName,
  getTierCapabilities,
  isPremiumTier,
  isUltraTier,
  isFreeTier,
  validateSessionTierAccess,
  createTierAccessError,
  getTierBandwidth,
  getTierRateLimit,
  getTierDownloadExpiry,
  clearCapabilityCache,
  hasPremiumFeatures,
  hasUltraFeatures,
  isFreeUser,
} from '@/lib/utils/tier';

describe('Tier Utility', () => {
  beforeEach(() => {
    clearCapabilityCache();
  });

  describe('normalizeTierName', () => {
    it('should normalize ultra tier variations', () => {
      expect(normalizeTierName('ultra')).toBe('ultra');
      expect(normalizeTierName('unlimited')).toBe('ultra');
      expect(normalizeTierName('ultimate')).toBe('ultra');
      expect(normalizeTierName('enterprise')).toBe('ultra');
      expect(normalizeTierName('UNLIMITED')).toBe('ultra');
      expect(normalizeTierName(' Ultimate ')).toBe('ultra');
    });

    it('should normalize premium tier', () => {
      expect(normalizeTierName('premium')).toBe('premium');
      expect(normalizeTierName('PREMIUM')).toBe('premium');
      expect(normalizeTierName(' premium ')).toBe('premium');
    });

    it('should normalize free tier', () => {
      expect(normalizeTierName('free')).toBe('free');
      expect(normalizeTierName('FREE')).toBe('free');
      expect(normalizeTierName(' free ')).toBe('free');
    });

    it('should handle null and undefined', () => {
      expect(normalizeTierName(null)).toBe(null);
      expect(normalizeTierName(undefined)).toBe(null);
      expect(normalizeTierName('')).toBe(null);
    });

    it('should return null for unknown tiers', () => {
      expect(normalizeTierName('invalid')).toBe(null);
      expect(normalizeTierName('basic')).toBe(null);
    });
  });

  describe('getTierCapabilities', () => {
    it('should return ultra capabilities for ultra variations', () => {
      const ultraCapabilities = getTierCapabilities('ultra');
      const unlimitedCapabilities = getTierCapabilities('unlimited');
      const ultimateCapabilities = getTierCapabilities('ultimate');
      const enterpriseCapabilities = getTierCapabilities('enterprise');

      expect(ultraCapabilities).toEqual(unlimitedCapabilities);
      expect(ultraCapabilities).toEqual(ultimateCapabilities);
      expect(ultraCapabilities).toEqual(enterpriseCapabilities);

      expect(ultraCapabilities.isPaid).toBe(true);
      expect(ultraCapabilities.isUltra).toBe(true);
      expect(ultraCapabilities.canRequestCustomSnapshots).toBe(true);
      expect(ultraCapabilities.bandwidthMbps).toBe(500);
      expect(ultraCapabilities.apiRateLimit).toBe(2000);
      expect(ultraCapabilities.downloadExpiryHours).toBe(48);
    });

    it('should return premium capabilities', () => {
      const capabilities = getTierCapabilities('premium');

      expect(capabilities.isPaid).toBe(true);
      expect(capabilities.isUltra).toBe(false);
      expect(capabilities.canRequestCustomSnapshots).toBe(true);
      expect(capabilities.bandwidthMbps).toBe(250);
      expect(capabilities.apiRateLimit).toBe(500);
      expect(capabilities.downloadExpiryHours).toBe(24);
    });

    it('should return free capabilities', () => {
      const capabilities = getTierCapabilities('free');

      expect(capabilities.isPaid).toBe(false);
      expect(capabilities.isUltra).toBe(false);
      expect(capabilities.canRequestCustomSnapshots).toBe(false);
      expect(capabilities.bandwidthMbps).toBe(50);
      expect(capabilities.apiRateLimit).toBe(50);
      expect(capabilities.downloadExpiryHours).toBe(12);
    });

    it('should return free capabilities for null/undefined', () => {
      expect(getTierCapabilities(null).isPaid).toBe(false);
      expect(getTierCapabilities(undefined).isPaid).toBe(false);
      expect(getTierCapabilities('').isPaid).toBe(false);
    });

    it('should cache capabilities', () => {
      // First call calculates
      const first = getTierCapabilities('ultra');
      // Second call should return cached
      const second = getTierCapabilities('ultra');
      
      expect(first).toBe(second); // Same object reference
    });
  });

  describe('Type Guards', () => {
    describe('isPremiumTier', () => {
      it('should return true for premium tiers', () => {
        expect(isPremiumTier('premium')).toBe(true);
        expect(isPremiumTier('ultra')).toBe(true);
        expect(isPremiumTier('unlimited')).toBe(true);
        expect(isPremiumTier('ultimate')).toBe(true);
        expect(isPremiumTier('enterprise')).toBe(true);
      });

      it('should return false for free tier', () => {
        expect(isPremiumTier('free')).toBe(false);
        expect(isPremiumTier(null)).toBe(false);
        expect(isPremiumTier(undefined)).toBe(false);
      });
    });

    describe('isUltraTier', () => {
      it('should return true for ultra tiers', () => {
        expect(isUltraTier('ultra')).toBe(true);
        expect(isUltraTier('unlimited')).toBe(true);
        expect(isUltraTier('ultimate')).toBe(true);
        expect(isUltraTier('enterprise')).toBe(true);
      });

      it('should return false for non-ultra tiers', () => {
        expect(isUltraTier('premium')).toBe(false);
        expect(isUltraTier('free')).toBe(false);
        expect(isUltraTier(null)).toBe(false);
      });
    });

    describe('isFreeTier', () => {
      it('should return true for free tier', () => {
        expect(isFreeTier('free')).toBe(true);
        expect(isFreeTier(null)).toBe(true);
        expect(isFreeTier(undefined)).toBe(true);
        expect(isFreeTier('')).toBe(true);
      });

      it('should return false for paid tiers', () => {
        expect(isFreeTier('premium')).toBe(false);
        expect(isFreeTier('ultra')).toBe(false);
        expect(isFreeTier('unlimited')).toBe(false);
      });
    });
  });

  describe('validateSessionTierAccess', () => {
    it('should validate boolean capabilities', () => {
      const premiumSession = { user: { tier: 'premium' } } as any;
      const ultraSession = { user: { tier: 'unlimited' } } as any;
      const freeSession = { user: { tier: 'free' } } as any;

      expect(validateSessionTierAccess(premiumSession, 'canRequestCustomSnapshots')).toBe(true);
      expect(validateSessionTierAccess(ultraSession, 'canRequestCustomSnapshots')).toBe(true);
      expect(validateSessionTierAccess(freeSession, 'canRequestCustomSnapshots')).toBe(false);

      expect(validateSessionTierAccess(ultraSession, 'hasUltraVIPAccess')).toBe(true);
      expect(validateSessionTierAccess(premiumSession, 'hasUltraVIPAccess')).toBe(false);
    });

    it('should validate numeric capabilities', () => {
      const premiumSession = { user: { tier: 'premium' } } as any;
      
      expect(validateSessionTierAccess(premiumSession, 'bandwidthMbps')).toBe(true);
      expect(validateSessionTierAccess(premiumSession, 'apiRateLimit')).toBe(true);
    });

    it('should return false for null session', () => {
      expect(validateSessionTierAccess(null, 'canRequestCustomSnapshots')).toBe(false);
    });

    it('should return false for session without tier', () => {
      const session = { user: {} } as any;
      expect(validateSessionTierAccess(session, 'canRequestCustomSnapshots')).toBe(false);
    });
  });

  describe('createTierAccessError', () => {
    it('should create error for free tier', () => {
      const error = createTierAccessError('free', 'custom snapshots');
      
      expect(error.error).toContain('requires a premium subscription');
      expect(error.code).toBe('TIER_INSUFFICIENT');
      expect(error.status).toBe(403);
    });

    it('should create error for premium tier accessing ultra features', () => {
      const error = createTierAccessError('premium', 'ultra VIP features');
      
      expect(error.error).toContain('requires an ultra subscription');
      expect(error.code).toBe('TIER_INSUFFICIENT_ULTRA');
      expect(error.status).toBe(403);
    });

    it('should create generic error for other cases', () => {
      const error = createTierAccessError('ultra', 'admin features');
      
      expect(error.error).toContain("don't have permission");
      expect(error.code).toBe('PERMISSION_DENIED');
      expect(error.status).toBe(403);
    });
  });

  describe('Tier Property Getters', () => {
    it('should get bandwidth for tiers', () => {
      expect(getTierBandwidth('ultra')).toBe(500);
      expect(getTierBandwidth('unlimited')).toBe(500);
      expect(getTierBandwidth('premium')).toBe(250);
      expect(getTierBandwidth('free')).toBe(50);
    });

    it('should get rate limit for tiers', () => {
      expect(getTierRateLimit('ultra')).toBe(2000);
      expect(getTierRateLimit('unlimited')).toBe(2000);
      expect(getTierRateLimit('premium')).toBe(500);
      expect(getTierRateLimit('free')).toBe(50);
    });

    it('should get download expiry for tiers', () => {
      expect(getTierDownloadExpiry('ultra')).toBe(48);
      expect(getTierDownloadExpiry('unlimited')).toBe(48);
      expect(getTierDownloadExpiry('premium')).toBe(24);
      expect(getTierDownloadExpiry('free')).toBe(12);
    });
  });

  describe('Legacy Compatibility', () => {
    it('should support deprecated hasPremiumFeatures', () => {
      expect(hasPremiumFeatures('premium')).toBe(true);
      expect(hasPremiumFeatures('ultra')).toBe(true);
      expect(hasPremiumFeatures('unlimited')).toBe(true);
      expect(hasPremiumFeatures('free')).toBe(false);
    });

    it('should support deprecated hasUltraFeatures', () => {
      expect(hasUltraFeatures('ultra')).toBe(true);
      expect(hasUltraFeatures('unlimited')).toBe(true);
      expect(hasUltraFeatures('premium')).toBe(false);
    });

    it('should support deprecated isFreeUser', () => {
      expect(isFreeUser('free')).toBe(true);
      expect(isFreeUser(null)).toBe(true);
      expect(isFreeUser('premium')).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should efficiently cache calculations', () => {
      const start = performance.now();
      
      // First call for each tier
      getTierCapabilities('ultra');
      getTierCapabilities('premium');
      getTierCapabilities('free');
      
      const firstTime = performance.now() - start;
      
      const cacheStart = performance.now();
      
      // Cached calls (should be much faster)
      for (let i = 0; i < 1000; i++) {
        getTierCapabilities('ultra');
        getTierCapabilities('premium');
        getTierCapabilities('free');
      }
      
      const cacheTime = performance.now() - cacheStart;
      
      // Cached calls should be at least 10x faster per operation
      expect(cacheTime / 1000).toBeLessThan(firstTime);
    });
  });
});