import { Request, Response } from 'express'
import { pool } from './db'
import { checkRedisHealth } from './redis'
import os from 'os'

// Track server start time
const serverStartTime = Date.now()

// Track request statistics
let totalRequests = 0
let successfulRequests = 0
let failedRequests = 0

export function incrementRequestStats(success: boolean) {
  totalRequests++
  if (success) {
    successfulRequests++
  } else {
    failedRequests++
  }
}

/**
 * Enhanced health check endpoint with performance metrics
 */
export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now()
  
  // System metrics
  const uptime = Date.now() - serverStartTime
  const uptimeSeconds = Math.floor(uptime / 1000)
  const processUptime = Math.floor(process.uptime())
  
  // Memory usage
  const memoryUsage = process.memoryUsage()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory
  
  // CPU usage (average across all cores)
  const cpus = os.cpus()
  const cpuCount = cpus.length
  let totalIdle = 0
  let totalTick = 0
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times]
    }
    totalIdle += cpu.times.idle
  })
  
  const cpuUsagePercent = 100 - (100 * totalIdle / totalTick)
  
  // Database health check
  let dbStatus = 'unknown'
  let dbResponseTime = 0
  
  try {
    const dbStartTime = Date.now()
    await pool.query('SELECT 1')
    dbResponseTime = Date.now() - dbStartTime
    dbStatus = 'healthy'
  } catch (error) {
    dbStatus = 'unhealthy'
  }
  
  // Redis health check
  const redisHealth = await checkRedisHealth()
  
  // Request statistics
  const errorRate = totalRequests > 0 
    ? ((failedRequests / totalRequests) * 100).toFixed(2) 
    : '0.00'
  
  const responseTime = Date.now() - startTime
  
  const health = {
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: {
      milliseconds: uptime,
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds),
      process: processUptime,
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      cpuCount,
      cpuUsage: `${cpuUsagePercent.toFixed(2)}%`,
      memory: {
        total: formatBytes(totalMemory),
        used: formatBytes(usedMemory),
        free: formatBytes(freeMemory),
        usagePercent: `${((usedMemory / totalMemory) * 100).toFixed(2)}%`,
      },
      process: {
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        external: formatBytes(memoryUsage.external),
        rss: formatBytes(memoryUsage.rss),
      },
    },
    database: {
      status: dbStatus,
      responseTime: `${dbResponseTime}ms`,
    },
    redis: {
      connected: redisHealth.connected,
      latency: redisHealth.latency ? `${redisHealth.latency}ms` : undefined,
      error: redisHealth.error,
    },
    requests: {
      total: totalRequests,
      successful: successfulRequests,
      failed: failedRequests,
      errorRate: `${errorRate}%`,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasS3: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      hasRedis: redisHealth.connected,
    },
    performance: {
      responseTime: `${responseTime}ms`,
    },
  }
  
  // Return 503 if database is unhealthy
  const statusCode = dbStatus === 'healthy' ? 200 : 503
  
  res.status(statusCode).json(health)
}

/**
 * Simple health check for load balancers
 */
export function simpleHealthCheck(req: Request, res: Response) {
  res.status(200).send('OK')
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  
  return parts.join(' ')
}
