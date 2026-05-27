# SDLC Platform - Setup Guide

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL 16 (local or Neon)
- npm

## Quick Start

### 1. Install Dependencies

```bash
cd packages/frontend
npm install
```

### 2. Setup Database

Create a `.env` file:

```bash
cd packages/frontend
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/sdlc_platform"
JWT_SECRET="your-secret-key-change-in-production"
```

Then run:

```bash
npx prisma generate
npx prisma migrate dev
```

### 3. Start Dev Server

```bash
npm run dev
```

Open `http://localhost:3000`

### Using Neon (Serverless PostgreSQL)

Replace `DATABASE_URL` with your Neon connection string:

```
DATABASE_URL="postgresql://neondb_owner:...@ep-....aws.neon.tech/neondb?sslmode=require"
```

Then run:

```bash
npx prisma db push
npm run dev
```

## API Endpoints

All endpoints are served at `/api/v1` on the same origin.

### Authentication
- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/refresh` — Refresh access token
- `POST /api/v1/auth/logout` — Logout
- `GET /api/v1/auth/me` — Get current user

### Organizations
- `GET /api/v1/organizations` — List user's organizations
- `POST /api/v1/organizations` — Create organization
- `GET /api/v1/organizations/:id` — Get organization details
- `PATCH /api/v1/organizations/:id` — Update organization
- `DELETE /api/v1/organizations/:id` — Delete organization

### Projects
- `GET /api/v1/projects` — List user's projects
- `POST /api/v1/projects` — Create personal project
- `POST /api/v1/projects/organizations/:orgId` — Create project in org
- `GET /api/v1/projects/:id` — Get project details
- `PATCH /api/v1/projects/:id` — Update project
- `DELETE /api/v1/projects/:id` — Delete project

### Issues
- `GET /api/v1/projects/:projectId/issues` — List issues
- `POST /api/v1/projects/:projectId/issues` — Create issue
- `GET /api/v1/projects/:projectId/issues/:id` — Get issue details
- `PATCH /api/v1/projects/:projectId/issues/:id` — Update issue
- `DELETE /api/v1/projects/:projectId/issues/:id` — Delete issue
- `GET /api/v1/projects/:projectId/issues/:id/comments` — Get comments
- `POST /api/v1/projects/:projectId/issues/:id/comments` — Add comment
- `GET /api/v1/projects/:projectId/issues/:id/activity` — Get activity log

### Sprints
- `GET /api/v1/projects/:projectId/sprints` — List sprints
- `POST /api/v1/projects/:projectId/sprints` — Create sprint
- `PATCH /api/v1/projects/:projectId/sprints/:id/status` — Update sprint status
- `GET /api/v1/projects/:projectId/sprints/:id/burndown` — Get burndown data

### Epics, Documents, Bugs, Test Management

All follow the same pattern under `/api/v1/projects/:projectId/`.

### Other
- `POST /api/v1/upload` — File upload
- `GET /api/v1/search?q=` — Global search
- `GET /api/v1/notifications` — List notifications
- `GET /api/v1/roles` — List roles
- `GET /api/v1/health` — Health check

## Troubleshooting

### Prisma validation error (DATABASE_URL)

```
Error: Environment variable not found: DATABASE_URL
```

Create `.env` file in `packages/frontend/` with `DATABASE_URL`.

### Password login fails after migration

Old passwords were hashed with argon2. The new code supports both argon2 and bcryptjs. If login still fails, register a new account.

### Dynamic param conflict

If you see `You cannot use different slug names for the same dynamic path`, ensure all dynamic segments under the same path level use the same param name (e.g., `[projectId]`).
