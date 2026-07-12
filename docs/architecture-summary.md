# AgencyOS Architecture Summary

**Version:** 1.0.0  
**Stack:** Next.js 15 (frontend) · NestJS 11 (API) · PostgreSQL · Prisma · Keycloak (OIDC)

## System shape

```
Browser → Nginx (TLS) → Next.js (:3000) + NestJS API (:3001)
                              ↓
                         PostgreSQL
                         Redis (infra reserved)
                         Keycloak (auth)
```

## Backend layers

| Layer | Responsibility |
|-------|----------------|
| Controllers | HTTP, headers (`x-tenant-id`, `x-workspace-id`, `x-user-id`), RBAC |
| Application services | Use-cases, transactions, orchestration |
| Domain services | Invariants and validation |
| Repositories | Prisma persistence, tenant/workspace scoped |
| Common | API envelopes, exception filter, TTL cache, throttling, Helmet |

## Core modules (complete)

Foundation · Clients · Projects · Tasks · Sales OS · Finance OS · Reports & Dashboard · Platform Administration

## Sprint 8 foundations (infrastructure only)

| Module | Purpose |
|--------|---------|
| `ai` | Provider abstraction (`NullAiProvider`), prompts, conversations, usage, settings, feature flags |
| `automation` | Execution enqueue/retry/logs, condition evaluator, schedule queries — no business action handlers |

## Cross-cutting

- **Auth:** Keycloak JWT (Passport JWKS); `AUTH_ENABLED` / `RBAC_ENFORCED` production-gated
- **Isolation:** Every query scoped by tenant + workspace
- **Audit:** `AuditLog` + `AuditWriterService`
- **API envelope:** `{ success, data, meta? }` / `{ success: false, error }`
- **Health:** `/api/health`, `/live`, `/ready`

## Frontend

App Router feature folders under `frontend/src/features/*`, TanStack Query, design-system loading/error/empty states.
