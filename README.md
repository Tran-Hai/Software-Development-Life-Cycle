# SDLC Platform - End-to-End Software Development Lifecycle Management

A comprehensive Enterprise SaaS platform for managing the complete software development lifecycle, from requirements gathering to CI/CD deployment monitoring.

## Features

### Phase 1: Foundation & MVP ✅
- [x] User Authentication (JWT Access/Refresh Tokens)
- [x] Role-Based Access Control (RBAC)
- [x] Organization & Project Management
- [x] Team Member Management
- [x] Issue Tracking (Tasks, Stories, Bugs)
- [x] Issue Comments & Activity Log
- [x] Dashboard & Analytics

### Phase 2: Agile & Collaboration (Coming Soon)
- [ ] Sprint Planning & Management
- [ ] Kanban Board (Drag & Drop)
- [ ] Wiki / Documentation
- [ ] Real-time Updates (WebSockets)
- [ ] Notifications System

### Phase 3: Testing & CI/CD (Coming Soon)
- [ ] Test Suite & Test Case Management
- [ ] Test Run Execution
- [ ] Bug/Defect Tracking
- [ ] CI/CD Pipeline Monitoring
- [ ] GitHub/GitLab Webhook Integration

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, TailwindCSS, TanStack Query |
| **Backend** | NestJS, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Storage** | MinIO (S3-compatible) |
| **Auth** | JWT (Access/Refresh), Argon2 password hashing |
| **Infrastructure** | Docker Compose |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │Dashboard │  │  Issues  │  │ Projects │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────┐
│                        Backend (NestJS)                     │
│  ┌──────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Auth │  │Organizations│ │ Projects │  │    Issues      │  │
│  │Module│  │  Module   │  │  Module  │  │    Module      │  │
│  └──────┘  └──────────┘  └──────────┘  └────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              RBAC & Permission Guards                │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Infrastructure Layer                      │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │  Redis   │  │       MinIO          │  │
│  │  (Primary)   │  │  (Cache) │  │    (File Storage)    │  │
│  └──────────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

See [SETUP.md](SETUP.md) for detailed setup instructions.

### TL;DR

```bash
# 1. Start infrastructure
sudo docker compose -f docker/docker-compose.dev.yml up -d

# 2. Install dependencies
pnpm install

# 3. Setup database
pnpm db:generate && pnpm db:migrate && pnpm db:seed

# 4. Start development servers
pnpm dev
```

### Demo Credentials
- **Email:** admin@sdlc.dev
- **Password:** Admin123!

## API Documentation

### Authentication

```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","fullName":"John Doe"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sdlc.dev","password":"Admin123!"}'
```

### Projects

```bash
# List projects
curl http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer <accessToken>"

# Create issue
curl -X POST http://localhost:3001/api/v1/projects/<projectId>/issues \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Feature","issueTypeId":"<typeId>","priority":"high"}'
```

## Project Structure

```
sdlc-platform/
├── docker/                          # Docker configuration
│   └── docker-compose.dev.yml       # Development infrastructure
├── packages/
│   ├── backend/                     # NestJS API
│   │   ├── src/
│   │   │   ├── common/              # Cross-cutting concerns
│   │   │   │   ├── decorators/      # @CurrentUser, @RequiredPermission
│   │   │   │   ├── guards/          # JWT, RBAC, Project permissions
│   │   │   │   ├── interceptors/    # Logging, Transform, Timeout
│   │   │   │   ├── filters/         # Global exception handling
│   │   │   │   └── pipes/           # Validation
│   │   │   ├── config/              # Configuration modules
│   │   │   ├── database/            # Prisma ORM
│   │   │   │   ├── prisma/          # Schema & service
│   │   │   │   └── seeds/           # Demo data
│   │   │   └── modules/             # Feature modules
│   │   │       ├── auth/            # Authentication & JWT
│   │   │       ├── users/           # User management
│   │   │       ├── organizations/   # Organization CRUD
│   │   │       ├── projects/        # Project CRUD
│   │   │       ├── members/         # Project membership
│   │   │       ├── issues/          # Issue tracking
│   │   │       └── rbac/            # Roles & permissions
│   │   └── ...
│   └── frontend/                    # Next.js 15 App
│       ├── src/
│       │   ├── app/                 # App Router pages
│       │   │   ├── (auth)/          # Login, Register
│       │   │   └── (dashboard)/     # Main app pages
│       │   ├── components/          # React components
│       │   │   ├── layout/          # Sidebar, Header
│       │   │   └── providers.tsx    # Query & Auth providers
│       │   └── lib/                 # Utilities
│       │       ├── api-client.ts    # Axios with interceptors
│       │       └── auth-context.tsx # Auth state management
│       └── ...
├── SETUP.md                         # Setup instructions
└── README.md                        # This file
```

## Security Features

- **JWT Authentication** with Access (15min) and Refresh (7 days) tokens
- **Argon2** password hashing (industry standard)
- **RBAC** with project-scoped roles (Owner, Admin, Member, Viewer)
- **Rate Limiting** (100 req/min)
- **Helmet** security headers
- **CORS** whitelisting
- **Input Validation** with class-validator
- **SQL Injection Protection** via Prisma parameterized queries

## License

MIT
