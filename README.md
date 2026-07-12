# AgencyOS

Enterprise Operating System for Digital Marketing Agencies.

**Status:** v1.0 — Production ready (core modules)

## Repository Layout

| Path              | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `.ai/`            | AI governance and engineering standards      |
| `blueprint/`      | Functional specs and module blueprints       |
| `docs/`           | Architecture, deployment, env, release notes |
| `frontend/`       | Next.js 15 application                       |
| `backend/`        | NestJS 11 API + Prisma                       |
| `shared/`         | Shared TypeScript package                    |
| `infrastructure/` | Nginx, Keycloak, Docker helpers              |

## Documentation

- [Architecture summary](docs/architecture-summary.md)
- [Module dependencies](docs/module-dependencies.md)
- [Deployment](docs/deployment.md)
- [Environment variables](docs/environment-variables.md)
- [Production checklist](docs/production-checklist.md)
- [Release notes v1.0](docs/release-notes-v1.0.md)
- [Installation](docs/installation.md)

## Quick start (local)

```bash
pnpm install
cp .env.example .env
# Start Postgres (and optional Redis/Keycloak) via docker-compose
pnpm --filter @agencyos/backend exec prisma migrate deploy
pnpm dev
```

## Deployment

Production on Ubuntu VPS (PM2 + nginx) is driven by `deploy.sh`. See [docs/deployment.md](docs/deployment.md).

## Governance

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Architecture Decisions](docs/decisions/)
