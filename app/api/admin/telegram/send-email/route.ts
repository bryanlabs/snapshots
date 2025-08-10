import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { 
  sendTelegramInvitationEmail, 
  sendTelegramReminderEmail,
  TelegramEmailSubjects 
} from '@/lib/email/telegram-notifications';

// POST /api/admin/telegram/send-email - Send email notifications for Telegram invitations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
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

    if (action === 'send_invitation_email') {
      // Send invitation email for a single invitation
      if (!invitationId) {
        return NextResponse.json(
          { error: 'Invitation ID is required' },
          { status: 400 }
        );
      }

      const invitation = await prisma.telegramInvitation.findUnique({
        where: { id: invitationId },
        include: {
          user: {
            select: {
              email: true,
              displayName: true,
              telegramUsername: true
            }
          }
        }
      });

      if (!invitation) {
        return NextResponse.json(
          { error: 'Invitation not found' },
          { status: 404 }
        );
      }

      // Prepare email data
      const emailData = {
        user: {
          displayName: invitation.user.displayName,
          email: invitation.user.email,
          telegramUsername: invitation.user.telegramUsername
        },
        invitation: {
          id: invitation.id,
          groupType: invitation.groupType,
          groupName: invitation.groupName,
          inviteToken: invitation.inviteToken || '',
          expiresAt: invitation.expiresAt
        },
        inviteLink: data?.inviteLink,
        personalMessage: data?.personalMessage
      };

      // Send the email
      const success = await sendTelegramInvitationEmail(emailData);

      if (success) {
        // Update invitation record
        await prisma.telegramInvitation.update({
          where: { id: invitationId },
          data: {
            emailSent: true,
            emailSentAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Invitation email sent successfully'
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        );
      }
    }

    if (action === 'send_bulk_invitation_emails') {
      // Send invitation emails for multiple invitations
      if (!invitationIds || !Array.isArray(invitationIds)) {
        return NextResponse.json(
          { error: 'Invitation IDs array is required' },
          { status: 400 }
        );
      }

      const invitations = await prisma.telegramInvitation.findMany({
        where: { id: { in: invitationIds } },
        include: {
          user: {
            select: {
              email: true,
              displayName: true,
              telegramUsername: true
            }
          }
        }
      });

      const emailPromises = invitations.map(async (invitation) => {
        const emailData = {
          user: {
            displayName: invitation.user.displayName,
            email: invitation.user.email,
            telegramUsername: invitation.user.telegramUsername
          },
          invitation: {
            id: invitation.id,
            groupType: invitation.groupType,
            groupName: invitation.groupName,
            inviteToken: invitation.inviteToken || '',
            expiresAt: invitation.expiresAt
          },
          inviteLink: data?.inviteLinks?.[invitation.id],
          personalMessage: data?.personalMessage
        };

        try {
          const success = await sendTelegramInvitationEmail(emailData);
          
          if (success) {
            await prisma.telegramInvitation.update({
              where: { id: invitation.id },
              data: {
                emailSent: true,
                emailSentAt: new Date()
              }
            });
          }

          return { id: invitation.id, success };
        } catch (error) {
          console.error(`Failed to send email for invitation ${invitation.id}:`, error);
          return { id: invitation.id, success: false };
        }
      });

      const results = await Promise.all(emailPromises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return NextResponse.json({
        success: true,
        message: `Sent ${successful} emails successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        results: {
          total: invitations.length,
          successful,
          failed,
          details: results
        }
      });
    }

    if (action === 'send_reminder_email') {
      // Send reminder email for a single invitation
      if (!invitationId) {
        return NextResponse.json(
          { error: 'Invitation ID is required' },
          { status: 400 }
        );
      }

      const invitation = await prisma.telegramInvitation.findUnique({
        where: { id: invitationId },
        include: {
          user: {
            select: {
              email: true,
              displayName: true
            }
          }
        }
      });

      if (!invitation) {
        return NextResponse.json(
          { error: 'Invitation not found' },
          { status: 404 }
        );
      }

      const reminderData = {
        user: {
          displayName: invitation.user.displayName,
          email: invitation.user.email
        },
        invitation: {
          groupName: invitation.groupName,
          expiresAt: invitation.expiresAt
        },
        reminderCount: invitation.remindersSent + 1
      };

      const success = await sendTelegramReminderEmail(reminderData);

      if (success) {
        // Update reminder count
        await prisma.telegramInvitation.update({
          where: { id: invitationId },
          data: {
            remindersSent: invitation.remindersSent + 1,
            lastReminderAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Reminder email sent successfully'
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to send reminder email' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing email request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/telegram/send-email - Get email template preview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
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
    const template = searchParams.get('template');
    const groupType = searchParams.get('groupType') || 'premium';

    if (template === 'invitation') {
      // Return sample invitation email data for preview
      const sampleData = {
        user: {
          displayName: 'John Developer',
          email: 'john@example.com',
          telegramUsername: 'johndev123'
        },
        invitation: {
          id: 'sample-id',
          groupType,
          groupName: groupType === 'ultra' ? 'BryanLabs Ultra VIP' : 'BryanLabs Premium Users',
          inviteToken: 'sample-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        },
        inviteLink: 'https://t.me/+sample-invite-link',
        personalMessage: groupType === 'ultra' ? 'Welcome to the Ultra tier! Looking forward to working with you directly on your infrastructure challenges.' : undefined
      };

      return NextResponse.json({
        template: 'invitation',
        subject: TelegramEmailSubjects.invitation(sampleData.invitation.groupName),
        sampleData,
        emailTypes: ['html', 'text']
      });
    }

    if (template === 'reminder') {
      const sampleData = {
        user: {
          displayName: 'John Developer',
          email: 'john@example.com'
        },
        invitation: {
          groupName: groupType === 'ultra' ? 'BryanLabs Ultra VIP' : 'BryanLabs Premium Users',
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
        },
        reminderCount: 1
      };

      return NextResponse.json({
        template: 'reminder',
        subject: TelegramEmailSubjects.reminder(sampleData.invitation.groupName, sampleData.reminderCount),
        sampleData
      });
    }

    return NextResponse.json({
      availableTemplates: [
        { id: 'invitation', name: 'Telegram Invitation Email', description: 'Sent when user gets invited to Telegram group' },
        { id: 'reminder', name: 'Invitation Reminder Email', description: 'Reminder for users who haven\'t joined yet' }
      ],
      supportedGroupTypes: ['premium', 'ultra']
    });

  } catch (error) {
    console.error('Error fetching email template info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}