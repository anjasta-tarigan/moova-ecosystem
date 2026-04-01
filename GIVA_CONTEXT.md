# GIVA Project Context

## Identity
Platform: GIVA Science & Innovation Ecosystem
All UI text: ENGLISH only
Replace "MOOVA" with "GIVA" everywhere

## Roles
Database values (NEVER change):
  SUPERADMIN, ADMIN, JUDGE, STUDENT

Display names in UI:
  SUPERADMIN → Super Admin
  ADMIN → Admin
  JUDGE → Judge
  STUDENT → Student

## Tech Stack

Frontend (workspace root — NO src/ folder):
  React 19 + TypeScript + Vite 6
  Tailwind CSS v4 via @tailwindcss/vite (npm, not CDN)
  React Router v7 HashRouter
  Recharts (installed)
  Lucide React (installed)
  Axios (installed, configured at lib/axios.ts)

Backend (backend/ folder):
  Express + TypeScript + Prisma + PostgreSQL
  Running on port 5000
  API prefix: /api

## Authentication
  JWT tokens in localStorage:
    giva_access_token
    giva_refresh_token
    giva_user
  Auth state: contexts/AuthContext.tsx
  API client: lib/axios.ts (auto token refresh)

## API Response Format
  Paginated:  { success: true, data: [], pagination: {} }
  Single:     { success: true, data: {} }
  Error:      { success: false, message: "" }

## File Structure

Frontend:
  components/          existing UI components
  components/admin/    admin-specific components
  contexts/            AuthContext.tsx
  hooks/               useAuth.ts
  layouts/             DashboardLayout.tsx, AdminLayout.tsx
  lib/                 axios.ts, utils.ts
  pages/               all pages
  pages/admin/         admin pages
  pages/superadmin/    superadmin pages
  services/            old mock services (deprecated)
  services/api/        real API services
  App.tsx              HashRouter + all routes
  index.css            Tailwind @import + @theme + custom
  index.html           NO CDN scripts
  vite.config.ts       includes tailwindcss() plugin

Backend:
  backend/src/modules/ all API modules
  backend/prisma/      schema.prisma + seed.ts

## Real API Services (use these)
  services/api/authApi.ts
  services/api/profileApi.ts
  services/api/eventsApi.ts
  services/api/teamsApi.ts
  services/api/submissionsApi.ts
  services/api/judgeApi.ts
  services/api/adminApi.ts

## Deprecated Mock Services (do not use)
  services/userService.ts
  services/teamService.ts
  services/judgeService.ts

## Routes
  /                   Landing page (public)
  /events             Events list (public)
  /events/:id         Event detail (public)
  /login              Login page
  /join               Register page
  /dashboard          Student dashboard (SISWA)
  /dashboard/judge    Judge dashboard (JURI)
  /admin              Admin panel (ADMIN + SUPERADMIN)
  /superadmin         Superadmin panel (SUPERADMIN only)

## Seed Accounts
  superadmin@giva.test / superadmin123 → SUPERADMIN
  admin@giva.test / admin123 → ADMIN
  juri1@giva.test / juri123 → JURI (displayed as Judge)
  siswa@giva.test / siswa123 → SISWA

## Critical Rules
  1. NEVER delete existing files without permission
  2. NEVER create src/ folder
  3. NEVER change database role enum values
  4. NEVER change localStorage key prefix (giva_)
  5. ALWAYS use pnpm add -w for frontend installs
  6. ALWAYS use English for all UI text
  7. ALWAYS add loading + error states to every page
  8. ALWAYS commit before starting new work

## Completed Work
  ✅ Backend API — all endpoints working
  ✅ Admin panel — event, student, certificate, report
  ✅ SuperAdmin panel — user management, judge assignments
  ✅ Auth integration — JWT with giva_ prefix
  ✅ Tailwind v4 migration — CDN removed
  ✅ Error boundaries — ErrorBoundary.tsx
  ✅ Loading states — LoadingSpinner.tsx

## Pending Work
  ⏳ Session 3: Student dashboard → real API
  ⏳ Session 4: Judge dashboard → real API
  ⏳ Session 5: Public pages → real API