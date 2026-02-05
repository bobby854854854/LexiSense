import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'
import * as schema from './db/schema'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set')
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/lexisense' 
})

export const db = drizzle({
  client: pool,
  schema,
})

export { pool }
