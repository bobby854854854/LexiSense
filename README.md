# LexiSense

Quickstart (Windows PowerShell)

# LexiSense

Quickstart (Windows PowerShell)

Prerequisites:

- Node.js 18+ and npm or pnpm installed
- PostgreSQL if you plan to run the DB-backed storage
- Optional: `drizzle-kit` for migrations

Install dependencies:

```powershell
npm install
```

**Security Features:**

- Rate limiting (100 requests per 15 minutes per IP)
- Input validation and sanitization
- CSRF protection
- XSS prevention
- Security headers (Helmet.js)
- Error boundaries for React components

Run in development (client + server):

```powershell
# Starts the server in development mode (uses tsx)
npm run dev
```

Build for production:

```powershell
npm run build
npm run start
```

Notes and tips

- The project uses `cross-env` for cross-platform environment variables in npm scripts.
- Server entry is `server/index.ts` and client app root is `client/src/main.tsx`.
- If TypeScript reports missing types for Node or Express, install dev dependencies:

```powershell
npm install -D @types/node @types/express
```

If you still see errors about Node globals like `process`, add `"node"` to the `types` array under `compilerOptions` in `tsconfig.json`.

**Environment Variables:**

Create a `.env` file in the root directory:

```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=your_database_url_here
NODE_ENV=development
```

**Security Best Practices:**

- All user inputs are validated and sanitized
- API endpoints have rate limiting
- Error handling prevents information leakage
- Security headers are automatically applied
