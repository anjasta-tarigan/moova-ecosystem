You are a React/TypeScript expert. Add a complete Admin Panel 
to the existing GIVA React project. 

IMPORTANT — Current project structure at workspace root:
  components/     ← existing UI components
  layouts/        ← existing layout files (DashboardLayout.tsx exists)
  pages/          ← existing pages
  services/       ← existing mock services (userService.ts, 
                     judgeService.ts, teamService.ts)
  App.tsx         ← existing router (HashRouter)
  types.ts        ← existing types
  constants.ts    ← existing constants

All new files must follow this same root-level structure.
There is NO src/ folder. Do NOT create a src/ folder.
Use pnpm as package manager (pnpm-lock.yaml exists).

=============================================================
STEP 1 — INSTALL DEPENDENCIES
=============================================================

Run these commands:
  pnpm dlx shadcn@latest init
    → When prompted:
      Style: Default
      Base color: Slate
      CSS variables: Yes
  
  pnpm dlx shadcn@latest add button card table badge dialog
    sheet input label select textarea form
    dropdown-menu avatar separator skeleton
    alert tabs progress

  pnpm add @tanstack/react-table
  pnpm add react-hook-form @hookform/resolvers zod
  pnpm add axios
  pnpm add date-fns

=============================================================
STEP 2 — NEW FOLDER STRUCTURE TO CREATE
=============================================================

Create these new folders and files at workspace root:

lib/
  ├── axios.ts          ← configured axios instance
  └── utils.ts          ← cn() helper for shadcn

hooks/
  ├── useAuth.ts
  └── useToast.ts

contexts/
  └── AuthContext.tsx

services/api/           ← inside existing services/ folder
  ├── authApi.ts
  ├── profileApi.ts
  ├── eventsApi.ts
  ├── teamsApi.ts
  ├── submissionsApi.ts
  ├── juriApi.ts
  └── adminApi.ts

components/admin/       ← inside existing components/ folder
  ├── StatsCard.tsx
  ├── DataTable.tsx
  ├── PageHeader.tsx
  └── StatusBadge.tsx

layouts/
  └── AdminLayout.tsx   ← add alongside existing DashboardLayout.tsx

pages/admin/            ← inside existing pages/ folder
  ├── AdminDashboard.tsx
  ├── AdminEvents.tsx
  ├── AdminEventForm.tsx
  ├── AdminSubmissions.tsx
  ├── AdminSiswa.tsx
  ├── AdminCertificates.tsx
  └── AdminReports.tsx

pages/superadmin/       ← inside existing pages/ folder
  ├── SuperAdminDashboard.tsx
  ├── SuperAdminUsers.tsx
  └── SuperAdminJuriAssignments.tsx

