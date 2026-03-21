# LexiSense - Contract Lifecycle Management Platform

## Original Problem Statement
Build a full stack app using the provided LexiSense.zip - an Enterprise AI-powered Contract Lifecycle Management platform.

## User Choices
- **Database**: Full PostgreSQL schema migration to MongoDB
- **AI Integration**: GPT-5.2 with Emergent LLM key
- **Features**: All MVP features + email notifications + version history + expiration alerts
- **Storage**: AWS S3 with placeholder credentials (MOCKED)
- **Email Service**: Resend API for team invitations and alerts

## Architecture

### Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Radix UI components
- **Backend**: FastAPI (Python) + Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: GPT-5.2 via emergentintegrations library
- **Storage**: AWS S3 (placeholder credentials)
- **Email**: Resend API
- **Auth**: JWT-based authentication

### API Endpoints
**Auth**
- `POST /api/auth/register` - User registration with organization creation
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user

**Dashboard**
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/activity` - Recent activity

**Contracts**
- `GET/POST /api/contracts` - List/upload contracts
- `GET /api/contracts/:id` - Get contract details
- `PATCH /api/contracts/:id` - Update contract (creates version)
- `DELETE /api/contracts/:id` - Delete contract
- `POST /api/contracts/:id/chat` - AI chat about contract
- `GET /api/contracts/:id/versions` - Get version history
- `GET /api/contracts/:id/versions/:num` - Get specific version
- `POST /api/contracts/:id/restore/:num` - Restore to version

**Team**
- `GET /api/team/members` - List team members
- `POST /api/team/invite` - Invite team member (sends email)
- `GET /api/team/invitations` - List invitations

**Alerts**
- `GET /api/alerts/settings` - Get alert settings
- `PUT /api/alerts/settings` - Update alert settings
- `GET /api/alerts/expiring` - Get expiring contracts
- `POST /api/alerts/check-and-send` - Send alert emails
- `GET /api/alerts/history` - Alert history

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
- [x] Professional dark theme enterprise UI

### Phase 2 - Enhanced Features (2026-03-20)
- [x] Email service integration (Resend API)
- [x] Team invitation emails with branded HTML templates
- [x] Contract version history tracking
- [x] Version restore functionality
- [x] Expiration alerts system
- [x] Configurable alert settings (days before expiry)
- [x] Alert email notifications
- [x] Alerts dashboard page

## User Personas
1. **Legal Counsel** - Reviews and analyzes contracts for risks
2. **Contract Manager** - Uploads and organizes contracts
3. **Team Admin** - Manages team access and permissions
4. **Executive** - Views dashboard metrics and high-level insights

## Mocked/Placeholder Components
- **AWS S3 Storage**: Using placeholder credentials, returns mock storage keys

## Prioritized Backlog

### P0 - Critical (Complete)
- [x] All core features implemented
- [x] Email notifications
- [x] Version history
- [x] Expiration alerts

### P1 - Important
- [ ] Bulk contract upload
- [ ] Advanced search filters
- [ ] Contract comparison view
- [ ] Export contracts to PDF

### P2 - Nice to Have
- [ ] Contract templates library
- [ ] Analytics charts and reports
- [ ] Mobile responsive improvements
- [ ] Dark/Light theme toggle

## Next Tasks
1. Add real AWS S3 credentials for production file storage
2. Set up scheduled job for automatic daily alert emails
3. Add contract comparison view
4. Implement bulk upload functionality
