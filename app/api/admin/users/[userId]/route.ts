import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { prisma } from '@/lib/prisma';

const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  tier: z.enum(['free', 'premium', 'ultra']).optional(),
  subscriptionStatus: z.enum(['free', 'active', 'cancelled', 'expired', 'pending']).optional(),
  subscriptionExpiresAt: z.string().datetime().nullable().optional(),
  reason: z.string().max(500).optional(),
});

function serializeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    walletAddress: user.walletAddress,
    displayName: user.displayName,
    role: user.role,
    tier: user.personalTier?.name || null,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString?.() || null,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  const session = await auth();
  const adminUserId = session?.user?.id;
  const { userId } = await params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const before = await prisma.user.findUnique({
    where: { id: userId },
    include: { personalTier: true },
  });

  if (!before) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = {};

  if (parsed.data.role) {
    updateData.role = parsed.data.role;
  }

  if (parsed.data.subscriptionStatus) {
    updateData.subscriptionStatus = parsed.data.subscriptionStatus;
  }

  if (parsed.data.subscriptionExpiresAt !== undefined) {
    updateData.subscriptionExpiresAt = parsed.data.subscriptionExpiresAt
      ? new Date(parsed.data.subscriptionExpiresAt)
      : null;
  }

  if (parsed.data.tier) {
    const tier = await prisma.tier.findUnique({
      where: { name: parsed.data.tier },
      select: { id: true },
    });

    if (!tier) {
      return NextResponse.json(
        { success: false, error: `Tier ${parsed.data.tier} not found` },
        { status: 400 }
      );
    }

    updateData.personalTierId = tier.id;
  }

  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: updateData,
      include: { personalTier: true },
    });

    await tx.adminAuditLog.create({
      data: {
        adminUserId,
        targetUserId: userId,
        action: 'user.update',
        before: serializeUser(before),
        after: serializeUser(updated),
        reason: parsed.data.reason,
      },
    });

    return updated;
  });

  return NextResponse.json({
    success: true,
    data: serializeUser(after),
  });
}
