import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default tiers
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
      canRequestSnapshots: false,
      canAccessApi: true,
      canCreateTeams: false,
      downloadPricePerGb: 0,
      snapshotRequestPrice: 0,
      badgeColor: "#6B7280",
      description: "Basic access with shared bandwidth",
      features: JSON.stringify([
        "10GB daily download limit",
        "50 Mbps shared bandwidth",
        "Access to public snapshots",
        "Basic API access",
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
      canRequestSnapshots: true,
      canAccessApi: true,
      canCreateTeams: true,
      downloadPricePerGb: 10, // $0.10 per GB
      snapshotRequestPrice: 500, // $5.00 per request
      badgeColor: "#3B82F6",
      description: "Enhanced access with priority bandwidth",
      features: JSON.stringify([
        "100GB daily download limit",
        "250 Mbps shared bandwidth",
        "Priority queue access",
        "Request custom snapshots",
        "Create team accounts",
        "Advanced API features",
      ]),
    },
    {
      name: "enterprise",
      displayName: "Enterprise",
      bandwidthMbps: 500,
      burstBandwidthMbps: 1000,
      dailyDownloadGb: 0, // unlimited
      monthlyDownloadGb: 0, // unlimited
      maxConcurrentDownloads: 10,
      queuePriority: 100,
      canRequestSnapshots: true,
      canAccessApi: true,
      canCreateTeams: true,
      downloadPricePerGb: 5, // $0.05 per GB
      snapshotRequestPrice: 0, // free
      badgeColor: "#10B981",
      description: "Dedicated resources for high-volume usage",
      features: JSON.stringify([
        "Unlimited downloads",
        "500 Mbps dedicated bandwidth",
        "Highest queue priority",
        "Free custom snapshots",
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