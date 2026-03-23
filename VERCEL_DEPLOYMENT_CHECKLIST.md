# Vercel Deployment Checklist

## Pre-Deployment Phase

### 1. Local Testing ✓

- [ ] Run `pnpm install`
- [ ] Run `./build-complete.sh` (Mac/Linux) or `build-complete.bat` (Windows)
- [ ] Verify no build errors
- [ ] Test frontend runs: `pnpm dev`
- [ ] Test backend runs: `pnpm -F giva-backend run start`
- [ ] Test API endpoints are accessible

### 2. Code Quality ✓

- [ ] No console errors in browser
- [ ] No TypeScript compilation errors
- [ ] All dependencies are declared in package.json
- [ ] No hardcoded credentials in code
- [ ] No references to localhost in production code

### 3. Git Setup ✓

- [ ] All code committed to git
- [ ] Branch is clean (no uncommitted changes)
- [ ] Ready to push to GitHub

## Database Setup Phase

### 3. PostgreSQL Database ✓

Choose ONE and set it up:

**Option A: Vercel Postgres** (Recommended)

- [ ] Go to: https://vercel.com/docs/storage/vercel-postgres
- [ ] Create database in Vercel Console
- [ ] Copy DATABASE_URL

**Option B: Neon**

- [ ] Go to: https://neon.tech
- [ ] Create account and project
- [ ] Copy DATABASE_URL

**Option C: Railway**

- [ ] Go to: https://railway.app
- [ ] Create account and project
- [ ] Copy DATABASE_URL

**Option D: Other (PlanetScale, TiDB, etc.)**

- [ ] Copy DATABASE_URL from your provider

### 4. Environment Variables Ready ✓

- [ ] DATABASE_URL - PostgreSQL connection string
- [ ] JWT_SECRET - Random string (min 32 chars)
  ```bash
  # Generate one with:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] CORS_ORIGIN - Your frontend domain (e.g., https://myapp.vercel.app)
- [ ] GEMINI_API_KEY - From Google AI Studio
- [ ] ADMIN_EMAIL - Admin account email
- [ ] ADMIN_PASSWORD - Admin account password
- [ ] NODE_ENV - Set to "production"

## Vercel Deployment Phase

### 5. Create Vercel Project ✓

- [ ] Go to: https://vercel.com/dashboard
- [ ] Click "Add New" → "Project"
- [ ] Import from Git (GitHub/GitLab/Bitbucket)
- [ ] Select your repository
- [ ] Configure project:
  - Framework: **Vite**
  - Root Directory: **./** (root)
  - Build Command: **pnpm install && pnpm run build:all**
  - Output Directory: **dist**
  - Install Command: **pnpm install**

### 6. Set Environment Variables ✓

In Vercel Dashboard → Settings → Environment Variables:

**Production Variables:**

- [ ] DATABASE_URL = `your_postgres_url`
- [ ] JWT_SECRET = `your_secret_key`
- [ ] CORS_ORIGIN = `https://your-project.vercel.app`
- [ ] GEMINI_API_KEY = `your_api_key`
- [ ] ADMIN_EMAIL = `admin@yourdomain.com`
- [ ] ADMIN_PASSWORD = `secure_password`
- [ ] NODE_ENV = `production`
- [ ] PORT = `5000`

**Preview Variables (optional):**

- [ ] Same as production or test values

### 7. Deploy ✓

- [ ] Push code to Git: `git push origin main`
- [ ] Vercel automatically deploys
- [ ] Monitor build in Vercel Dashboard:
  - Check Build Log for errors
  - Wait for "Ready" status
  - Note the deployment URL

## Post-Deployment Phase

### 8. Run Initial Setup ✓

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull

# Run migrations
pnpm prisma migrate deploy

# Seed database (optional - creates initial admin)
pnpm db:seed
```

**Option B: Manual Setup**

1. [ ] Go to your Vercel deployment URL
2. [ ] Open browser DevTools → Network tab
3. [ ] Check no 500 errors
4. [ ] Manually run migrations:
   - Use database admin panel (pgAdmin, DBeaver)
   - Count tables in database
   - Should have: User, Event, Team, Submission, Certificate, etc.
5. [ ] Run seed script manually through database GUI

### 9. Verify Deployment ✓

- [ ] Frontend loads: `https://your-project.vercel.app`
- [ ] No console errors in browser
- [ ] API responds: `https://your-project.vercel.app/api/public/events`
- [ ] Authentication works:
  - Try login endpoint
  - JWT token returned successfully
