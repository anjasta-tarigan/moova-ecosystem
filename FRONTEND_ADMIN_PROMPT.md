You are a React/TypeScript expert building an admin panel
for GIVA — a Science & Innovation Ecosystem platform.

=============================================================
PROJECT IDENTITY
=============================================================
Platform name: GIVA (not MOOVA)
Replace ALL "MOOVA" references with "GIVA" in new files.
localStorage keys prefix: "giva_" (not "moova_")

=============================================================
TECH STACK
=============================================================
- React 19 + TypeScript
- Vite 6
- Tailwind CSS (via CDN in index.html — DO NOT CHANGE)
- React Router v7 (HashRouter)
- Recharts (already installed)
- Lucide React (already installed)
- Package manager: pnpm (always use pnpm add -w)

=============================================================
CRITICAL RULES
=============================================================
- NO shadcn/ui — build all UI from pure Tailwind
- NO src/ folder — all files at workspace ROOT
- NO CDN changes — keep index.html Tailwind CDN as-is
- NO deletion of existing files EXCEPT:
  App.tsx → only ADD new routes, keep existing
  pages/AuthPage.tsx → only update login logic
- ALWAYS use pnpm add -w for installations

=============================================================
CURRENT PROJECT STRUCTURE
=============================================================

Workspace root:
  backend/          ← Express API running on port 5000
  components/       ← existing UI components
  layouts/          ← DashboardLayout.tsx exists
  pages/            ← all existing pages
  services/         ← mock services
  App.tsx           ← HashRouter + existing routes
  types.ts          ← UserRole types
  constants.ts      ← NAV_ITEMS, EVENTS
  index.html        ← Tailwind via CDN
  index.css         ← global styles

=============================================================
STEP 1 — INSTALL DEPENDENCIES
=============================================================

Run these commands:
  pnpm add -w axios
  pnpm add -w date-fns
  pnpm add -w clsx tailwind-merge
  pnpm add -w @tanstack/react-table
  pnpm add -w react-hook-form @hookform/resolvers zod

Verify each installs without error before continuing.

=============================================================
STEP 2 — UPDATE .env.local
=============================================================

Add to existing .env.local at workspace root:
  VITE_API_URL=http://localhost:5000

=============================================================
STEP 3 — NEW FILES TO CREATE
=============================================================

lib/
  ├── utils.ts
  └── axios.ts

contexts/
  └── AuthContext.tsx

hooks/
  └── useAuth.ts

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
  ├── StatusBadge.tsx
  ├── Modal.tsx
  ├── SideSheet.tsx
  ├── AdminInput.tsx
  └── AdminSelect.tsx

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
STEP 4 — lib/utils.ts
=============================================================

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date))
}

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

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('giva_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — auto refresh token
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
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
  isSuperAdmin: boolean
  isAdmin: boolean
  isJuri: boolean
  isSiswa: boolean

Implementation:
  - Create AuthContext with createContext
  - AuthProvider component:
    → On mount: read giva_access_token from localStorage
    → If token exists: call GET /api/auth/me to validate
    → Set user from response data
    → setIsLoading(false) when done
  - login():
    → POST /api/auth/login { email, password }
    → Store: giva_access_token, giva_refresh_token, 
             giva_user in localStorage
    → Set user state
  - logout():
    → POST /api/auth/logout { refreshToken }
    → Clear all giva_ keys from localStorage
    → Set user to null
  - Computed booleans:
    isSuperAdmin = user?.role === 'SUPERADMIN'
    isAdmin = user?.role === 'ADMIN' || isSuperAdmin
    isJuri = user?.role === 'JURI'
    isSiswa = user?.role === 'SISWA'
  - Export: AuthProvider + useAuthContext hook

=============================================================
STEP 7 — hooks/useAuth.ts
=============================================================

Re-export useAuthContext from AuthContext:

import { useAuthContext } from '../contexts/AuthContext'
export const useAuth = useAuthContext
export default useAuthContext

=============================================================
STEP 8 — services/api/authApi.ts
=============================================================

import api from '../../lib/axios'

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (data: {
    fullName: string
    email: string
    password: string
    confirmPassword: string
  }) => api.post('/api/auth/register', data),
  
  logout: (refreshToken: string) =>
    api.post('/api/auth/logout', { refreshToken }),
  
  me: () => api.get('/api/auth/me'),
  
  refresh: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refreshToken })
}

=============================================================
STEP 9 — services/api/profileApi.ts
=============================================================

import api from '../../lib/axios'

