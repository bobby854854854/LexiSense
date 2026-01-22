import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { relations } from 'drizzle-orm'
import { z } from 'zod'

// --- Enums ---
export const userRoleEnum = pgEnum('user_role', ['admin', 'member'])
export const contractStatusEnum = pgEnum('contract_status', [
  'active',
  'archived',
  'processing',
  'failed',
  'expired',
  'draft',
  'expiring',
])

// --- Tables ---

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: varchar('email', { length: 256 }).unique().notNull(),
  passwordHash: text('password_hash'),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  role: userRoleEnum('role').default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const userSessions = pgTable('user_sessions', {
  sid: varchar('sid').primaryKey(),
  sess: text('sess').notNull(),
  expire: timestamp('expire').notNull(),
})

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 512 }).notNull(),
  status: contractStatusEnum('status').default('processing').notNull(),
  storageKey: varchar('storage_key', { length: 1024 }).notNull(),
  analysisResults: jsonb('analysis_results'),
  analysisError: text('analysis_error'),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  uploadedByUserId: uuid('uploaded_by_user_id')
    .references(() => users.id, { onDelete: 'set null' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  contractType: varchar('contract_type'),
  title: varchar('title'),
  counterparty: varchar('counterparty'),
  riskLevel: varchar('risk_level'),
  value: varchar('value'),
  effectiveDate: timestamp('effective_date'),
  expiryDate: timestamp('expiry_date'),
})

// --- Relations ---

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}))

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  contracts: many(contracts),
}))

export const contractsRelations = relations(contracts, ({ one }) => ({
  organization: one(organizations, {
    fields: [contracts.organizationId],
    references: [organizations.id],
  }),
  uploadedByUser: one(users, {
    fields: [contracts.uploadedByUserId],
    references: [users.id],
  }),
}))

// --- Zod Schemas for Validation ---
export const insertContractSchema = createInsertSchema(contracts)
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email({ message: 'Invalid email address.' }),
})

export type Contract = typeof contracts.$inferSelect
export type AIInsight = {}