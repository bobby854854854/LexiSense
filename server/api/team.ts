
import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { eq, and, gt } from 'drizzle-orm'
import { db } from '../db'
import { users, invitations } from '../db/schema'
import type { UserRole } from '@shared/types'

const router = Router()

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next()
  }
  res.status(401).json({ message: 'Unauthorized' })
}

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
  const user = req.user as any
  if (user.role === 'admin') {
    return next()
  }
  res.status(403).json({ message: 'Forbidden: Admin access required' })
}

// GET /api/team/members - List all team members
router.get('/members', isAuthenticated, async (req, res, next) => {
  try {
    const user = req.user as any

    const members = await db.query.users.findMany({
      where: eq(users.organizationId, user.organizationId),
      columns: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: (users, { asc }) => [asc(users.createdAt)],
    })

    res.json(members)
  } catch (error) {
    console.error('Error fetching team members:', error)
    next(error)
  }
})

// GET /api/team/invitations - List pending invitations
router.get('/invitations', isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const user = req.user as any

    const pendingInvitations = await db.query.invitations.findMany({
      where: and(
        eq(invitations.organizationId, user.organizationId),
        gt(invitations.expiresAt, new Date())
      ),
      with: {
        creator: {
          columns: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: (invitations, { desc }) => [desc(invitations.createdAt)],
    })

    res.json(pendingInvitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    next(error)
  }
})

// POST /api/team/invite - Create a new invitation
router.post(
  '/invite',
  isAuthenticated,
  isAdmin,
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'member', 'viewer']),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = req.user as any
      const { email, role } = req.body

      // Check if email already exists in organization
      const existingUser = await db.query.users.findFirst({
        where: and(
          eq(users.email, email.toLowerCase()),
          eq(users.organizationId, user.organizationId)
        ),
      })

      if (existingUser) {
        return res.status(409).json({ 
          message: 'User with this email is already in your organization' 
        })
      }

      // Check if there's already a pending invitation
      const existingInvitation = await db.query.invitations.findFirst({
        where: and(
          eq(invitations.email, email.toLowerCase()),
          eq(invitations.organizationId, user.organizationId),
          gt(invitations.expiresAt, new Date())
        ),
      })

      if (existingInvitation) {
        return res.status(409).json({ 
          message: 'An invitation has already been sent to this email' 
        })
      }

      // Create invitation (expires in 7 days)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const [invitation] = await db
        .insert(invitations)
        .values({
          organizationId: user.organizationId,
          email: email.toLowerCase(),
          role: role as UserRole,
          expiresAt,
          createdBy: user.id,
        })
        .returning()

      // TODO: Send invitation email
      // await sendInvitationEmail(email, invitation.token)

      res.status(201).json({
        ...invitation,
        inviteUrl: `${process.env.APP_URL || 'http://localhost:5000'}/accept-invite?token=${invitation.token}`,
      })
    } catch (error) {
      console.error('Error creating invitation:', error)
      next(error)
    }
  }
)

// DELETE /api/team/invitations/:id - Cancel an invitation
router.delete(
  '/invitations/:id',
  isAuthenticated,
  isAdmin,
  param('id').isUUID(),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = req.user as any
      const { id } = req.params

      // Check if invitation exists and belongs to user's organization
      const invitation = await db.query.invitations.findFirst({
        where: and(
          eq(invitations.id, id),
          eq(invitations.organizationId, user.organizationId)
        ),
      })

      if (!invitation) {
        return res.status(404).json({ message: 'Invitation not found' })
      }

      await db.delete(invitations).where(eq(invitations.id, id))

      res.json({ message: 'Invitation cancelled successfully' })
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      next(error)
    }
  }
)

// PATCH /api/team/members/:id/role - Update member role
router.patch(
  '/members/:id/role',
  isAuthenticated,
  isAdmin,
  param('id').isUUID(),
  body('role').isIn(['admin', 'member', 'viewer']),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = req.user as any
      const { id } = req.params
      const { role } = req.body

      // Can't change your own role
      if (id === user.id) {
        return res.status(400).json({ 
          message: 'You cannot change your own role' 
        })
      }

      // Check if member exists and belongs to same organization
      const member = await db.query.users.findFirst({
        where: and(
          eq(users.id, id),
          eq(users.organizationId, user.organizationId)
        ),
      })

      if (!member) {
        return res.status(404).json({ message: 'Team member not found' })
      }

      // Update role
      const [updatedMember] = await db
        .update(users)
        .set({ role: role as UserRole })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })

      res.json(updatedMember)
    } catch (error) {
      console.error('Error updating member role:', error)
      next(error)
    }
  }
)

// DELETE /api/team/members/:id - Remove team member
router.delete(
  '/members/:id',
  isAuthenticated,
  isAdmin,
  param('id').isUUID(),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = req.user as any
      const { id } = req.params

      // Can't remove yourself
      if (id === user.id) {
        return res.status(400).json({ 
          message: 'You cannot remove yourself from the team' 
        })
      }

      // Check if member exists and belongs to same organization
      const member = await db.query.users.findFirst({
        where: and(
          eq(users.id, id),
          eq(users.organizationId, user.organizationId)
        ),
      })

      if (!member) {
        return res.status(404).json({ message: 'Team member not found' })
      }

      // Check if this is the last admin
      if (member.role === 'admin') {
        const adminCount = await db.query.users.findMany({
          where: and(
            eq(users.organizationId, user.organizationId),
            eq(users.role, 'admin')
          ),
        })

        if (adminCount.length <= 1) {
          return res.status(400).json({ 
            message: 'Cannot remove the last admin. Promote another member to admin first.' 
          })
        }
      }

      await db.delete(users).where(eq(users.id, id))

      res.json({ message: 'Team member removed successfully' })
    } catch (error) {
      console.error('Error removing team member:', error)
      next(error)
    }
  }
)

export { router as teamRouter }