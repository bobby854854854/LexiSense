# LexiSense - GitHub Copilot Instructions

## Repository Overview

**LexiSense** is an enterprise AI-powered Contract Lifecycle Management (CLM) platform built with React, Express.js, and PostgreSQL. The codebase contains ~11,671 lines of TypeScript/TSX code organized in a monorepo structure with frontend (`client/`), backend (`server/`), and shared code (`shared/`).

**Tech Stack:**

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui (Radix UI)
- **Backend:** Node.js + Express.js (ES modules) + TypeScript
- **Database:** PostgreSQL (Neon Serverless) + Drizzle ORM
- **Storage:** AWS S3 with streaming uploads
- **Cache:** Redis (optional, for distributed rate limiting)
- **AI:** OpenAI GPT-4 (gpt-4o model)
- **Logging:** Winston with daily log rotation
- **Testing:** Vitest (no tests currently exist)
- **Tooling:** ESLint, Prettier, Husky (pre-commit hooks), lint-staged

**Node Version:** 20.17+ (CI uses 20.17, local development tested with 24.13.0)  
**Package Manager:** npm (11.6.2+)

## Critical Build Instructions

### Initial Setup & Common Issues

**IMPORTANT:** The package-lock.json may be out of sync. Always run `npm install` first, not `npm ci`:

```bash
# 1. Install dependencies (REQUIRED first step)
npm install
# Wait ~15 seconds for completion

# 2. Copy environment file
cp .env.example .env
# Edit .env with required credentials (see Environment Variables section)
```

**Known Issue:** Running `npm ci` will fail with "lock file out of sync" error. Always use `npm install` instead.

### Environment Variables

Required for development (see `.env.example` for full list):

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
- `APP_URL` - Default: `http://localhost:5000`

Production also requires: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `REDIS_URL` (optional)

Check environment setup:

```bash
npm run check-env
# Validates all required variables are set
```

### Build Commands (In Order)

**Development:**

```bash
npm run dev
# Starts both Express server (port 5000) and Vite dev server (port 3000)
# Vite proxies /api/* requests to Express
# Wait ~5-10 seconds for both servers to start
```

**Type Checking:**

```bash
npm run typecheck
# Runs TypeScript compiler without emitting files
# Current status: Has errors due to missing imports and type mismatches
# Expected to fail until TypeScript issues are resolved
```

**Linting:**

```bash
npm run lint
# Runs ESLint with Prettier integration
# Auto-fixes most issues via pre-commit hook
# Current status: Shows formatting issues, mostly Prettier semicolon rules
```

**Format Check:**

```bash
npx prettier --check .
# Checks code formatting without modifying files
```

**Format Fix:**

```bash
npm run format
# Auto-formats all files with Prettier
```

**Building for Production:**

```bash
# Build client only (used in CI/CD)
npm run build:client
# Outputs to: dist/client/
# Current status: FAILS due to missing react-router-dom import in main.tsx
# Known Issue: Build will fail until import dependencies are fixed

# Full production build
npm run build
# Runs build:client only (build:server is not in default build)
```

**Testing:**

```bash
npm test
# Runs Vitest test suite
# Current status: No test files exist, exits with code 1
# Missing dependency: jsdom (needs to be installed for DOM testing)
```

**Database Setup:**

