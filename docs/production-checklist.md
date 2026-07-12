# Production Checklist

Use before promoting AgencyOS v1.0 to production.

## Environment

- [ ] `NODE_ENV=production`
- [ ] `AUTH_ENABLED=true`
- [ ] `RBAC_ENFORCED=true`
- [ ] `CORS_ORIGIN` is a non-localhost HTTPS origin
- [ ] `DATABASE_URL` points at production PostgreSQL
- [ ] Keycloak `KEYCLOAK_ISSUER_URL` / `KEYCLOAK_JWKS_URI` configured
- [ ] Strong `POSTGRES_PASSWORD` / Keycloak admin password
- [ ] No `NEXT_PUBLIC_DEV_*` or `NEXT_PUBLIC_ALLOW_DEV_IDENTITY_HEADERS` in prod
- [ ] `SWAGGER_ENABLED=false` (unless intentionally open behind auth)
- [ ] `STORAGE_*` allowlists reviewed
- [ ] `AI_ENABLED=false` until providers are configured

## Database

- [ ] `pnpm --filter @agencyos/backend exec prisma migrate deploy`
- [ ] Backup job configured (`BACKUP_DIR`, cron or managed snapshots)
- [ ] Restore drill documented

## Build & process

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm build` succeeds
- [ ] PM2 started from `ecosystem.config.js` (API **3001**, web **3000**)
- [ ] `pm2 save` + startup hook installed

## Reverse proxy

- [ ] Nginx config from `infrastructure/nginx/agencyos.vps.conf`
- [ ] TLS certificates valid
- [ ] `/api/` proxies to `127.0.0.1:3001`
- [ ] Security headers present (frame deny, nosniff, HSTS)

## Health & monitoring

- [ ] `GET /api/health/live` returns 200
- [ ] `GET /api/health/ready` returns 200 (DB up)
- [ ] Log rotation / PM2 logs reviewed
- [ ] Uptime check on public `/api/health/live`

## Security smoke

- [ ] Unauthenticated API calls rejected when auth enabled
- [ ] Cross-tenant header spoofing blocked by JWT binding
- [ ] File upload rejects disallowed MIME/extension
- [ ] Rate limiting observed under load

## Docker (optional)

- [ ] `docker-compose.prod.yml` secrets injected
- [ ] Container healthchecks green

## Sign-off

- [ ] Release notes reviewed (`docs/release-notes-v1.0.md`)
- [ ] Rollback plan: previous PM2 release + DB backup restore
