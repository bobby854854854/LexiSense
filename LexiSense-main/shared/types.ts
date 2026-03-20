import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import { users, contracts as contractsTable } from './schema'

// --- Auth ---
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email({ message: 'Invalid email address.' }),
  passwordHash: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' }),
})
export const loginUserSchema = insertUserSchema.pick({
  email: true,
  passwordHash: true,
})
export type User = typeof users.$inferSelect
export type AuthenticatedUser = Omit<User, 'passwordHash'>
export type UserRole = 'admin' | 'member' | 'viewer'

// --- Team ---
export interface TeamMember {
  id: string
  email: string
  role: UserRole
  createdAt: Date
}

export interface InvitationWithCreator {
  id: string
  email: string
  role: UserRole
  expiresAt: Date
  inviteUrl?: string
  creator: {
    email: string
  }
}

// --- Contracts ---
export type Contract = typeof contractsTable.$inferSelect

export const analysisResultsSchema = z.object({
  summary: z.string(),
  parties: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
    })
  ),
  keyDates: z.object({
    effectiveDate: z.string(),
    terminationDate: z.string(),
    renewalTerms: z.string(),
  }),
  highLevelRisks: z.array(z.string()),
})

export type AnalysisResults = z.infer<typeof analysisResultsSchema>
