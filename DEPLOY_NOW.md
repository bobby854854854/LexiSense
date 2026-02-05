# 🚀 LexiSense Beta Deployment Instructions

## ✅ READY TO DEPLOY - Frontend Built Successfully!

### 1. Deploy Frontend to Vercel

```bash
# Login to Vercel (one-time setup)
npx vercel login

# Deploy to production
npx vercel --prod --yes
```

**Or use Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Import from GitHub: `https://github.com/bobby854854854/LexiSense.git`
3. Set build command: `npm run build:client`
4. Set output directory: `dist/client`

### 2. AWS S3 Bucket Setup

**Create S3 Bucket:**
```bash
aws s3 mb s3://lexisense-contracts-prod
```

**CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-vercel-url.vercel.app"],
    "ExposeHeaders": []
  }
]
```

**IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::lexisense-contracts-prod/*"
    }
  ]
}
```

### 3. Redis Setup (Upstash)

1. Go to https://upstash.com
2. Create Redis database
3. Copy connection URL: `redis://default:password@host:port`

### 4. Deploy Backend (Render)

1. Go to https://render.com
2. Connect GitHub repo
3. Create Web Service
4. Set build command: `npm run build:server`
5. Set start command: `npm start`

**Environment Variables:**
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:pass@host/db
REDIS_URL=redis://default:pass@host:port
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=lexisense-contracts-prod
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_key
EMAIL_FROM=LexiSense <noreply@lexisense.com>
SESSION_SECRET=your_32_char_secret
OPENAI_API_KEY=sk-your_key
APP_URL=https://your-vercel-url.vercel.app
```

### 5. Database Migration

```bash
# After backend deployment
npm run db:migrate
```

### 6. Verify Deployment

- Frontend: https://your-vercel-url.vercel.app
- Backend health: https://your-render-url.onrender.com/api/health
- Test file upload, email, rate limiting

## 🎉 GO LIVE!

Your LexiSense beta is ready for real customers with:
- ✅ Enterprise security (rate limiting, CSRF, XSS protection)
- ✅ AWS S3 file storage with streaming
- ✅ Redis distributed rate limiting
- ✅ Professional email templates
- ✅ Winston logging + audit trail
- ✅ Performance monitoring
- ✅ All frontend pages wired
- ✅ Pagination and search

**Next Steps:**
1. Set up monitoring alerts
2. Configure backup strategy
3. Add custom domain
4. Launch beta program! 🚀