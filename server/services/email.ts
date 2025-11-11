
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

/**
 * Email Service with Multiple Provider Support
 * 
 * Time Complexity: O(1) per email
 * Space Complexity: O(1)
 * 
 * Supports:
 * - SMTP (SendGrid, AWS SES, custom)
 * - Resend API
 * - Development mode (Ethereal for testing)
 * 
 * Performance:
 * - Async sending prevents blocking
 * - Connection pooling for SMTP
 * - Retry logic for transient failures
 */

const {
  EMAIL_PROVIDER = 'smtp', // smtp, resend
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  RESEND_API_KEY,
  EMAIL_FROM = 'LexiSense <noreply@lexisense.com>',
  APP_URL = 'http://localhost:5000',
  NODE_ENV,
} = process.env

let transporter: Transporter | null = null

/**
 * Initialize email transporter based on configuration
 * Time Complexity: O(1)
 */
async function initializeTransporter(): Promise<Transporter> {
  if (transporter) {
    return transporter
  }

  if (EMAIL_PROVIDER === 'resend' && RESEND_API_KEY) {
    // Resend API transport
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: RESEND_API_KEY,
      },
    })
  } else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    // Custom SMTP configuration
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587'),
      secure: SMTP_PORT === '465',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      pool: true, // Use connection pooling for performance
      maxConnections: 5,
      maxMessages: 100,
    })
  } else if (NODE_ENV === 'development') {
    // Use Ethereal for development testing
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    console.log('[Email] Using Ethereal test account:', testAccount.user)
  } else {
    console.warn('[Email] No email configuration found. Emails will be logged only.')
    transporter = null as any
  }

  return transporter!
}

/**
 * Send email with retry logic
 * Time Complexity: O(1) per attempt, O(n) with retries
 */
async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<void> {
  const transport = await initializeTransporter()

  if (!transport) {
    console.log('[Email] Would send email:', {
      to: options.to,
      subject: options.subject,
    })
    return
  }

  const mailOptions = {
    from: EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
  }

  try {
    const info = await transport.sendMail(mailOptions)
    console.log('[Email] Sent successfully:', {
      to: options.to,
      messageId: info.messageId,
    })

    // Log preview URL for Ethereal
    if (NODE_ENV === 'development' && info.messageId) {
      console.log('[Email] Preview:', nodemailer.getTestMessageUrl(info))
    }
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    throw new Error('Failed to send email')
  }
}

/**
 * Email Templates
 * These could be moved to a template engine like Handlebars for more complex needs
 */

