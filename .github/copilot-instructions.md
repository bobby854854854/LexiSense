# LexiSense Copilot Instructions

Welcome! This document will help you quickly understand and work effectively in the LexiSense repository. Always trust these instructions first; only search the repo if something seems missing or fails.

---

## 1. HighLevelDetails

### What is LexiSense?

**LexiSense** is an enterprise AI-powered Contract Lifecycle Management (CLM) SaaS platform. It helps legal teams analyze, manage, and collaborate on contracts using AI-powered insights.

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Radix UI (shadcn/ui components), Tailwind CSS
- **Routing**: Wouter (lightweight React router)
- **State Management**: React Query (@tanstack/react-query), React Context
- **Backend** (in repo): Express.js, Node.js, TypeScript (ES modules)
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **AI**: OpenAI GPT-4 for contract analysis
- **File Storage**: AWS S3
- **Auth**: Session-based (bcrypt + express-session)

### Repository Structure

This is a **monorepo** containing both frontend and backend:

```
LexiSense/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── main.tsx       # Entry point
│   │   ├── App.tsx        # Router & app shell
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   │   └── ui/        # shadcn/ui components (auto-generated)
│   │   ├── contexts/      # React contexts (AuthContext, etc.)
│   │   ├── hooks/         # Custom hooks
│   │   └── api.ts         # API client (fetch wrappers)
│   └── index.html         # HTML entry point
├── server/                 # Express backend API
│   ├── index.ts           # Express setup & route registration
│   ├── api/               # API route handlers
│   ├── db/                # Database schema & migrations
│   ├── ai.ts              # OpenAI integration
│   └── auth.ts            # Authentication middleware
├── shared/                 # Shared TypeScript types
│   └── types.ts           # Interfaces used by client & server
├── .github/workflows/      # CI/CD pipelines
└── [config files]          # Root-level configs
```

### Deployment Model

- **Frontend**: Can be deployed to Vercel (static build from `client/`)
- **Backend**: Can be deployed to Render/Railway as a Node.js service
- In **production**, the canonical client (`client/src/api.ts`) uses a same-origin `/api/*` base; the backend typically serves both the API and the static frontend from the same origin
- `VITE_API_URL` is optional and only needed for non-standard setups (e.g. hosting frontend and backend on different domains, Storybook, or E2E tools that talk directly to the API); the main browser client does not rely on it by default
- In **development**, Vite proxies `/api/*` requests to `http://localhost:5000` so the client can continue using the same `/api` base

---

## 2. BuildInstructions

### Prerequisites

- **Node.js**: v20.17 or higher
- **Package Manager**: npm (or pnpm/yarn)
- **PostgreSQL**: Neon/local instance (connection string in `.env`)

### First-Time Setup

**Always run `npm install` at the repo root before any other commands:**

```bash
npm install
```

**Set up environment variables:**

1. Copy `.env.example` to `.env`
2. Fill in required values (see Environment Variables section below)

**Initialize the database:**

```bash
npm run check-env           # Verify environment variables
npm run db:push             # Push schema to database
```

### Development Workflow

**Start the development server:**

```bash
npm run dev
```

This runs the Express server with `tsx watch` (hot reload). The server listens on the port specified in `.env` (default: port 3000, but `.env.example` sets `PORT=5000`).

**Note:** The default `dev` command only runs the backend. To run the Vite dev server for the frontend with the correct root, port 3000, and `/api` proxy, run `npx vite` from the repository root in a separate terminal, which will use the root-level `vite.config.ts`.

### Building for Production

**Build the client (frontend):**

```bash
npm run build              # or npm run build:client
```

Output: `dist/client/` directory with static files for deployment.

**Build the server (backend):**

```bash
npm run build:server
```

Output: Compiled TypeScript to JavaScript (if needed; note: current setup uses `tsx` for runtime execution).

**Run production server:**

```bash
npm start
```

Runs the server with `NODE_ENV=production` using `tsx`.

### Testing

**Run tests:**

```bash
npm test                   # Run tests once (Vitest)
npm run test:watch         # Watch mode
```

**Note:** The test suite is currently minimal. Don't waste time searching for comprehensive tests; focus on writing new tests if needed for your changes.

### Linting & Formatting

**Lint the codebase:**

```bash
npm run lint               # ESLint
```

**Format code:**

```bash
npm run format             # Prettier
```

**Type checking:**

```bash
npm run typecheck          # or npm run check
```

**Pre-commit hooks**: Husky is configured to run lint-staged on commit.

**Always prefer using the above package.json scripts over ad-hoc commands.**

### Environment Variables

**Required for development** (add to `.env` file, never commit):

