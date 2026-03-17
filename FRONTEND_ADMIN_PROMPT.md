You are a React/TypeScript/Tailwind expert. Before writing 
any code, you MUST research the current state of these 
technologies using web search or available tools.

=============================================================
STEP 0 — RESEARCH FIRST (MANDATORY)
=============================================================

Before doing anything else, search the web and find:

1. What is the latest version of shadcn/ui as of today?
   Search: "shadcn ui latest version 2025"

2. What version of Tailwind CSS does the latest 
   shadcn/ui require?
   Search: "shadcn ui tailwind css v3 or v4 2025"

3. Is shadcn/ui compatible with Vite + React + 
   TypeScript without Next.js?
   Search: "shadcn ui vite react typescript setup 2025"

4. Read the official shadcn docs installation guide for Vite:
   Fetch: https://ui.shadcn.com/docs/installation/vite

5. What is the correct way to install Tailwind CSS 
   with Vite in 2025?
   Fetch: https://tailwindcss.com/docs/installation/using-vite

Based on your research, determine:
- Which exact shadcn/ui version to use
- Which exact Tailwind CSS version to use  
- Whether to use tailwind v3 or v4 approach
- The correct setup steps for this specific combination

Report your findings BEFORE proceeding to any installation.

=============================================================
CURRENT PROJECT STATE
=============================================================

Project: GIVA Science & Innovation Ecosystem
Location: workspace root (NOT inside src/ folder)
Package manager: pnpm
Framework: React 19 + TypeScript + Vite 6
Router: React Router v7 (HashRouter)

CURRENT TAILWIND SETUP (must be migrated):
- index.html uses Tailwind via CDN script tag:
  <script src="https://cdn.tailwindcss.com"></script>
- Tailwind config is inline in index.html as:
  <script>tailwind.config = { theme: { extend: {...} } }</script>
- There is NO tailwind.config.js or tailwind.config.ts file
- There is NO postcss.config.js file
- Tailwind is NOT in package.json dependencies

EXISTING TAILWIND CUSTOM CONFIG (from index.html):
The current config extends colors with:
  primary: { 50-950 range of grays/blacks }
  secondary: { grays }
  accent: { cyan, green, crimson, amber, orange, blue }
  backgroundImage: { brand-gradient, atmosphere variants }
  animation: { float, pulse-slow, spin-slow }
  keyframes: { float }
  fontFamily: { sans: Inter }

This custom config MUST be preserved when migrating.

EXISTING FILES (do not delete or overwrite):
  components/          ← existing UI components
  layouts/             ← DashboardLayout.tsx exists
  pages/               ← all existing pages
  services/            ← mock services exist
  App.tsx              ← HashRouter, existing routes
  types.ts             ← UserRole types etc
  constants.ts         ← NAV_ITEMS, EVENTS etc
  index.html           ← has Tailwind CDN (will be replaced)
  index.css            ← may have custom styles

=============================================================
STEP 1 — MIGRATE TAILWIND FROM CDN TO NPM
=============================================================

Based on your research in Step 0, install Tailwind properly.

IF research shows Tailwind v4 is correct for latest shadcn:

  pnpm add tailwindcss @tailwindcss/vite
  
  Update vite.config.ts:
    import tailwindcss from '@tailwindcss/vite'
    plugins: [react(), tailwindcss()]
  
  Update index.css (add at top):
    @import "tailwindcss";
    @custom-variant dark (&:is(.dark *));
  
  Remove from index.html:
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config = {...}</script>
  
  Migrate the custom config from index.html inline script
  into CSS theme variables in index.css using v4 syntax:
    @theme {
      --color-primary-50: ...;
      etc.
    }

IF research shows Tailwind v3 is correct:

  pnpm add -D tailwindcss@3 postcss autoprefixer
  pnpx tailwindcss init -p
  
  This creates tailwind.config.js and postcss.config.js.
  
  Update tailwind.config.js content array:
    content: ["./*.{ts,tsx}", "./**/*.{ts,tsx}"]
  
  Migrate the custom theme from index.html inline script
  into tailwind.config.js extend section, preserving ALL
  existing color values and animations exactly.
  
  Update index.css (add at top):
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
  
  Remove from index.html:
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config = {...}</script>

