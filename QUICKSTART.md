# LexiSense - Quick Start Guide

## Critical First Step
Move the utils file to the expected location:

```powershell
# Windows PowerShell
mkdir client\src\lib -Force
Move-Item -Path client\src\utils.ts -Destination client\src\lib\utils.ts
```

Or for bash/Linux/Mac:
```bash
mkdir -p client/src/lib
mv client/src/utils.ts client/src/lib/utils.ts
```

## Environment Variables
Create a `.env` file in the project root (already exists) and ensure these are set:

```
DATABASE_URL=your_neon_database_url_here
OPENAI_API_KEY=your_openai_api_key_here
SESSION_SECRET=your_secure_random_secret_here
NODE_ENV=development
PORT=5000
```

## Installation & Build Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npm run db:setup
```

### 3. Type Check
```bash
npm run typecheck
```

### 4. Build for Production
```bash
npm run build
```

### 5. Development Mode
```bash
npm run dev
```

### 6. Production Mode
```bash
npm run start
```

## Project Structure

```
LexiSense/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React context
│   │   ├── lib/           # Utilities (after moving utils.ts)
│   │   ├── App.tsx        # Root component
│   │   └── main.tsx       # Entry point
│   └── index.html         # HTML template
├── server/                # Express backend
│   ├── api/              # API route handlers
│   ├── db/               # Database configuration
│   ├── index.ts          # Server entry point
│   └── ai.ts             # AI integration
├── shared/               # Shared types & schema
│   ├── schema.ts         # Database schema
│   └── types.ts          # TypeScript types
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies & scripts

```

## API Endpoints

### Contracts
- `GET /api/contracts` - Fetch all contracts
- `GET /api/contracts/:id` - Fetch single contract
- `POST /api/contracts/upload` - Upload contract file

### Health Check
- `GET /api/health` - Server health status

## Key Features Fixed

✅ TypeScript compilation without errors
✅ Database schema defined
✅ Server entry point configured
✅ Client-side API functions created
✅ React context providers set up
✅ Build configuration ready

## Troubleshooting

### TypeScript Errors
If you see TypeScript errors, ensure:
1. `client/src/lib/utils.ts` exists (move from client/src/utils.ts)
2. Run `npm install` to get all dependencies
3. Run `npm run typecheck` to verify

### Build Fails
- Check that DATABASE_URL is valid
- Ensure all node_modules are installed
- Try `npm ci` instead of `npm install` for clean install

### Server Won't Start
- Check PORT 5000 is not in use
- Ensure .env file is in project root
- Check DATABASE_URL connection string

## Development Workflow

1. Start development server: `npm run dev`
2. Open http://localhost:5000 in browser
3. Make changes to client or server code
4. Changes auto-reload in development mode
5. Run `npm run typecheck` before committing

## Deployment Checklist

- [ ] Move utils.ts to client/src/lib/
- [ ] Set environment variables
- [ ] Run npm install
- [ ] Run npm run typecheck
- [ ] Run npm run build
- [ ] Test with npm run start
- [ ] Deploy dist/ folder

---

For detailed information about all fixes applied, see `BUILD_FIX_SUMMARY.md`