- `DATABASE_URL`: PostgreSQL connection string (e.g., from Neon)
- `SESSION_SECRET`: Secret key for session signing (32+ characters)
- `OPENAI_API_KEY`: OpenAI API key (for contract analysis)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`: AWS S3 credentials
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Email configuration (or use `RESEND_API_KEY`)
- `APP_URL`: Application URL (for email invites)

**Optional:**

- `REDIS_URL`: For distributed rate limiting (fallback to in-memory)
- `PORT`: Server port (default: 3000; `.env.example` uses 5000 for local dev to align with the Vite proxy)
- `NODE_ENV`: Set automatically by scripts
- `LOG_LEVEL`, `LOG_DIR`: Logging configuration

**Client environment variables** (for Vite, prefix with `VITE_`):

- `VITE_API_URL`: Backend API URL (defaults to Render-hosted API in production)

### CI/CD Workflows

**GitHub Actions** (`.github/workflows/`):

- `ci.yml`: Runs on push/PR to main - executes tests, typecheck, build
- `ci-cd.yml`, `deploy.yml`, `pr-checks.yml`: Additional automation

**Commands run in CI:**

```bash
npm install
npm run typecheck
npm test
npm run build
```

**To mirror CI locally**, run these commands in sequence.

---

## 3. ProjectLayout

### Frontend Architecture

**Entry Point**: `client/src/main.tsx`

- Renders `<App />` into the DOM
- Wraps app with providers: `<AuthProvider>`, `<QueryClientProvider>`, `<Toaster>`

**App Shell**: `client/src/App.tsx`

- Defines routes using `wouter`
- Public routes: `/login`
- Protected routes: `/` (dashboard), `/contracts/:id`, etc.
- Uses `<ProtectedRoute>` wrapper for authenticated routes
- Routes currently render their own layouts; there is no shared `<MainLayout>` wrapper in the router

**Pages**: `client/src/pages/*.tsx`

- Each page is a React component (e.g., `Dashboard.tsx`, `ContractDetail.tsx`, `Login.tsx`)
- Use React Query hooks for data fetching
- Call API functions from `client/src/api.ts`

**Components**: `client/src/components/*.tsx`

- Reusable React components
- `ui/` subdirectory contains shadcn/ui components (auto-generated via CLI)
- Import UI components as `@/components/ui/*`

**API Client**: `client/src/api.ts`

- Simple fetch wrappers with error handling
- Type responses with shared interfaces from `@shared/types`
- Example: `getContracts()`, `uploadContract(file)`

**Contexts**: `client/src/contexts/*.tsx`

- `AuthContext.tsx`: Manages authentication state (login, logout, current user)
- Access via `useAuth()` hook

**Hooks**: `client/src/hooks/*.ts`

- Custom hooks (e.g., `use-mobile.ts`, `use-toast.ts`)

**Styling**: `client/src/index.css`

- Global styles and Tailwind directives
- Theme configuration: `tailwind.config.js`, `client/src/theme.ts` (if exists)

### Backend Architecture

**Entry Point**: `server/index.ts`

- Express app setup
- Middleware: helmet, rate limiting, session
- Route registration: `/api/auth`, `/api/contracts`, etc.

**API Routes**: `server/api/*.ts`

- Modular route handlers (e.g., `contracts.ts`, `auth.ts`, `team.ts`)
- Use `isAuthenticated` middleware for protected routes
- Always filter data by `req.user.id` for security

**Database**: `server/db/`

- `schema.ts`: Drizzle ORM table definitions (users, contracts, teams, etc.)
- `migrate.ts`: Migration runner
- `server/db.ts`: Database connection (Neon serverless)
- Use Drizzle query builder: `db.query.contracts.findMany()`

**AI Integration**: `server/ai.ts`

- OpenAI GPT-4 integration for contract analysis
- Returns structured JSON: `{ summary, parties, dates, risks }`
- Temperature: 0.1 for consistency

**Authentication**: `server/auth.ts`

- `isAuthenticated` middleware
- Session-based auth with PostgreSQL session store
- Passwords hashed with bcrypt (10 rounds)

### Shared Types

**Shared Types**: `shared/types.ts`

- TypeScript interfaces used by both client and server
- Import as `@shared/types` (via TypeScript path alias)
- Key types: `User`, `Contract`, `Team`, `Invitation`

### Configuration Files

- `vite.config.ts`: Vite configuration (root: `client/`, output: `dist/client`, proxy: `/api` → `localhost:5000`)
- `tsconfig.json`: Root TypeScript config (client-focused)
- `tsconfig.server.json`: Server-specific TypeScript config
- `eslint.config.js`: ESLint rules (TypeScript, React, Prettier)
- `tailwind.config.js`: Tailwind CSS configuration
- `components.json`: shadcn/ui CLI configuration
- `design_guidelines.md`: Color palette, typography, spacing guidelines

### Adding New Features

**To add a new page:**

1. Create `client/src/pages/NewPage.tsx`
2. Add route in `client/src/App.tsx` (use `<ProtectedRoute>` if auth required)
3. Import UI components from `@/components/ui/*`
4. Call API functions from `@/api.ts`

**To add a new API endpoint:**

1. Create or extend handler in `server/api/*.ts`
2. Use `isAuthenticated` middleware + `req.user.id`
3. Add matching fetch function in `client/src/api.ts`
4. Register route in `server/index.ts`
5. Add types to `shared/types.ts`

**To add a new UI component:**

1. Use shadcn/ui CLI: `npx shadcn@latest add <component-name>`
2. Or create custom component in `client/src/components/`
3. Follow existing patterns (TypeScript props interface, Tailwind styling)

---

## General Guidance

- **Reuse existing patterns**: Use existing hooks, components, and abstractions before creating new ones
- **Follow TypeScript conventions**: Use `camelCase` for TS/JS, `snake_case` for database fields
- **Security**: Always filter by `userId`, validate inputs, use CSRF tokens
- **Error handling**: Throw descriptive errors in API functions, handle in components with error boundaries
- **Don't modify CI/build/architecture** unless explicitly requested
- **Consult design_guidelines.md** for styling decisions
- **Run linters and tests** before committing changes

---

For more details, see:

- `DEPLOYMENT.md`: Production deployment guide
- `design_guidelines.md`: UI/UX design system
- `.env.example`: Full list of environment variables