IMPORTANT: After migration, run pnpm dev and verify 
the existing pages still look correct before proceeding.

=============================================================
STEP 2 — INSTALL SHADCN/UI
=============================================================

Based on research findings, run the correct init command.

For Vite setup (from official docs):
  pnpm dlx shadcn@latest init

When prompted during init:
  - Style: Default
  - Base color: Slate
  - CSS variables: Yes
  - Tailwind config: (auto-detected)
  - Components alias: @/components
  - Utils alias: @/lib/utils

Then add required components:
  pnpm dlx shadcn@latest add button card table badge 
    dialog sheet input label select textarea form
    dropdown-menu avatar separator skeleton alert 
    tabs progress toast

=============================================================
STEP 3 — INSTALL OTHER DEPENDENCIES
=============================================================

pnpm add @tanstack/react-table
pnpm add react-hook-form @hookform/resolvers
pnpm add axios
pnpm add date-fns
pnpm add zod

=============================================================
STEP 4 — CREATE NEW FOLDER STRUCTURE
=============================================================

All paths are relative to workspace ROOT (no src/ folder):

lib/
  ├── axios.ts
  └── utils.ts

hooks/
  ├── useAuth.ts
  └── useToast.ts

contexts/
  └── AuthContext.tsx

services/api/
  ├── authApi.ts
  ├── profileApi.ts
  ├── eventsApi.ts
  ├── teamsApi.ts
  ├── submissionsApi.ts
  ├── juriApi.ts
  └── adminApi.ts

components/admin/
  ├── StatsCard.tsx
  ├── DataTable.tsx
  ├── PageHeader.tsx
  └── StatusBadge.tsx

layouts/
  └── AdminLayout.tsx

pages/admin/
  ├── AdminDashboard.tsx
  ├── AdminEvents.tsx
  ├── AdminEventForm.tsx
  ├── AdminSubmissions.tsx
  ├── AdminSiswa.tsx
  ├── AdminCertificates.tsx
  └── AdminReports.tsx

pages/superadmin/
  ├── SuperAdminDashboard.tsx
  ├── SuperAdminUsers.tsx
  └── SuperAdminJuriAssignments.tsx

=============================================================
STEP 5 — lib/axios.ts
=============================================================

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL 
  || 'http://localhost:5000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('giva_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = 
          localStorage.getItem('giva_refresh_token')
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/refresh`, { refreshToken }
        )
        localStorage.setItem(
          'giva_access_token', data.data.accessToken
        )
        localStorage.setItem(
          'giva_refresh_token', data.data.refreshToken
        )
        original.headers.Authorization = 
          `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('giva_access_token')
        localStorage.removeItem('giva_refresh_token')
        localStorage.removeItem('giva_user')
        window.location.hash = '#/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

=============================================================
STEP 6 — contexts/AuthContext.tsx
=============================================================

Interface User:
  id: string
  fullName: string
  email: string
  role: 'SUPERADMIN' | 'ADMIN' | 'JURI' | 'SISWA'

Interface AuthContextType:
  user: User | null
  isLoading: boolean
  login(email, password): Promise<void>
  logout(): Promise<void>
  isSuperAdmin: boolean
  isAdmin: boolean
  isJuri: boolean
  isSiswa: boolean

localStorage keys: giva_access_token, 
                   giva_refresh_token, giva_user

On mount: validate token via GET /api/auth/me
login(): POST /api/auth/login → store tokens + user
logout(): POST /api/auth/logout → clear storage

Export: AuthProvider + useAuthContext hook

=============================================================
STEP 7 — services/api/ FILES
=============================================================

All 7 API files — same as specified previously but:
- localStorage keys use 'giva_' prefix not 'moova_'
- Base URL points to http://localhost:5000

authApi.ts:     login, register, logout, me, refresh
profileApi.ts:  getProfile, updateProfile, uploadAvatar,
                getMyEvents, getMySubmissions, 
                getMyCertificates
