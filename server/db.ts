import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import ws from 'ws'
import * as schema from '@shared/schema'

neonConfig.webSocketConstructor = ws

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database?'
  )
}

// Validate DATABASE_URL to prevent SSRF
const databaseUrl = process.env.DATABASE_URL
if (
  !databaseUrl.startsWith('postgresql://') &&
  !databaseUrl.startsWith('postgres://')
) {
  throw new Error(
    'Invalid DATABASE_URL: Only PostgreSQL connections are allowed'
  )
}

export const pool = new Pool({ connectionString: databaseUrl })
export const db = drizzle({ client: pool, schema })