=============================================================
STEP 3 — lib/axios.ts
=============================================================

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('moova_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('moova_refresh_token')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken
        })
        localStorage.setItem('moova_access_token', data.data.accessToken)
        localStorage.setItem('moova_refresh_token', data.data.refreshToken)
        originalRequest.headers.Authorization = 
          `Bearer ${data.data.accessToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('moova_access_token')
        localStorage.removeItem('moova_refresh_token')
        localStorage.removeItem('moova_user')
        window.location.hash = '#/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

=============================================================
STEP 4 — lib/utils.ts
=============================================================

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

=============================================================
STEP 5 — contexts/AuthContext.tsx
=============================================================

Interface User:
  id: string
  fullName: string
  email: string
  role: 'SUPERADMIN' | 'ADMIN' | 'JURI' | 'SISWA'

Interface AuthContextType:
  user: User | null
  isLoading: boolean
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
  isAdmin: boolean       ← role === 'ADMIN' || 'SUPERADMIN'
  isSuperAdmin: boolean  ← role === 'SUPERADMIN'
  isJuri: boolean        ← role === 'JURI'
  isSiswa: boolean       ← role === 'SISWA'

Implementation:
- On mount: check localStorage for moova_access_token,
  if exists call GET /api/auth/me to validate,
  set user from response, setIsLoading(false)
- login(): POST /api/auth/login, 
  store accessToken, refreshToken, user in localStorage
  keys: moova_access_token, moova_refresh_token, moova_user
- logout(): POST /api/auth/logout, 
  clear all 3 localStorage keys, set user null
- Export: AuthProvider component + useAuthContext hook

=============================================================
STEP 6 — hooks/useAuth.ts
=============================================================

Re-export useAuthContext from AuthContext for convenience.
Also export helper: isAllowed(user, ...roles) boolean check.

=============================================================
STEP 7 — services/api/authApi.ts
=============================================================

Using the configured api instance from lib/axios.ts:

export const authApi = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (data: { fullName, email, password, confirmPassword }) =>
    api.post('/api/auth/register', data),
  
  logout: (refreshToken) =>
    api.post('/api/auth/logout', { refreshToken }),
  
  me: () =>
    api.get('/api/auth/me'),
  
  refresh: (refreshToken) =>
    api.post('/api/auth/refresh', { refreshToken })
}

=============================================================
STEP 8 — services/api/profileApi.ts
=============================================================

export const profileApi = {
  getProfile: () =>
    api.get('/api/siswa/profile'),
  
  updateProfile: (data: Partial<SiswaProfile>) =>
    api.put('/api/siswa/profile', data),
  
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.post('/api/siswa/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  getMyEvents: () =>
    api.get('/api/siswa/my-events'),
  
  getMySubmissions: () =>
    api.get('/api/siswa/my-submissions'),
  
  getMyCertificates: () =>
    api.get('/api/siswa/my-certificates')
}

=============================================================
STEP 9 — services/api/eventsApi.ts
=============================================================

export const eventsApi = {
  getEvents: (params?) =>
    api.get('/api/events', { params }),
  
  getEvent: (id) =>
    api.get(`/api/events/${id}`),
  
  registerToEvent: (id, data: { teamId?: string }) =>
    api.post(`/api/events/${id}/register`, data),
  
  getQa: (eventId, params?) =>
    api.get(`/api/events/${eventId}/qa`, { params }),
  
  postQuestion: (eventId, text) =>
    api.post(`/api/events/${eventId}/qa`, { text }),
  
  postReply: (eventId, questionId, text) =>
    api.post(`/api/events/${eventId}/qa/${questionId}/replies`, { text }),
  
  toggleUpvote: (eventId, questionId) =>
    api.post(`/api/events/${eventId}/qa/${questionId}/upvote`)
}

=============================================================
STEP 10 — services/api/teamsApi.ts
=============================================================

export const teamsApi = {
  getMyTeams: () =>
    api.get('/api/teams'),
  
  getTeam: (id) =>
    api.get(`/api/teams/${id}`),
  
  createTeam: (name) =>
    api.post('/api/teams', { name }),
  
  joinTeam: (code) =>
    api.post('/api/teams/join', { code }),
  
  updateTeam: (id, name) =>
    api.put(`/api/teams/${id}`, { name }),
  
  disbandTeam: (id) =>
    api.delete(`/api/teams/${id}`),
  
  leaveTeam: (id) =>
    api.delete(`/api/teams/${id}/leave`),
  
  removeMember: (teamId, userId) =>
    api.delete(`/api/teams/${teamId}/members/${userId}`),
  
  updateMemberRole: (teamId, userId, role) =>
    api.patch(`/api/teams/${teamId}/members/${userId}/role`, { role })
}

=============================================================
STEP 11 — services/api/submissionsApi.ts
=============================================================

export const submissionsApi = {
  getMySubmissions: () =>
    api.get('/api/submissions'),
  
  getSubmission: (id) =>
    api.get(`/api/submissions/${id}`),
  
  createSubmission: (data) =>
    api.post('/api/submissions', data),
  
  updateSubmission: (id, data) =>
    api.put(`/api/submissions/${id}`, data),
  
  uploadFile: (id, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/api/submissions/${id}/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  deleteFile: (submissionId, fileId) =>
    api.delete(`/api/submissions/${submissionId}/files/${fileId}`),
  
  submitSubmission: (id) =>
    api.post(`/api/submissions/${id}/submit`, { consentGiven: true }),
  
  withdrawSubmission: (id) =>
    api.post(`/api/submissions/${id}/withdraw`)
}

=============================================================
STEP 12 — services/api/juriApi.ts
=============================================================

export const juriApi = {
  getAssignments: () =>
    api.get('/api/juri/assignments'),
  
  getCategorySubmissions: (categoryId, params?) =>
    api.get(`/api/juri/assignments/${categoryId}/submissions`, { params }),
  
  getSubmissionDetail: (submissionId, stage) =>
    api.get(`/api/juri/submissions/${submissionId}`, { params: { stage } }),
  
  saveScore: (data: {
    submissionId: string
    stage: string
    criteriaScores: Record<string, number>
    comment: string
    status: 'draft' | 'submitted'
  }) =>
    api.post('/api/juri/scores', data)
}

=============================================================
STEP 13 — services/api/adminApi.ts
=============================================================

export const adminApi = {
  // Dashboard
  getDashboard: () =>
    api.get('/api/admin/dashboard'),
  
  getSystemStats: () =>
    api.get('/api/superadmin/system-stats'),

  // Events
  getEvents: (params?) =>
    api.get('/api/admin/events', { params }),
  
  createEvent: (data) =>
    api.post('/api/admin/events', data),
  
  updateEvent: (id, data) =>
    api.put(`/api/admin/events/${id}`, data),
  
  updateEventStatus: (id, status) =>
    api.patch(`/api/admin/events/${id}/status`, { status }),
  
  deleteEvent: (id) =>
    api.delete(`/api/admin/events/${id}`),

  // Submissions
  getSubmissions: (params?) =>
    api.get('/api/admin/submissions', { params }),
  
  advanceStage: (id, stage) =>
    api.patch(`/api/admin/submissions/${id}/stage`, { stage }),

  // Siswa
  getSiswaList: (params?) =>
    api.get('/api/admin/siswa', { params }),
  
  getSiswaDetail: (id) =>
    api.get(`/api/admin/siswa/${id}`),

  // Certificates
  getCertificates: (params?) =>
    api.get('/api/admin/certificates', { params }),
  
  createCertificate: (data) =>
    api.post('/api/admin/certificates', data),
  
  revokeCertificate: (id, reason) =>
    api.patch(`/api/admin/certificates/${id}/revoke`, { reason }),

  // Reports
  getEventReport: (eventId) =>
    api.get(`/api/admin/reports/event/${eventId}`),

  // Superadmin — users
  getAdminJuriUsers: (params?) =>
    api.get('/api/superadmin/users', { params }),
  
  createAdminOrJuri: (data) =>
    api.post('/api/superadmin/users', data),
  
  updateAdminOrJuri: (id, data) =>
    api.put(`/api/superadmin/users/${id}`, data),
  
  toggleUserActive: (id) =>
    api.patch(`/api/superadmin/users/${id}/toggle-active`),
  
  deleteAdminOrJuri: (id) =>
    api.delete(`/api/superadmin/users/${id}`),

  // Superadmin — juri assignments
  createJuriAssignment: (data) =>
    api.post('/api/superadmin/juri-assignments', data),
  
  deleteJuriAssignment: (id) =>
    api.delete(`/api/superadmin/juri-assignments/${id}`)
}

=============================================================
STEP 14 — components/admin/StatsCard.tsx
=============================================================

import { Card, CardContent } from '@/components/ui/card'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  trend?: { value: number; isUp: boolean }
}

Render a Card with:
- Icon in colored circle (top left)
- Large bold value (center)
- Title below value (small, muted)
- Optional description (xs, muted)
- Optional trend badge (green if isUp, red if down)

=============================================================
STEP 15 — components/admin/DataTable.tsx
=============================================================

Generic TanStack React Table wrapper:

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  isLoading?: boolean
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }
}

Features:
- Show Skeleton rows (5 rows) when isLoading=true
- Previous/Next pagination buttons at bottom
- Show "Tidak ada data" empty state
- Responsive: horizontal scroll on mobile

=============================================================
STEP 16 — components/admin/PageHeader.tsx
=============================================================

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

Render: h1 title + optional description paragraph + 
        optional action button aligned to the right.
Use a bottom border separator.

=============================================================
STEP 17 — components/admin/StatusBadge.tsx
=============================================================

interface StatusBadgeProps {
  status: string
}

Map to Shadcn Badge variant + custom color:
  'OPEN' | 'ACTIVE' | 'VALID' | 'SUBMITTED' → 
    green background, white text
  'DRAFT' | 'PENDING' | 'UPCOMING' →
    yellow/amber background, dark text
  'CLOSED' | 'REVOKED' | 'DISBANDED' | 'SCORED' →
    gray background, dark text
  'UNDER_REVIEW' | 'REVISION_REQUESTED' →
    blue background, white text

=============================================================
STEP 18 — layouts/AdminLayout.tsx
=============================================================

Sidebar + Topbar layout for admin routes.
Similar structure to existing DashboardLayout.tsx but simpler.

Sidebar nav items depend on user role from useAuthContext():

If role === 'ADMIN' or 'SUPERADMIN':
  - Dashboard → /admin
  - Events → /admin/events
  - Submissions → /admin/submissions  
  - Data Siswa → /admin/siswa
  - Sertifikat → /admin/certificates
  - Laporan → /admin/reports

If role === 'SUPERADMIN' (additional items):
  - Kelola Admin & Juri → /superadmin/users
  - Penugasan Juri → /superadmin/assignments
  - System Stats → /superadmin

Topbar:
  - MOOVA logo (left)
  - User avatar + fullName + role Badge (right)
  - Logout button

Active state: highlight current route with primary color.
Collapsible on mobile.

=============================================================
STEP 19 — pages/admin/AdminDashboard.tsx
=============================================================

On mount: call adminApi.getDashboard()

Layout (grid):
Row 1 — 5 StatsCards:
  - Total Siswa Terdaftar (totalSiswa)
  - Event Aktif (eventsByStatus.OPEN)
  - Total Submission (totalSubmissions)
  - Total Sertifikat (totalCertificates)
  - Submission Dinilai (submissionsByStatus.SCORED)

Row 2 — 2 columns:
  Left: BarChart (Recharts) — top 5 events by registration count
    xAxis: event title (truncated 20 chars)
    bar: registrationCount, fill="#1e293b"
  
  Right: Recent Registrations table
    Columns: Nama Siswa, Event, Waktu Daftar
    Show last 10 records

=============================================================
STEP 20 — pages/admin/AdminEvents.tsx
=============================================================

State: events[], isLoading, search, statusFilter, page

On mount + filter change: call adminApi.getEvents({search, status, page})

Render:
- PageHeader with "Tambah Event" button → navigate('/admin/events/new')
- Search input + status Select filter (inline)
- DataTable with columns:
  - Judul (bold, clickable → edit)
  - Kategori
  - Format (Badge)
  - Status (StatusBadge)
  - Deadline
  - Pendaftar (registrationCount)
  - Aksi: dropdown with Edit, Ubah Status, Hapus

Hapus: show Shadcn AlertDialog confirm before calling deleteEvent
Ubah Status: show Dialog with Select for new status

=============================================================
STEP 21 — pages/admin/AdminEventForm.tsx
=============================================================

Use React Hook Form + Zod schema validation.

Zod schema:
  title: string min 5
  shortDescription: string min 10
  fullDescription: string min 20
  theme: string optional
  date: string required
  location: string required
  format: enum ONLINE|IN_PERSON|HYBRID
  category: string required
  status: enum DRAFT|OPEN|UPCOMING|CLOSED
  deadline: string required
  fee: string default "Gratis"
  teamSizeMin: number min 1
  teamSizeMax: number min 1
  eligibility: string[] (dynamic add/remove)
  sdgs: number[] (checkbox 1-17)
  prizePool: string optional
  organizer: string default "MOOVA"
  
  timeline: array of { date, title, description, order }
  faqs: array of { question, answer, order }
  categories: array of { name, description }

Form layout (use Shadcn Tabs):
  Tab 1 "Informasi Dasar": 
    title, shortDescription, fullDescription, theme,
    date, deadline, location, format, category,
    status, fee, teamSizeMin, teamSizeMax, organizer
  
  Tab 2 "Detail":
    prizePool, eligibility (dynamic list with add/remove),
    sdgs (checkboxes grid 1-17)
  
  Tab 3 "Timeline":
    Dynamic list: add/remove timeline entries
    Each entry: date input, title input, description textarea
  
  Tab 4 "FAQ":
    Dynamic list: add/remove FAQ entries
    Each entry: question input, answer textarea
  
  Tab 5 "Kategori Lomba":
    Dynamic list: add/remove categories
    Each entry: name input, description input

If editing (/admin/events/:id/edit):
  - Fetch event data on mount
  - Prefill form with existing data
  - On submit: call updateEvent

If creating (/admin/events/new):
  - On submit: call createEvent

Show toast on success/error.
"Simpan" button at bottom, disabled while submitting.

=============================================================
STEP 22 — pages/admin/AdminSubmissions.tsx
=============================================================

State: submissions[], isLoading, eventFilter, 
       statusFilter, stageFilter, page

DataTable columns:
  - Judul Proyek
  - Tim
  - Event
  - Tahap (Badge: ABSTRACT/PAPER/FINAL)
  - Status (StatusBadge)
  - Total Nilai (or "Belum dinilai")
  - Aksi

Row actions:
  1. "Lihat Detail" → opens Sheet (slide panel) with:
     - Full submission info
     - File list with download links
     - Score summary per stage per juri
  
  2. "Naikkan Tahap" → Dialog confirm, 
     then call advanceStage(id, nextStage)
     only show if status is SCORED

Filters: Event Select, Status Select, Stage Select

=============================================================
STEP 23 — pages/admin/AdminSiswa.tsx
=============================================================

State: siswaList[], isLoading, search, 
       provinceFilter, schoolLevelFilter, page

DataTable columns:
  - Nama Lengkap
  - Email
  - Sekolah
  - Jenjang
  - Kelas
  - Provinsi
  - Kelengkapan Profil (Progress component 0-100%)
  - Aksi: "Detail"

"Detail" → opens Sheet with:
  - Avatar + fullName + email
  - SiswaProfile all fields
  - List of registered events
  - List of submissions (projectTitle + status)

=============================================================
STEP 24 — pages/admin/AdminCertificates.tsx
=============================================================

State: certificates[], isLoading, eventFilter, 
       typeFilter, page

DataTable columns:
  - Penerima
  - Event
  - Tipe (Badge)
  - Penghargaan
  - Tanggal Terbit
  - Diterbitkan Oleh
  - Status (StatusBadge: VALID/REVOKED)
  - Aksi

Button "Terbitkan Sertifikat" → Dialog with form:
  - Pilih Siswa (search input, call /api/admin/siswa)
  - Pilih Event (select from events list)
  - Tipe: Select WINNER|PARTICIPANT|JURI
  - Penghargaan: text input
  - Diterbitkan Oleh: text input

Row actions:
  - "Cabut" (only if VALID) → Dialog with reason textarea,
    then call revokeCertificate

=============================================================
STEP 25 — pages/admin/AdminReports.tsx
=============================================================

State: selectedEventId, reportData, isLoading

Layout:
  - Event selector at top (fetch events list on mount)
  - On event select: fetch report from adminApi.getEventReport

Show report sections:
  Row 1 — 4 StatsCards:
    registrationCount, submissionCount, 
    scoredCount, averageScore

  Row 2:
    Left: BarChart — nilai rata-rata per kategori
      xAxis: categoryName, bar: avgScore
    Right: Table top 10 submission
      Columns: Peringkat, Tim, Proyek, Total Nilai

=============================================================
STEP 26 — pages/superadmin/SuperAdminDashboard.tsx
=============================================================

On mount: call adminApi.getSystemStats()

Layout:
  Row 1 — StatsCards:
    - Total ADMIN, Total JURI, Total SISWA
    - Total Events, Total Submissions
    - Storage Used (in MB)
  
  Row 2 — Quick access cards:
    - "Kelola Admin & Juri" → navigate('/superadmin/users')
    - "Penugasan Juri" → navigate('/superadmin/assignments')

=============================================================
STEP 27 — pages/superadmin/SuperAdminUsers.tsx
=============================================================

State: users[], activeTab ('ADMIN'|'JURI'), 
       isLoading, page, search

On mount + tab change: call adminApi.getAdminJuriUsers({ role: activeTab })

Shadcn Tabs: "Admin" | "Juri"

DataTable columns:
  - Nama Lengkap
  - Email
  - Status: Badge AKTIF (green) or NONAKTIF (red)
  - Dibuat Pada (formatted date)
  - Aksi

Button "Tambah Admin/Juri" → Dialog form:
  Fields: fullName, email, password, 
          role Select (ADMIN|JURI, default = activeTab)
  On submit: call createAdminOrJuri

Row actions dropdown:
  - "Edit" → Dialog same as create form but prefilled,
    password optional (empty = don't change)
  - "Aktif/Nonaktifkan" → call toggleUserActive,
    show confirm dialog first
  - "Hapus" → AlertDialog confirm, 
    then call deleteAdminOrJuri

=============================================================
STEP 28 — pages/superadmin/SuperAdminJuriAssignments.tsx
=============================================================

Layout: 2-column grid

Left column "Pilih Penugasan":
  - Select Event (fetch events on mount)
  - On event select: show categories of that event
  - Select Category
  - On category select: show assigned juri list for 
    that category in right column

Right column "Daftar Juri Bertugas":
  - Show list of JuriAssignment for selected category
  - Each item: juri fullName + email + 
    current stage Badge + progress bar
  - "Hapus" button per assignment → confirm dialog

Button "Tugaskan Juri" → Dialog:
  - Select Juri (fetched from superadmin/users?role=JURI)
  - Select Stage: ABSTRACT|PAPER|FINAL
  - On submit: call createJuriAssignment

=============================================================
STEP 29 — UPDATE App.tsx
=============================================================

Keep all existing routes unchanged.
Add these modifications:

1. Wrap entire <HashRouter> content with <AuthProvider>
   from contexts/AuthContext.tsx

2. Add new route guards:

const AdminGuard = () => {
  const { user, isLoading } = useAuthContext()
  if (isLoading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!['ADMIN', 'SUPERADMIN'].includes(user.role))
    return <Navigate to="/" replace />
  return <AdminLayout />  // AdminLayout uses <Outlet />
}

const SuperAdminGuard = () => {
  const { user, isLoading } = useAuthContext()
  if (isLoading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'SUPERADMIN')
    return <Navigate to="/admin" replace />
  return <AdminLayout />
}

3. Add routes inside <Routes>:

<Route path="/admin" element={<AdminGuard />}>
  <Route index element={<AdminDashboard />} />
  <Route path="events" element={<AdminEvents />} />
  <Route path="events/new" element={<AdminEventForm />} />
  <Route path="events/:id/edit" element={<AdminEventForm />} />
  <Route path="submissions" element={<AdminSubmissions />} />
  <Route path="siswa" element={<AdminSiswa />} />
  <Route path="certificates" element={<AdminCertificates />} />
  <Route path="reports" element={<AdminReports />} />
</Route>

<Route path="/superadmin" element={<SuperAdminGuard />}>
  <Route index element={<SuperAdminDashboard />} />
  <Route path="users" element={<SuperAdminUsers />} />
  <Route path="assignments" element={<SuperAdminJuriAssignments />} />
</Route>

4. Update existing AuthPage login to use AuthContext:
   Instead of directly writing to localStorage,
   call the login() function from useAuthContext()

=============================================================
STEP 30 — UPDATE .env.local
=============================================================

Add this line to existing .env.local:
VITE_API_URL=http://localhost:5000

=============================================================
GENERATE ORDER
=============================================================

Generate all files in this exact order:
1.  .env.local (add VITE_API_URL line)
2.  lib/utils.ts
3.  lib/axios.ts
4.  contexts/AuthContext.tsx
5.  hooks/useAuth.ts
6.  services/api/authApi.ts
7.  services/api/profileApi.ts
8.  services/api/eventsApi.ts
9.  services/api/teamsApi.ts
10. services/api/submissionsApi.ts
11. services/api/juriApi.ts
12. services/api/adminApi.ts
13. components/admin/StatsCard.tsx
14. components/admin/DataTable.tsx
15. components/admin/PageHeader.tsx
16. components/admin/StatusBadge.tsx
17. layouts/AdminLayout.tsx
18. pages/admin/AdminDashboard.tsx
19. pages/admin/AdminEvents.tsx
20. pages/admin/AdminEventForm.tsx
21. pages/admin/AdminSubmissions.tsx
22. pages/admin/AdminSiswa.tsx
23. pages/admin/AdminCertificates.tsx
24. pages/admin/AdminReports.tsx
25. pages/superadmin/SuperAdminDashboard.tsx
26. pages/superadmin/SuperAdminUsers.tsx
27. pages/superadmin/SuperAdminJuriAssignments.tsx
28. App.tsx (update existing file)

IMPORTANT RULES:
- Never use src/ prefix — all paths are from workspace root
- Keep all existing code in App.tsx, only ADD new routes
- Do not modify existing components/, layouts/, pages/ files
  except App.tsx
- Every file must be fully implemented, no placeholders
- Use pnpm not npm