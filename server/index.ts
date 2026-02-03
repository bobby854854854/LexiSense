import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import contractsRouter from './api/contracts'
import authRouter from './api/auth'

import connectPgSimple from 'connect-pg-simple'
import { pool } from './db'
import { logger } from './logger'
import { requestLogger, errorLogger } from './middleware/logging'
import { healthCheck, simpleHealthCheck } from './health'

const app = express()

// Trust reverse proxy (Render, etc.)
app.set('trust proxy', 1)

// Request logging middleware
app.use(requestLogger)

// Security middleware
app.use(helmet())
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, { 
    nodeEnv: process.env.NODE_ENV,
    port: PORT,
  })
})

export default app
