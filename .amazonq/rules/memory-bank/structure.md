# LexiSense - Project Structure

## Directory Organization

### Root Level

```
LexiSense/
├── client/          # React frontend application
├── server/          # Express backend API
├── shared/          # Shared types and schemas
├── tests/           # Test suites
├── .amazonq/        # Amazon Q configuration and rules
├── .github/         # GitHub workflows and CI/CD
└── attached_assets/ # Static assets and resources
```

## Core Components

### Client (`/client`)

React-based single-page application with TypeScript.

**Structure:**

- `src/components/` - Reusable UI components
  - `ui/` - shadcn/ui component library (50+ components)
  - `examples/` - Example implementations of complex components
  - Root-level components for app-specific features
- `src/pages/` - Route-based page components
  - `dashboard.tsx` - Main landing page with metrics and overview
  - `contracts.tsx` - Contract repository and management
  - `contract-upload.tsx` - Contract import interface
  - `ai-drafting.tsx` - AI-powered contract creation
  - `analytics.tsx` - Reporting and insights
  - `not-found.tsx` - 404 error page
- `src/hooks/` - Custom React hooks
  - `use-toast.ts` - Toast notification management
  - `use-mobile.tsx` - Responsive design utilities
- `src/lib/` - Utility libraries
  - `api.ts` - API client with TanStack Query integration
  - `queryClient.ts` - React Query configuration
  - `utils.ts` - Helper functions (cn, date formatting)
  - `errorHandler.ts` - Error handling and boundaries
- `App.tsx` - Root application component with routing
- `main.tsx` - Application entry point
- `index.html` - HTML template

### Server (`/server`)

Express.js REST API with TypeScript.

**Structure:**

- `index.ts` - Server entry point, middleware setup, Express configuration
- `routes.ts` - API endpoint definitions and request handlers
- `security.ts` - Security middleware (rate limiting, validation, sanitization)
- `validation.ts` - Zod schema validators for request/response
- `db.ts` - Database connection and Drizzle ORM setup
- `db-storage.ts` - Database-backed storage implementation
- `storage.ts` - Storage abstraction layer
- `vite.ts` - Vite integration for development mode

### Shared (`/shared`)

Common code shared between client and server.

**Structure:**

- `schema.ts` - Zod schemas for data validation and TypeScript types

### Tests (`/tests`)

Test suites using Vitest and Supertest.

**Structure:**

- `server.routes.test.ts` - API endpoint integration tests

## Architectural Patterns

### Frontend Architecture

- **Component-Based**: Modular React components with clear separation of concerns
- **Composition Pattern**: shadcn/ui components composed for complex UIs
- **Custom Hooks**: Reusable logic extraction (toast, mobile detection)
- **Client-Side Routing**: Wouter for lightweight SPA routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **Error Boundaries**: React Error Boundary for graceful error handling

### Backend Architecture

- **RESTful API**: Express.js with standard HTTP methods
- **Layered Architecture**:
  - Routes layer (endpoint definitions)
  - Validation layer (input/output validation)
  - Security layer (rate limiting, sanitization)
  - Storage layer (database abstraction)
- **Middleware Pipeline**: Security → Validation → Business Logic → Response
- **Session Management**: express-session with PostgreSQL store

### Data Flow

1. **Client Request** → API client (`lib/api.ts`) → TanStack Query
2. **Server Receives** → Security middleware → Route handler
3. **Validation** → Zod schemas validate input
4. **Business Logic** → Storage layer interaction
5. **Response** → Validation → Client
6. **Client Updates** → React Query cache → UI re-render

### Database Architecture

- **ORM**: Drizzle ORM for type-safe database queries
- **Schema Definition**: `shared/schema.ts` defines data models
- **Migration**: drizzle-kit for schema migrations
- **Connection**: Neon serverless PostgreSQL

## Key Relationships

### Component Dependencies

- Pages depend on components and hooks
- Components depend on ui components and lib utilities
- All client code depends on shared schemas for type safety

### API Integration

- Client `api.ts` provides typed API methods
- Server `routes.ts` implements corresponding endpoints
- Shared `schema.ts` ensures type consistency

### Security Flow

- All requests pass through `security.ts` middleware
- Rate limiting applied per IP address
- Input sanitization via DOMPurify
- Validation via Zod schemas in `validation.ts`

## Configuration Files

### Build & Development

- `vite.config.ts` - Vite bundler configuration
- `tsconfig.json` - TypeScript compiler options
- `package.json` - Dependencies and scripts
- `drizzle.config.ts` - Database ORM configuration

### Styling

- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS plugins
- `components.json` - shadcn/ui component configuration
- `index.css` - Global styles and Tailwind imports

### Testing

- `vitest.config.ts` - Vitest test runner configuration

### CI/CD

- `.github/workflows/ci.yml` - GitHub Actions workflow

### Design

- `design_guidelines.md` - Comprehensive UI/UX design system documentation
