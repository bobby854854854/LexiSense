import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import contractsRouter from './api/contracts'
import authRouter from './api/auth'

const app = express()

// Security middleware
app.use(helmet())
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
)

// API routes
app.use('/api/contracts', contractsRouter)
app.use('/api/auth', authRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

export default app
