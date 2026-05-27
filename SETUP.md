# SDLC Platform - Setup Guide

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0 (or use corepack)
- Docker & Docker Compose

## Quick Start

### 1. Start Infrastructure

```bash
sudo docker compose -f docker/docker-compose.dev.yml up -d
```

This starts:
- **PostgreSQL 16** on port 5432
- **Redis 7** on port 6379
- **MinIO** on port 9000 (console: 9001)

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

### 4. Start Development Servers

```bash
# Start backend (port 3001)
pnpm dev:backend

# Start frontend (port 3000) - in another terminal
pnpm dev:frontend
```

Or start both at once:
```bash
pnpm dev
```

## Demo Credentials

After seeding:
- **Email:** admin@sdlc.dev
- **Password:** Admin123!

## Project Structure

```
sdlc-platform/
├── docker/                    # Docker Compose files
├── packages/
│   ├── backend/               # NestJS API (port 3001)
│   │   ├── src/
│   │   │   ├── common/        # Guards, interceptors, filters
│   │   │   ├── config/        # Configuration modules
│   │   │   ├── database/      # Prisma schema & service
│   │   │   └── modules/       # Feature modules
│   │   └── ...
│   └── frontend/              # Next.js 15 App (port 3000)
│       ├── src/
│       │   ├── app/           # App Router pages
│       │   ├── components/    # React components
│       │   └── lib/           # API client, auth context
│       └── ...
└── ...
```

## API Endpoints

Base URL: `http://localhost:3001/api/v1`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Organizations
- `POST /organizations` - Create organization
- `GET /organizations` - List user's organizations
- `GET /organizations/:id` - Get organization details
- `PATCH /organizations/:id` - Update organization
- `DELETE /organizations/:id` - Delete organization

### Projects
- `POST /organizations/:orgId/projects` - Create project
- `GET /projects` - List user's projects
- `GET /projects/:id` - Get project details
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Members
- `POST /projects/:id/members` - Add member
- `GET /projects/:id/members` - List members
- `PATCH /projects/:id/members/:memberId` - Update member role
- `DELETE /projects/:id/members/:memberId` - Remove member

### Issues
- `GET /projects/:id/issues` - List issues (with filters: status, assigneeId, priority)
- `POST /projects/:id/issues` - Create issue
- `GET /issues/:id` - Get issue details
- `PATCH /issues/:id` - Update issue
- `DELETE /issues/:id` - Delete issue
- `GET /issues/:id/comments` - Get comments
- `POST /issues/:id/comments` - Add comment
- `GET /issues/:id/activity` - Get activity log

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching & message broker
- **JWT** - Authentication (Access/Refresh tokens)
- **Argon2** - Password hashing

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **TanStack Query** - Server state management
- **Axios** - HTTP client
- **Lucide React** - Icons

## Troubleshooting

### Database connection issues
```bash
# Check if PostgreSQL is running
sudo docker ps

# View PostgreSQL logs
sudo docker logs sdlc-postgres
```

### Reset database
```bash
sudo docker compose -f docker/docker-compose.dev.yml down -v
sudo docker compose -f docker/docker-compose.dev.yml up -d
pnpm db:migrate
pnpm db:seed
```
