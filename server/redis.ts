import { createClient } from 'redis'
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { logger } from './logger'

// Redis client instance
let redisClient: ReturnType<typeof createClient> | null = null

/**
 * Creates and connects a Redis client
 */
export async function createRedisClient() {
  if (redisClient) {
    return redisClient
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  
  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts')
            return new Error('Redis reconnection failed')
          }
          return Math.min(retries * 100, 3000)
        },
      },
    })

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', { 
        error: err instanceof Error ? err.message : 'Unknown error' 
      })
    })

    redisClient.on('connect', () => {
      logger.info('Redis client connected')
    })

    redisClient.on('ready', () => {
      logger.info('Redis client ready')
    })

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting')
    })

    await redisClient.connect()
    
    return redisClient
  } catch (error) {
    logger.error('Failed to connect to Redis', {
      error: error instanceof Error ? error.message : 'Unknown error',
      redisUrl: redisUrl.replace(/:[^:@]+@/, ':****@'), // Hide password in logs
    })
    throw error
  }
}

/**
 * Gets the Redis client, or null if not available
 */
export function getRedisClient() {
  return redisClient
}

/**
 * Creates a rate limiter middleware with Redis store (if available)
 * Falls back to memory store if Redis is not configured
 */
export function createRateLimiter(options: {
  windowMs?: number
  max?: number
  message?: string
  skipSuccessfulRequests?: boolean
}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
  } = options

  // Try to use Redis store if available
  if (redisClient && redisClient.isReady) {
    logger.info('Using Redis for rate limiting', { windowMs, max })
    
    return rateLimit({
      windowMs,
      max,
      message: { message },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      skipSuccessfulRequests,
      store: new RedisStore({
        // @ts-expect-error - RedisStore types are not fully compatible
        sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
      }),
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
        })
        res.status(429).json({ message })
      },
    })
  }

  // Fall back to memory store
  logger.warn('Redis not available, using memory store for rate limiting')
  
  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
      })
      res.status(429).json({ message })
    },
  })
}

/**
 * Closes the Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    logger.info('Redis client disconnected')
  }
}

/**
 * Check if Redis is connected and healthy
 */
export async function checkRedisHealth(): Promise<{
  connected: boolean
  latency?: number
  error?: string
}> {
  if (!redisClient || !redisClient.isReady) {
    return { connected: false, error: 'Redis client not initialized or not ready' }
  }

  try {
    const start = Date.now()
    await redisClient.ping()
    const latency = Date.now() - start

    return { connected: true, latency }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
