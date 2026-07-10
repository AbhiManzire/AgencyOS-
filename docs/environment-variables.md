# Environment Variables

## Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment |
| `AUTH_ENABLED` | Production: Yes (`true`) | `true` (unless set `false`) | Enable JWT auth. Must be `true` in production. |
| `RBAC_ENFORCED` | Production: Yes (`true`) | `false` | Enforce permission checks. Must be `true` in production. |

## Backend API

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | API listen port |
| `API_PREFIX` | No | `api` | Global route prefix |
| `CORS_ORIGIN` | Production: Yes | `http://localhost:3000` | Allowed CORS origin (non-localhost in production) |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SWAGGER_ENABLED` | No | `true` (dev) / `false` (prod) | Enable `/api/docs` OpenAPI UI |
| `THROTTLE_TTL_MS` | No | `60000` | Rate limit window (ms) |
| `THROTTLE_LIMIT` | No | `100` | Max requests per window |
| `STORAGE_LOCAL_PATH` | No | `uploads` | File storage directory |
| `STORAGE_MAX_FILE_SIZE_BYTES` | No | `10485760` | Max upload size (10 MB) |

## Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Docker/prod: Yes | `http://localhost:3001/api` | Backend API base URL |
| `NEXT_PUBLIC_KEYCLOAK_URL` | No | `http://localhost:8080` | Keycloak base URL |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | No | `agencyos` | Keycloak realm |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | No | `agencyos-web` | OIDC client ID |
| `NEXT_PUBLIC_TENANT_ID` | Production scope | — | Tenant header when not using JWT claim |
| `NEXT_PUBLIC_WORKSPACE_ID` | Production scope | — | Workspace header when not using JWT claim |
| `NEXT_PUBLIC_DEV_TENANT_ID` | Local only | seed default | Dev tenant header override |
| `NEXT_PUBLIC_DEV_WORKSPACE_ID` | Local only | seed default | Dev workspace header override |
| `NEXT_PUBLIC_DEV_USER_ID` | Local only | seed default | Dev user header override |
| `NEXT_PUBLIC_ALLOW_DEV_IDENTITY_HEADERS` | Local/demo only | unset | Set `true` to allow identity headers in production builds (not recommended) |

## PostgreSQL

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_USER` | No | `agencyos` | Database user |
| `POSTGRES_PASSWORD` | Yes | — | Database password |
| `POSTGRES_DB` | No | `agencyos` | Database name |
| `POSTGRES_PORT` | No | `5432` | Host port (Docker Compose) |
| `POSTGRES_HOST` | No | `localhost` | Host for backup scripts |

## Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL |
| `REDIS_PORT` | No | `6379` | Host port (Docker Compose) |

## Keycloak

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KEYCLOAK_ISSUER_URL` | Production: Yes | — | JWT issuer URL |
| `KEYCLOAK_JWKS_URI` | Production: Yes* | — | JWKS endpoint (*or derived from issuer) |
| `KEYCLOAK_AUDIENCE` | No | `agencyos-api` | Expected JWT audience |
| `KEYCLOAK_ADMIN` | No | `admin` | Keycloak admin username |
| `KEYCLOAK_ADMIN_PASSWORD` | Yes | — | Keycloak admin password |
| `KEYCLOAK_PORT` | No | `8080` | Host port (Docker Compose) |

Optional JWT claims for scope binding: `agencyos_tenant_id`, `agencyos_workspace_id`. JWT `sub` must map to the AgencyOS user id.

## Production / Docker

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HTTP_PORT` | No | `80` | Nginx public port |
| `BACKUP_DIR` | No | `./backups` | Database backup output directory |

See `.env.example` for development and `.env.production.example` for production templates.