```bash
# Initialize database schema
npm run db:migrate
# Runs server/db/migrate.ts which creates tables from schema
# Requires DATABASE_URL to be set

# Push schema changes
npm run db:push
# Uses Drizzle Kit to push schema changes

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Pre-commit Hooks

**Husky is configured** and runs automatically on `git commit`:

- ESLint with auto-fix (`--fix`)
- Prettier formatting (`--write`)
- Type checking (NOT run in hooks)

Files affected by hooks:

- `*.{ts,tsx,js,jsx}` → ESLint + Prettier
- `*.{json,md,yml,yaml}` → Prettier only

**To bypass hooks (emergency only):**

```bash
git commit --no-verify -m "message"
```

**Common Hook Failure:** If ESLint finds errors (not warnings), commit will be blocked. Fix the errors or use `--no-verify` cautiously.

## CI/CD Workflows

Location: `.github/workflows/`

**Four workflows are configured:**

1. **ci.yml** - Main CI pipeline (runs on push/PR to main)
   - Runs: `npm ci`, `npm test`, `npm run typecheck`, `npm run build`
   - Node version: 20.17
   - **Current status:** Will fail on npm ci (lock file issue), typecheck, and build

2. **pr-checks.yml** - PR quality checks
   - Runs: `npm ci`, `npm run typecheck`, `npm run lint`, `npx prettier --check .`, `npm run build`
   - All steps use `continue-on-error: true` except build
   - Node version: 20

3. **deploy.yml** - Production deployment to Vercel (on push to main)
   - Runs: `npm ci`, `npm run build:client`, deploys to Vercel
   - Requires GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

4. **ci-cd.yml** - Full CI/CD pipeline (comprehensive checks + deploy)
   - Combines quality checks and deployment
   - Deploys to Vercel only on push to main

**To pass CI:**

1. Fix package-lock.json sync issue (or change CI to use `npm install`)
2. Fix TypeScript errors in typecheck
3. Fix Vite build error (missing react-router-dom import)
4. Add tests or skip test step in CI

## Project Layout & Architecture

### Directory Structure

```
/
├── .github/
│   ├── copilot-instructions.md     ← This file
│   └── workflows/                   ← GitHub Actions CI/CD
│       ├── ci.yml, pr-checks.yml, deploy.yml, ci-cd.yml
├── client/                          ← React frontend (Vite project root)
│   ├── index.html                   ← Entry HTML
│   └── src/
│       ├── main.tsx                 ← React entry point
│       ├── App.tsx                  ← Router & layout
│       ├── pages/                   ← Page components
│       ├── components/              ← React components
│       │   ├── ui/                  ← shadcn/ui components (auto-generated)
│       │   ├── features/            ← Feature components
│       │   └── layout/              ← Layout components
│       ├── hooks/                   ← Custom React hooks
│       ├── lib/                     ← Utilities
│       └── contexts/                ← React contexts (AuthContext)
├── server/                          ← Express backend
│   ├── index.ts                     ← Express app entry point & middleware setup
│   ├── api/                         ← API route handlers
│   │   ├── contracts.ts             ← Contract CRUD endpoints
│   │   ├── auth.ts                  ← Auth endpoints (login, register)
│   │   └── team.ts                  ← Team management
│   ├── db/
│   │   ├── schema.ts                ← Exports from shared/schema.ts
│   │   ├── migrate.ts               ← Database migration script
│   │   └── index.ts                 ← Database client
│   ├── services/                    ← Business logic
│   │   ├── ai.ts                    ← OpenAI integration
│   │   ├── storage.ts               ← AWS S3 file storage
│   │   └── email.ts                 ← SMTP email sending
│   ├── middleware/
│   │   └── rateLimiter.ts           ← Rate limiting (Redis-backed)
│   ├── utils/
│   │   ├── logger.ts                ← Winston logger configuration
│   │   └── magicNumbers.ts          ← File type validation
│   ├── jobs/
│   │   └── cleanup.ts               ← Background job for expired invitations
│   ├── auth.ts                      ← Authentication middleware
│   └── db.ts                        ← Drizzle ORM client
├── shared/                          ← Shared types & schemas
│   ├── schema.ts                    ← Drizzle table schemas (users, contracts)
│   └── types.ts                     ← TypeScript types & Zod validation schemas
├── scripts/
│   ├── check-env.ts                 ← Environment variable validator
│   └── setup-db.ts                  ← Database initialization script
├── .husky/                          ← Git hooks
│   └── pre-commit                   ← Runs lint-staged
├── package.json                     ← Dependencies & scripts
├── tsconfig.json                    ← TypeScript config (client + server)
├── tsconfig.server.json             ← Server-specific TypeScript config
├── vite.config.ts                   ← Vite bundler config
├── eslint.config.js                 ← ESLint v9 flat config
├── .prettierrc.json                 ← Prettier config
├── .lintstagedrc.json               ← lint-staged config
├── tailwind.config.js               ← Tailwind CSS config
├── components.json                  ← shadcn/ui config
└── design_guidelines.md             ← UI design system documentation
```

### Key Files to Understand

1. **server/index.ts** - Express app setup, middleware registration, session config
2. **shared/schema.ts** - Database table definitions (users, contracts tables)
3. **shared/types.ts** - Shared TypeScript interfaces, Zod schemas
4. **client/src/App.tsx** - React router setup (wouter), protected routes
5. **server/api/contracts.ts** - Contract CRUD API with AI analysis
6. **server/services/ai.ts** - OpenAI GPT-4 contract analysis logic
7. **server/db.ts** - Drizzle ORM client & connection pool setup

### Data Flow

**Contract Upload & AI Analysis:**

1. User uploads file → `POST /api/contracts/upload`
2. Server validates file, extracts text, creates contract record (status: "processing")
3. OpenAI analyzes contract text → returns JSON with summary, parties, keyDates, risks
4. Results saved to `contracts.aiInsights` (JSONB column)
5. Contract status updated to "completed"

**Authentication:**

- Session-based auth with express-session + connect-pg-simple
- Sessions stored in PostgreSQL `user_sessions` table
- Passwords hashed with bcrypt (10 rounds)
- Protected routes use `isAuthenticated` middleware

### Type Safety & Naming Conventions

- **Database columns:** `snake_case` (e.g., `first_name`, `created_at`)
- **TypeScript/JS:** `camelCase` (e.g., `firstName`, `createdAt`)
- **Drizzle ORM** automatically maps between conventions
- **Shared types** in `@shared/types` imported by both client & server
- **Path aliases:**
  - `@/*` → `client/src/*`
  - `@shared/*` → `shared/*`

### shadcn/ui Components

- Located in `client/src/components/ui/`
- Auto-generated from shadcn/ui CLI (don't edit manually)
- Configuration in `components.json`
- Uses Radix UI primitives + Tailwind CSS
- Import pattern: `import { Button } from '@/components/ui/button'`

## Common Development Workflows

**Making Code Changes:**

1. Create feature branch
2. Make minimal changes
3. Run `npm run lint` to check for issues
4. Run `npm run format` to auto-fix formatting
5. Test changes with `npm run dev`
6. Commit (pre-commit hook will run ESLint + Prettier automatically)

**Adding API Endpoints:**

1. Define route handler in `server/api/*.ts`
2. Add authentication check: `import { isAuthenticated } from '../auth'`
3. Use `req.user.id` to access authenticated user ID
4. Add types to `shared/types.ts`
5. Register route in `server/index.ts`

**Database Changes:**

1. Update schema in `shared/schema.ts`
2. Run `npm run db:push` to sync schema
3. Or create migration with `npm run db:generate`

**Fixing Build Errors:**

1. Check TypeScript errors: `npm run typecheck`
2. Check lint errors: `npm run lint`
3. Check build errors: `npm run build:client`
4. Most common issues: missing imports, type mismatches, path alias issues

## Known Issues & Workarounds

1. **npm ci fails with lock file sync error**
   - **Workaround:** Always use `npm install` instead of `npm ci`
   - **CI Impact:** CI workflows will fail on npm ci step

2. **TypeScript errors in typecheck**
   - Missing module: `./hooks/useAuth`
   - Missing module: `@mui/material` (should not be imported)
   - Type mismatches in various components
   - **Workaround:** Fix imports before running typecheck

3. **Vite build fails with react-router-dom import error**
   - Missing dependency in package.json
   - **Workaround:** App uses `wouter` not `react-router-dom`, remove incorrect import

4. **Test suite has no tests**
   - `npm test` exits with code 1
   - Missing jsdom dependency
   - **Workaround:** Add tests or skip test step in development

## Validation Steps

Before pushing changes:

1. ✅ Run `npm run lint` → Should pass or show only warnings
2. ✅ Run `npm run typecheck` → Should pass (currently fails, fix before merging)
3. ✅ Run `npm run build:client` → Should build successfully (currently fails)
4. ✅ Run `npm run dev` → Should start without errors
5. ✅ Test changed functionality manually in browser
6. ✅ Check git status → Ensure no unintended files are staged
7. ✅ Commit will auto-run lint-staged hooks

## Additional Resources

- **README.md** - Quick start guide, architecture overview, deployment info
- **DEPLOY_NOW.md** - Detailed deployment instructions (Vercel, Render, AWS S3, Redis)
- **DEPLOYMENT.md** - Backend deployment guide
- **CI-CD-SETUP.md** - GitHub Actions secrets setup, workflow descriptions
- **design_guidelines.md** - UI design system (colors, typography, spacing, components)
- **.env.example** - Complete list of environment variables with descriptions

## Trust These Instructions

This file was created by thoroughly exploring the codebase, testing all build commands, reviewing documentation, and noting all errors and workarounds. When making changes:

1. **Follow the build order** exactly as documented above
2. **Use `npm install`** not `npm ci`
3. **Check known issues** before debugging similar problems
4. **Run validation steps** before committing
5. **Only search the codebase** if information here is incomplete or you find it to be incorrect

If you discover new issues or workarounds, update this file to help future development.
