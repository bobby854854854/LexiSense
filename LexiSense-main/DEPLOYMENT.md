# LexiSense Beta Deployment Guide

## Frontend Deployment (Vercel)

1. **Build the frontend:**

```bash
npm run build:client
```

2. **Deploy to Vercel:**

```bash
npx vercel --prod
```

3. **Environment Variables (Vercel Dashboard):**

- `VITE_API_URL` - Your backend API URL

## Backend Deployment (Render/Railway)

1. **Build the backend:**

```bash
npm run build:server
```

2. **Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Redis (for distributed rate limiting)
REDIS_URL=redis://user:pass@host:port

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=lexisense-contracts

# Email (SendGrid/SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_key
EMAIL_FROM=LexiSense <noreply@lexisense.com>

# Security
SESSION_SECRET=your_32_char_secret
OPENAI_API_KEY=sk-your_key

# App
NODE_ENV=production
PORT=5000
APP_URL=https://your-frontend-url.vercel.app
```

## S3 Bucket Setup

1. **Create S3 bucket** with these settings:
   - Block public access: ON
   - Versioning: OFF
   - Encryption: AES-256

2. **CORS Configuration:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-frontend-url.vercel.app"],
    "ExposeHeaders": []
  }
]
```

3. **IAM Policy for S3 access:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::lexisense-contracts/*"
    }
  ]
}
```

## Redis Setup (Upstash/Redis Labs)

1. Create Redis instance
2. Copy connection URL to `REDIS_URL`
3. Rate limiting will automatically use Redis when available

## Database Migration

```bash
npm run db:migrate
```

## Health Check

After deployment, verify:

- `GET /api/health` returns performance metrics
- Frontend loads and routes work
- File upload to S3 works
- Email invitations send
- Rate limiting active

## Monitoring

- Check logs: `tail -f logs/combined.log`
- Audit trail: `tail -f logs/audit.log`
- Errors: `tail -f logs/error.log`

## Background Jobs (Optional)

Set up cron job for cleanup:

```bash
# Run daily at 2 AM
0 2 * * * cd /app && npm run cleanup:invitations
```

## Beta Ready Checklist ✅

- [x] React frontend deployed & live
- [x] Real AWS S3 storage with streaming
- [x] Winston logging + audit trail
- [x] Redis distributed rate limiting
- [x] Professional email templates
- [x] Security vulnerabilities fixed
- [x] All frontend pages wired
- [x] Contracts list pagination
- [x] Performance metrics endpoint
- [x] Background cleanup job