export const profileApi = {
  getProfile: () =>
    api.get('/api/siswa/profile'),
  
  updateProfile: (data: Record<string, any>) =>
    api.put('/api/siswa/profile', data),
  
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.post('/api/siswa/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  getMyEvents: () => api.get('/api/siswa/my-events'),
  getMySubmissions: () => api.get('/api/siswa/my-submissions'),
  getMyCertificates: () => api.get('/api/siswa/my-certificates')
}

=============================================================
STEP 10 — services/api/eventsApi.ts
=============================================================

import api from '../../lib/axios'

export const eventsApi = {
  getEvents: (params?: Record<string, any>) =>
    api.get('/api/events', { params }),
  
  getEvent: (id: string) =>
    api.get(`/api/events/${id}`),
  
  registerToEvent: (id: string, data: { teamId?: string }) =>
    api.post(`/api/events/${id}/register`, data),
  
  getQa: (eventId: string, params?: Record<string, any>) =>
    api.get(`/api/events/${eventId}/qa`, { params }),
  
  postQuestion: (eventId: string, text: string) =>
    api.post(`/api/events/${eventId}/qa`, { text }),
  
  postReply: (eventId: string, questionId: string, 
              text: string) =>
    api.post(
      `/api/events/${eventId}/qa/${questionId}/replies`,
      { text }
    ),
  
  toggleUpvote: (eventId: string, questionId: string) =>
    api.post(
      `/api/events/${eventId}/qa/${questionId}/upvote`
    )
}

=============================================================
STEP 11 — services/api/teamsApi.ts
=============================================================

import api from '../../lib/axios'

export const teamsApi = {
  getMyTeams: () => api.get('/api/teams'),
  getTeam: (id: string) => api.get(`/api/teams/${id}`),
  createTeam: (name: string) =>
    api.post('/api/teams', { name }),
  joinTeam: (code: string) =>
    api.post('/api/teams/join', { code }),
  updateTeam: (id: string, name: string) =>
    api.put(`/api/teams/${id}`, { name }),
  disbandTeam: (id: string) =>
    api.delete(`/api/teams/${id}`),
  leaveTeam: (id: string) =>
    api.delete(`/api/teams/${id}/leave`),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/api/teams/${teamId}/members/${userId}`),
  updateMemberRole: (teamId: string, userId: string,
                     role: string) =>
    api.patch(
      `/api/teams/${teamId}/members/${userId}/role`,
      { role }
    )
}

=============================================================
STEP 12 — services/api/submissionsApi.ts
=============================================================

import api from '../../lib/axios'

export const submissionsApi = {
  getMySubmissions: () => api.get('/api/submissions'),
  getSubmission: (id: string) =>
    api.get(`/api/submissions/${id}`),
  createSubmission: (data: Record<string, any>) =>
    api.post('/api/submissions', data),
  updateSubmission: (id: string, data: Record<string, any>) =>
    api.put(`/api/submissions/${id}`, data),
  uploadFile: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/api/submissions/${id}/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteFile: (submissionId: string, fileId: string) =>
    api.delete(
      `/api/submissions/${submissionId}/files/${fileId}`
    ),
  submitSubmission: (id: string) =>
    api.post(`/api/submissions/${id}/submit`, 
             { consentGiven: true }),
  withdrawSubmission: (id: string) =>
    api.post(`/api/submissions/${id}/withdraw`)
}

=============================================================
STEP 13 — services/api/juriApi.ts
=============================================================

import api from '../../lib/axios'

export const juriApi = {
  getAssignments: () =>
    api.get('/api/juri/assignments'),
  
  getCategorySubmissions: (categoryId: string,
                           params?: Record<string, any>) =>
    api.get(
      `/api/juri/assignments/${categoryId}/submissions`,
      { params }
    ),
  
  getSubmissionDetail: (submissionId: string,
                        stage: string) =>
    api.get(`/api/juri/submissions/${submissionId}`,
            { params: { stage } }),
  
  saveScore: (data: {
    submissionId: string
    stage: string
    criteriaScores: Record<string, number>
    comment: string
    status: 'draft' | 'submitted'
  }) => api.post('/api/juri/scores', data)
}

=============================================================
STEP 14 — services/api/adminApi.ts
=============================================================

import api from '../../lib/axios'

export const adminApi = {
  // Dashboard
  getDashboard: () =>
    api.get('/api/admin/dashboard'),
  getSystemStats: () =>
    api.get('/api/superadmin/system-stats'),

  // Events CRUD
  getEvents: (params?: Record<string, any>) =>
    api.get('/api/admin/events', { params }),
  createEvent: (data: Record<string, any>) =>
    api.post('/api/admin/events', data),
  updateEvent: (id: string, data: Record<string, any>) =>
    api.put(`/api/admin/events/${id}`, data),
  updateEventStatus: (id: string, status: string) =>
    api.patch(`/api/admin/events/${id}/status`, { status }),
  deleteEvent: (id: string) =>
    api.delete(`/api/admin/events/${id}`),

  // Submissions
  getSubmissions: (params?: Record<string, any>) =>
    api.get('/api/admin/submissions', { params }),
  advanceStage: (id: string, stage: string) =>
    api.patch(`/api/admin/submissions/${id}/stage`,
              { stage }),

  // Siswa
  getSiswaList: (params?: Record<string, any>) =>
    api.get('/api/admin/siswa', { params }),
  getSiswaDetail: (id: string) =>
    api.get(`/api/admin/siswa/${id}`),

  // Certificates
  getCertificates: (params?: Record<string, any>) =>
    api.get('/api/admin/certificates', { params }),
  createCertificate: (data: Record<string, any>) =>
    api.post('/api/admin/certificates', data),
  revokeCertificate: (id: string, reason: string) =>
    api.patch(`/api/admin/certificates/${id}/revoke`,
              { reason }),

  // Reports
  getEventReport: (eventId: string) =>
    api.get(`/api/admin/reports/event/${eventId}`),

  // Superadmin — Users
  getAdminJuriUsers: (params?: Record<string, any>) =>
    api.get('/api/superadmin/users', { params }),
  createAdminOrJuri: (data: Record<string, any>) =>
    api.post('/api/superadmin/users', data),
  updateAdminOrJuri: (id: string,
                      data: Record<string, any>) =>
    api.put(`/api/superadmin/users/${id}`, data),
  toggleUserActive: (id: string) =>
    api.patch(`/api/superadmin/users/${id}/toggle-active`),
  deleteAdminOrJuri: (id: string) =>
    api.delete(`/api/superadmin/users/${id}`),

  // Superadmin — Juri Assignments
  createJuriAssignment: (data: Record<string, any>) =>
    api.post('/api/superadmin/juri-assignments', data),
  deleteJuriAssignment: (id: string) =>
    api.delete(`/api/superadmin/juri-assignments/${id}`)
}

=============================================================
STEP 15 — components/admin/StatsCard.tsx
=============================================================

import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  trend?: { value: number; isUp: boolean }
  color?: string
}

const StatsCard: React.FC<StatsCardProps> = ({
  title, value, icon, description, trend,
  color = 'bg-slate-100 text-slate-600'
}) => (
  <div className="bg-white rounded-2xl p-6 border 
    border-slate-200 shadow-sm hover:shadow-md 
    transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 
          rounded-full ${trend.isUp 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-red-100 text-red-700'}`}>
          {trend.isUp ? '↑' : '↓'} {trend.value}%
        </span>
      )}
    </div>
    <p className="text-3xl font-bold text-slate-900 mb-1">
      {value}
    </p>
    <p className="text-sm font-medium text-slate-500">
      {title}
    </p>
    {description && (
      <p className="text-xs text-slate-400 mt-1">
        {description}
      </p>
    )}
  </div>
)