- [ ] Database connected:
  - Events display on frontend
  - User profiles editable
  - Certificates generated
- [ ] File uploads work:
  - Try uploading avatar
  - Try uploading document
  - Files stored in uploads directory

### 10. Security Check ✓

- [ ] No credentials in logs
- [ ] No API keys exposed in frontend code
- [ ] CORS properly configured
- [ ] HTTPS enforced (Vercel default)
- [ ] No /uploads directory listed publicly
- [ ] Admin endpoints protected

### 11. Performance Check ✓

- [ ] Frontend loads in < 3 seconds
- [ ] API calls in < 500ms
- [ ] No 404 errors in console
- [ ] No large unoptimized images
- [ ] Database queries optimized

### 12. Monitoring Setup ✓

- [ ] Enable Vercel Analytics:
  - Dashboard → Analytics
  - Monitor page load times
  - Check error rates

- [ ] Setup alerts (optional):
  - Vercel → Integrations → your choice
  - Slack/Discord/Email notifications

## Troubleshooting

### Build Fails

1. [ ] Check Vercel Build Log for specific error
2. [ ] Common issues:
   - `prisma@x not found`: Clear node_modules, rebuild
   - `DATABASE_URL not set`: Add to env vars
   - `Port already in use`: Vercel will override, ignore
3. [ ] Local build passes: `./build-complete.sh`

### API Not Responding

1. [ ] Check environment variables are set
2. [ ] Check DATABASE_URL is correct
3. [ ] Check database is accessible
4. [ ] Check logs: Vercel Dashboard → Deployments → Logs
5. [ ] Redeploy: `git push` or click Redeploy in Vercel

### Frontend Shows Error

1. [ ] Check browser console for errors
2. [ ] Check Network tab for failed requests
3. [ ] Verify API_URL in frontend points to correct domain
4. [ ] Check CORS_ORIGIN headers

### Database Not Connected

1. [ ] Verify DATABASE_URL in env vars
2. [ ] Test connection string locally:
   ```bash
   psql "your_database_url"
   ```
3. [ ] Check database firewall allows Vercel IPs
4. [ ] Try creating new database and updating URL

### Migrations Failed

1. [ ] Check database has \_prisma_migrations table
2. [ ] Run manually:
   ```bash
   vercel env pull
   pnpm prisma migrate deploy
   ```
3. [ ] Check schema.prisma syntax
4. [ ] Check no migration conflicts

## Rollback Plan

If something goes wrong:

```bash
# Revert to previous deployment
vercel rollback

# Or manually in Vercel Dashboard:
# Deployments → Previous version → Promote
```

## Maintenance

### Regular Tasks

- [ ] Monitor error logs weekly
- [ ] Update dependencies monthly: `pnpm update`
- [ ] Backup database regularly
- [ ] Review Vercel Analytics

### When Adding Features

- [ ] Update schema.prisma (if database changes)
- [ ] Create new migration: `pnpm prisma migrate dev --name description`
- [ ] Test build locally: `./build-complete.sh`
- [ ] Push to git
- [ ] Vercel auto-deploys

### When Updating Dependencies

```bash
# Update all
pnpm update

# Or specific package
pnpm add <package-name>@latest

# Build and test
./build-complete.sh

# If works, push to git
git add .
git commit -m "Update dependencies"
git push
```

## Success Criteria

✅ Deployment is successful if:

- [ ] Frontend accessible and loads without errors
- [ ] API responding to requests
- [ ] Database connected and queries working
- [ ] Authentication functional
- [ ] File uploads working
- [ ] Admin panel accessible (to admin users)
- [ ] No sensitive data in logs
- [ ] Performance metrics good
- [ ] Monitoring/alerts active

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Express Docs: https://expressjs.com
- React Docs: https://react.dev
- Git: https://git-scm.com/doc

---

**Deployed by:** [Your Name]  
**Date:** [Deployment Date]  
**Environment:** Production  
**URL:** https://your-project.vercel.app
