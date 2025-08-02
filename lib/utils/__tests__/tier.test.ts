import {
  isFreeUser,
  hasPremiumFeatures,
  hasUnlimitedFeatures,
  getBandwidthLimit,
  getDownloadExpiryHours,
  canRequestCustomSnapshots,
} from '../tier';

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

  describe('hasUnlimitedFeatures', () => {
    it('should return false for free and premium tiers', () => {
      expect(hasUnlimitedFeatures('free')).toBe(false);
      expect(hasUnlimitedFeatures('premium')).toBe(false);
      expect(hasUnlimitedFeatures(null)).toBe(false);
      expect(hasUnlimitedFeatures(undefined)).toBe(false);
    });

    it('should return true for unlimited and enterprise tiers', () => {
      expect(hasUnlimitedFeatures('unlimited')).toBe(true);
      expect(hasUnlimitedFeatures('enterprise')).toBe(true);
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

    it('should return 0 (unlimited) for unlimited/enterprise tiers', () => {
      expect(getBandwidthLimit('unlimited')).toBe(0);
      expect(getBandwidthLimit('enterprise')).toBe(0);
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

    it('should return 48 hours for unlimited/enterprise tiers', () => {
      expect(getDownloadExpiryHours('unlimited')).toBe(48);
      expect(getDownloadExpiryHours('enterprise')).toBe(48);
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
      expect(canRequestCustomSnapshots('unlimited')).toBe(true);
      expect(canRequestCustomSnapshots('enterprise')).toBe(true);
    });
  });
});