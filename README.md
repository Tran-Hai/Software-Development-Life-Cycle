# SDLC Platform

End-to-end software development lifecycle management platform.

## Features

- **Authentication & RBAC** — JWT access/refresh tokens, project-scoped roles (Owner, Admin, Member, Viewer)
- **Project Management** — Multi-project support with member management
- **Issue Tracking** — Tasks, stories, bugs, epics with comments and activity log
- **Kanban Board** — Drag-and-drop issue management
- **Sprint Planning** — Sprint creation, goal setting, and tracking
- **Test Management** — Test suites, test cases, test runs
- **Bug Tracking** — Dedicated bug/defect management
- **Wiki / Documentation** — Project documentation pages
- **Real-time Notifications** — WebSocket-powered updates
- **Global Search** — Cross-project search
- **Dashboard & Analytics** — Per-project and cross-project stats
- **Dark Mode** — Light/dark theme toggle

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, TanStack Query |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL (Neon Serverless) |
| Cache | Redis |
| Storage | MinIO (S3-compatible) |
| Auth | JWT (Access/Refresh), Argon2 password hashing |
| Real-time | WebSocket |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                │
│  Auth  | Dashboard | Issues | Kanban | Sprints | Wiki      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST + WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│                    Backend API (NestJS)                      │
│  Auth | Users | Organizations | Projects | Members          │
│  Issues | Sprints | Epics | Test Management | Bugs          │
│  Documents | Notifications | Search | RBAC | File Upload    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Infrastructure Layer                       │
│  PostgreSQL (Neon)  |  Redis  |  MinIO (S3)                 │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter @sdlc/backend run prisma:generate

# Push schema to database and seed
pnpm --filter @sdlc/backend run prisma:push && pnpm --filter @sdlc/backend run prisma:seed

# Start development servers (backend: 3001, frontend: 3000)
pnpm dev
```

### Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@sdlc.dev | Admin123! | Super Admin |

## Project Structure

```
sdlc-platform/
├── packages/
│   ├── backend/                    # NestJS API
│   │   ├── src/
│   │   │   ├── common/             # Guards, interceptors, decorators
│   │   │   ├── config/             # Database, JWT, Redis config
│   │   │   ├── database/
│   │   │   │   ├── prisma/         # Schema, migrations, Prisma service
│   │   │   │   └── seeds/          # Demo data seeding
│   │   │   └── modules/
│   │   │       ├── auth/           # JWT authentication
│   │   │       ├── users/          # User management
│   │   │       ├── organizations/  # Organization CRUD
│   │   │       ├── projects/       # Project CRUD + stats
│   │   │       ├── members/        # Project membership
│   │   │       ├── issues/         # Issue tracking
│   │   │       ├── epics/          # Epic management
│   │   │       ├── sprints/        # Sprint planning
│   │   │       ├── bugs/           # Bug/defect tracking
│   │   │       ├── test-management/ # Test suites, cases, runs
│   │   │       ├── documents/      # Wiki/documentation
│   │   │       ├── notifications/  # In-app notifications
│   │   │       ├── search/         # Global search
│   │   │       ├── rbac/           # Roles & permissions
│   │   │       └── file-upload/    # S3 file storage
│   │   └── ...
│   └── frontend/                   # Next.js 15
│       ├── src/
│       │   ├── app/                # App Router (auth + dashboard)
│       │   ├── components/         # UI components + layout
│       │   └── lib/                # API client, auth, theme context
│       └── ...
└── docker/                         # Docker Compose for local dev
```

## Environment Variables

Copy `packages/backend/.env.example` to `packages/backend/.env` and configure:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `REDIS_URL` | Redis connection string |
| `MINIO_*` | S3-compatible storage config |
| `FRONTEND_URL` | Frontend origin for CORS |

## License

MIT
