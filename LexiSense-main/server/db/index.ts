import { drizzle } from 'drizzle-orm/neon-serverless'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create Neon client
const sql = neon(DATABASE_URL)

// Create Drizzle instance with schema
export const db = drizzle(sql, { schema })

// Export schema for convenience
export * from './schema'
