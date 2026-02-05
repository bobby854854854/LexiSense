# LexiSense Copilot Instructions

## Project Overview
**LexiSense** is an AI-powered Contract Lifecycle Management (CLM) platform using React + Express + PostgreSQL. It analyzes contracts using OpenAI GPT-4, stores them in a database, and provides legal insights to users.

## Architecture Quick Reference

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js (ES modules) + Node.js  
- **Database**: PostgreSQL + Drizzle ORM
- **UI**: shadcn/ui (Radix UI components) + Tailwind CSS
- **AI**: OpenAI GPT-4 (gpt-4o model)
- **Auth**: Session-based with bcrypt + express-session

### Code Organization
```
client/src/         → React app (entry: main.tsx)
  ├─ pages/        → Page components (contracts, dashboard, login)
  ├─ components/   → Reusable React components
  │   └─ ui/       → shadcn/ui components (auto-generated)
  ├─ contexts/     → React context (AuthContext for auth state)
  ├─ hooks/        → Custom hooks (use-mobile, use-toast)
  └─ api.ts        → HTTP client using fetch
server/            → Express API (entry: index.ts)
  ├─ api/         → Router modules (contracts.ts, auth.ts)
  ├─ index.ts     → Express setup, middleware, route registration
  ├─ db.ts        → Drizzle ORM client & connection pool
  ├─ db/schema.ts → Table definitions (users, contracts)
  ├─ ai.ts        → OpenAI contract analysis logic
  └─ auth.ts      → Authentication middleware
shared/            → Shared types & schemas
  └─ types.ts     → TypeScript interfaces used by both client & server
```

## Critical Data Flows

### Contract Upload & Analysis
1. User uploads file → `POST /api/contracts/upload` 
2. Server extracts text, saves contract record with `status: "processing"`
3. `analyzeContract()` calls OpenAI GPT-4 with contract text
4. AI returns JSON with `summary`, `parties`, `keyDates`, `highLevelRisks`
5. Results stored in `contracts.aiInsights` (jsonb field)
6. Update status to `"completed"`

### Authentication
- Session stored in PostgreSQL via `connect-pg-simple`
- Passwords hashed with bcrypt (10 salt rounds)
- Protected routes require `isAuthenticated` middleware
- `AuthContext` reads session from server on app load

### Type Flow
- Shared interfaces in [shared/types.ts](shared/types.ts) used by both client & server
- Database schema in [server/db/schema.ts](server/db/schema.ts) defined with Drizzle
- API responses must match `Contract` interface
- Field names: use `camelCase` in TypeScript, database stores `snake_case`

## Build & Development Workflow

### First-Time Setup
```powershell
npm install
npm run env:check          # Verify OPENAI_API_KEY, DATABASE_URL
npm run db:setup           # Initialize database schema (requires .env)
npm run dev                # Start server + Vite dev server
```

### Required Environment Variables
```
OPENAI_API_KEY=sk-...      # OpenAI API key (required for AI features)
DATABASE_URL=postgresql://... # Neon/Postgres connection string
NODE_ENV=development       # Set by npm scripts automatically
SESSION_SECRET=dev-secret  # For session signing (use process.env fallback)
```

### Build Process
- **Development**: `npm run dev` → tsx runs server, Vite serves client
- **Production**: `npm run build` → Vite builds client to `dist/client`, esbuild bundles server to `dist/index.js`
- **Proxy**: Vite proxies `/api/*` requests to `http://localhost:3000` during dev

### Running Tests & Linting
```powershell
npm run test       # Vitest (no tests added yet)
npm run lint       # ESLint + TypeScript checks
npm run format     # Prettier formatting
npm run typecheck  # TypeScript without emitting
```

## Key Implementation Patterns

### API Client Pattern
[client/src/api.ts](client/src/api.ts) uses simple fetch with error handling:
```typescript
export async function getContracts(): Promise<Contract[]> {
  const response = await fetch('/api/contracts')
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}
```
- No custom fetch wrappers; plain fetch for simplicity
- Type responses with shared `Contract` interface

