# Complete Build & Deployment Guide

## Overview

This monorepo contains a full-stack application that will be deployed to Vercel:

- **Frontend**: React + Vite SPA
- **Backend**: Express.js API with Prisma ORM
- **Database**: PostgreSQL (external)
- **Package Manager**: pnpm (monorepo)

## Local Build & Test (Complete Process)

### Prerequisites

```bash
# Node v20+ and pnpm required
node --version  # v20+
pnpm --version  # 8+

# If pnpm not installed:
npm install -g pnpm
```

### Full Build Process

**Step 1: Install Dependencies**

```bash
cd /path/to/moova-ecosystem
pnpm install
```

**Step 2: Generate Prisma Client**

```bash
pnpm prisma:generate
```

**Step 3: Setup Environment Variables**

```bash
# Copy and configure
cp .env.example .env.local

# Edit .env.local with:
# - DATABASE_URL (local PostgreSQL)
# - JWT_SECRET (any random string)
# - CORS_ORIGIN=http://localhost:3000
# - API keys if needed
```

**Step 4: Initialize Database**

```bash
# Create/migrate database schema
pnpm -F giva-backend prisma db push

# Seed initial data (optional, for development)
pnpm db:seed
```

**Step 5: Development Mode**

```bash
# Terminal 1: Frontend (port 3000)
pnpm dev

# Terminal 2: Backend (port 5000)
pnpm -F giva-backend dev
```

**Step 6: Production Build (Testing)**

```bash
# Run complete build
./build-complete.sh                    # Mac/Linux
build-complete.bat                     # Windows

# Or manually:
pnpm install
pnpm prisma:generate
pnpm run build:all
pnpm -F giva-backend run db:migrate

# Test built version
pnpm -F giva-backend run start
# Visit http://localhost:5000
```

## Vercel Deployment Process

### 1. Prerequisites

Before deploying, ensure:

- ✅ Local build succeeds: `./build-complete.sh`
- ✅ Code is in Git repository (GitHub, GitLab, Bitbucket)
- ✅ PostgreSQL database ready (Vercel Postgres, Neon, Railway, etc.)
- ✅ All secrets noted: JWT_SECRET, API keys, Admin credentials

### 2. Create Vercel Project

**Option A: Via Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. "Import Git Repository"
4. Select your repository
5. Configure:
   - **Root Directory**: `.` (root)
   - **Framework**: `Vite`
   - **Build Command**: `pnpm install && pnpm run build:all`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Create project
vercel

# Select options:
# ? Set up and configure a new project? Yes
# ? Which scope? Your account
# ? Link to existing project? No
# ? What's your project's name? moova-ecosystem
# ? In which directory is your code? ./
# ? Want to modify these settings? No
```

### 3. Set Environment Variables

**In Vercel Dashboard → Settings → Environment Variables:**

Add these for **Production**:

```
DATABASE_URL = postgresql://...
JWT_SECRET = <random_32+_char_string>
CORS_ORIGIN = https://your-deployment.vercel.app
GEMINI_API_KEY = <your_key>
ADMIN_EMAIL = admin@yourdomain.com
ADMIN_PASSWORD = <secure_password>
NODE_ENV = production
```

**For Preview:** (optional)

```
Same as production, or use test values
```

### 4. Deploy

**Option A: Automatic**

```bash
# Push to main branch
git push origin main

# Vercel automatically deploys
# Monitor at: https://vercel.com/dashboard/moova-ecosystem
```

**Option B: Manual via CLI**

```bash
vercel --prod
```

### 5. Run Initial Database Setup

**After first deployment**, run migrations and seed:

**Option A: Using Vercel CLI**

```bash
# Pull production environment
vercel env pull

# Run migrations
pnpm -F giva-backend prisma migrate deploy

# Seed database (creates admin account)
pnpm -F giva-backend prisma db seed
```

**Option B: Using Database Admin Panel**

1. Open PostgreSQL admin (pgAdmin, DBeaver, or your provider's panel)
2. Verify `_prisma_migrations` table exists
3. Manually execute all migrations if needed
4. Manually execute seed statements

**Option C: SSH into Vercel (Advanced)**

```bash
# Not available with Vercel - use CLI method instead
```

### 6. Verify Deployment

Test your live deployment:

```bash
# Test frontend
curl https://your-deployment.vercel.app
# Should return HTML with no errors

# Test API
curl https://your-deployment.vercel.app/api/public/events
# Should return JSON array

# Test image uploads
curl -X POST https://your-deployment.vercel.app/api/upload \
  -F "file=@/path/to/image.jpg"
