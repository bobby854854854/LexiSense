import {
  type User,
  type InsertUser,
  type Contract,
  type InsertContract,
} from '@shared/schema'
import { eq, desc } from 'drizzle-orm'

export interface IStorage {
  getUser(id: string): Promise<User | undefined>
  getUserByUsername(username: string): Promise<User | undefined>
  createUser(user: InsertUser): Promise<User>

  getAllContracts(): Promise<Contract[]>
  getContract(id: string): Promise<Contract | undefined>
  createContract(contract: InsertContract): Promise<Contract>
  updateContract(
    id: string,
    contract: Partial<InsertContract>
  ): Promise<Contract | undefined>
  deleteContract(id: string): Promise<boolean>
}

export class InMemoryStorage implements IStorage {
  private users: User[] = []
  private contracts: Contract[] = []

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find((u) => u.id === id)
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((u) => u.username === username)
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = {
      id: (Math.random() * 1e9).toFixed(0),
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User
    this.users.push(newUser)
    return newUser
  }

  async getAllContracts(): Promise<Contract[]> {
    // return copy ordered by createdAt desc
    return [...this.contracts].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
  }

  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.find((c) => c.id === id)
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const newContract = {
      id: (Math.random() * 1e9).toFixed(0),
      ...contract,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Contract
    this.contracts.push(newContract)
    return newContract
  }

  async updateContract(
    id: string,
    contract: Partial<InsertContract>
  ): Promise<Contract | undefined> {
    const idx = this.contracts.findIndex((c) => c.id === id)
    if (idx === -1) return undefined
    this.contracts[idx] = {
      ...this.contracts[idx],
      ...contract,
      updatedAt: new Date(),
    } as Contract
    return this.contracts[idx]
  }

  async deleteContract(id: string): Promise<boolean> {
    const before = this.contracts.length
    this.contracts = this.contracts.filter((c) => c.id !== id)
    return this.contracts.length < before
  }
}

// Choose storage at runtime to allow starting without a real database in dev
let storageImpl: IStorage | null = null
let initPromise: Promise<void> | null = null

async function initStorage(): Promise<IStorage> {
  if (storageImpl) return storageImpl
  
  if (!initPromise) {
    initPromise = (async () => {
      try {
        if (process.env.DATABASE_URL) {
          const { DbStorage } = await import('./db-storage')
          storageImpl = new DbStorage() as unknown as IStorage
        } else {
          storageImpl = new InMemoryStorage()
        }
      } catch (e) {
        // On any DB init failure, fallback to in-memory for developer convenience
        storageImpl = new InMemoryStorage()
      }
    })()
  }
  
  await initPromise
  return storageImpl!
}

export const storage = {
  async getUser(id: string) {
    const impl = await initStorage()
    return impl.getUser(id)
  },
  async getUserByUsername(username: string) {
    const impl = await initStorage()
    return impl.getUserByUsername(username)
  },
  async createUser(user: InsertUser) {
    const impl = await initStorage()
    return impl.createUser(user)
  },
  async getAllContracts() {
    const impl = await initStorage()
    return impl.getAllContracts()
  },
  async getContract(id: string) {
    const impl = await initStorage()
    return impl.getContract(id)
  },
  async createContract(contract: InsertContract) {
    const impl = await initStorage()
    return impl.createContract(contract)
  },
  async updateContract(id: string, contract: Partial<InsertContract>) {
    const impl = await initStorage()
    return impl.updateContract(id, contract)
  },
  async deleteContract(id: string) {
    const impl = await initStorage()
    return impl.deleteContract(id)
  },
} as IStorage
