import {
  type User,
  type InsertUser,
  type Contract,
  type InsertContract,
  contracts,
} from '@shared/schema'
import { eq, desc } from 'drizzle-orm'

async function getDb() {
  // dynamic import to avoid throwing on initial load if DATABASE_URL isn't set
  const mod = await import('./db')
  return mod.db
}

export class DbStorage {
  async getUser(id: string): Promise<User | undefined> {
    return undefined
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error('Not implemented')
  }

  async getAllContracts(): Promise<Contract[]> {
    const db = await getDb()
    return await db.select().from(contracts).orderBy(desc(contracts.createdAt))
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const db = await getDb()
    const results = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id))
    return results[0]
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const db = await getDb()
    const results = await db.insert(contracts).values(contract).returning()
    return results[0]
  }

  async updateContract(
    id: string,
    contract: Partial<InsertContract>
  ): Promise<Contract | undefined> {
    const db = await getDb()
    const results = await db
      .update(contracts)
      .set({ ...contract, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning()
    return results[0]
  }

  async deleteContract(id: string): Promise<boolean> {
    const db = await getDb()
    const results = await db
      .delete(contracts)
      .where(eq(contracts.id, id))
      .returning()
    return results.length > 0
  }
}
