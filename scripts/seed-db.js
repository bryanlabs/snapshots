const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const tiers = [
  {
    name: 'free',
    displayName: 'Free Tier',
    bandwidthMbps: 50,
    burstBandwidthMbps: 75,
    dailyDownloadGb: 10,
    monthlyDownloadGb: 100,
    maxConcurrentDownloads: 1,
    queuePriority: 0,
    apiRateLimitHourly: 50,
    canRequestSnapshots: false,
    canAccessApi: true,
    canCreateTeams: false,
    downloadPricePerGb: 0,
    snapshotRequestPrice: 0,
    badgeColor: '#6B7280',
    description: 'Basic access to public snapshots.',
    features: JSON.stringify([
      '10GB daily download limit',
      '50 Mbps shared bandwidth',
      '50 API requests per hour',
      'Access to public snapshots',
    ]),
    isActive: true,
  },
  {
    name: 'premium',
    displayName: 'Premium',
    bandwidthMbps: 250,
    burstBandwidthMbps: 300,
    dailyDownloadGb: 100,
    monthlyDownloadGb: 1000,
    maxConcurrentDownloads: 3,
    queuePriority: 10,
    apiRateLimitHourly: 500,
    canRequestSnapshots: true,
    canAccessApi: true,
    canCreateTeams: true,
    telegramGroupAccess: 'premium',
    telegramGroupName: 'BryanLabs Premium',
    downloadPricePerGb: 10,
    snapshotRequestPrice: 500,
    badgeColor: '#3B82F6',
    description: 'Faster downloads, priority queueing, and custom requests.',
    features: JSON.stringify([
      '100GB daily download limit',
      '250 Mbps shared bandwidth',
      '500 API requests per hour',
      'Priority queue access',
      'Request custom snapshots',
    ]),
    isActive: true,
  },
  {
    name: 'ultra',
    displayName: 'Ultra',
    bandwidthMbps: 500,
    burstBandwidthMbps: 1000,
    dailyDownloadGb: 0,
    monthlyDownloadGb: 0,
    maxConcurrentDownloads: 10,
    queuePriority: 100,
    apiRateLimitHourly: 2000,
    canRequestSnapshots: true,
    canAccessApi: true,
    canCreateTeams: true,
    telegramGroupAccess: 'ultra',
    telegramGroupName: 'BryanLabs Ultra',
    downloadPricePerGb: 5,
    snapshotRequestPrice: 0,
    badgeColor: '#10B981',
    description: 'Highest priority access for heavy operators.',
    features: JSON.stringify([
      'Unlimited downloads',
      '500 Mbps bandwidth',
      '2000 API requests per hour',
      'Highest queue priority',
      'Private snapshot hosting support',
    ]),
    isActive: true,
  },
];

async function main() {
  for (const tier of tiers) {
    await prisma.tier.upsert({
      where: { name: tier.name },
      update: tier,
      create: tier,
    });
  }

  await prisma.systemConfig.upsert({
    where: { id: 'system' },
    update: {
      totalBandwidthMbps: 1000,
      reservedBandwidthMbps: 100,
      defaultTierId: 'free',
    },
    create: {
      id: 'system',
      totalBandwidthMbps: 1000,
      reservedBandwidthMbps: 100,
      defaultTierId: 'free',
    },
  });

  const bootstrapAdminWallet = process.env.BOOTSTRAP_ADMIN_WALLET;
  if (bootstrapAdminWallet) {
    const freeTier = await prisma.tier.findUnique({
      where: { name: 'free' },
      select: { id: true },
    });

    await prisma.user.upsert({
      where: { walletAddress: bootstrapAdminWallet },
      update: {
        role: 'admin',
      },
      create: {
        walletAddress: bootstrapAdminWallet,
        role: 'admin',
        personalTierId: freeTier?.id,
        subscriptionStatus: 'free',
      },
    });
  }
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