export default StatsCard

=============================================================
STEP 16 — components/admin/DataTable.tsx
=============================================================

Generic table using @tanstack/react-table.
Props:
  columns: ColumnDef<TData>[]
  data: TData[]
  isLoading?: boolean
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }

Styles:
  Container: "bg-white rounded-2xl border border-slate-200 
              overflow-hidden shadow-sm"
  Table: "w-full text-sm"
  Header row: "bg-slate-50 border-b border-slate-200"
  Header cell: "px-6 py-4 text-left text-xs font-bold 
                text-slate-500 uppercase tracking-wider"
  Data row: "border-b border-slate-100 hover:bg-slate-50 
             transition-colors"
  Data cell: "px-6 py-4 text-slate-700"
  
  Loading state: 5 rows of skeleton
    "animate-pulse bg-slate-200 h-4 rounded w-full"
  
  Empty state:
    "py-12 text-center text-slate-400 text-sm"
    "Tidak ada data ditemukan"
  
  Pagination:
    Container: "flex items-center justify-between px-6 
                py-4 border-t border-slate-100"
    Info: "text-sm text-slate-500"
    Buttons: prev/next with disabled state

=============================================================
STEP 17 — components/admin/PageHeader.tsx
=============================================================

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

Render:
  <div className="flex items-start justify-between 
    pb-6 border-b border-slate-200 mb-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 
        tracking-tight">{title}</h1>
      {description && 
        <p className="text-slate-500 text-sm mt-1">
          {description}
        </p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>

=============================================================
STEP 18 — components/admin/StatusBadge.tsx
=============================================================

const statusConfig: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700 
         border-emerald-200',
  ACTIVE: 'bg-emerald-100 text-emerald-700 
           border-emerald-200',
  VALID: 'bg-emerald-100 text-emerald-700 
          border-emerald-200',
  DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  UPCOMING: 'bg-amber-100 text-amber-700 border-amber-200',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  REVOKED: 'bg-red-100 text-red-700 border-red-200',
  DISBANDED: 'bg-slate-100 text-slate-600 border-slate-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700 
                 border-blue-200',
  REVISION_REQUESTED: 'bg-orange-100 text-orange-700 
                       border-orange-200',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-200',
  SCORED: 'bg-purple-100 text-purple-700 
           border-purple-200',
}

