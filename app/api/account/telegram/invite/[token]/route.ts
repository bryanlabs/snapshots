import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    token: string;
  };
}

// GET /api/account/telegram/invite/[token] - Get invitation details by token
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Find invitation by token
    const invitation = await prisma.telegramInvitation.findUnique({
      where: { inviteToken: token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            telegramUsername: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await prisma.telegramInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' }
      });

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check invitation status
    if (!['pending', 'invited'].includes(invitation.status)) {
      return NextResponse.json(
        { error: `Invitation is ${invitation.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        groupType: invitation.groupType,
        groupName: invitation.groupName,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt
      },
      user: {
        displayName: invitation.user.displayName,
        email: invitation.user.email,
        telegramUsername: invitation.user.telegramUsername
      }
    });

  } catch (error) {
    console.error('Error fetching invitation details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/account/telegram/invite/[token] - Confirm invitation join
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = params;
    const body = await request.json();
    const { action } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Find invitation by token
    const invitation = await prisma.telegramInvitation.findUnique({
      where: { inviteToken: token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            telegramUsername: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await prisma.telegramInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' }
      });

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    if (action === 'mark_joined') {
      // Mark invitation as joined (called after user successfully joins Telegram group)
      await prisma.telegramInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'joined',
          joinedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Successfully joined Telegram group',
        invitation: {
          id: invitation.id,
          status: 'joined',
          groupName: invitation.groupName
        }
      });
    }

    if (action === 'mark_invited') {
      // Mark invitation as sent (called when admin processes the invitation)
      await prisma.telegramInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'invited',
          invitedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Invitation marked as sent',
        invitation: {
          id: invitation.id,
          status: 'invited',
          groupName: invitation.groupName
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing invitation action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}