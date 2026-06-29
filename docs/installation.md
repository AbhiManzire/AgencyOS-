# AgencyOS Installation Guide

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (for infrastructure services)
- PostgreSQL 16 (or use Docker Compose)

## Quick start (development)

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start infrastructure services:

```bash
docker compose up -d
```

4. Apply database migrations:

```bash
pnpm --filter @agencyos/backend exec prisma migrate deploy
```

5. Start the development servers:

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- API docs (Swagger): http://localhost:3001/api/docs
- Keycloak: http://localhost:8080

## Workspace packages

| Package | Path | Description |
|---------|------|-------------|
| `@agencyos/frontend` | `frontend/` | Next.js web application |
| `@agencyos/backend` | `backend/` | NestJS REST API |
| `@agencyos/shared` | `shared/` | Shared TypeScript types |

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Troubleshooting

- **Database connection errors** — ensure PostgreSQL is running and `DATABASE_URL` in `.env` is correct.
- **Prisma client errors** — run `pnpm --filter @agencyos/backend prisma:generate`.
- **Keycloak auth errors** — confirm Keycloak is running and realm import completed.