eventsApi.ts:   getEvents, getEvent, registerToEvent,
                getQa, postQuestion, postReply, toggleUpvote
teamsApi.ts:    getMyTeams, getTeam, createTeam, joinTeam,
                updateTeam, disbandTeam, leaveTeam,
                removeMember, updateMemberRole
submissionsApi.ts: getMySubmissions, getSubmission,
                   createSubmission, updateSubmission,
                   uploadFile, deleteFile, 
                   submitSubmission, withdrawSubmission
juriApi.ts:     getAssignments, getCategorySubmissions,
                getSubmissionDetail, saveScore
adminApi.ts:    getDashboard, getSystemStats,
                getEvents, createEvent, updateEvent,
                updateEventStatus, deleteEvent,
                getSubmissions, advanceStage,
                getSiswaList, getSiswaDetail,
                getCertificates, createCertificate,
                revokeCertificate, getEventReport,
                getAdminJuriUsers, createAdminOrJuri,
                updateAdminOrJuri, toggleUserActive,
                deleteAdminOrJuri, createJuriAssignment,
                deleteJuriAssignment

=============================================================
STEP 8 — ADMIN COMPONENTS
=============================================================

components/admin/StatsCard.tsx:
  Props: { title, value, icon, description?, trend? }
  Uses Shadcn Card component
  Shows: colored icon circle, large value, subtitle

components/admin/DataTable.tsx:
  Generic TanStack Table wrapper
  Props: { columns, data, isLoading?, pagination? }
  Features: sort, paginate, skeleton loading, empty state

components/admin/PageHeader.tsx:
  Props: { title, description?, action?: ReactNode }
  Layout: title left, action button right, border bottom

components/admin/StatusBadge.tsx:
  Props: { status: string }
  OPEN/ACTIVE/VALID → green Badge
  DRAFT/PENDING/UPCOMING → yellow Badge
  CLOSED/REVOKED/DISBANDED → gray Badge
  UNDER_REVIEW/REVISION_REQUESTED → blue Badge
  SCORED/SUBMITTED → purple Badge

=============================================================
STEP 9 — layouts/AdminLayout.tsx
=============================================================

Sidebar + Topbar for admin routes.
Uses Shadcn components for nav items.

Sidebar shows based on role from useAuthContext():

ADMIN and SUPERADMIN see:
  Dashboard       /admin
  Events          /admin/events
  Submissions     /admin/submissions
  Data Siswa      /admin/siswa
  Sertifikat      /admin/certificates
  Laporan         /admin/reports

SUPERADMIN also sees:
  Kelola Pengguna /superadmin/users
  Penugasan Juri  /superadmin/assignments
  System Stats    /superadmin

Topbar: GIVA logo, user name, role badge, logout button
Mobile: collapsible sidebar

=============================================================
STEP 10-16 — ADMIN PAGES
=============================================================

pages/admin/AdminDashboard.tsx:
  Fetch: adminApi.getDashboard()
  Show: 5 StatsCards + BarChart (recharts) + 
        recent registrations table

pages/admin/AdminEvents.tsx:
  Fetch: adminApi.getEvents(params)
  Show: DataTable with search/filter
  Actions: tambah, edit, ubah status, hapus

pages/admin/AdminEventForm.tsx:
  React Hook Form + Zod validation
  Shadcn Tabs: Info Dasar, Detail, Timeline, FAQ, Kategori
  Dynamic lists for timeline/faq/categories (add/remove)
  POST or PUT based on route (/new vs /:id/edit)

pages/admin/AdminSubmissions.tsx:
  Fetch: adminApi.getSubmissions(params)
  Filter: event, status, stage
  Actions: lihat detail (Sheet), naikkan tahap

pages/admin/AdminSiswa.tsx:
  Fetch: adminApi.getSiswaList(params)
  Show: DataTable with completeness Progress bar
  Action: lihat detail (Sheet with full profile)

pages/admin/AdminCertificates.tsx:
  Fetch: adminApi.getCertificates(params)
  Actions: terbitkan (Dialog form), cabut (Dialog+reason)

