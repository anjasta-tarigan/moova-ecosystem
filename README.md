# GIVA - Science & Innovation Ecosystem

## Overview

GIVA is a pnpm monorepo (Vite frontend + Express/Prisma backend) that connects students, researchers, and organizations through science and innovation competitions. Development runs on `http://localhost:3000` (frontend) and `http://localhost:5000` (backend), backed by PostgreSQL.

## Tech Stack

- Frontend: React 19, TypeScript, Vite 6, Tailwind v4
- Backend: Express, TypeScript, Prisma v7 (PrismaPg adapter) on PostgreSQL
- Auth: JWT (access + refresh tokens)

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 14 with a database named `giva_db`
- pnpm >= 10

## Setup

1. Install dependencies (workspace root)

```bash
pnpm install
```

2. Configure environment variables

- Copy `.env.example` to `.env` at the workspace root for shared/frontend variables (e.g., `VITE_API_URL`, `DATABASE_URL=postgresql://postgres:@localhost:5432/giva_db`).
- Copy `backend/.env.example` to `backend/.env` for backend runtime variables (`DATABASE_URL`, JWT secrets, CORS origin, port).

3. Provision the database

```bash
# Creates or updates giva_db schema and seeds default accounts
pnpm run db:push
pnpm run db:seed
```

4. Run the full stack locally

```bash
pnpm run dev
```

This starts frontend (Vite) and backend (Express + Prisma) concurrently.

## Default Accounts

| Role        | Email                | Password      |
| ----------- | -------------------- | ------------- |
| Super Admin | superadmin@giva.test | superadmin123 |
| Admin       | admin@giva.test      | admin123      |
| Judge       | juri1@giva.test      | juri123       |
| Student     | siswa@giva.test      | siswa123      |

## Common Routes

| Path             | Access     | Description              |
| ---------------- | ---------- | ------------------------ |
| /                | Public     | Landing page             |
| /events          | Public     | Events listing           |
| /login           | Public     | Login                    |
| /join            | Public     | Register (students only) |
| /dashboard       | Student    | Student dashboard        |
| /dashboard/judge | Judge      | Judge workspace          |
| /admin           | Admin      | Admin panel              |
| /superadmin      | SuperAdmin | System management        |

## Build for Production

```bash
# Build frontend + backend
pnpm run build

# Preview static frontend build
pnpm run preview

# Start compiled backend (after pnpm run build)
pnpm run start
```
