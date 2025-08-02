/**
 * Email notification utilities for Telegram community invitations
 * Handles sending invitation emails, reminders, and status updates
 */

interface TelegramInvitationEmailData {
  user: {
    displayName?: string;
    email: string;
    telegramUsername?: string;
  };
  invitation: {
    id: string;
    groupType: string;
    groupName: string;
    inviteToken: string;
    expiresAt?: Date;
  };
  inviteLink?: string;
  personalMessage?: string;
}

interface TelegramReminderEmailData {
  user: {
    displayName?: string;
    email: string;
  };
  invitation: {
    groupName: string;
    expiresAt?: Date;
  };
  reminderCount: number;
}

/**
 * Generate HTML email template for Telegram group invitation
 */
export function generateTelegramInvitationEmail(data: TelegramInvitationEmailData): string {
  const { user, invitation, inviteLink, personalMessage } = data;
  const userName = user.displayName || user.email.split('@')[0];
  const expirationDate = invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : null;
  
  const groupDescriptions = {
    premium: {
      description: 'Connect with other premium users, get priority support, and access exclusive blockchain infrastructure content.',
      benefits: [
        'Direct access to BryanLabs support team',
        'Priority assistance with node setup and troubleshooting',
        'Exclusive tips and best practices from experienced operators',
        'Early access to new features and snapshot optimizations',
        'Network with other professional blockchain developers'
      ]
    },
    ultra: {
      description: 'Join an exclusive group with direct access to Dan, the founder, for personalized infrastructure consulting.',
      benefits: [
        'Direct conversations with Dan (@danbryan80)',
        'Personalized infrastructure consulting and advice',
        'Priority feature requests and custom solutions',
        'Phone support access for urgent issues',
        'Private networking with other Ultra-tier users',
        'First access to experimental features and tools'
      ]
    }
  };

  const groupInfo = groupDescriptions[invitation.groupType as keyof typeof groupDescriptions];
  const isUltra = invitation.groupType === 'ultra';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${invitation.groupName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 0; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .welcome-message { background-color: #f8f9fa; border-left: 4px solid ${isUltra ? '#8b5cf6' : '#3b82f6'}; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0; }
        .benefits { background-color: #f0f9ff; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .benefits h3 { color: ${isUltra ? '#7c3aed' : '#1d4ed8'}; margin-top: 0; }
        .benefits ul { padding-left: 20px; margin: 15px 0; }
        .benefits li { margin: 8px 0; color: #4b5563; }
        .cta-section { text-align: center; margin: 40px 0; padding: 30px; background: linear-gradient(135deg, ${isUltra ? '#8b5cf6' : '#3b82f6'} 0%, ${isUltra ? '#7c3aed' : '#1e40af'} 100%); border-radius: 12px; }
        .cta-button { display: inline-block; background-color: white; color: ${isUltra ? '#7c3aed' : '#1d4ed8'}; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 0; }
        .instructions { background-color: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .instructions h4 { color: #92400e; margin-top: 0; }
        .instructions ol { padding-left: 20px; }
        .instructions li { margin: 8px 0; color: #78350f; }
        .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
        .expiration-notice { background-color: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .personal-message { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0ea5e9; }
        .support-info { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; }
        @media (max-width: 600px) {
            .container { margin: 0; }
            .header, .content { padding: 30px 20px; }
            .cta-section { padding: 25px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to ${invitation.groupName}!</h1>
            <p>Your exclusive Telegram community access is ready</p>
        </div>

        <div class="content">
            <div class="welcome-message">
                <h3>Hi ${userName}! 👋</h3>
                <p>Congratulations on joining the ${invitation.groupType.toUpperCase()} tier! You now have access to our exclusive Telegram community where you can:</p>
            </div>

            <div class="benefits">
                <h3>${isUltra ? '👑' : '⚡'} Your ${invitation.groupType.charAt(0).toUpperCase() + invitation.groupType.slice(1)} Benefits</h3>
                <p>${groupInfo?.description}</p>
                <ul>
                    ${groupInfo?.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                </ul>
            </div>

            ${personalMessage ? `
            <div class="personal-message">
                <h4>Personal Message from Dan:</h4>
                <p style="font-style: italic;">"${personalMessage}"</p>
            </div>
            ` : ''}

            <div class="cta-section" style="color: white;">
                <h3 style="color: white; margin-top: 0;">Ready to Join?</h3>
                <p style="color: rgba(255,255,255,0.9); margin-bottom: 25px;">Click the button below to join ${invitation.groupName}</p>
                ${inviteLink ? `
                    <a href="${inviteLink}" class="cta-button" style="color: ${isUltra ? '#7c3aed' : '#1d4ed8'};">
                        Join ${invitation.groupName} →
                    </a>
                ` : `
                    <div style="background-color: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="color: white; margin: 0; font-size: 14px;">
                            💬 Your invitation is being processed. You'll receive the group link within 24 hours.
                        </p>
                    </div>
                `}
            </div>

            <div class="instructions">
                <h4>📱 How to Join:</h4>
                <ol>
                    <li>Make sure you have Telegram installed on your device</li>
                    <li>Click the invitation link ${inviteLink ? 'above' : 'when you receive it'}</li>
                    <li>Introduce yourself with your Telegram username: <strong>${user.telegramUsername ? `@${user.telegramUsername}` : 'Please add your username in account settings'}</strong></li>
                    <li>Start connecting with the community!</li>
                </ol>
                <p><strong>Don't have Telegram?</strong> Download it from <a href="https://telegram.org/">telegram.org</a> (it's free!)</p>
            </div>

            ${expirationDate ? `
            <div class="expiration-notice">
                <p><strong>⏰ Note:</strong> This invitation expires on ${expirationDate}. Join soon to secure your spot!</p>
            </div>
            ` : ''}

            <div class="support-info">
                <h4>Need Help?</h4>
                <p>If you have any questions about joining the Telegram group or accessing your ${invitation.groupType} benefits:</p>
                <ul>
                    <li>📧 Email us at: support@bryanlabs.net</li>
                    <li>🔗 Visit your account: <a href="${process.env.NEXTAUTH_URL || 'https://snapshots.bryanlabs.net'}/account">Account Settings</a></li>
                    ${isUltra ? '<li>📞 Ultra users: Use your phone support access</li>' : ''}
                </ul>
            </div>
        </div>

        <div class="footer">
            <p><strong>BryanLabs</strong> - Professional Blockchain Infrastructure</p>
            <p>© 2025 BryanLabs. All rights reserved.</p>
            <p style="font-size: 12px; margin-top: 15px;">
                You're receiving this email because you upgraded to ${invitation.groupType.toUpperCase()} tier.
                <br>
                Questions? Reply to this email or contact support@bryanlabs.net
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of Telegram invitation email
 */
export function generateTelegramInvitationTextEmail(data: TelegramInvitationEmailData): string {
  const { user, invitation, inviteLink, personalMessage } = data;
  const userName = user.displayName || user.email.split('@')[0];
  const expirationDate = invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : null;
  const isUltra = invitation.groupType === 'ultra';

  return `
🎉 Welcome to ${invitation.groupName}!

Hi ${userName}! 👋

Congratulations on joining the ${invitation.groupType.toUpperCase()} tier! You now have access to our exclusive Telegram community.

${isUltra ? '👑' : '⚡'} Your ${invitation.groupType.charAt(0).toUpperCase() + invitation.groupType.slice(1)} Benefits:

${isUltra ? `
• Direct conversations with Dan (@danbryan80)
• Personalized infrastructure consulting and advice
• Priority feature requests and custom solutions
• Phone support access for urgent issues
• Private networking with other Ultra-tier users
• First access to experimental features and tools
` : `
• Direct access to BryanLabs support team
• Priority assistance with node setup and troubleshooting
• Exclusive tips and best practices from experienced operators
• Early access to new features and snapshot optimizations
• Network with other professional blockchain developers
`}

${personalMessage ? `
Personal Message from Dan:
"${personalMessage}"

` : ''}

${inviteLink ? `
📱 JOIN NOW: ${inviteLink}

` : `
💬 Your invitation is being processed. You'll receive the group link within 24 hours.

`}

How to Join:
1. Make sure you have Telegram installed on your device
2. Click the invitation link ${inviteLink ? 'above' : 'when you receive it'}
3. Introduce yourself with your Telegram username: ${user.telegramUsername ? `@${user.telegramUsername}` : 'Please add your username in account settings'}
4. Start connecting with the community!

Don't have Telegram? Download it from https://telegram.org/ (it's free!)

${expirationDate ? `
⏰ Note: This invitation expires on ${expirationDate}. Join soon to secure your spot!

` : ''}

Need Help?
📧 Email: support@bryanlabs.net
🔗 Account: ${process.env.NEXTAUTH_URL || 'https://snapshots.bryanlabs.net'}/account
${isUltra ? '📞 Ultra users: Use your phone support access' : ''}

---
BryanLabs - Professional Blockchain Infrastructure
© 2025 BryanLabs. All rights reserved.

You're receiving this email because you upgraded to ${invitation.groupType.toUpperCase()} tier.
Questions? Reply to this email or contact support@bryanlabs.net
  `.trim();
}

/**
 * Generate reminder email for pending Telegram invitations
 */
export function generateTelegramReminderEmail(data: TelegramReminderEmailData): string {
  const { user, invitation, reminderCount } = data;
  const userName = user.displayName || user.email.split('@')[0];
  const expirationDate = invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reminder: Join ${invitation.groupName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 0; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .reminder-box { background-color: #fef3c7; border: 2px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 15px 0; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Don't Miss Out!</h1>
            <p>Your ${invitation.groupName} invitation is waiting</p>
        </div>

        <div class="content">
            <p>Hi ${userName},</p>
            
            <div class="reminder-box">
                <h3 style="color: #92400e; margin-top: 0;">🔔 Reminder #${reminderCount}</h3>
                <p style="color: #78350f;">You haven't joined <strong>${invitation.groupName}</strong> yet!</p>
                ${expirationDate ? `<p style="color: #dc2626; font-weight: 600;">This invitation expires on ${expirationDate}</p>` : ''}
            </div>

            <p>You're missing out on:</p>
            <ul>
                <li>Direct support from the BryanLabs team</li>
                <li>Networking with other blockchain professionals</li>
                <li>Exclusive tips and best practices</li>
                <li>Early access to new features</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'https://snapshots.bryanlabs.net'}/account" class="cta-button">
                    Check Your Invitation Status →
                </a>
            </div>

            <p><strong>Need help?</strong> Contact us at support@bryanlabs.net</p>
        </div>

        <div class="footer">
            <p>BryanLabs - Professional Blockchain Infrastructure</p>
            <p style="font-size: 12px;">To stop receiving reminders, contact support@bryanlabs.net</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Email subject line generators
 */
export const TelegramEmailSubjects = {
  invitation: (groupName: string) => `🎉 Welcome to ${groupName} - Your Telegram Community Access`,
  reminder: (groupName: string, reminderCount: number) => `⏰ Reminder #${reminderCount}: Join ${groupName}`,
  expired: (groupName: string) => `⚠️ Your ${groupName} invitation has expired`,
  joined: (groupName: string) => `✅ Welcome to ${groupName}! You're now connected`
};

/**
 * Email sending function (to be implemented with your email service)
 */
export async function sendTelegramInvitationEmail(
  data: TelegramInvitationEmailData,
  options: {
    sendMethod: 'html' | 'text' | 'both';
    fromEmail?: string;
    fromName?: string;
  } = { sendMethod: 'both' }
): Promise<boolean> {
  const { sendMethod, fromEmail = 'noreply@bryanlabs.net', fromName = 'BryanLabs Community' } = options;
  
  const subject = TelegramEmailSubjects.invitation(data.invitation.groupName);
  const htmlContent = generateTelegramInvitationEmail(data);
  const textContent = generateTelegramInvitationTextEmail(data);

  // TODO: Implement actual email sending logic here
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  console.log('Sending Telegram invitation email:', {
    to: data.user.email,
    subject,
    htmlContent: sendMethod === 'text' ? null : htmlContent,
    textContent: sendMethod === 'html' ? null : textContent
  });

  // For now, return true to simulate successful sending
  return true;
}

/**
 * Send reminder email for pending invitation
 */
export async function sendTelegramReminderEmail(data: TelegramReminderEmailData): Promise<boolean> {
  const subject = TelegramEmailSubjects.reminder(data.invitation.groupName, data.reminderCount);
  const htmlContent = generateTelegramReminderEmail(data);

  // TODO: Implement actual email sending logic
  console.log('Sending Telegram reminder email:', {
    to: data.user.email,
    subject,
    htmlContent
  });

  return true;
}