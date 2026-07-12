# AgencyOS v1.0 Release Notes

**Release date:** 2026-07-12  
**Codename:** Production Hardening, AI & Release (Sprint 8)

## Highlights

AgencyOS core business modules are complete and production-hardened:

- Foundation, Clients, Projects, Tasks
- Sales OS, Finance OS
- Reports & Founder Dashboard
- Platform Administration (settings, security, audit, notifications)

Sprint 8 adds **release readiness** plus **AI** and **automation** infrastructure (no AI business features or workflow action handlers yet).

## Added

- AI module: provider abstraction (`NullAiProvider`), prompt templates, conversations, usage tracking, settings, feature flags, AI audit hooks
- Automation engine foundation: executions, logs, retries (exponential backoff), condition evaluator, schedule queries
- Shared `PaginationQueryDto` and request-scope helpers
- File upload MIME/extension allowlists
- Production documentation: architecture, module dependencies, checklist, env updates

## Improved

- In-process TTL cache eviction (max entries)
- React Query `gcTime` defaults; lazy-loaded reports analytics/schedules panels
- `optimizePackageImports` retained for lucide; Next security headers unchanged
- RBAC catalog: `ai.read`, `ai.manage`
- Audit actions: `AI_CHANGE`, `AUTOMATION_CHANGE`

## Security

- Upload type validation (MIME + extension)
- Production auth/RBAC/CORS gates unchanged and verified
- AI provider secrets masked in API responses (`hasEncryptedApiKey`; prefer `apiKeyEnvRef`)
- Bearer JWT + CORS; classic cookie CSRF not used for API auth

## Migration

Apply: `20260712120000_sprint_8_ai_automation`

```bash
pnpm --filter @agencyos/backend exec prisma migrate deploy
```

## Known limitations (by design)

- No live LLM provider wired — `NullAiProvider` only
- Automation does not execute domain actions yet (CREATE_TASK, SEND_EMAIL, …)
- Redis is provisioned in Compose but app cache remains in-process TTL
- Email delivery remains log-only until an SMTP provider is configured
