import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { prisma } from '@/lib/prisma';

async function handleGetAudit(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('targetUserId') || undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);

  const logs = await prisma.adminAuditLog.findMany({
    where: targetUserId ? { targetUserId } : undefined,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: logs,
  });
}

export const GET = withAdminAuth(handleGetAudit);
