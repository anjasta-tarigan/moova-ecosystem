# GIVA - Science & Innovation Ecosystem

## Overview

GIVA is a global platform connecting students, researchers, and organizations through science and innovation competitions.

## Tech Stack

- Frontend: React 19, TypeScript, Vite 6, Tailwind v4
- Backend: Express, TypeScript, Prisma, PostgreSQL
- Auth: JWT (access + refresh tokens)

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 14
- pnpm >= 10

## Setup

### Backend

```bash
cd backend
pnpm install
cp .env.example .env
# Edit .env with your database credentials
pnpm prisma db push
pnpm prisma db seed
pnpm dev
```

### Frontend

```bash
# At workspace root
pnpm install
cp .env.example .env.local
# Edit .env.local with your API URL
pnpm dev
```

## Default Accounts

| Role        | Email                | Password      |
| ----------- | -------------------- | ------------- |
| Super Admin | superadmin@giva.test | superadmin123 |
| Admin       | admin@giva.test      | admin123      |
| Judge       | juri1@giva.test      | juri123       |
| Student     | siswa@giva.test      | siswa123      |

## Available Routes

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
# Frontend
pnpm build
pnpm preview

# Backend
cd backend
pnpm build
pnpm start
```
