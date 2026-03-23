# Vercel Deployment Guide

This document outlines the complete deployment process for the GIVA Moova Ecosystem application.

## Architecture

- **Frontend**: React + Vite SPA (deployed to Vercel Edge)
- **Backend**: Express.js API (deployed to Vercel Serverless Functions)
- **Database**: PostgreSQL (managed externally, e.g., Vercel Postgres, Neon, Railway)
- **Package Manager**: pnpm monorepo

## Pre-Deployment Checklist

### 1. Environment Variables Setup

Create the following environment variables in Vercel project settings:

#### Database

- `DATABASE_URL` - PostgreSQL connection string (required)

#### Security

- `JWT_SECRET` - Secure random string for JWT signing
- `CORS_ORIGIN` - Frontend domain (e.g., https://yourdomain.com)

#### API Keys

- `GEMINI_API_KEY` - Google Gemini API key for AI features

#### Server

- `NODE_ENV` - Set to "production"
- `PORT` - Set to "5000" (Vercel will override at runtime)

#### Admin Credentials (for initial seeding)

- `ADMIN_EMAIL` - Admin account email
- `ADMIN_PASSWORD` - Admin account password

### 2. Database Setup

You must have a PostgreSQL database ready. Options:

- **Vercel Postgres** (recommended for Vercel deployments)
  - https://vercel.com/docs/storage/vercel-postgres
- **Neon** (Free tier PostgreSQL)
  - https://neon.tech
- **Railway** (Developer-friendly)
  - https://railway.app
- **PlanetScale/TiDB Cloud**
  - https://planetscale.com / https://tidbcloud.com

Once database is created, get the `DATABASE_URL` connection string.

### 3. Local Testing

Before deploying, test the complete build locally:

```bash
# Make the build script executable
chmod +x build-complete.sh

# Run the complete build
./build-complete.sh
```

Or use pnpm directly:

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Build frontend
pnpm run build

# Build backend
pnpm -F giva-backend run build

# Test backend
pnpm -F giva-backend run start
```

## Deployment Steps

### Step 1: Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

Or use the Vercel dashboard at https://vercel.com

### Step 2: Configure Environment Variables

In Vercel dashboard:

1. Go to Settings → Environment Variables
2. Add all required variables (see Pre-Deployment Checklist)
3. Ensure variables are available for Production environment

### Step 3: Run Migrations and Seed (One Time)

After first deployment, run migrations and seed:

**Using Vercel CLI:**

```bash
# Connect to your Vercel project
vercel link

# Run migrations
vercel env pull
pnpm prisma migrate deploy

# Run seed (optional, for initial data)
pnpm db:seed
```

**Or manually in your database admin panel:**

1. Execute all migration files in order
2. Run seed.ts to populate initial data

### Step 4: Verify Deployment

1. Check frontend is accessible: `https://your-domain.com`
2. Check API is accessible: `https://your-domain.com/api/health`
3. Verify database connection in logs

## Build Process Explained

The `vercel.json` configuration handles:

1. **Frontend Build** (Vite)
   - Optimizes React components
   - Bundles CSS with Tailwind
   - Outputs to `dist/`
   - Served as static files

2. **Backend Build** (TypeScript + Express)
   - Compiles TypeScript to JavaScript
   - Outputs to `backend/dist/`
   - Runs as Vercel Serverless Function

3. **Environment Variables**
   - Frontend: Available as `process.env.VITE_*`
   - Backend: Available as `process.env.*`

4. **Database Initialization**
   - Prisma migrations run automatically
   - Seed script can be run manually
   - Connection pool configured via `DATABASE_URL`

## Scripts Reference

### Frontend (Root)

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm preview      # Preview production build
```

### Backend

```bash
pnpm -F giva-backend dev        # Start dev server with auto-reload
pnpm -F giva-backend build      # Build TypeScript
pnpm -F giva-backend start      # Run compiled server
pnpm -F giva-backend seed       # Seed database
```

## Troubleshooting

### Build Fails with "prisma not found"

Solution: Add `@prisma/engines` to `prisma.installEngine` in backend `package.json`:

```json
{
  "prisma": {
    "installEngine": "builtin"
  }
}
```

### Database Connection Timeout

- Verify DATABASE_URL is correct in environment variables
- Check database is accessible from Vercel's IP range
- Add Vercel IPs to database firewall if using managed database

### Migrations Not Running

- Ensure DATABASE_URL is set before build
- Run migrations manually after deployment:
  ```bash
  vercel env pull
  pnpm -F giva-backend prisma migrate deploy
  ```

### Large Build Size

The `vercel.json` specifies `sourceFilesOutsideRootDirectory: true` to handle the monorepo structure.

If size issues occur:

1. Exclude unnecessary files in `.vercelignore`
2. Optimize dependencies
3. Check node_modules size with `pnpm why <package>`

## Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] API endpoints respond correctly
- [ ] Database migrations have run
- [ ] Authentication works (JWT tokens)
- [ ] File uploads work (avatars, certificates)
- [ ] Email notifications setup (if applicable)
- [ ] Admin panel accessible to admins only
- [ ] CORS properly configured for your domain

## Environment Variables Checklist

```
✓ DATABASE_URL           - PostgreSQL connection
✓ JWT_SECRET            - Signing key (min 32 chars)
✓ CORS_ORIGIN           - Your frontend domain
✓ GEMINI_API_KEY        - AI features
✓ ADMIN_EMAIL           - Initial admin
✓ ADMIN_PASSWORD        - Initial admin password
✓ NODE_ENV              - "production"
```

## Rollback Procedure

If deployment fails:

1. Revert to previous version:

   ```bash
   vercel rollback
   ```

2. Check build logs:
   - Dashboard → Deployments → View Logs

3. Fix issues and redeploy:
   ```bash
   git push  # or vercel deploy
   ```

## Monitoring

Monitor your deployment:

1. **Vercel Dashboard**: https://vercel.com/dashboard
   - Build logs
   - Function metrics
   - Edge requests

2. **Prisma Dashboard** (if using Prisma Cloud):
   - Database queries
   - Performance metrics

3. **Application Logs**:
   - Check browser console
   - Check API response headers

## Support

For issues:

- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Express Docs: https://expressjs.com
- React Docs: https://react.dev
