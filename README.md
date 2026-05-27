# SDLC Platform

End-to-end software development lifecycle management platform built with Next.js 15 (full-stack).

## Features

- **Authentication & RBAC** — JWT access/refresh tokens, project-scoped roles (Owner, Admin, Member, Viewer)
- **Project Management** — Multi-project support with member management
- **Issue Tracking** — Tasks, stories, bugs, epics with comments and activity log
- **Kanban Board** — Drag-and-drop issue management
- **Sprint Planning** — Sprint creation, goal setting, burndown tracking
- **Test Management** — Test suites, test cases, test runs
- **Bug Tracking** — Dedicated bug/defect management
- **Wiki / Documentation** — Project documentation pages with versioning
- **Global Search** — Cross-project search
- **Dashboard & Analytics** — Per-project and cross-project stats
- **Dark Mode** — Light/dark theme toggle

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS, Radix UI |
| State | TanStack Query, Zustand |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6 |
| Auth | JWT (Access/Refresh), bcryptjs + argon2 |
| Storage | Local filesystem (dev) / S3 (prod) |

## Architecture

```
sdlc-platform/
├── packages/frontend/          # Next.js 15 full-stack app
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/v1/         # API Route Handlers (46 endpoints)
│   │   │   ├── (auth)/         # Login, Register pages
│   │   │   └── (dashboard)/    # All app pages
│   │   ├── components/         # UI components + layout
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # API client, auth, theme context
│   │   └── server/             # DB client, auth utils, guards
│   ├── prisma/                 # Schema + migrations
│   └── ...
├── docker/                     # Docker Compose for local dev
└── render.yaml                 # Render deployment config
```

## Quick Start

```bash
# 1. Install dependencies
cd packages/frontend && npm install

# 2. Setup database (PostgreSQL required)
cp .env.example .env
# Edit DATABASE_URL in .env
npx prisma generate
npx prisma migrate dev

# 3. Start dev server
npm run dev
```

## Deployment

### Render (single service)

The project includes a `render.yaml` for one-click deployment:

1. Connect your GitHub repo to Render
2. Use the Blueprint: `render.yaml`
3. Set `DATABASE_URL` as environment variable (Neon PostgreSQL)
4. Deploy

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |

## License

MIT
