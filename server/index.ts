import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import ViteExpress from 'vite-express'
import helmet from 'helmet'
import csurf from 'csurf'
import ConnectPgSimple from 'connect-pg-simple'
import { pool } from './db'
import './auth' // Initialize Passport strategies

import authApi from './api/auth'
import contractsApi from './api/contracts'

const app = express()
const pgSession = ConnectPgSimple(session)

// --- Middleware ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
      },
    },
  })
)
app.use(express.json())

// Session middleware
app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'a_very_secret_key_for_development',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  }),
)

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// CSRF Protection middleware
app.use(csurf())
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken())
  next()
})

// --- API Routes ---
app.use('/api/auth', authApi)
app.use('/api/contracts', contractsApi)

// --- Health Check ---
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

const port = process.env.PORT || 5000
ViteExpress.listen(app, Number(port), () =>
  console.log(`[express] serving on port ${port}`),
)