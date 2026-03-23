# Quick Deployment Reference

## 1️⃣ Pre-Deployment (5 min)

```bash
# Test local build works
./build-complete.sh          # Windows: build-complete.bat

# Should see: ✓ Build and deployment setup complete!
```

## 2️⃣ Database Setup (Choose ONE)

- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Neon**: https://neon.tech (free tier)
- **Railway**: https://railway.app
- **Other**: PlanetScale, TiDB Cloud, etc.

Copy `DATABASE_URL` from your provider.

## 3️⃣ GitHub

Push your code to GitHub (ensure `.git`, `.gitignore`, and `vercel.json` are present):

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## 4️⃣ Vercel Project

1. Go to https://vercel.com/dashboard
2. Click → "Add New" → "Project"
3. Select your GitHub repository
4. Click "Import"
5. **Settings:**
   - Root Directory: `.` (root)
   - Framework: `Vite`
   - Build: `pnpm install && pnpm run build:all`
   - Install: `pnpm install`
   - Output: `dist`
6. Click "Deploy"

## 5️⃣ Environment Variables

In **Vercel Dashboard → Settings → Environment Variables**:

Add these to **Production**:

```
DATABASE_URL        → postgresql://...
JWT_SECRET          → random string (32+ chars)
CORS_ORIGIN         → https://your-project.vercel.app
GEMINI_API_KEY      → your API key
ADMIN_EMAIL         → admin@yourdomain.com
ADMIN_PASSWORD      → secure password
NODE_ENV            → production
```

## 6️⃣ Deploy

Push to main (or click "Redeploy" in Vercel):

```bash
git push origin main
# Vercel deploys automatically
```

## 7️⃣ Run Migrations (One Time)

After deployment succeeds:

```bash
# Pull env variables
vercel env pull

# Run migrations
pnpm -F giva-backend prisma migrate deploy

# Seed data
pnpm -F giva-backend prisma db seed
```

## ✅ Verify

- Frontend: https://your-project.vercel.app
- API: https://your-project.vercel.app/api/public/events
- Check Vercel logs for errors

## 🔧 If Build Fails

1. Check Vercel build log
2. Local test: `./build-complete.sh`
3. Common issues:
   - Missing DATABASE_URL env var
   - prisma client not generated
   - typescript errors
4. Fix locally, push, auto-redeploy

## 📱 Complete URLs

- **Frontend**: https://your-project.vercel.app
- **API Base**: https://your-project.vercel.app/api
- **Admin**: https://your-project.vercel.app/admin

## ⚙️ Important Environment Variables

| Variable       | Value                  | Example                        |
| -------------- | ---------------------- | ------------------------------ |
| DATABASE_URL   | PostgreSQL connection  | postgresql://user:pass@host/db |
| JWT_SECRET     | Secret key (32+ chars) | a1b2c3d4e5f6...xyz             |
| CORS_ORIGIN    | Your domain            | https://myapp.vercel.app       |
| GEMINI_API_KEY | API key                | AIza...                        |
| NODE_ENV       | production             | production                     |

## 🆘 Troubleshooting

| Problem          | Solution                                      |
| ---------------- | --------------------------------------------- |
| Build fails      | Check logs, run `./build-complete.sh` locally |
| API 502 error    | Check DATABASE_URL, database access           |
| Blank page       | Check browser console, Network tab            |
| Upload fails     | Use external storage (S3, Blob, Cloudinary)   |
| DB not connected | Verify DATABASE_URL and firewall rules        |

## 📚 Documentation

- Full guide: [BUILD_AND_DEPLOYMENT_GUIDE.md](BUILD_AND_DEPLOYMENT_GUIDE.md)
- Checklist: [VERCEL_DEPLOYMENT_CHECKLIST.md](VERCEL_DEPLOYMENT_CHECKLIST.md)
- Deployment: [DEPLOYMENT.md](DEPLOYMENT.md)
- Env vars: [.env.example](.env.example)

---

**Status**: ✅ Ready to Deploy  
**Last Updated**: 2026-03-23
