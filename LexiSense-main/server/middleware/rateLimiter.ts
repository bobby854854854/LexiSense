import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'
import { logger } from '../utils/logger.js'

// Redis client setup
let redisClient: Redis | null = null

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    })

    redisClient.on('connect', () => {
      logger.info('Redis connected for rate limiting')
    })

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err)
    })
  } catch (error) {
    logger.error('Failed to initialize Redis:', error)
  }
}

// API rate limiter
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient
    ? new RedisStore({
        sendCommand: (...args: string[]) => redisClient!.call(...args),
      })
    : undefined, // Falls back to memory store if Redis unavailable
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health'
  },
  onLimitReached: (req) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    })
  },
})

// Auth rate limiter (stricter)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient
    ? new RedisStore({
        sendCommand: (...args: string[]) => redisClient!.call(...args),
      })
    : undefined,
  onLimitReached: (req) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    })
  },
})

export { redisClient }
