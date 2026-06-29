# Environment Variables

## Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment |

## Backend API

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | API listen port |
| `API_PREFIX` | No | `api` | Global route prefix |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SWAGGER_ENABLED` | No | `true` | Enable `/api/docs` OpenAPI UI |
| `THROTTLE_TTL_MS` | No | `60000` | Rate limit window (ms) |
| `THROTTLE_LIMIT` | No | `100` | Max requests per window |
| `STORAGE_LOCAL_PATH` | No | `uploads` | File storage directory |
| `STORAGE_MAX_FILE_SIZE_BYTES` | No | `10485760` | Max upload size (10 MB) |

## Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001/api` | Backend API base URL |
| `NEXT_PUBLIC_KEYCLOAK_URL` | No | `http://localhost:8080` | Keycloak base URL |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | No | `agencyos` | Keycloak realm |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | No | `agencyos-web` | OIDC client ID |
| `NEXT_PUBLIC_DEV_TENANT_ID` | No | — | Dev tenant header override |
| `NEXT_PUBLIC_DEV_WORKSPACE_ID` | No | — | Dev workspace header override |
| `NEXT_PUBLIC_DEV_USER_ID` | No | — | Dev user header override |

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
| `KEYCLOAK_ISSUER_URL` | Yes | — | JWT issuer URL |
| `KEYCLOAK_JWKS_URI` | Yes | — | JWKS endpoint for token validation |
| `KEYCLOAK_AUDIENCE` | No | `agencyos-api` | Expected JWT audience |
| `KEYCLOAK_ADMIN` | No | `admin` | Keycloak admin username |
| `KEYCLOAK_ADMIN_PASSWORD` | Yes | — | Keycloak admin password |
| `KEYCLOAK_PORT` | No | `8080` | Host port (Docker Compose) |

## Production / Docker

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HTTP_PORT` | No | `80` | Nginx public port |
| `BACKUP_DIR` | No | `./backups` | Database backup output directory |

See `.env.example` for development and `.env.production.example` for production templates.
