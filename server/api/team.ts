import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { db } from '../db';
import { users, invitations } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { isAuthenticated, isAdmin } from '../middleware/auth';  // Or wherever your auth middleware is
import type { User, Invitation, UserRole } from '@shared/types';

// Email transporter setup (global or in a separate service file)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,  // Use true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper to send invite email
async function sendInviteEmail(email: string, token: string) {
  const inviteUrl = `\( {process.env.APP_URL}/accept-invite?token= \){token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Invitation to Join LexiSense',
    html: `
      <p>You've been invited to join LexiSense!</p>
      <p>Click <a href="${inviteUrl}">here</a> to accept the invitation and set up your account.</p>
      <p>This link expires in 7 days.</p>
      <p>If you didn't expect this, please ignore it.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invite email sent to ${email}`);
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send invite email.');
  }
}

const router = Router();

// ... (Other routes like GET /, PUT /:id/role, DELETE /:id remain unchanged)

// POST /api/team/invite - Invite a new member (admins only)
router.post(
  '/invite',
  isAuthenticated,
  isAdmin,
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'member', 'viewer'] as UserRole[]),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user = req.user as User;
    const { email, role } = req.body;

    try {
      // Check if email already in org
      const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (existing) return res.status(409).json({ message: 'User already in organization.' });

      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // 7 days

      const [invitation] = await db.insert(invitations).values({
        organizationId: user.organizationId,
        email,
        role,
        token,
        expiresAt,
        createdBy: user.id,
      }).returning();

      // Send email
      await sendInviteEmail(email, token);

      res.status(201).json(invitation);
    } catch (error) {
      next(error);
    }
  },
);

export { router as teamRouter };