Render:
  <span className={`inline-flex items-center px-2.5 
    py-0.5 rounded-full text-xs font-bold border
    ${statusConfig[status] || statusConfig.DRAFT}`}>
    {status.replace(/_/g, ' ')}
  </span>

=============================================================
STEP 19 — components/admin/Modal.tsx
=============================================================

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

Sizes:
  sm: "max-w-md"
  md: "max-w-lg" (default)
  lg: "max-w-2xl"

Render when isOpen:
  // Overlay
  <div className="fixed inset-0 z-50 flex items-center 
    justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/50 
      backdrop-blur-sm" onClick={onClose} />
    
    // Modal Card
    <div className={`relative bg-white rounded-2xl 
      shadow-2xl w-full ${sizeClass} max-h-[90vh] 
      flex flex-col`}>
      
      // Header
      <div className="flex items-center justify-between 
        p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">
          {title}
        </h3>
        <button onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full 
            text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>
      
      // Body
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
      
      // Footer
      {footer && 
        <div className="p-6 border-t border-slate-100">
          {footer}
        </div>}
    </div>
  </div>

=============================================================
STEP 20 — components/admin/SideSheet.tsx
=============================================================

interface SideSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

Render:
  <div className={`fixed inset-0 z-50 
    ${isOpen ? 'pointer-events-auto' : 
               'pointer-events-none'}`}>
    
    // Backdrop
    <div className={`absolute inset-0 bg-slate-900/40 
      backdrop-blur-sm transition-opacity duration-300
      ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose} />
    
    // Panel
    <div className={`absolute right-0 top-0 h-full 
      w-full max-w-lg bg-white shadow-2xl 
      transform transition-transform duration-300
      flex flex-col
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      // Header
      <div className="flex items-center justify-between 
        p-6 border-b border-slate-100 shrink-0">
        <h3 className="text-lg font-bold text-slate-900">
          {title}
        </h3>
        <button onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full">
          <X size={20} />
        </button>
      </div>
      
      // Content
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  </div>

=============================================================
STEP 21 — components/admin/AdminInput.tsx
=============================================================

interface AdminInputProps 
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

Render:
  <div className="space-y-1.5">
    {label && 
      <label className="block text-xs font-bold 
        uppercase text-slate-500 tracking-wide">
        {label}
      </label>}
    <input
      className={`w-full px-4 py-2.5 bg-slate-50 border 
        rounded-xl text-sm font-medium text-slate-900
        focus:ring-2 focus:ring-slate-900 
        focus:border-slate-900 outline-none transition-all
        placeholder:text-slate-400
        ${error ? 'border-red-300 bg-red-50' 
                : 'border-slate-200'}`}
      {...props}
    />
    {error && 
      <p className="text-xs text-red-600">{error}</p>}
  </div>

=============================================================
STEP 22 — components/admin/AdminSelect.tsx
=============================================================

interface AdminSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
}

Render native select with Tailwind styling:
  "w-full px-4 py-2.5 bg-slate-50 border border-slate-200
   rounded-xl text-sm font-medium text-slate-900
   focus:ring-2 focus:ring-slate-900 outline-none
   transition-all appearance-none cursor-pointer"

=============================================================
STEP 23 — layouts/AdminLayout.tsx
=============================================================

Pattern: Same as existing DashboardLayout.tsx structure.
Import useAuthContext from contexts/AuthContext.

State: collapsed (boolean), isMobileOpen (boolean)

