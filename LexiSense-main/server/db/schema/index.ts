import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Organizations Table
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Users Table
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    hashedPassword: text('hashed_password'),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').notNull().$type<'admin' | 'member' | 'viewer'>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    orgIdx: index('users_organization_idx').on(table.organizationId),
  })
)

// Contracts Table
export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    uploadedBy: uuid('uploaded_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    originalName: text('original_name').notNull(),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    extractedText: text('extracted_text'),
    aiAnalysis: jsonb('ai_analysis').$type<{
      summary: string
      parties: Array<{ name: string; role: string }>
      dates: Array<{ name: string; date: string }>
      risks: Array<{ level: 'high' | 'medium' | 'low'; description: string }>
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('contracts_organization_idx').on(table.organizationId),
    uploadedByIdx: index('contracts_uploaded_by_idx').on(table.uploadedBy),
    createdAtIdx: index('contracts_created_at_idx').on(table.createdAt),
  })
)

// Invitations Table
export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    email: text('email').notNull(),
    role: text('role').notNull().$type<'admin' | 'member' | 'viewer'>(),
    token: uuid('token').defaultRandom().unique().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdBy: uuid('created_by')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: index('invitations_token_idx').on(table.token),
    emailIdx: index('invitations_email_idx').on(table.email),
    expiresAtIdx: index('invitations_expires_at_idx').on(table.expiresAt),
  })
)

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  contracts: many(contracts),
  invitations: many(invitations),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  uploadedContracts: many(contracts),
  createdInvitations: many(invitations),
}))

export const contractsRelations = relations(contracts, ({ one }) => ({
  organization: one(organizations, {
    fields: [contracts.organizationId],
    references: [organizations.id],
  }),
  uploader: one(users, {
    fields: [contracts.uploadedBy],
    references: [users.id],
  }),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [invitations.createdBy],
    references: [users.id],
  }),
}))

// Type exports
export type Organization = typeof organizations.$inferSelect
export type InsertOrganization = typeof organizations.$inferInsert
export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
export type Contract = typeof contracts.$inferSelect
export type InsertContract = typeof contracts.$inferInsert
export type Invitation = typeof invitations.$inferSelect
export type InsertInvitation = typeof invitations.$inferInsert
