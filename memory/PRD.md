# LexiSense - Contract Lifecycle Management Platform

## Original Problem Statement
Build a full stack app using the provided LexiSense.zip - an Enterprise AI-powered Contract Lifecycle Management platform.

## User Choices
- **Database**: Full PostgreSQL schema migration to MongoDB
- **AI Integration**: GPT-5.2 with Emergent LLM key
- **Features**: All MVP features + email notifications + version history + expiration alerts + Phase 3 features + Workflow + RBAC + Audit + Notifications
- **Storage**: AWS S3 with placeholder credentials (MOCKED)
- **Email Service**: Resend API for team invitations and alerts

## Architecture

### Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Radix UI / shadcn + Recharts
- **Backend**: FastAPI (Python) + Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: GPT-5.2 via emergentintegrations library
- **Storage**: AWS S3 (placeholder credentials - MOCKED)
- **Email**: Resend API
- **Auth**: JWT-based authentication
- **Scheduler**: APScheduler for daily alert emails

### Code Architecture
```
/app
├── backend/
│   ├── models/          # Pydantic models (user, contract, audit, notification)
│   ├── routes/          # FastAPI routers (auth, contracts, workflow, audit, notifications, etc.)
│   ├── services/        # Business logic (AI analysis, PDF, email, audit, scheduler)
│   ├── utils/           # Auth helpers (JWT, RBAC require_role)
│   └── server.py        # Main FastAPI app entry point
└── frontend/
    ├── src/
    │   ├── components/  # Reusable UI components (Layout with notifications, shadcn/ui)
    │   ├── contexts/    # React contexts (Auth, Theme)
    │   ├── pages/       # Page components (Dashboard, Contracts, Analytics, AuditLog, etc.)
    │   ├── App.js       # Main router setup
    │   └── api.js       # Centralized API calls
    └── package.json
```

### API Endpoints
**Auth**: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
**Dashboard**: GET /api/dashboard/stats, GET /api/dashboard/activity
**Contracts**: GET/POST /api/contracts, GET/PATCH/DELETE /api/contracts/:id, POST /api/contracts/bulk, POST /api/contracts/:id/chat, GET /api/contracts/:id/versions
**Workflow**: GET /api/contracts/workflow/states, POST /api/contracts/:id/workflow/{action}, GET /api/contracts/:id/workflow/history
**Team**: GET /api/team/members, POST /api/team/invite, GET /api/team/invitations
**Alerts**: GET/PUT /api/alerts/settings, GET /api/alerts/expiring, POST /api/alerts/check-and-send
**Templates**: GET/POST /api/templates, GET /api/templates/default, DELETE /api/templates/:id
**Analytics**: GET /api/analytics/overview, GET /api/analytics/contracts/:id/compare/:id2
**Export**: GET /api/export/contract/:id/pdf, GET /api/export/analytics/pdf
**Audit**: GET /api/audit
**Notifications**: GET /api/notifications, GET /api/notifications/unread-count, POST /api/notifications/:id/read, POST /api/notifications/read-all

## What's Been Implemented

### Phase 1 - MVP (2026-03-20)
- [x] User registration/login with JWT
- [x] Organization creation on registration
- [x] Dashboard with stats cards and recent contracts
- [x] Contracts page with upload modal
- [x] Contract detail page with AI analysis tabs
- [x] AI chat interface for contract Q&A
- [x] Team management page
- [x] Team member invitation system

### Phase 2 - Enhanced Features (2026-03-20)
- [x] Email service integration (Resend API)
- [x] Contract version history tracking
- [x] Expiration alerts system
- [x] Configurable alert settings

### Phase 3 - Advanced Features (2026-03-21)
- [x] Bulk contract upload
- [x] Advanced search filters
- [x] Contract comparison view
- [x] PDF export
- [x] Contract templates library
- [x] Analytics with Recharts (PieChart, BarChart, LineChart)
- [x] Dark/Light theme toggle
- [x] Scheduled daily alert emails

### Phase 4 - Enterprise Features (2026-03-21)
- [x] Contract Workflow/Approval System (Draft -> Review -> Approved -> Active)
- [x] Role-Based Access Control (admin/manager/user/viewer)
- [x] Audit Logging for all operations
- [x] In-app Notification Center with bell icon
- [x] Audit Log page with filtering
- [x] Manager role for approvals
- [x] Mobile responsive improvements

### Testing Status
- [x] iteration_1: Core features (passed)
- [x] iteration_2: Phase 2 features (passed)
- [x] iteration_3: Phase 3 features - 30/30 backend + all frontend (100%)
- [x] iteration_4: Phase 4 features - 17/17 backend + all frontend (100%)

## Roles & Permissions
| Action | Admin | Manager | User | Viewer |
|--------|-------|---------|------|--------|
| Upload contracts | Yes | Yes | Yes | No |
| Delete any contract | Yes | Yes | No | No |
| Approve/Reject contracts | Yes | Yes | No | No |
| Submit for review | Yes | Yes | Yes | No |
| Invite team members | Yes | No | No | No |
| View audit logs | Yes | Yes | No | No |
| Update alert settings | Yes | No | No | No |

## Mocked/Placeholder Components
- **AWS S3 Storage**: Using placeholder credentials, returns mock storage keys

## Prioritized Backlog

### P3 - Future Enhancements
- [ ] Real AWS S3 credentials for production file storage
- [ ] Contract tagging and categorization
- [ ] Custom contract fields
- [ ] Advanced reporting and export options
- [ ] Multi-language support
- [ ] Two-factor authentication
- [ ] API rate limiting and usage tracking

## 3rd Party Integrations
- **OpenAI GPT-5.2**: Uses Emergent LLM Key
- **Resend**: API Key provided
- **AWS S3**: MOCKED with placeholder credentials
