import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const execAsync = promisify(exec);

// Use a test database
process.env.DATABASE_URL = 'file:./test.db';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export async function setupTestDatabase() {
  // Run migrations
  await execAsync('npx prisma db push --skip-generate');
  
  // Seed test data
  await seedTestData();
}

export async function teardownTestDatabase() {
  // Clean up all data
  await prisma.download.deleteMany();
  await prisma.snapshot.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tier.deleteMany();
  
  await prisma.$disconnect();
}

export async function seedTestData() {
  // Create tiers
  const freeTier = await prisma.tier.create({
    data: {
      id: 'free-tier-test',
      name: 'free',
      displayName: 'Free Tier',
      bandwidthMbps: 50,
      burstBandwidthMbps: 50,
      dailyDownloadGb: 10,
      monthlyDownloadGb: 100,
      maxConcurrentDownloads: 1,
      queuePriority: 0,
    },
  });

  const premiumTier = await prisma.tier.create({
    data: {
      id: 'premium-tier-test',
      name: 'premium',
      displayName: 'Premium Tier',
      bandwidthMbps: 250,
      burstBandwidthMbps: 250,
      dailyDownloadGb: 100,
      monthlyDownloadGb: 1000,
      maxConcurrentDownloads: 5,
      queuePriority: 10,
    },
  });

  // Create test users
  const testUser = await prisma.user.create({
    data: {
      id: 'test-user-1',
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      displayName: 'Test User',
      personalTierId: freeTier.id,
      creditBalance: 0,
    },
  });

  const premiumUser = await prisma.user.create({
    data: {
      id: 'premium-user-1',
      email: 'premium@example.com',
      passwordHash: await bcrypt.hash('premium123', 10),
      displayName: 'Premium User',
      personalTierId: premiumTier.id,
      creditBalance: 10000, // $100 in credits
    },
  });

  // Create test snapshots
  const osmosisSnapshot = await prisma.snapshot.create({
    data: {
      id: 'snapshot-osmosis-1',
      chainId: 'osmosis',
      fileName: 'osmosis-1-pruned-20240320.tar.gz',
      filePath: 'osmosis/osmosis-1-pruned-20240320.tar.gz',
      fileSizeBytes: 125829120000,
      blockHeight: 18500000,
      pruningMode: 'pruned',
      compressionType: 'gzip',
      snapshotTakenAt: new Date('2024-03-20T00:00:00Z'),
      regions: 'us-east,eu-west',
    },
  });

  const cosmosSnapshot = await prisma.snapshot.create({
    data: {
      id: 'snapshot-cosmos-1',
      chainId: 'cosmos',
      fileName: 'cosmoshub-4-archive-20240320.tar.gz',
      filePath: 'cosmos/cosmoshub-4-archive-20240320.tar.gz',
      fileSizeBytes: 2500000000000,
      blockHeight: 19000000,
      pruningMode: 'archive',
      compressionType: 'gzip',
      snapshotTakenAt: new Date('2024-03-20T00:00:00Z'),
      regions: 'us-east',
    },
  });

  return {
    tiers: { freeTier, premiumTier },
    users: { testUser, premiumUser },
    snapshots: { osmosisSnapshot, cosmosSnapshot },
  };
}

// Test utilities
export function generateTestEmail() {
  return `test-${randomBytes(4).toString('hex')}@example.com`;
}

export async function createTestUser(data?: {
  email?: string;
  password?: string;
  tierId?: string;
}) {
  const email = data?.email || generateTestEmail();
  const password = data?.password || 'testpass123';
  const tierId = data?.tierId || 'free-tier-test';

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      displayName: email.split('@')[0],
      personalTierId: tierId,
    },
  });

  return { user, password };
}

// Mock MinIO client for testing
export const mockMinioClient = {
  presignedGetObject: jest.fn().mockResolvedValue('https://mock-url.example.com/file'),
  statObject: jest.fn().mockResolvedValue({
    size: 125829120000,
    lastModified: new Date('2024-03-20T00:00:00Z'),
  }),
  listObjectsV2: jest.fn().mockResolvedValue({
    Contents: [
      {
        Key: 'osmosis/osmosis-1-pruned-20240320.tar.gz',
        Size: 125829120000,
        LastModified: new Date('2024-03-20T00:00:00Z'),
      },
    ],
  }),
};