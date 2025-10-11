import express, { type Request, Response, NextFunction } from 'express'
import { registerRoutes } from './routes'
import { setupVite, serveStatic, log } from './vite'
import { setupSecurity } from './security'

const app = express()

function sanitizeForLog(input: unknown, maxLen = 200) {
  try {
    let s = typeof input === 'string' ? input : JSON.stringify(input)
    // remove control characters and newlines
    s = s.replace(/[\r\n\t]/g, ' ')
    // truncate
    if (s.length > maxLen) s = s.slice(0, maxLen - 1) + '\u2026'
    return s
  } catch {
    return String(input).replace(/[\r\n\t]/g, ' ')
  }
}

// Security middleware
setupSecurity(app)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: false, limit: '10mb' }))

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  const path = req.path
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined

  const originalResJson = res.json.bind(res) as (
    body?: unknown,
    ...args: unknown[]
  ) => Response
  res.json = function (bodyJson?: unknown, ...args: unknown[]) {
    capturedJsonResponse = bodyJson as Record<string, unknown> | undefined
    return originalResJson(bodyJson, ...args)
  } as typeof res.json

  res.on('finish', () => {
    const duration = Date.now() - start
    if (path.startsWith('/api')) {
      // Build a safe log entry without embedding raw JSON that could contain newlines
      const safeMethod = sanitizeForLog(req.method, 16)
      const safePath = sanitizeForLog(path, 200)
      const base = `${safeMethod} ${safePath} ${res.statusCode} in ${duration}ms`

      let extras = ''
      if (capturedJsonResponse && typeof capturedJsonResponse === 'object') {
        const copy = { ...capturedJsonResponse } as Record<string, unknown>
        if (copy.password) copy.password = '[REDACTED]'
        if (copy.token) copy.token = '[REDACTED]'
        // include only keys and a short preview to avoid injection
        try {
          const preview = sanitizeForLog(JSON.stringify(copy), 200)
          extras = ` :: ${preview}`
        } catch {
          extras = ''
        }
      }

      const logLine = (base + extras).slice(0, 1000)
      log(logLine)
    }
  })

  next()
})

;(async () => {
  const server = await registerRoutes(app)

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500
    const message = err.message || 'Internal Server Error'

    res.status(status).json({ message })
    // Log the error for debugging but don't rethrow so the server keeps running.
    const sanitizedErrorMessage = sanitizeForLog(
      err && err.message ? err.message : 'Unknown error',
      500
    )
    const sanitizedStack =
      process.env.NODE_ENV === 'development' && err && err.stack
        ? sanitizeForLog(err.stack, 2000)
        : undefined

    const logEntry =
      `[error] ${sanitizedErrorMessage} (status=${status})` +
      (sanitizedStack ? ` :: ${sanitizedStack}` : '')
    console.error(logEntry)
  })

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get('env') === 'development') {
    await setupVite(app, server)
  } else {
    serveStatic(app)
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10)
  const listenOptions: any = { port, host: '0.0.0.0' }
  // reusePort is not supported on some platforms (notably Windows). Only set it
  // when the platform supports it.
  if (process.platform !== 'win32') {
    listenOptions.reusePort = true
  }

  server.listen(listenOptions, () => {
    log(`serving on port ${port}`)
  })
})()
