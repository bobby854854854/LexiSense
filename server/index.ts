import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import contractsRouter from './api/contracts'
import authRouter from './api/auth'

import connectPgSimple from 'connect-pg-simple'
import { pool } from './db'
import { logger } from './logger'
import { requestLogger, errorLogger } from './middleware/logging'
import { healthCheck, simpleHealthCheck } from './health'
import { createRedisClient, createRateLimiter, closeRedis } from './redis'

const app = express()

// Initialize Redis connection (optional - falls back to memory if not available)
createRedisClient().catch((error) => {
  logger.warn('Starting without Redis', { 
    error: error instanceof Error ? error.message : 'Unknown error' 
  })
})

// Trust reverse proxy (Render, etc.)
app.set('trust proxy', 1)

// Request logging middleware
app.use(requestLogger)

// Security middleware
app.use(helmet())

// Rate limiting with Redis (falls back to memory if Redis unavailable)
app.use(
  createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later.',
  })
)

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PgStore = connectPgSimple(session)
const sessionStore = new PgStore({
  pool,
  tableName: 'user_sessions',
})

// Session configuration
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
)

// API routes
app.use('/api/contracts', contractsRouter)
app.use('/api/auth', authRouter)

// Health check endpoints
app.get('/api/health', healthCheck)
app.get('/health', simpleHealthCheck) // For load balancers

// Error logging middleware (must be last)
app.use(errorLogger)

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, { 
    nodeEnv: process.env.NODE_ENV,
    port: PORT,
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server')
  server.close(async () => {
    logger.info('HTTP server closed')
    await closeRedis()
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server')
  server.close(async () => {
    logger.info('HTTP server closed')
    await closeRedis()
    process.exit(0)
  })
})

export default app
