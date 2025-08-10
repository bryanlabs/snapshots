import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { hasPremiumFeatures, hasUltraFeatures } from '@/lib/utils/tier';
import { randomBytes } from 'crypto';

// GET /api/account/telegram - Get user's telegram invitation status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        personalTier: true,
        telegramInvitations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userTier = user.personalTier?.name || 'free';
    
    // Determine available telegram access based on tier
    let availableGroups: string[] = [];
    if (hasUltraFeatures(userTier)) {
      availableGroups = ['ultra', 'premium'];
    } else if (hasPremiumFeatures(userTier)) {
      availableGroups = ['premium'];
    }

    // Get current invitations status
    const invitations = user.telegramInvitations.reduce((acc, invitation) => {
      acc[invitation.groupType] = {
        id: invitation.id,
        status: invitation.status,
        groupName: invitation.groupName,
        invitedAt: invitation.invitedAt,
        joinedAt: invitation.joinedAt,
        expiresAt: invitation.expiresAt,
        emailSent: invitation.emailSent,
        remindersSent: invitation.remindersSent
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      userTier,
      telegramUsername: user.telegramUsername,
      telegramUserId: user.telegramUserId,
      availableGroups,
      invitations,
      communityAccess: {
        free: {
          available: true,
          description: 'Community forums only (no Telegram access)'
        },
        premium: {
          available: availableGroups.includes('premium'),
          description: 'Access to "Premium Users" Telegram group',
          groupName: 'BryanLabs Premium Users'
        },
        ultra: {
          available: availableGroups.includes('ultra'),
          description: 'Private Telegram group with Dan directly',
          groupName: 'BryanLabs Ultra VIP'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching telegram status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/account/telegram - Request telegram invitation or update telegram info
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, telegramUsername, groupType } = body;

    if (action === 'update_telegram_info') {
      // Update user's telegram username
      if (!telegramUsername || typeof telegramUsername !== 'string') {
        return NextResponse.json(
          { error: 'Telegram username is required' },
          { status: 400 }
        );
      }

      // Validate telegram username format
      const telegramUsernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
      if (!telegramUsernameRegex.test(telegramUsername)) {
        return NextResponse.json(
          { error: 'Invalid Telegram username format' },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { telegramUsername }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Telegram username updated successfully' 
      });
    }

    if (action === 'request_invitation') {
      // Request invitation to a specific group
      if (!groupType || !['premium', 'ultra'].includes(groupType)) {
        return NextResponse.json(
          { error: 'Invalid group type' },
          { status: 400 }
        );
      }

      // Check user's tier eligibility
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { personalTier: true }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userTier = user.personalTier?.name || 'free';
      
      // Verify tier eligibility
      if (groupType === 'ultra' && !hasUltraFeatures(userTier)) {
        return NextResponse.json(
          { error: 'Ultra tier required for this group' },
          { status: 403 }
        );
      }
      
      if (groupType === 'premium' && !hasPremiumFeatures(userTier)) {
        return NextResponse.json(
          { error: 'Premium tier or higher required for this group' },
          { status: 403 }
        );
      }

      // Check if invitation already exists
      const existingInvitation = await prisma.telegramInvitation.findFirst({
        where: {
          userId: session.user.id,
          groupType,
          status: { in: ['pending', 'invited', 'joined'] }
        }
      });

      if (existingInvitation) {
        return NextResponse.json(
          { error: 'Invitation already exists for this group' },
          { status: 409 }
        );
      }

      // Create new invitation
      const inviteToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

      const groupNames = {
        premium: 'BryanLabs Premium Users',
        ultra: 'BryanLabs Ultra VIP'
      };

      const invitation = await prisma.telegramInvitation.create({
        data: {
          userId: session.user.id,
          groupType,
          groupName: groupNames[groupType as keyof typeof groupNames],
          status: 'pending',
          inviteToken,
          expiresAt
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Telegram invitation requested successfully',
        invitation: {
          id: invitation.id,
          status: invitation.status,
          groupType: invitation.groupType,
          groupName: invitation.groupName,
          expiresAt: invitation.expiresAt,
          inviteToken: invitation.inviteToken
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing telegram request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/account/telegram - Cancel or revoke telegram invitation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');
    const groupType = searchParams.get('groupType');

    if (!invitationId && !groupType) {
      return NextResponse.json(
        { error: 'Invitation ID or group type is required' },
        { status: 400 }
      );
    }

    let whereClause: any = { userId: session.user.id };
    
    if (invitationId) {
      whereClause.id = invitationId;
    } else if (groupType) {
      whereClause.groupType = groupType;
    }

    // Find and update the invitation
    const invitation = await prisma.telegramInvitation.findFirst({
      where: whereClause
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Update invitation status to revoked
    await prisma.telegramInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        revokedBy: session.user.id,
        revokedReason: 'User requested cancellation'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Telegram invitation cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling telegram invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}