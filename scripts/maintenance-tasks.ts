#!/usr/bin/env tsx
/**
 * Maintenance Tasks for Tier-Based System
 * 
 * This script runs periodic maintenance tasks:
 * 1. Clean up old API usage records
 * 2. Process expired subscriptions
 * 3. Generate usage analytics
 */

import { PrismaClient } from "@prisma/client";
import { cleanupOldUsageRecords } from "@/lib/middleware/apiRateLimit";
import { processExpiredSubscriptions } from "@/lib/utils/subscription";

const prisma = new PrismaClient();

async function runMaintenanceTasks() {
  console.log("🔧 Starting maintenance tasks...");
  
  try {
    // 1. Clean up old API usage records (keep last 7 days)
    console.log("🧹 Cleaning up old API usage records...");
    const deletedRecords = await cleanupOldUsageRecords(7);
    console.log(`✅ Cleaned up ${deletedRecords} old API usage records`);
    
    // 2. Process expired subscriptions
    console.log("⏰ Processing expired subscriptions...");
    const subscriptionResults = await processExpiredSubscriptions();
    console.log(`✅ Processed ${subscriptionResults.total} expired subscriptions`);
    console.log(`   - ${subscriptionResults.successful} successful`);
    console.log(`   - ${subscriptionResults.failed} failed`);
    
    // 3. Generate basic usage statistics
    console.log("📊 Generating usage statistics...");
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    // API usage stats for yesterday
    const apiUsageStats = await prisma.apiUsageRecord.aggregate({
      where: {
        hourBucket: {
          gte: yesterdayStart,
          lt: todayStart,
        },
      },
      _sum: {
        requestCount: true,
      },
      _count: {
        userId: true,
      },
    });
    
    // User tier distribution
    const tierDistribution = await prisma.user.groupBy({
      by: ['subscriptionStatus'],
      _count: {
        subscriptionStatus: true,
      },
    });
    
    // Active subscriptions by tier
    const activeTierDistribution = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'active',
      },
      include: {
        personalTier: {
          select: {
            name: true,
          },
        },
      },
    });
    
    const tierCounts = activeTierDistribution.reduce((acc, user) => {
      const tierName = user.personalTier?.name || 'free';
      acc[tierName] = (acc[tierName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("📈 Usage Statistics:");
    console.log(`   - Yesterday's API requests: ${apiUsageStats._sum.requestCount || 0}`);
    console.log(`   - Unique API users yesterday: ${apiUsageStats._count.userId || 0}`);
    console.log("📊 Subscription Status Distribution:");
    tierDistribution.forEach(({ subscriptionStatus, _count }) => {
      console.log(`   - ${subscriptionStatus}: ${_count.subscriptionStatus} users`);
    });
    console.log("🎯 Active Tier Distribution:");
    Object.entries(tierCounts).forEach(([tier, count]) => {
      console.log(`   - ${tier}: ${count} users`);
    });
    
    console.log("✅ Maintenance tasks completed successfully!");
    
  } catch (error) {
    console.error("❌ Error running maintenance tasks:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runMaintenanceTasks()
    .catch((error) => {
      console.error("Failed to run maintenance tasks:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default runMaintenanceTasks;