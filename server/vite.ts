import express, { type Express } from 'express'
import fs from 'fs'
import path from 'path'
import { createServer as createViteServer, createLogger } from 'vite'
import { type Server } from 'http'
import viteConfig from '../vite.config'
import { nanoid } from 'nanoid'

const viteLogger = createLogger()

export function log(message: string, source = 'express') {
  const sanitizedSource = String(source).replace(/[\r\n\t]/g, '')
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  console.log(
    `${formattedTime} [${source}] ${String(message).replace(/[\r\n\t]/g, '')} - vite.ts:20`
  )
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  }

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options)
        process.exit(1)
      },
    },
    server: serverOptions,
    appType: 'custom',
  })

  app.use(vite.middlewares)
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl.replace(/[<>"'&]/g, '')

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        '..',
        'client',
        'index.html'
      )

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, 'utf-8')
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      )
      const page = await vite.transformIndexHtml(url, template)
      res
        .status(200)
        .set({
          'Content-Type': 'text/html',
          'X-Content-Type-Options': 'nosniff',
        })
        .end(page)
    } catch (e) {
      vite.ssrFixStacktrace(e as Error)
      next(e)
    }
  })
}

function validateAndResolvePath(
  basePath: string,
  relativePath: string
): string {
  const resolvedPath = path.join(basePath, relativePath)
  if (!resolvedPath.startsWith(basePath)) {
    throw new Error('Invalid path detected')
  }
  return resolvedPath
}

export function serveStatic(app: Express) {
  const basePath = path.resolve(import.meta.dirname)
  const distPath = validateAndResolvePath(basePath, 'public')

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    )
  }

  app.use(express.static(distPath))

  // fall through to index.html if the file doesn't exist
  app.use('*', (_req, res) => {
    const indexPath = path.resolve(distPath, 'index.html')
    if (!indexPath.startsWith(distPath)) {
      return res.status(403).send('Forbidden')
    }
    res.sendFile(indexPath)
  })
}
