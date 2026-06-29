# API Documentation

AgencyOS exposes a REST API documented via **OpenAPI (Swagger)**.

## Interactive docs

When the backend is running with `SWAGGER_ENABLED=true` (default):

**URL:** `http://localhost:3001/api/docs`

Production URL (behind nginx): `https://your-domain/api/docs`

## Authentication

The API uses **JWT Bearer tokens** issued by Keycloak.

1. Obtain an access token from Keycloak for the `agencyos-api` audience.
2. In Swagger UI, click **Authorize** and enter: `Bearer <your-token>`

### Development headers

In local development without full OIDC, scope headers may be used:

| Header | Description |
|--------|-------------|
| `x-tenant-id` | Tenant UUID |
| `x-workspace-id` | Workspace UUID |
| `x-user-id` | Acting user UUID |

## Response format

Successful responses:

```json
{
  "success": true,
  "data": { },
  "meta": { }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "statusCode": 400
  }
}
```

## Health endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | Public | Combined health check |
| GET | `/api/health/live` | Public | Liveness probe |
| GET | `/api/health/ready` | Public | Readiness probe |

## Rate limiting

API requests are rate-limited globally (default: 100 requests per 60 seconds per IP). Health endpoints are excluded.

Configure via `THROTTLE_TTL_MS` and `THROTTLE_LIMIT`.

## Major API areas

| Area | Base path | Description |
|------|-----------|-------------|
| Clients | `/api/clients` | Client CRM |
| Projects | `/api/projects` | Project management |
| Tasks | `/api/tasks` | Task tracking |
| Sales | `/api/deals`, `/api/quotes`, `/api/proposals` | Sales pipeline |
| Finance | `/api/invoices` | Invoicing |
| Files | `/api/files` | File attachments |
| Activities | `/api/activities` | Activity timeline |

Refer to the Swagger UI for complete endpoint schemas, request bodies, and response types.