Sidebar nav items:
  
  Base items (ADMIN + SUPERADMIN):
  [
    { label: 'Dashboard', href: '/admin', 
      icon: LayoutDashboard },
    { label: 'Events', href: '/admin/events', 
      icon: Calendar },
    { label: 'Submissions', href: '/admin/submissions', 
      icon: FileText },
    { label: 'Data Siswa', href: '/admin/siswa', 
      icon: Users },
    { label: 'Sertifikat', href: '/admin/certificates', 
      icon: Award },
    { label: 'Laporan', href: '/admin/reports', 
      icon: BarChart2 },
  ]
  
  Additional for SUPERADMIN only:
  [
    { label: 'Kelola Pengguna', href: '/superadmin/users',
      icon: Shield },
    { label: 'Penugasan Juri', 
      href: '/superadmin/assignments', icon: Briefcase },
    { label: 'System Stats', href: '/superadmin', 
      icon: Activity },
  ]

Sidebar style: bg-slate-900 text-white
  Same as DashboardLayout sidebar pattern

Active nav item: 
  "bg-white/10 text-white border-l-2 border-white"

Topbar (desktop h-16 bg-white border-b):
  Left: collapse button + "GIVA Admin" text
  Right: 
    - Role badge: 
      SUPERADMIN → purple pill
      ADMIN → blue pill
    - User fullName
    - Logout button (LogOut icon)

Mobile: hamburger menu + overlay sidebar

Use <Outlet /> for main content area

=============================================================
STEP 24 — pages/admin/AdminDashboard.tsx
=============================================================

On mount: call adminApi.getDashboard()
State: data, isLoading, error

Show loading skeleton while fetching.

Layout:
  <PageHeader title="Dashboard" 
    description="Ringkasan sistem GIVA" />
  
  Row 1 — 5 StatsCards (grid-cols-2 md:grid-cols-5):
    - Total Siswa | icon: Users | blue
    - Event Aktif | icon: Calendar | green  
    - Total Submission | icon: FileText | amber
    - Total Sertifikat | icon: Award | purple
    - Submission Dinilai | icon: CheckCircle | emerald
  
  Row 2 — 2 columns (grid-cols-1 lg:grid-cols-2):
    Left: BarChart (Recharts)
      Title: "Event by Registrasi"
      Data: topEvents from API
      XAxis: event title (slice 0,20)
      Bar: registrationCount, fill="#0f172a"
    
    Right: Recent Registrations
      Title: "Pendaftaran Terbaru"
      Table: nama siswa | event | waktu
      Show last 10 from recentRegistrations

=============================================================
STEP 25 — pages/admin/AdminEvents.tsx
=============================================================

State: events[], isLoading, search, statusFilter, 
       page (1), totalPages
       showStatusModal (boolean), selectedEvent

On mount + filter change:
  fetch adminApi.getEvents({ search, status, page })

Render:
  <PageHeader 
    title="Manajemen Event"
    action={
      <button onClick={() => navigate('/admin/events/new')}
        className="flex items-center gap-2 px-4 py-2.5 
          bg-slate-900 text-white rounded-xl text-sm 
          font-bold hover:bg-black transition-colors">
        <Plus size={16} /> Tambah Event
      </button>
    }
  />
  
  Filter bar (flex gap-3):
    - Search input (flex-1)
    - AdminSelect: Status filter
      options: All, DRAFT, OPEN, UPCOMING, CLOSED
  
  DataTable columns:
    { header: 'Judul', cell: bold text + navigate on click }
    { header: 'Kategori', cell: text }
    { header: 'Format', cell: StatusBadge }
    { header: 'Status', cell: StatusBadge }
    { header: 'Deadline', cell: formatted date }
    { header: 'Pendaftar', cell: number }
    { header: 'Aksi', cell: dropdown menu }
  
  Row actions dropdown (3 dots button):
    - Edit → navigate to /admin/events/:id/edit
    - Ubah Status → open Modal with status select
    - Hapus → confirm then deleteEvent
      (show inline confirm: "Ketik DELETE untuk konfirmasi")

=============================================================
STEP 26 — pages/admin/AdminEventForm.tsx
=============================================================

Determine mode: 
  useParams() id → if exists: edit mode, else: create mode
On edit mount: fetch adminApi from getEvents + filter by id

