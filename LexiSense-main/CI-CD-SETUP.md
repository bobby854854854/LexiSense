# CI/CD Setup Guide

## GitHub Actions Secrets

Add these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):

### Vercel Deployment

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

**Get Vercel credentials:**

1. Go to https://vercel.com/account/tokens
2. Create new token
3. Run `npx vercel link` to get org and project IDs

## Pre-commit Hooks

Automatically runs on every commit:

- ESLint (auto-fix)
- Prettier (auto-format)
- Type checking

**Skip hooks (emergency only):**

```bash
git commit --no-verify -m "message"
```

## CI/CD Workflows

### PR Quality Checks (`pr-checks.yml`)

Runs on every pull request:

- ✅ Type checking
- ✅ Linting
- ✅ Format validation
- ✅ Build verification

### Production Deployment (`deploy.yml`)

Runs on push to main:

- ✅ Build frontend
- ✅ Deploy to Vercel
- ✅ Notify on success

### Full CI/CD Pipeline (`ci-cd.yml`)

Comprehensive checks and deployment

## Manual Deployment

```bash
# Deploy frontend
npm run deploy:vercel

# Deploy backend (Render)
git push origin main
```

## Environment Setup

**Required for CI/CD:**

- Node.js 20+
- npm ci (clean install)
- All secrets configured

**Local development:**

```bash
npm install
npm run prepare  # Setup husky
npm run dev
```
