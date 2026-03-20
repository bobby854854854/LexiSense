# LexiSense

Enterprise AI-powered Contract Lifecycle Management platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev

# Build for production
npm run build
```

## 📦 Deployment

See [DEPLOY_NOW.md](./DEPLOY_NOW.md) for complete deployment instructions.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Storage**: AWS S3 with streaming uploads
- **Cache**: Redis for distributed rate limiting
- **Email**: SMTP with professional templates
- **Logging**: Winston with structured audit trails

## 🔒 Security Features

- Rate limiting (Redis-backed)
- CSRF protection
- XSS prevention
- Input validation
- Session management
- Audit logging

## 📊 Features

- AI contract analysis
- Team collaboration
- File upload with magic number validation
- Performance monitoring
- Email invitations
- Pagination and search

## 🛠️ Scripts

```bash
npm run dev          # Development server
npm run build        # Build production
npm run start        # Start production server
npm run check-env    # Validate environment
npm run db:migrate   # Run database migrations
npm run cleanup:invitations  # Clean expired invites
```

## 📄 License

MIT