Form using react-hook-form + zod schema:
  schema fields:
    title: z.string().min(5, "Minimal 5 karakter")
    shortDescription: z.string().min(10)
    fullDescription: z.string().min(20)
    theme: z.string().optional()
    date: z.string().min(1, "Wajib diisi")
    location: z.string().min(1)
    format: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID'])
    category: z.string().min(1)
    status: z.enum(['DRAFT','OPEN','UPCOMING','CLOSED'])
    deadline: z.string().min(1)
    fee: z.string().default('Gratis')
    teamSizeMin: z.number().min(1).default(1)
    teamSizeMax: z.number().min(1).default(5)
    eligibility: z.array(z.string()).default([])
    sdgs: z.array(z.number()).default([])
    prizePool: z.string().optional()
    organizer: z.string().default('GIVA')
    timeline: z.array(z.object({
      date: z.string(), title: z.string(),
      description: z.string(), order: z.number()
    })).default([])
    faqs: z.array(z.object({
      question: z.string(), answer: z.string(),
      order: z.number()
    })).default([])
    categories: z.array(z.object({
      name: z.string(), description: z.string()
    })).default([])

Tabbed layout (pure Tailwind tabs):
  const tabs = ['Info Dasar', 'Detail', 
                 'Timeline', 'FAQ', 'Kategori']
  
  Tab buttons:
    active: "border-b-2 border-slate-900 text-slate-900"
    inactive: "text-slate-500 hover:text-slate-700"

  Tab "Info Dasar": title, shortDescription, 
    fullDescription, theme, date, deadline, location,
    format (select), category, status (select), fee,
    teamSizeMin, teamSizeMax, organizer, prizePool
  
  Tab "Detail":
    Eligibility: dynamic list (add text input, remove X)
    SDGs: checkbox grid 1-17
  
  Tab "Timeline":
    Dynamic list of timeline items
    Each: date input + title input + description textarea
    Add/Remove buttons
  
  Tab "FAQ":
    Dynamic list: question + answer pairs
    Add/Remove buttons
  
  Tab "Kategori":
    Dynamic list: name + description pairs
    Add/Remove buttons

Submit button (sticky bottom):
  "Simpan Event" → loading state during submit
  On success: navigate('/admin/events')
  On error: show error message

=============================================================
STEP 27 — pages/admin/AdminSubmissions.tsx
=============================================================

State: submissions[], isLoading, filters
       selectedSubmission, showSheet

Filters: eventId select, status select, stage select
  Fetch events list for the event dropdown

DataTable columns:
  Judul Proyek | Tim | Event | Tahap (StatusBadge) |
  Status (StatusBadge) | Total Nilai | Aksi

Row action "Lihat Detail":
  Opens SideSheet with:
    - Project title, team name, event name
    - Status + Stage badges
    - Description
    - Files list (name + download link)
    - Score summary: juri name + total score per stage
  
Row action "Naikkan Tahap":
  Show only if status === 'SCORED'
  Stages: ABSTRACT → PAPER → FINAL
  Confirm Modal → call advanceStage

=============================================================
STEP 28 — pages/admin/AdminSiswa.tsx
=============================================================

State: siswaList[], isLoading, filters,
       selectedSiswa, showSheet

Filters: search input, province select, schoolLevel select

DataTable columns:
  Nama | Email | Sekolah | Jenjang | Kelas | Provinsi |
  Kelengkapan | Aksi

Kelengkapan cell (completeness progress bar):
  <div className="flex items-center gap-2">
    <div className="w-16 bg-slate-200 rounded-full h-1.5">
      <div className="bg-slate-900 h-1.5 rounded-full"
           style={{width: `${completeness}%`}} />
    </div>
    <span className="text-xs text-slate-500">
      {completeness}%
    </span>
  </div>

Row action "Detail" → opens SideSheet with:
  - Avatar + fullName + email + role badge
  - Profile fields in 2-column grid
  - Registered events list
  - Submissions list with status badges

=============================================================
STEP 29 — pages/admin/AdminCertificates.tsx
=============================================================

State: certificates[], isLoading, filters
       showCreateModal, showRevokeModal
       selectedCert, revokeReason

Filters: eventId select, type select

DataTable columns:
  Penerima | Event | Tipe | Penghargaan |
  Tanggal | Diterbitkan Oleh | Status | Aksi

"Terbitkan Sertifikat" button → Modal form:
  Fields:
    - Cari Siswa: search input + dropdown results
      (call getSiswaList on type, show name+email options)
    - Pilih Event: AdminSelect from events list
    - Tipe: select WINNER | PARTICIPANT | JURI
    - Penghargaan: text input
    - Diterbitkan Oleh: text input (default: "GIVA Global")
  Submit → createCertificate → refresh list

Row action "Cabut" (only if VALID):
  Modal with:
    Title: "Cabut Sertifikat"
    Body: reason textarea (required)
    Submit → revokeCertificate

=============================================================
STEP 30 — pages/admin/AdminReports.tsx
=============================================================

