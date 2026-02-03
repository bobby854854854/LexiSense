import { Request, Response, NextFunction } from 'express'
import { logger } from '../logger'
import { incrementRequestStats } from '../health'

/**
 * Express middleware for logging HTTP requests
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const success = res.statusCode < 400
    
    // Update request statistics
    incrementRequestStats(success)
    
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
    }
    
    if (res.statusCode >= 500) {
      logger.error('HTTP Request Error', logData)
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData)
    } else {
      logger.info('HTTP Request', logData)
    }
  })
  
  next()
}

/**
 * Express error handler middleware with logging
 */
export function errorLogger(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    ip: req.ip || req.socket.remoteAddress,
  })
  
  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message
  
  res.status(500).json({ message })
}
