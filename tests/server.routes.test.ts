// Provide a dummy OpenAI API key for tests and mock the OpenAI package
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key'

// Mock the openai client so tests don't contact the real API
vi.mock('openai', () => {
  return {
    default: class {
      constructor() {}
      // minimal chat API surface used by the app
      chat = {
        completions: {
          create: async () => ({ choices: [{ message: { content: '{}' } }] }),
        },
      }
    },
  }
})

// Mock the storage module to avoid DB dependency
vi.mock('../server/storage', () => {
  return {
    storage: {
      getAllContracts: vi.fn(async () => []),
      getContract: vi.fn(async (id: string) => undefined),
      createContract: vi.fn(async (c: any) => ({ id: '1', ...c })),
      updateContract: vi.fn(async () => undefined),
      deleteContract: vi.fn(async () => true),
    },
  }
})

import request from 'supertest'
import { createServer } from 'http'
import express from 'express'

// We will import registerRoutes and then attach to a test server
import { registerRoutes } from '../server/routes'

let server: any
let app: express.Express

beforeAll(async () => {
  app = express()
  app.use(express.json())
  server = await registerRoutes(app)
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
})

it('GET /api/contracts returns empty array', async () => {
  const res = await request(app).get('/api/contracts')
  expect(res.status).toBe(200)
  expect(res.body).toEqual([])
})

it('POST /api/contracts returns created contract', async () => {
  const payload = {
    title: 'T',
    counterparty: 'C',
    contractType: 'Other',
    status: 'active',
  }
  const res = await request(app).post('/api/contracts').send(payload)
  expect(res.status).toBe(200)
  expect(res.body).toMatchObject({ id: '1', title: 'T' })
})
