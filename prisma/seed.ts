import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default tiers with new API rate limiting
  const tiers = [
    {
      name: "free",
      displayName: "Free Tier",
      bandwidthMbps: 50,
      burstBandwidthMbps: 75,
      dailyDownloadGb: 10,
      monthlyDownloadGb: 100,
      maxConcurrentDownloads: 1,
      queuePriority: 0,
      apiRateLimitHourly: 50, // New: 50 API requests/hour
      canRequestSnapshots: false,
      canAccessApi: true,
      canCreateTeams: false,
      downloadPricePerGb: 0,
      snapshotRequestPrice: 0,
      badgeColor: "#6B7280",
      description: "Basic access with daily snapshots at 12:00 UTC",
      features: JSON.stringify([
        "10GB daily download limit",
        "50 Mbps shared bandwidth",
        "50 API requests per hour",
        "Daily snapshots (12:00 UTC)",
        "Access to public snapshots",
      ]),
    },
    {
      name: "premium",
      displayName: "Premium",
      bandwidthMbps: 250,
      burstBandwidthMbps: 300,
      dailyDownloadGb: 100,
      monthlyDownloadGb: 1000,
      maxConcurrentDownloads: 3,
      queuePriority: 10,
      apiRateLimitHourly: 500, // New: 500 API requests/hour
      canRequestSnapshots: true,
      canAccessApi: true,
      canCreateTeams: true,
      downloadPricePerGb: 10, // $0.10 per GB
      snapshotRequestPrice: 500, // $5.00 per request
      badgeColor: "#3B82F6",
      description: "Enhanced access with twice daily snapshots",
      features: JSON.stringify([
        "100GB daily download limit",
        "250 Mbps shared bandwidth",
        "500 API requests per hour",
        "Twice daily snapshots (0:00, 12:00 UTC)",
        "Priority queue access",
        "Request custom snapshots",
        "Create team accounts",
      ]),
    },
    {
      name: "ultra",
      displayName: "Ultra",
      bandwidthMbps: 500,
      burstBandwidthMbps: 1000,
      dailyDownloadGb: 0, // unlimited
      monthlyDownloadGb: 0, // unlimited
      maxConcurrentDownloads: 10,
      queuePriority: 100,
      apiRateLimitHourly: 2000, // New: 2000 API requests/hour
      canRequestSnapshots: true,
      canAccessApi: true,
      canCreateTeams: true,
      downloadPricePerGb: 5, // $0.05 per GB
      snapshotRequestPrice: 0, // free
      badgeColor: "#10B981",
      description: "Dedicated resources with 6-hour snapshots + custom requests",
      features: JSON.stringify([
        "Unlimited downloads",
        "500 Mbps dedicated bandwidth",
        "2000 API requests per hour",
        "6-hour snapshots (0:00, 6:00, 12:00, 18:00 UTC)",
        "Custom snapshot requests",
        "Highest queue priority",
        "Private snapshot hosting",
        "24/7 support",
        "Custom SLA",
      ]),
    },
  ];

  for (const tier of tiers) {
    await prisma.tier.upsert({
      where: { name: tier.name },
      update: tier,
      create: tier,
    });
    console.log(`✅ Created/updated tier: ${tier.displayName}`);
  }

  // Create system config
  await prisma.systemConfig.upsert({
    where: { id: "system" },
    update: {
      totalBandwidthMbps: 1000,
      reservedBandwidthMbps: 100,
      defaultTierId: "free",
    },
    create: {
      id: "system",
      totalBandwidthMbps: 1000,
      reservedBandwidthMbps: 100,
      defaultTierId: "free",
    },
  });
  console.log("✅ Created/updated system configuration");

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });