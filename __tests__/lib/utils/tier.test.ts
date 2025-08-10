import {
  // New modern API
  normalizeTierName,
  isPremiumTier,
  isUltraTier,
  isFreeTier,
  getTierCapabilities,
  // Legacy compatibility
  isFreeUser,
  hasPremiumFeatures,
  hasUltraFeatures,
  getBandwidthLimit,
  getDownloadExpiryHours,
  canRequestCustomSnapshots,
  // NextAuth integration
  validateSessionTierAccess,
  createTierAccessError,
} from '@/lib/utils/tier';

describe('Tier Utilities', () => {
  describe('isFreeUser', () => {
    it('should return true for free tier', () => {
      expect(isFreeUser('free')).toBe(true);
    });

    it('should return true for null/undefined tier', () => {
      expect(isFreeUser(null)).toBe(true);
      expect(isFreeUser(undefined)).toBe(true);
      expect(isFreeUser('')).toBe(true);
    });

    it('should return false for premium tiers', () => {
      expect(isFreeUser('premium')).toBe(false);
      expect(isFreeUser('unlimited')).toBe(false);
      expect(isFreeUser('enterprise')).toBe(false);
    });
  });

  describe('hasPremiumFeatures', () => {
    it('should return false for free tier', () => {
      expect(hasPremiumFeatures('free')).toBe(false);
    });

    it('should return false for null/undefined tier', () => {
      expect(hasPremiumFeatures(null)).toBe(false);
      expect(hasPremiumFeatures(undefined)).toBe(false);
      expect(hasPremiumFeatures('')).toBe(false);
    });

    it('should return true for premium tiers', () => {
      expect(hasPremiumFeatures('premium')).toBe(true);
      expect(hasPremiumFeatures('unlimited')).toBe(true);
      expect(hasPremiumFeatures('enterprise')).toBe(true);
    });
  });

  describe('hasUltraFeatures', () => {
    it('should return false for free and premium tiers', () => {
      expect(hasUltraFeatures('free')).toBe(false);
      expect(hasUltraFeatures('premium')).toBe(false);
      expect(hasUltraFeatures(null)).toBe(false);
      expect(hasUltraFeatures(undefined)).toBe(false);
    });

    it('should return true for ultra, unlimited and enterprise tiers', () => {
      expect(hasUltraFeatures('ultra')).toBe(true);
      expect(hasUltraFeatures('unlimited')).toBe(true);
      expect(hasUltraFeatures('enterprise')).toBe(true);
    });
  });

  describe('normalizeTierName', () => {
    it('should normalize null/undefined to free', () => {
      expect(normalizeTierName(null)).toBe('free');
      expect(normalizeTierName(undefined)).toBe('free');
      expect(normalizeTierName('')).toBe('free');
    });

    it('should normalize legacy tier names', () => {
      expect(normalizeTierName('unlimited')).toBe('ultra');
      expect(normalizeTierName('enterprise')).toBe('ultra');
      expect(normalizeTierName('ultimate')).toBe('ultra');
      expect(normalizeTierName('UNLIMITED')).toBe('ultra'); // case insensitive
    });

    it('should preserve current tier names', () => {
      expect(normalizeTierName('free')).toBe('free');
      expect(normalizeTierName('premium')).toBe('premium');
      expect(normalizeTierName('ultra')).toBe('ultra');
    });
  });

  describe('isPremiumTier', () => {
    it('should return true for all paid tiers', () => {
      expect(isPremiumTier('premium')).toBe(true);
      expect(isPremiumTier('ultra')).toBe(true);
      expect(isPremiumTier('unlimited')).toBe(true); // legacy support
      expect(isPremiumTier('enterprise')).toBe(true); // legacy support
    });

    it('should return false for free tier', () => {
      expect(isPremiumTier('free')).toBe(false);
      expect(isPremiumTier(null)).toBe(false);
      expect(isPremiumTier(undefined)).toBe(false);
    });
  });

  describe('getTierCapabilities', () => {
    it('should return correct capabilities for ultra tier', () => {
      const capabilities = getTierCapabilities('ultra');
      expect(capabilities.isPaid).toBe(true);
      expect(capabilities.isUltra).toBe(true);
      expect(capabilities.canRequestCustomSnapshots).toBe(true);
      expect(capabilities.bandwidthMbps).toBe(500);
      expect(capabilities.apiRateLimit).toBe(2000);
      expect(capabilities.showAds).toBe(false);
    });

    it('should return correct capabilities for premium tier', () => {
      const capabilities = getTierCapabilities('premium');
      expect(capabilities.isPaid).toBe(true);
      expect(capabilities.isUltra).toBe(false);
      expect(capabilities.canRequestCustomSnapshots).toBe(true);
      expect(capabilities.bandwidthMbps).toBe(250);
      expect(capabilities.apiRateLimit).toBe(500);
      expect(capabilities.showAds).toBe(false);
    });

    it('should return correct capabilities for free tier', () => {
      const capabilities = getTierCapabilities('free');
      expect(capabilities.isPaid).toBe(false);
      expect(capabilities.isUltra).toBe(false);
      expect(capabilities.canRequestCustomSnapshots).toBe(false);
      expect(capabilities.bandwidthMbps).toBe(50);
      expect(capabilities.apiRateLimit).toBe(50);
      expect(capabilities.showAds).toBe(true);
      expect(capabilities.upgradePromptEnabled).toBe(true);
    });

    it('should normalize legacy tier names in capabilities', () => {
      const unlimitedCaps = getTierCapabilities('unlimited');
      const ultraCaps = getTierCapabilities('ultra');
      expect(unlimitedCaps).toEqual(ultraCaps);
    });
  });

  describe('validateSessionTierAccess', () => {
    it('should return false for null/undefined session', () => {
      expect(validateSessionTierAccess(null, 'canRequestCustomSnapshots')).toBe(false);
      expect(validateSessionTierAccess(undefined, 'canRequestCustomSnapshots')).toBe(false);
      expect(validateSessionTierAccess({ user: undefined }, 'canRequestCustomSnapshots')).toBe(false);
    });

    it('should validate boolean capabilities', () => {
      const session = { user: { tier: 'premium' } };
      expect(validateSessionTierAccess(session, 'canRequestCustomSnapshots')).toBe(true);
      expect(validateSessionTierAccess(session, 'showAds')).toBe(false);
      
      const freeSession = { user: { tier: 'free' } };
      expect(validateSessionTierAccess(freeSession, 'canRequestCustomSnapshots')).toBe(false);
    });

    it('should validate numeric capabilities', () => {
      const session = { user: { tier: 'ultra' } };
      expect(validateSessionTierAccess(session, 'bandwidthMbps')).toBe(true); // 500 > 0
      expect(validateSessionTierAccess(session, 'queuePriority')).toBe(true); // 100 > 0
    });
  });

  describe('getBandwidthLimit', () => {
    it('should return 50 Mbps for free tier', () => {
      expect(getBandwidthLimit('free')).toBe(50);
      expect(getBandwidthLimit(null)).toBe(50);
      expect(getBandwidthLimit(undefined)).toBe(50);
    });

    it('should return 250 Mbps for premium tier', () => {
      expect(getBandwidthLimit('premium')).toBe(250);
    });

    it('should return 500 Mbps for ultra/unlimited/enterprise tiers', () => {
      expect(getBandwidthLimit('ultra')).toBe(500);
      expect(getBandwidthLimit('unlimited')).toBe(500); // normalized to ultra
      expect(getBandwidthLimit('enterprise')).toBe(500); // normalized to ultra
    });
  });

  describe('getDownloadExpiryHours', () => {
    it('should return 12 hours for free tier', () => {
      expect(getDownloadExpiryHours('free')).toBe(12);
      expect(getDownloadExpiryHours(null)).toBe(12);
      expect(getDownloadExpiryHours(undefined)).toBe(12);
    });

    it('should return 24 hours for premium tier', () => {
      expect(getDownloadExpiryHours('premium')).toBe(24);
    });

    it('should return 48 hours for ultra/unlimited/enterprise tiers', () => {
      expect(getDownloadExpiryHours('ultra')).toBe(48);
      expect(getDownloadExpiryHours('unlimited')).toBe(48); // normalized to ultra
      expect(getDownloadExpiryHours('enterprise')).toBe(48); // normalized to ultra
    });
  });

  describe('canRequestCustomSnapshots', () => {
    it('should return false for free tier', () => {
      expect(canRequestCustomSnapshots('free')).toBe(false);
      expect(canRequestCustomSnapshots(null)).toBe(false);
      expect(canRequestCustomSnapshots(undefined)).toBe(false);
    });

    it('should return true for premium tiers', () => {
      expect(canRequestCustomSnapshots('premium')).toBe(true);
      expect(canRequestCustomSnapshots('ultra')).toBe(true);
      expect(canRequestCustomSnapshots('unlimited')).toBe(true); // normalized to ultra
      expect(canRequestCustomSnapshots('enterprise')).toBe(true); // normalized to ultra
    });
  });

  describe('createTierAccessError', () => {
    it('should create appropriate error messages', () => {
      const freeError = createTierAccessError('free', 'custom snapshots');
      expect(freeError.error).toContain('paid subscription tier');
      expect(freeError.code).toBe('TIER_INSUFFICIENT');
      expect(freeError.status).toBe(403);
      
      const premiumError = createTierAccessError('premium', 'ultra features');
      expect(premiumError.error).toContain('higher subscription tier');
      expect(premiumError.code).toBe('TIER_INSUFFICIENT');
    });
  });
});