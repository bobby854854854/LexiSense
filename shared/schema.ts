import { sql } from 'drizzle-orm'
import {
  pgTable,
  text,
  varchar,
  timestamp,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

export const users = pgTable('users', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').notNull().default('user'),
  isActive: text('is_active').notNull().default('true'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
})

export const loginUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
})

export type InsertUser = z.infer<typeof insertUserSchema>
export type User = typeof users.$inferSelect

export const contracts = pgTable('contracts', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
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
  userId: varchar('user_id').references(() => users.id),
  tags: jsonb('tags').default([]),
  isTemplate: text('is_template').notNull().default('false'),
  templateCategory: text('template_category'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type InsertContract = z.infer<typeof insertContractSchema>
export type Contract = typeof contracts.$inferSelect

export interface AIInsight {
  type: 'key-term' | 'obligation' | 'risk' | 'opportunity'
  title: string
  content: string
  severity?: 'low' | 'medium' | 'high'
}
