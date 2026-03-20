import nodemailer from 'nodemailer'
import { logger } from '../utils/logger.js'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
      port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    })
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
      })
    } catch (error) {
      logger.error('Failed to send email:', error)
      throw error
    }
  }

  // Invitation email template
  async sendInvitation(
    email: string,
    inviterName: string,
    organizationName: string,
    inviteToken: string
  ): Promise<void> {
    const inviteUrl = `${process.env.APP_URL}/accept-invite?token=${inviteToken}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You're invited to join ${organizationName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You're Invited!</h1>
              <p>Join ${organizationName} on LexiSense</p>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on LexiSense, the AI-powered Contract Lifecycle Management platform.</p>
              
              <p>With LexiSense, you'll be able to:</p>
              <ul>
                <li>📄 Create and manage contracts with AI assistance</li>
                <li>🔍 Analyze contract risks and compliance</li>
                <li>📊 Track contract performance and analytics</li>
                <li>🤝 Collaborate with your team seamlessly</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>
              
              <p><small>This invitation will expire in 7 days. If you can't click the button, copy and paste this link into your browser:</small></p>
              <p><small><a href="${inviteUrl}">${inviteUrl}</a></small></p>
            </div>
            <div class="footer">
              <p>© 2024 LexiSense Inc. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      You're invited to join ${organizationName} on LexiSense!
      
      ${inviterName} has invited you to join their organization on LexiSense, the AI-powered Contract Lifecycle Management platform.
      
      Accept your invitation: ${inviteUrl}
      
      This invitation will expire in 7 days.
      
      © 2024 LexiSense Inc.
    `

    await this.sendEmail({
      to: email,
      subject: `You're invited to join ${organizationName} on LexiSense`,
      html,
      text,
    })
  }

  // Welcome email template
  async sendWelcome(
    email: string,
    name: string,
    organizationName: string
  ): Promise<void> {
    const dashboardUrl = `${process.env.APP_URL}/dashboard`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to LexiSense!</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Welcome to LexiSense!</h1>
              <p>Your AI-powered contract management journey begins now</p>
            </div>
            <div class="content">
              <p>Hi ${name}!</p>
              <p>Welcome to <strong>${organizationName}</strong> on LexiSense! We're excited to help you transform how you manage contracts.</p>
              
              <div class="feature">
                <h3>🤖 AI Contract Drafting</h3>
                <p>Create professional contracts in minutes with our AI assistant</p>
              </div>
              
              <div class="feature">
                <h3>📊 Smart Analytics</h3>
                <p>Get insights into your contract portfolio and identify opportunities</p>
              </div>
              
              <div class="feature">
                <h3>🔒 Enterprise Security</h3>
                <p>Your contracts are protected with bank-level security</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Upload your first contract or create one with AI</li>
                <li>Explore the analytics dashboard</li>
                <li>Invite team members to collaborate</li>
              </ol>
              
              <p>Need help? Reply to this email or check our documentation.</p>
            </div>
            <div class="footer">
              <p>© 2024 LexiSense Inc. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      Welcome to LexiSense, ${name}!
      
      You've successfully joined ${organizationName} on LexiSense, the AI-powered Contract Lifecycle Management platform.
      
      Get started: ${dashboardUrl}
      
      Next Steps:
      1. Upload your first contract or create one with AI
      2. Explore the analytics dashboard
      3. Invite team members to collaborate
      
      Need help? Reply to this email or check our documentation.
      
      © 2024 LexiSense Inc.
    `

    await this.sendEmail({
      to: email,
      subject: 'Welcome to LexiSense! 🚀',
      html,
      text,
    })
  }
}

export const emailService = new EmailService()
