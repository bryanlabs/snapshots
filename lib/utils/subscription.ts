/**
 * Subscription Management Utilities
 * 
 * Handles tier-based subscription logic, including status checking,
 * expiration validation, and subscription lifecycle management.
 */

import { prisma } from "@/lib/prisma";
import type { SubscriptionStatus, UserTier } from "@/types/user";

/**
 * Check if a subscription is currently active
 */
export function isSubscriptionActive(
  status: SubscriptionStatus,
  expiresAt?: Date | null
): boolean {
  if (status === 'free') return true; // Free is always "active"
  if (status !== 'active') return false;
  
  if (expiresAt && new Date() > expiresAt) {
    return false; // Expired
  }
  
  return true;
}

/**
 * Get effective tier for user considering subscription status
 */
export function getEffectiveTier(
  personalTier: string,
  subscriptionStatus: SubscriptionStatus,
  subscriptionExpiresAt?: Date | null
): UserTier {
  // If subscription is not active, default to free
  if (!isSubscriptionActive(subscriptionStatus, subscriptionExpiresAt)) {
    return 'free';
  }
  
  // Return the personal tier if subscription is active
  return personalTier as UserTier;
}

/**
 * Calculate subscription expiration
 */
export function calculateSubscriptionExpiry(
  tier: UserTier,
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
): Date {
  const now = new Date();
  const expiryDate = new Date(now);
  
  if (billingPeriod === 'yearly') {
    expiryDate.setFullYear(now.getFullYear() + 1);
  } else {
    expiryDate.setMonth(now.getMonth() + 1);
  }
  
  return expiryDate;
}

/**
 * Update user subscription status
 */
export async function updateUserSubscription(
  userId: string,
  updates: {
    tier?: UserTier;
    status?: SubscriptionStatus;
    expiresAt?: Date | null;
  }
) {
  const updateData: any = {};
  
  if (updates.tier) {
    // Find the tier by name
    const tier = await prisma.tier.findUnique({
      where: { name: updates.tier },
    });
    
    if (tier) {
      updateData.personalTierId = tier.id;
    }
  }
  
  if (updates.status) {
    updateData.subscriptionStatus = updates.status;
  }
  
  if (updates.expiresAt !== undefined) {
    updateData.subscriptionExpiresAt = updates.expiresAt;
  }
  
  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: {
      personalTier: true,
    },
  });
}

/**
 * Check for expired subscriptions and update their status
 */
export async function processExpiredSubscriptions() {
  const now = new Date();
  
  // Find users with expired subscriptions
  const expiredUsers = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: {
        lte: now,
      },
    },
    include: {
      personalTier: true,
    },
  });
  
  console.log(`Found ${expiredUsers.length} expired subscriptions to process`);
  
  // Get free tier for defaulting expired users
  const freeTier = await prisma.tier.findUnique({
    where: { name: 'free' },
  });
  
  if (!freeTier) {
    throw new Error('Free tier not found in database');
  }
  
  // Update expired users to free tier
  const results = await Promise.allSettled(
    expiredUsers.map(user =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'expired',
          personalTierId: freeTier.id,
        },
      })
    )
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Processed expired subscriptions: ${successful} successful, ${failed} failed`);
  
  return { successful, failed, total: expiredUsers.length };
}

/**
 * Get subscription summary for a user
 */
export async function getUserSubscriptionSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      personalTier: true,
    },
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const effectiveTier = getEffectiveTier(
    user.personalTier?.name || 'free',
    user.subscriptionStatus as SubscriptionStatus,
    user.subscriptionExpiresAt
  );
  
  const isActive = isSubscriptionActive(
    user.subscriptionStatus as SubscriptionStatus,
    user.subscriptionExpiresAt
  );
  
  const daysUntilExpiry = user.subscriptionExpiresAt
    ? Math.ceil((user.subscriptionExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  
  return {
    userId: user.id,
    currentTier: user.personalTier?.name || 'free',
    effectiveTier,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    isActive,
    daysUntilExpiry,
    tierConfig: user.personalTier,
  };
}

/**
 * Cancel user subscription (mark as cancelled but maintain access until expiry)
 */
export async function cancelUserSubscription(userId: string) {
  return updateUserSubscription(userId, {
    status: 'cancelled',
    // Keep expiresAt as is - user keeps access until expiry
  });
}

/**
 * Reactivate cancelled subscription
 */
export async function reactivateUserSubscription(
  userId: string,
  tier: UserTier,
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
) {
  const newExpiryDate = calculateSubscriptionExpiry(tier, billingPeriod);
  
  return updateUserSubscription(userId, {
    tier,
    status: 'active',
    expiresAt: newExpiryDate,
  });
}