State: events[], selectedEventId, reportData, isLoading

On mount: fetch events list for selector
On event select: fetch adminApi.getEventReport(eventId)

Layout:
  <PageHeader title="Laporan Event" />
  
  Event selector:
    AdminSelect with events list
    placeholder="Pilih event untuk lihat laporan"
  
  If no event selected: empty state illustration
  
  If loading: skeleton
  
  If data loaded:
    Row 1 — 4 StatsCards:
      Total Registrasi | Total Submission |
      Submission Dinilai | Nilai Rata-rata
    
    Row 2 — 2 columns:
      Left: BarChart
        Title: "Nilai Rata-rata per Kategori"
        XAxis: categoryName
        Bar: avgScore, fill="#0f172a"
      
      Right: Top 10 Submissions table
        Columns: # | Tim | Judul Proyek | Total Nilai
        Sorted by score descending

=============================================================
STEP 31 — pages/superadmin/SuperAdminDashboard.tsx
=============================================================

On mount: fetch adminApi.getSystemStats()

Layout:
  <PageHeader title="System Statistics" 
    description="Overview sistem GIVA" />
  
  Row 1 — User stats (3 cards):
    Total ADMIN | Total JURI | Total SISWA
  
  Row 2 — System stats (3 cards):
    Total Events | Total Submissions | Storage Used (MB)
  
  Row 3 — Quick Navigation cards:
    "Kelola Admin & Juri" → /superadmin/users
    "Penugasan Juri" → /superadmin/assignments
  Each card: icon + title + description + arrow button

=============================================================
STEP 32 — pages/superadmin/SuperAdminUsers.tsx
=============================================================

State: users[], isLoading, activeTab ('ADMIN'|'JURI')
       showModal, modalMode ('create'|'edit')
       selectedUser, showDeleteConfirm

On mount + tab change: 
  fetch adminApi.getAdminJuriUsers({ role: activeTab })

Tab switcher:
  "Admin" | "Juri" tabs (pure Tailwind)
  active: "bg-slate-900 text-white rounded-lg"

"Tambah [Admin/Juri]" button → Modal form:
  Fields: fullName, email, password, 
          role select (default: activeTab)
  Zod: fullName min 2, email valid, password min 8
  Submit → createAdminOrJuri

DataTable columns:
  Nama | Email | Status (badge) | Dibuat | Aksi

Status badge:
  isActive true → "AKTIF" green
  isActive false → "NONAKTIF" red

