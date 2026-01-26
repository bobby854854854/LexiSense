import { pgTable, text, timestamp, varchar, jsonb, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().default('gen_random_uuid()'),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').notNull().default('user'),
  isActive: text('is_active').notNull().default('true'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().default(new Date()),
  updatedAt: timestamp('updated_at').notNull().default(new Date()),
})

export const contracts = pgTable('contracts', {
  id: varchar('id', { length: 36 }).primaryKey().default('gen_random_uuid()'),
  title: text('title').notNull(),
  counterparty: text('counterparty').notNull(),
  contractType: text('contract_type').notNull(),
  status: text('status').notNull(),
  value: text('value'),
  effectiveDate: text('effective_date'),
  expiryDate: text('expiry_date'),
  riskLevel: text('risk_level'),
  originalText: text('original_text'),
  aiInsights: jsonb('ai_insights'),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  tags: jsonb('tags').default([]),
  isTemplate: text('is_template').notNull().default('false'),
  templateCategory: text('template_category'),
  createdAt: timestamp('created_at').notNull().default(new Date()),
  updatedAt: timestamp('updated_at').notNull().default(new Date()),
})
