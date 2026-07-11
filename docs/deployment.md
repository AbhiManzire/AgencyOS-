# AgencyOS Deployment Guide

## Production stack (VPS / PM2) — recommended

AgencyOS production on a Ubuntu VPS uses:

- **Nginx** — TLS termination and reverse proxy (`infrastructure/nginx/agencyos.vps.conf`)
- **PM2** — process manager for NestJS (port **3001**) and Next.js (port **3000**)
- **PostgreSQL** — primary database
- **pnpm** — monorepo install and builds

Nginx always proxies `/api/` to `127.0.0.1:3001`. Do not change the backend port.

### Fresh Ubuntu VPS bootstrap (one-time)

1. Install Node.js 20+, pnpm 9+, nginx, git, and PostgreSQL (or point `DATABASE_URL` at a managed DB).
2. Clone the repository (path must match GitHub secret `PROJECT_PATH`, default `/var/www/AgencyOS-`):

```bash
sudo mkdir -p /var/www
sudo git clone <repo-url> /var/www/AgencyOS-
sudo chown -R "$USER:$USER" /var/www/AgencyOS-
cd /var/www/AgencyOS-
```

3. Create production env files (backend/frontend as used on the host). At minimum set `DATABASE_URL` and auth-related variables from `.env.example` / `.env.production.example`.
4. Issue TLS certificates (Certbot) for the domain in `agencyos.vps.conf` before the first HTTPS reload, or adjust cert paths after install.
5. Ensure the deploy user can run `sudo nginx -t`, `sudo systemctl reload nginx`, and write under `/etc/nginx/sites-*` without a password prompt (or run deploy as root).
6. Run the first deploy:

```bash
export PROJECT_PATH=/var/www/AgencyOS-
chmod +x "$PROJECT_PATH/deploy.sh"
"$PROJECT_PATH/deploy.sh"
```

7. Confirm PM2 survives reboot (`deploy.sh` configures `pm2 startup` when needed):

```bash
pm2 status
sudo reboot   # optional smoke test
```

### Ongoing deploy (idempotent)

`deploy.sh` is the single source of truth. Re-running it always:

1. Resets the tree to `origin/main`
2. Installs dependencies (`pnpm install --frozen-lockfile`)
3. Runs `prisma generate` and `prisma migrate deploy`
4. Builds shared, backend, and frontend
5. Restarts PM2 from `ecosystem.config.js` with `--update-env` (backend **PORT=3001**)
6. Installs `infrastructure/nginx/agencyos.vps.conf` → `/etc/nginx/sites-available/agencyos`
7. Symlinks `sites-enabled/agencyos` and removes `sites-enabled/default` if present
8. Runs `nginx -t` and reloads nginx
9. Verifies `curl http://127.0.0.1:3001/api/health/live` (exits non-zero on failure)

Manual:

```bash
"$PROJECT_PATH/deploy.sh"
```

CI (push to `main`): `.github/workflows/deploy.yml` SSHs to the VPS and runs the same script. Required secrets: `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `SSH_PRIVATE_KEY`, `PROJECT_PATH`.

### Port contract (do not drift)

| Process | Port | Config |
|---------|------|--------|
| NestJS API (PM2) | **3001** | `ecosystem.config.js`, nginx upstream `agencyos_backend` |
| Next.js (PM2) | **3000** | `ecosystem.config.js`, nginx upstream `agencyos_frontend` |

If nginx and PM2 disagree on ports, you get 502s. Never edit live nginx by hand without updating the repo file — the next deploy overwrites `/etc/nginx/sites-available/agencyos` from git.

### Health probes

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health/live` | Liveness — process is running (deploy gate) |
| `GET /api/health/ready` | Readiness — database is reachable |
| `GET /api/health` | Combined health status |

### Diagnostics

If something is wrong after deploy:

```bash
./infrastructure/scripts/fix-nginx-pm2.sh
pm2 logs agencyos-backend --lines 100
```

---

## Alternative: Docker Compose

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