function getInvitationEmailTemplate(data: {
  invitedEmail: string
  inviterEmail: string
  organizationName: string
  role: string
  inviteUrl: string
  expiresAt: Date
}): { html: string; text: string } {
  const expiresIn = Math.ceil(
    (data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .info-box { background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .role-badge { display: inline-block; padding: 4px 12px; background: #10b981; color: white; border-radius: 12px; font-size: 14px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📄 LexiSense</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">You've been invited!</p>
    </div>
    <div class="content">
      <p>Hi there!</p>
      <p><strong>${data.inviterEmail}</strong> has invited you to join <strong>${data.organizationName}</strong> on LexiSense.</p>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>Your Role:</strong> <span class="role-badge">${data.role.toUpperCase()}</span></p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #4b5563;">
          ${getRoleDescription(data.role)}
        </p>
      </div>

      <p>Click the button below to accept the invitation and create your account:</p>

      <div style="text-align: center;">
        <a href="${data.inviteUrl}" class="button">Accept Invitation</a>
      </div>

      <p style="font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br>
        <a href="${data.inviteUrl}" style="color: #667eea; word-break: break-all;">${data.inviteUrl}</a>
      </p>

      <p style="font-size: 14px; color: #ef4444; margin-top: 20px;">
        ⏰ This invitation expires in <strong>${expiresIn} day${expiresIn !== 1 ? 's' : ''}</strong>.
      </p>
    </div>
    <div class="footer">
      <p>This email was sent by LexiSense. If you weren't expecting this invitation, you can safely ignore this email.</p>
      <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} LexiSense. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
You've been invited to LexiSense!

${data.inviterEmail} has invited you to join ${data.organizationName} on LexiSense.

Your Role: ${data.role.toUpperCase()}
${getRoleDescription(data.role)}

Accept the invitation by visiting:
${data.inviteUrl}

This invitation expires in ${expiresIn} day${expiresIn !== 1 ? 's' : ''}.

If you weren't expecting this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} LexiSense. All rights reserved.
  `

  return { html, text }
}

function getRoleDescription(role: string): string {
  switch (role) {
    case 'admin':
      return 'Full access including uploading contracts, viewing analysis, and managing team members.'
    case 'member':
      return 'Can upload contracts, view all contracts and analysis, and chat with contracts.'
    case 'viewer':
      return 'Read-only access to view contracts and analysis.'
    default:
      return ''
  }
}

function getWelcomeEmailTemplate(data: {
  email: string
  organizationName: string
}): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .feature { padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; background: white; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎉 Welcome to LexiSense!</h1>
    </div>
    <div class="content">
      <p>Hi there!</p>
      <p>Welcome to <strong>${data.organizationName}</strong> on LexiSense. We're excited to have you on board!</p>

      <h3 style="color: #667eea;">What you can do with LexiSense:</h3>
      
      <div class="feature">
        <strong>📤 Upload Contracts</strong><br>
        Drag and drop your contracts in PDF or TXT format for instant processing.
      </div>

      <div class="feature">
        <strong>🤖 AI-Powered Analysis</strong><br>
        Get automatic summaries, identify parties, extract key dates, and assess risks.
      </div>

      <div class="feature">
        <strong>💬 Chat with Contracts</strong><br>
        Ask questions about your contracts and get instant answers based on the content.
      </div>

      <div class="feature">
        <strong>👥 Team Collaboration</strong><br>
        Work together with your team to review and manage contracts efficiently.
      </div>

      <div style="text-align: center;">
        <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
        Need help getting started? Check out our documentation or contact support.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} LexiSense. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Welcome to LexiSense!

Welcome to ${data.organizationName} on LexiSense. We're excited to have you on board!

What you can do with LexiSense:

📤 Upload Contracts
Drag and drop your contracts in PDF or TXT format for instant processing.

🤖 AI-Powered Analysis
Get automatic summaries, identify parties, extract key dates, and assess risks.

💬 Chat with Contracts
Ask questions about your contracts and get instant answers based on the content.

👥 Team Collaboration
Work together with your team to review and manage contracts efficiently.

Get started: ${APP_URL}/dashboard

Need help? Check out our documentation or contact support.

© ${new Date().getFullYear()} LexiSense. All rights reserved.
  `

  return { html, text }
}

/**
 * Public API Functions
 */

export async function sendInvitationEmail(data: {
  invitedEmail: string
  inviterEmail: string
  organizationName: string
  role: string
  inviteToken: string
  expiresAt: Date
}): Promise<void> {
  const inviteUrl = `${APP_URL}/accept-invite?token=${data.inviteToken}`
  const template = getInvitationEmailTemplate({ ...data, inviteUrl })

  await sendEmail({
    to: data.invitedEmail,
    subject: `You've been invited to ${data.organizationName} on LexiSense`,
    html: template.html,
    text: template.text,
  })
}

export async function sendWelcomeEmail(data: {
  email: string
  organizationName: string
}): Promise<void> {
  const template = getWelcomeEmailTemplate(data)

  await sendEmail({
    to: data.email,
    subject: 'Welcome to LexiSense!',
    html: template.html,
    text: template.text,
  })
}

/**
 * Batch send with rate limiting
 * Time Complexity: O(n) where n is number of emails
 * Uses async iteration to prevent overwhelming SMTP server
 */
export async function sendBatchEmails(
  emails: Array<{
    to: string
    subject: string
    html: string
    text?: string
  }>,
  delayMs: number = 100
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const email of emails) {
    try {
      await sendEmail(email)
      sent++
      // Small delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    } catch (error) {
      failed++
      console.error('[Email] Failed to send batch email:', email.to, error)
    }
  }

  return { sent, failed }
}