pages/admin/AdminReports.tsx:
  Select event → fetch adminApi.getEventReport(eventId)
  Show: 4 StatsCards + BarChart per kategori + 
        top 10 submissions table

=============================================================
STEP 17-19 — SUPERADMIN PAGES
=============================================================

pages/superadmin/SuperAdminDashboard.tsx:
  Fetch: adminApi.getSystemStats()
  Show: system stats cards + quick navigation links

pages/superadmin/SuperAdminUsers.tsx:
  Tabs: Admin | Juri
  DataTable with: nama, email, status badge, dibuat pada
  Actions: tambah (Dialog), edit (Dialog), 
           toggle aktif, hapus (AlertDialog)

pages/superadmin/SuperAdminJuriAssignments.tsx:
  2-column: select event+category | assigned juri list
  Actions: tugaskan juri (Dialog), hapus assignment

=============================================================
STEP 20 — UPDATE App.tsx
=============================================================

ONLY ADD these changes to existing App.tsx:

1. Wrap <HashRouter> content with <AuthProvider>

2. Add AdminGuard component:
   - Checks role is ADMIN or SUPERADMIN
   - Redirects to /login if not authenticated
   - Renders <AdminLayout /> with <Outlet />

3. Add SuperAdminGuard component:
   - Checks role is SUPERADMIN only
   - Redirects to /admin if ADMIN tries to access
   - Renders <AdminLayout /> with <Outlet />

4. Add new routes inside <Routes>:
   <Route path="/admin" element={<AdminGuard />}>
     <Route index element={<AdminDashboard />} />
     <Route path="events" element={<AdminEvents />} />
     <Route path="events/new" element={<AdminEventForm />} />
     <Route path="events/:id/edit" 
            element={<AdminEventForm />} />
     <Route path="submissions" 
            element={<AdminSubmissions />} />
     <Route path="siswa" element={<AdminSiswa />} />
     <Route path="certificates" 
            element={<AdminCertificates />} />
     <Route path="reports" element={<AdminReports />} />
   </Route>

   <Route path="/superadmin" element={<SuperAdminGuard />}>
     <Route index element={<SuperAdminDashboard />} />
     <Route path="users" element={<SuperAdminUsers />} />
     <Route path="assignments" 
            element={<SuperAdminJuriAssignments />} />
   </Route>

5. Update existing login logic:
   The existing AuthPage at /login and /join currently 
   writes to localStorage with keys:
     'moova_user', 'moova_access_token' etc.
   
   Update AuthPage.tsx to use AuthContext login() instead:
   - Import useAuthContext
   - Replace handleLoginSubmit localStorage logic with:
     await login(email, password)
   - On success redirect based on role:
     SUPERADMIN/ADMIN → /admin
     JURI → /dashboard/judge  
     SISWA → /dashboard

=============================================================
STEP 21 — UPDATE .env.local
=============================================================

Add to existing .env.local:
VITE_API_URL=http://localhost:5000

=============================================================
EXECUTION ORDER
=============================================================

Execute in this exact order:
0.  Research Tailwind + shadcn compatibility (MANDATORY)
1.  Migrate Tailwind from CDN to npm (based on research)
2.  Test existing pages still work: pnpm dev
3.  Install shadcn/ui (based on research findings)
4.  Install other dependencies
5.  Update .env.local
6.  lib/utils.ts
7.  lib/axios.ts
8.  contexts/AuthContext.tsx
9.  hooks/useAuth.ts
10. services/api/ (all 7 files)
11. components/admin/ (all 4 files)
12. layouts/AdminLayout.tsx
13. pages/admin/ (all 7 pages)
14. pages/superadmin/ (all 3 pages)
15. Update App.tsx
16. Update pages/AuthPage.tsx

CRITICAL RULES:
- ALWAYS research before installing (Step 0)
- NEVER create src/ folder
- NEVER delete existing components/, pages/, layouts/ files
- NEVER use CDN imports for React or other libraries
- ALWAYS use pnpm
- Replace "MOOVA" with "GIVA" in all new files
- After Tailwind migration (Step 1), verify 
  existing UI still renders before continuing