Row actions dropdown:
  "Edit" → same Modal prefilled
    (password field: placeholder="Kosongkan jika 
     tidak diubah", not required in edit mode)
  "Aktif/Nonaktifkan" → confirm Modal 
    → toggleUserActive
  "Hapus" → confirm Modal with warning text
    → deleteAdminOrJuri

=============================================================
STEP 33 — pages/superadmin/SuperAdminJuriAssignments.tsx
=============================================================

State: events[], categories[], assignments[]
       selectedEventId, selectedCategoryId
       showAssignModal, juriList[]

On mount: fetch events list

On event select: 
  Set selectedEventId
  Fetch categories from selected event
  (GET /api/admin/events/:id → use categories array)

On category select:
  Fetch assignments for that category
  (from judgeAssignments in event data)

Layout: 2-column grid on desktop

Left column "Pilih Target":
  "Event" label + AdminSelect (events list)
  "Kategori" label + AdminSelect 
    (categories of selected event, disabled if no event)

Right column "Juri Bertugas":
  Title: selected category name or "Pilih kategori"
  
  "Tugaskan Juri" button (disabled if no category) →
    Modal form:
      Select Juri: 
        fetch adminApi.getAdminJuriUsers({ role: 'JURI' })
        show as select options
      Select Stage: ABSTRACT | PAPER | FINAL
      Submit → createJuriAssignment → refresh
  
  Assignment list:
    Each item card:
      - Juri fullName + email
      - Stage badge
      - Progress: X/Y submissions scored
      - "Hapus" button → confirm → deleteJuriAssignment

=============================================================
STEP 34 — UPDATE App.tsx
=============================================================

ADD to existing App.tsx (do not remove anything):

1. Import new components:
   import { AuthProvider, useAuthContext } 
     from './contexts/AuthContext'
   import AdminLayout from './layouts/AdminLayout'
   import AdminDashboard from './pages/admin/AdminDashboard'
   import AdminEvents from './pages/admin/AdminEvents'
   import AdminEventForm from './pages/admin/AdminEventForm'
   import AdminSubmissions 
     from './pages/admin/AdminSubmissions'
   import AdminSiswa from './pages/admin/AdminSiswa'
   import AdminCertificates 
     from './pages/admin/AdminCertificates'
   import AdminReports from './pages/admin/AdminReports'
   import SuperAdminDashboard 
     from './pages/superadmin/SuperAdminDashboard'
   import SuperAdminUsers 
     from './pages/superadmin/SuperAdminUsers'
   import SuperAdminJuriAssignments 
     from './pages/superadmin/SuperAdminJuriAssignments'

2. Add guard components BEFORE the App function:

const AdminGuard: React.FC = () => {
  const { user, isLoading } = useAuthContext()
  if (isLoading) return (
    <div className="min-h-screen flex items-center 
      justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-slate-900 
        border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (!['ADMIN', 'SUPERADMIN'].includes(user.role))
    return <Navigate to="/" replace />
  return <AdminLayout />
}

const SuperAdminGuard: React.FC = () => {
  const { user, isLoading } = useAuthContext()
  if (isLoading) return (
    <div className="min-h-screen flex items-center 
      justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-slate-900 
        border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'SUPERADMIN')
    return <Navigate to="/admin" replace />
  return <AdminLayout />
}

3. Wrap entire <HashRouter> content with <AuthProvider>:
   <AuthProvider>
     <HashRouter>
       ...existing content...
     </HashRouter>
   </AuthProvider>

4. Add inside <Routes> (after existing routes):
   <Route path="/admin" element={<AdminGuard />}>
     <Route index element={<AdminDashboard />} />
     <Route path="events" element={<AdminEvents />} />
     <Route path="events/new" 
            element={<AdminEventForm />} />
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

=============================================================
STEP 35 — UPDATE pages/AuthPage.tsx
=============================================================

Update the handleLoginSubmit function:

1. Import useAuthContext at top:
   import { useAuthContext } from '../contexts/AuthContext'

2. Inside component add:
   const { login } = useAuthContext()

3. Replace the existing handleLoginSubmit with:
   const handleLoginSubmit = async (e: React.FormEvent) => {
     e.preventDefault()
     setLoading(true)
     setError(null)
     try {
       await login(formData.email, formData.password)
       // Get user from localStorage to determine redirect
       const userStr = localStorage.getItem('giva_user')
       const user = userStr ? JSON.parse(userStr) : null
       if (!user) throw new Error('Login failed')
       
       if (user.role === 'SUPERADMIN' || 
           user.role === 'ADMIN') {
         navigate('/admin')
       } else if (user.role === 'JURI') {
         navigate('/dashboard/judge')
       } else {
         navigate('/dashboard')
       }
     } catch (err: any) {
       setError(
         err.response?.data?.message || 
         'Email atau password salah'
       )
     } finally {
       setLoading(false)
     }
   }

4. Remove the DEMO_ACCOUNTS array and mock timeout logic
   since login now uses real API.

5. Keep everything else in AuthPage unchanged.

=============================================================
EXECUTION ORDER
=============================================================

Execute in this exact order:
1.  Install dependencies (pnpm add -w ...)
2.  Update .env.local
3.  lib/utils.ts
4.  lib/axios.ts
5.  contexts/AuthContext.tsx
6.  hooks/useAuth.ts
7.  services/api/authApi.ts
8.  services/api/profileApi.ts
9.  services/api/eventsApi.ts
10. services/api/teamsApi.ts
11. services/api/submissionsApi.ts
12. services/api/juriApi.ts
13. services/api/adminApi.ts
14. components/admin/StatsCard.tsx
15. components/admin/DataTable.tsx
16. components/admin/PageHeader.tsx
17. components/admin/StatusBadge.tsx
18. components/admin/Modal.tsx
19. components/admin/SideSheet.tsx
20. components/admin/AdminInput.tsx
21. components/admin/AdminSelect.tsx
22. layouts/AdminLayout.tsx
23. pages/admin/AdminDashboard.tsx
24. pages/admin/AdminEvents.tsx
25. pages/admin/AdminEventForm.tsx
26. pages/admin/AdminSubmissions.tsx
27. pages/admin/AdminSiswa.tsx
28. pages/admin/AdminCertificates.tsx
29. pages/admin/AdminReports.tsx
30. pages/superadmin/SuperAdminDashboard.tsx
31. pages/superadmin/SuperAdminUsers.tsx
32. pages/superadmin/SuperAdminJuriAssignments.tsx
33. App.tsx (add routes + guards + AuthProvider)
34. pages/AuthPage.tsx (update login only)

Generate files 1-13 first, then pause and confirm
before continuing to components and pages.