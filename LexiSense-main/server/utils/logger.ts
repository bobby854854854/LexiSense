import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
)

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
    }),
  ],
})

export const auditLog = (event: string, metadata: Record<string, unknown>) => {
  logger.warn('AUDIT', { event, ...metadata })
}