### React Route Structure
[client/src/App.tsx](client/src/App.tsx) uses `wouter` for routing:
- Protected routes wrap components with `<ProtectedRoute>`
- Public routes: `/`, `/login`
- Protected routes: `/dashboard`, `/contracts/:id`
- `MainLayout` wraps dashboard & contract views

### Database Query Pattern
[server/api/contracts.ts](server/api/contracts.ts) uses Drizzle query builder:
```typescript
const userContracts = await db.query.contracts.findMany({
  where: eq(contracts.userId, req.user.id),
  orderBy: (contracts, { desc }) => [desc(contracts.createdAt)],
})
```
- Always filter by `userId` for security
- Use `findMany` for lists, `findFirst` for single records

### AI Analysis Pattern
[server/ai.ts](server/ai.ts) enforces JSON response:
- Uses `response_format: { type: 'json_object' }` for structured output
- Prompt defines exact JSON schema (summary, parties, keyDates, risks)
- Parse `response.choices[0].message.content` and validate before storing
- Temperature set to 0.2 for consistency

### Component Pattern
- Functional components with TypeScript props interface
- shadcn/ui components imported from `@/components/ui/*`
- Use `useToast()` hook for notifications
- Use `useAuth()` for auth state in components

## Important Conventions

### Naming
- Database fields: `snake_case` (e.g., `first_name`, `created_at`)
- TypeScript/JS: `camelCase` (e.g., `firstName`, `createdAt`)
- Use consistent field names across schema, types, and API responses

### Security
- Rate limiting: 100 requests per 15 minutes per IP (via express-rate-limit)
- Helmet.js for security headers
- CSRF protection via csurf (check if implemented in routes)
- Input sanitization with DOMPurify for client-side
- All API endpoints require authentication except `/`, `/login`, `/api/auth/*`
- Multer file uploads limited to 10MB; stored in memory only (no disk)

### Error Handling
- Server: return `{ message: "error description" }` with appropriate HTTP status
- Client: API functions throw errors; components use error boundaries
- Avoid generic "An error occurred" messages; be specific

### Type Safety
- No `as any` type casts; use proper interfaces
- Shared types between client & server via `@shared/*` imports
- Database schema auto-generates types (check Drizzle docs if needed)

## Files to Know

**Critical for understanding architecture:**
- [server/index.ts](server/index.ts) - Express app setup & middleware
- [server/db/schema.ts](server/db/schema.ts) - Database table definitions
- [client/src/App.tsx](client/src/App.tsx) - Router & page structure
- [server/api/contracts.ts](server/api/contracts.ts) - Contract API endpoints
- [server/ai.ts](server/ai.ts) - AI analysis implementation
- [shared/types.ts](shared/types.ts) - Shared TypeScript interfaces

**Design & UI:**
- [design_guidelines.md](design_guidelines.md) - Color palette, typography, spacing
- [components.json](components.json) - shadcn/ui configuration

## Common Tasks

**Add a new API endpoint:**
1. Create handler in `server/api/*.ts` or extend existing
2. Use `isAuthenticated` middleware + userId from `req.user.id`
3. Add matching fetch function in `client/src/api.ts`
4. Add route registration in `server/index.ts`
5. Add types to `shared/types.ts`

**Add a new React page:**
1. Create component in `client/src/pages/PageName.tsx`
2. Add route in `client/src/App.tsx` (wrap with `ProtectedRoute` if needed)
3. Import UI components from `@/components/ui/*`
4. Call API functions from `@/api.ts`

**Debug database issues:**
1. Check `DATABASE_URL` in `.env`
2. Run `npm run db:setup` to initialize schema
3. Use Drizzle Studio (if available) or direct Postgres queries to inspect tables

## Known Issues & TODOs
- Authentication middleware is stubbed (check [server/auth.ts](server/auth.ts))
- No comprehensive test suite yet
- AI response validation could be more robust (consider JSON schema validation library)