# Should upload to /uploads/avatars/
```

### 7. Troubleshooting Deployment

#### Build Fails: "prisma not found"

**Solution:**

1. Check `backend/package.json` has `@prisma/client` in dependencies
2. Force rebuild in Vercel:
   - Go to Deployments → Select failed deployment → Redeploy

#### Build Fails: "DATABASE_URL not set"

**Solution:**

1. Go to Settings → Environment Variables
2. Verify DATABASE_URL is added
3. Redeploy from dashboard

#### API Responds 502 (Bad Gateway)

**Solution:**

1. Check backend/dist/server.js exists
2. Verify DATABASE_URL is accessible from Vercel
3. Check logs: Dashboard → Deployments → Logs
4. Ensure database firewall allows Vercel IPs

#### Frontend Shows Blank Page

**Solution:**

1. Check dist/ folder exists
2. Check browser console: F12 → Console
3. Check Network tab for 404s
4. Verify VITE_API_URL points to backend

#### Files Can't Upload

**Solution:**

1. uploads/ directory must be writable
2. On Vercel, use external storage:
   - AWS S3
   - Vercel Blob
   - Cloudinary
3. Update multer config to use external storage

## Scripts Reference

### Root Scripts (Frontend)

```bash
pnpm dev              # Start dev server (port 3000)
pnpm build            # Build frontend to dist/
pnpm build:all        # Build frontend + backend
pnpm preview          # Preview production build locally
pnpm start            # Start backend server
pnpm db:migrate       # Run pending migrations
pnpm db:seed          # Seed database
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:studio    # Open Prisma Studio GUI
```

### Backend Scripts

```bash
pnpm -F giva-backend dev        # Start with auto-reload
pnpm -F giva-backend build      # TypeScript compilation
pnpm -F giva-backend start      # Run compiled server
pnpm -F giva-backend db:migrate # Run migrations
pnpm -F giva-backend db:push    # Create/update schema without migrations
```

## File Structure for Deployment

```
moova-ecosystem/
├── dist/                    # Frontend build output (Vercel serves)
├── backend/
│   ├── dist/               # Backend build output
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── migrations/     # Migration files
│   │   └── seed.ts         # Database seed
│   ├── src/                # TypeScript source
│   └── package.json
├── pages/                  # Frontend pages
├── components/             # React components
├── public/                 # Static assets
├── package.json            # Root package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json            # Vercel configuration ✓
├── .vercelignore          # Files to exclude ✓
├── .env.example           # Environment template ✓
├── DEPLOYMENT.md          # Deployment guide ✓
└── build-complete.sh      # Build script ✓
```

## Database URL Formats

### Vercel Postgres

```
postgresql://user:password@aws-0-us-east-1.vercel-storage.com:5432/verceldb?sslmode=require
```

### Neon

```
postgresql://user:password@pg.neon.tech/database?sslmode=require
```

### Railway

```
postgresql://user:password@containers.railway.app:5432/railway
```

### PlanetScale (MySQL compatibility)

```
mysql://user:password@gateway-us-west-2.railway.app:3306/database
```

## Monitoring & Maintenance

### Weekly Tasks

- [ ] Check Vercel Analytics for errors
- [ ] Monitor database performance
- [ ] Review user feedback

### Monthly Tasks

- [ ] Update dependencies: `pnpm update`
- [ ] Review and clean up logs
- [ ] Backup database (if self-managed)

### When Deploying Updates

```bash
# Make changes locally
# ...modify code...

# Test build locally
./build-complete.sh

# If successful, commit and push
git add .
git commit -m "Update features/fixes"
git push origin main

# Vercel automatically deploys
# Monitor at dashboard
```

## Security Checklist

- [ ] No credentials in public code
- [ ] JWT_SECRET is random and strong (32+ chars)
- [ ] CORS_ORIGIN restricted to production domain
- [ ] Database has firewall configured
- [ ] File uploads validated for file type/size
- [ ] API endpoints protected with auth/role checks
- [ ] Admin routes require SUPERADMIN role
- [ ] Environment variables use Vercel secrets
- [ ] HTTPS enforced (Vercel default)
- [ ] Database backup strategy in place

## Rollback & Recovery

### Rollback to Previous Version

```bash
# Via Vercel Dashboard
# Deployments → Select previous → Promote

# Via CLI
vercel rollback
```

### Recover from Database Corruption

1. Stop application
2. Restore from backup
3. Redeploy once database is healthy

### Clear Database & Restart

⚠️ **Destructive Operation** - Only for development

```bash
# Local only - NEVER in production!
pnpm -F giva-backend prisma migrate reset

# Vercel production - ask team first!
# Use database admin panel to:
# 1. Drop all tables
# 2. Run all migrations again
# 3. Run seed to recreate initial data
```

---

**Last Updated:** 2026-03-23  
**Version:** 1.0  
**Status:** Ready for Production Deployment
