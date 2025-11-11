
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { Redis } from 'ioredis'

/**
 * Rate Limiter Configuration
 * 
 * Time Complexity: O(1) per request with Redis
 * Space Complexity: O(u) where u is unique users/IPs in time window
 * 
 * Using Redis provides:
 * - Distributed rate limiting across multiple servers
 * - Automatic cleanup of expired entries
 * - O(1) increment and check operations
 */

// Initialize Redis client if REDIS_URL is provided
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    })
  : null

// Base configuration
const createRateLimiter = (options: {
  windowMs: number
  max: number
  message: string
  skipSuccessfulRequests?: boolean
}) => {
  const config: any = {
    windowMs: options.windowMs,
    max: options.max,
    message: { message: options.message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    // Use IP + user ID for authenticated endpoints
    keyGenerator: (req: any) => {
      const ip = req.ip || req.connection.remoteAddress
      const userId = req.user?.id || 'anonymous'
      return `${ip}:${userId}`
    },
  }

  // Use Redis store if available, otherwise memory store
  if (redis) {
    config.store = new RedisStore({
      client: redis,
      prefix: 'rl:',
    })
  }

  return rateLimit(config)
}

/**
 * Authentication Rate Limiter
 * Prevents brute force attacks
 * 
 * Limits: 5 attempts per 15 minutes per IP
 * Only counts failed attempts (skipSuccessfulRequests: true)
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts. Please try again later.',
  skipSuccessfulRequests: true,
})

/**
 * File Upload Rate Limiter
 * Prevents resource exhaustion
 * 
 * Limits: 10 uploads per hour per user
 * Space Complexity: O(1) - Only stores counter and timestamp
 */
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Upload limit exceeded. Please try again later.',
})

/**
 * AI/Chat Rate Limiter
 * Prevents API abuse and cost overruns
 * 
 * Limits: 30 requests per 15 minutes per user
 * Protects against OpenAI credit exhaustion
 */
export const aiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'AI request limit exceeded. Please slow down.',
})

/**
 * General API Rate Limiter
 * Prevents general API abuse
 * 
 * Limits: 100 requests per 15 minutes per user
 */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests. Please try again later.',
})

/**
 * Strict Rate Limiter for sensitive operations
 * Used for: Invitations, role changes, deletions
 * 
 * Limits: 5 requests per hour per user
 */
export const strictLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Operation limit exceeded. Please try again later.',
})

/**
 * CSRF Token Rate Limiter
 * Prevents token harvesting
 * 
 * Limits: 20 requests per 15 minutes per IP
 */
export const csrfLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many token requests.',
})

// Cleanup Redis connection on process exit
if (redis) {
  process.on('SIGTERM', () => {
    redis.quit()
  })
  process.on('SIGINT', () => {
    redis.quit()
  })
}