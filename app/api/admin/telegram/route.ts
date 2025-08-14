import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/telegram - Get telegram invitations for admin management
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const groupType = searchParams.get('groupType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    let whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (groupType) {
      whereClause.groupType = groupType;
    }

    // Get invitations with user details
    const invitations = await prisma.telegramInvitation.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            telegramUsername: true,
            personalTier: {
              select: {
                name: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Get summary statistics
    const stats = await prisma.telegramInvitation.groupBy({
      by: ['status', 'groupType'],
      _count: true
    });

    const summary = stats.reduce((acc, stat) => {
      if (!acc[stat.groupType]) {
        acc[stat.groupType] = {};
      }
      acc[stat.groupType][stat.status] = stat._count;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return NextResponse.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        user: {
          id: inv.user.id,
          email: inv.user.email,
          displayName: inv.user.displayName,
          telegramUsername: inv.user.telegramUsername,
          tier: inv.user.personalTier?.name || 'free'
        },
        groupType: inv.groupType,
        groupName: inv.groupName,
        status: inv.status,
        inviteToken: inv.inviteToken,
        createdAt: inv.createdAt,
        invitedAt: inv.invitedAt,
        joinedAt: inv.joinedAt,
        expiresAt: inv.expiresAt,
        emailSent: inv.emailSent,
        emailSentAt: inv.emailSentAt,
        remindersSent: inv.remindersSent
      })),
      summary,
      pagination: {
        limit,
        offset,
        hasMore: invitations.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching admin telegram data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/telegram - Admin actions for telegram invitations
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, invitationId, invitationIds, data } = body;

    if (action === 'bulk_process') {
      // Process multiple invitations
      if (!invitationIds || !Array.isArray(invitationIds)) {
        return NextResponse.json(
          { error: 'Invitation IDs array is required' },
          { status: 400 }
        );
      }

      const { newStatus, inviteLinks } = data || {};
      
      if (!newStatus || !['invited', 'joined', 'revoked'].includes(newStatus)) {
        return NextResponse.json(
          { error: 'Valid status is required' },
          { status: 400 }
        );
      }

      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      };

      if (newStatus === 'invited') {
        updateData.invitedAt = new Date();
        updateData.invitedBy = session.user.id;
      } else if (newStatus === 'joined') {
        updateData.joinedAt = new Date();
      } else if (newStatus === 'revoked') {
        updateData.revokedAt = new Date();
        updateData.revokedBy = session.user.id;
        if (data?.reason) {
          updateData.revokedReason = data.reason;
        }
      }

      // If invite links are provided, update them
      if (inviteLinks && typeof inviteLinks === 'object') {
        // Update invitations with individual invite links
        const updatePromises = invitationIds.map((id: string) => {
          const linkData = inviteLinks[id] ? { inviteLink: inviteLinks[id] } : {};
          return prisma.telegramInvitation.update({
            where: { id },
            data: { ...updateData, ...linkData }
          });
        });

        await Promise.all(updatePromises);
      } else {
        // Bulk update without individual links
        await prisma.telegramInvitation.updateMany({
          where: { id: { in: invitationIds } },
          data: updateData
        });
      }

      return NextResponse.json({
        success: true,
        message: `${invitationIds.length} invitations updated to ${newStatus}`,
        processed: invitationIds.length
      });
    }

    if (action === 'send_email_notification') {
      // Mark invitation as having email sent
      if (!invitationId) {
        return NextResponse.json(
          { error: 'Invitation ID is required' },
          { status: 400 }
        );
      }

      await prisma.telegramInvitation.update({
        where: { id: invitationId },
        data: {
          emailSent: true,
          emailSentAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Email notification marked as sent'
      });
    }

    if (action === 'send_reminder') {
      // Send reminder and increment counter
      if (!invitationId) {
        return NextResponse.json(
          { error: 'Invitation ID is required' },
          { status: 400 }
        );
      }

      const invitation = await prisma.telegramInvitation.findUnique({
        where: { id: invitationId }
      });

      if (!invitation) {
        return NextResponse.json(
          { error: 'Invitation not found' },
          { status: 404 }
        );
      }

      await prisma.telegramInvitation.update({
        where: { id: invitationId },
        data: {
          remindersSent: invitation.remindersSent + 1,
          lastReminderAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Reminder sent and recorded'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing admin telegram action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}