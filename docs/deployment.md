# AgencyOS Deployment Guide

## Production stack

AgencyOS production deployment uses:

- **Nginx** — reverse proxy for frontend, API, and Keycloak
- **Frontend** — Next.js standalone container
- **Backend** — NestJS API container
- **PostgreSQL** — primary database
- **Redis** — cache/session support (infrastructure ready)
- **Keycloak** — OIDC authentication

## Deploy with Docker Compose

1. Copy the production environment template:

```bash
cp .env.production.example .env
```

2. Update all secrets and public URLs in `.env`.

3. Build and start services:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

4. Run database migrations:

```bash
docker compose -f docker-compose.prod.yml exec backend \
  sh -c "cd /app/backend && npx prisma migrate deploy"
```

5. Verify health:

```bash
curl http://localhost/api/health/live
curl http://localhost/api/health/ready
```

## Health probes

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health/live` | Liveness — process is running |
| `GET /api/health/ready` | Readiness — database is reachable |
| `GET /api/health` | Combined health status |

Configure Kubernetes or your orchestrator to use `/api/health/live` for liveness and `/api/health/ready` for readiness.

## Backup and restore

Create a database backup:

```bash
export POSTGRES_PASSWORD=your-password
./infrastructure/scripts/backup.sh
```

Restore from backup:

```bash
export POSTGRES_PASSWORD=your-password
./infrastructure/scripts/restore.sh ./backups/agencyos-YYYYMMDDTHHMMSSZ.sql.gz
```

## Graceful shutdown

The backend enables NestJS shutdown hooks. Send `SIGTERM` to allow in-flight requests to complete and Prisma connections to close cleanly.

## Security

Production deployments include:

- Helmet security headers on the API
- Rate limiting (configurable via `THROTTLE_TTL_MS` and `THROTTLE_LIMIT`)
- Structured HTTP request logging
- Nginx security headers on the edge

Disable Swagger in production if desired: `SWAGGER_ENABLED=false`.
