# Production Checklist

Use before promoting AgencyOS v1.0 to production.

## Environment

- [ ] `NODE_ENV=production`
- [ ] `AUTH_ENABLED=false` for v1.0 without Keycloak (or `true` when Keycloak is live)
- [ ] `NEXT_PUBLIC_AUTH_ENABLED` matches backend auth mode (rebuild frontend after changing)
- [ ] `RBAC_ENFORCED=true`
- [ ] `CORS_ORIGIN` is a non-localhost HTTPS origin
- [ ] `DATABASE_URL` points at production PostgreSQL
- [ ] When auth is on: Keycloak `KEYCLOAK_ISSUER_URL` / `KEYCLOAK_JWKS_URI` configured (issuer must match JWT `iss`)
- [ ] When auth is on: `NEXT_PUBLIC_KEYCLOAK_URL` points at reachable Keycloak
- [ ] When auth is on: AgencyOS users have `keycloak_subject` set to Keycloak `sub`
- [ ] When auth is off: demo identity headers (`NEXT_PUBLIC_DEV_*` or deploy defaults) match seeded users
- [ ] Strong `POSTGRES_PASSWORD` / Keycloak admin password (if Keycloak is used)
- [ ] No `NEXT_PUBLIC_ALLOW_DEV_IDENTITY_HEADERS` unless intentionally running a production demo
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
- [ ] `/auth/` proxies to Keycloak (`127.0.0.1:8080`) — only required when OIDC auth is enabled
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
