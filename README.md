# AgencyOS

Enterprise Operating System for Digital Marketing Agencies.

**Status:** Product Discovery

## Repository Layout

| Path              | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `.ai/`            | AI governance, standards, and project guidance          |
| `blueprint/`      | Functional specs, API, UI, database, and wireframes     |
| `docs/`           | Human-readable documentation and architecture decisions |
| `frontend/`       | Next.js application (not yet initialized)               |
| `backend/`        | NestJS application (not yet initialized)                |
| `infrastructure/` | Docker, deployment, and environment configuration       |

## Deployment

Production on Ubuntu VPS (PM2 + nginx) is driven by `deploy.sh`. See [docs/deployment.md](docs/deployment.md) for fresh-VPS bootstrap, the port contract (API **3001**), and CI secrets.

## Governance

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Architecture Decisions](docs/decisions/)
