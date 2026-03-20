import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import contractsRouter from './api/contracts'
import authRouter from './api/auth'
import { apiRateLimit, authRateLimit } from './middleware/rateLimiter.js'
import { logger, auditLog } from './utils/logger.js'
import connectPgSimple from 'connect-pg-simple'
import { pool } from './db'
import os from 'os'

const app = express()

// Trust reverse proxy (Render, etc.)
app.set('trust proxy', 1)

// Security middleware
app.use(helmet())
app.use(apiRateLimit)

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    })
  })
  next()
})

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
app.use('/api/auth', authRateLimit, authRouter)

// Health check with performance metrics
app.get('/api/health', async (req, res) => {
  const startTime = Date.now()

  try {
    // Database health check
    const dbStart = Date.now()
    await pool.query('SELECT 1')
    const dbLatency = Date.now() - dbStart

    // System metrics
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      performance: {
        responseTime: Date.now() - startTime,
        dbLatency,
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        system: {
          loadAvg: os.loadavg(),
          freeMem: Math.round(os.freemem() / 1024 / 1024),
          totalMem: Math.round(os.totalmem() / 1024 / 1024),
        },
      },
      services: {
        database: 'healthy',
        redis: process.env.REDIS_URL ? 'configured' : 'memory',
        s3: process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'local',
      },
    }

    res.json(health)
  } catch (error) {
    logger.error('Health check failed:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    })
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  })
  console.log(`Server is running on port ${PORT}`)
})

export default app
