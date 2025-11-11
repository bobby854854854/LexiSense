
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { migrate } from 'drizzle-orm/neon-serverless/migrator'
import { neon } from '@neondatabase/serverless'

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

async function runMigration() {
  console.log('⏳ Running migrations...')

  const sql = neon(DATABASE_URL)
  const db = drizzle(sql)

  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('✅ Migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()