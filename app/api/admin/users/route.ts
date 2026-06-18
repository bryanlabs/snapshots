import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { prisma } from '@/lib/prisma';

async function handleGetUsers(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { walletAddress: { contains: q, mode: 'insensitive' as const } },
          { displayName: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  const [users, tiers] = await Promise.all([
    prisma.user.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        displayName: true,
        role: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        lastLoginAt: true,
        personalTier: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            downloads: true,
            snapshotRequests: true,
          },
        },
      },
    }),
    prisma.tier.findMany({
      where: { isActive: true },
      orderBy: { queuePriority: 'asc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        bandwidthMbps: true,
        dailyDownloadGb: true,
        monthlyDownloadGb: true,
        maxConcurrentDownloads: true,
        queuePriority: true,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      users,
      tiers,
    },
  });
}

export const GET = withAdminAuth(handleGetUsers);
