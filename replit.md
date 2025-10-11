# LexiSense CLM Platform

## Overview

LexiSense is an enterprise-grade Contract Lifecycle Management (CLM) platform with AI-powered contract analysis and intelligence. The application provides secure contract storage, automated risk detection, AI-driven insights, and intelligent contract drafting capabilities. Built as a full-stack TypeScript application, it combines a React frontend with an Express backend, leveraging OpenAI for natural language processing and contract analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**

- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast HMR (Hot Module Replacement)
- **Wouter** for lightweight client-side routing instead of React Router

**UI Component System:**

- **Shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Design System**: Material Design-inspired approach optimized for enterprise data-dense interfaces
- **Theme Support**: Built-in light/dark mode with professional color palette (deep blue primary, semantic colors for status)
- **Typography**: Inter font family for UI, JetBrains Mono for code/contract text

**State Management:**

- **TanStack Query (React Query)** for server state management, caching, and data fetching
- Custom query client configuration with credentials-based authentication
- Local React state for UI interactions

**Key Frontend Features:**

- Dashboard with contract statistics and activity feed
- Contract repository with search, filtering, and table/card views
- AI-powered contract upload and analysis workflow
- AI contract drafting interface
- Analytics and reporting views
- Reusable component library (StatCard, ContractCard, RiskIndicator, etc.)

### Backend Architecture

**Runtime & Framework:**

- **Node.js** with **Express.js** for RESTful API server
- **TypeScript** with ESM (ES Modules) for modern JavaScript
- Custom middleware for request logging and error handling

**API Design:**

- RESTful endpoints under `/api` prefix
- JSON-based request/response format
- Structured error handling with HTTP status codes
- Route separation in `server/routes.ts`

**AI Integration:**

- **OpenAI API** integration for contract analysis and drafting
- Custom prompts for extracting key terms, obligations, risks, and opportunities
- AI-powered risk assessment (low/medium/high)
- Structured JSON responses from AI for consistent data parsing

### Data Storage

**Database:**

- **PostgreSQL** via Neon serverless database
- **Drizzle ORM** for type-safe database queries and schema management
- WebSocket-based connection pooling for serverless compatibility

**Schema Design:**

- `users` table: User authentication and management (currently not fully implemented)
- `contracts` table: Core contract storage with fields for:
  - Basic metadata (title, counterparty, type, status)
  - Financial data (value, dates)
  - AI-generated insights (JSONB field)
  - Risk assessment levels
  - Original contract text
- Timestamps for audit trail (createdAt, updatedAt)

**Data Access Pattern:**

- Repository pattern via `IStorage` interface in `server/storage.ts`
- `DbStorage` implementation using Drizzle ORM
- Type-safe schema definitions shared between client and server via `shared/schema.ts`

### Authentication & Authorization

**Current State:**

- User schema defined but authentication not fully implemented
- Session management infrastructure ready (connect-pg-simple for PostgreSQL sessions)
- Placeholder methods in storage layer for user operations

**Architectural Readiness:**

- User table with username/password fields
- Zod validation schemas for user input
- Session storage configuration present

### External Dependencies

**AI & Machine Learning:**

- **OpenAI API**: Contract analysis, risk detection, key term extraction, and AI drafting
  - Used for natural language understanding of contract text
  - Generates structured insights (obligations, risks, opportunities)
  - Powers contract drafting feature with customizable templates

**Database:**

- **Neon Serverless PostgreSQL**: Managed database with WebSocket support
  - Provides scalable, serverless database infrastructure
  - Connection pooling via `@neondatabase/serverless`

**UI Components:**

- **Radix UI**: Headless component primitives for accessibility
  - 25+ primitive components (Dialog, Dropdown, Popover, etc.)
  - ARIA-compliant, keyboard navigation support
- **Shadcn/ui**: Pre-built component library on top of Radix
- **Lucide React**: Icon library for consistent iconography

**Development Tools:**

- **Replit Plugins**: Development banner, error overlay, and cartographer for enhanced DX
- **Drizzle Kit**: Database migration and schema management CLI
- **TypeScript**: Type safety across full stack with shared types

**Fonts:**

- **Google Fonts**: Inter (primary UI font), JetBrains Mono (monospace for contracts)

**Build & Development:**

- **Vite**: Frontend bundling and development server
- **ESBuild**: Server-side bundling for production
- **PostCSS & Autoprefixer**: CSS processing for Tailwind
