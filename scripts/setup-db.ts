import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from '../shared/schema';

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  try {
    console.log('Setting up database...');
    
    // Run migrations if they exist
    try {
      await migrate(db, { migrationsFolder: './migrations' });
      console.log('✅ Migrations completed');
    } catch (error) {
      console.log('No migrations found, creating tables directly...');
      
      // Create tables directly from schema
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          role TEXT NOT NULL DEFAULT 'user',
          is_active TEXT NOT NULL DEFAULT 'true',
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS contracts (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          counterparty TEXT NOT NULL,
          contract_type TEXT NOT NULL,
          status TEXT NOT NULL,
          value TEXT,
          effective_date TEXT,
          expiry_date TEXT,
          risk_level TEXT,
          original_text TEXT,
          ai_insights JSONB,
          user_id VARCHAR REFERENCES users(id),
          tags JSONB DEFAULT '[]',
          is_template TEXT NOT NULL DEFAULT 'false',
          template_category TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);

      console.log('✅ Tables created successfully');
    }

    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();