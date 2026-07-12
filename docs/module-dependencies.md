# Module Dependency Summary

## Backend import graph (high level)

```
AppModule
├── AppConfigModule
├── ThrottlerModule
├── PrismaModule (global)
├── HealthModule
├── AuthModule
├── RbacModule
├── ClientsModule
├── ProjectsModule → Clients (FK)
├── TasksModule → Projects
├── SalesModule → Clients
├── FinanceModule → Clients / Projects
├── DashboardModule → aggregates across domains
├── ReportsModule → aggregates + ScheduledReport
├── SettingsModule → Rbac
├── SecurityModule → AuditModule
├── AuditModule
├── NotificationsModule
├── ActivitiesModule / CommentsModule / FilesModule / TimeEntriesModule
├── WorkflowsModule (definition CRUD)
├── AutomationModule (execution engine foundation)
└── AiModule → AuditModule
```

## Shared packages

| Package | Consumers |
|---------|-----------|
| `@agencyos/shared` | Frontend + Backend (health types, deploy defaults) |

## Frontend feature → API mapping

| Feature | Primary API prefix |
|---------|-------------------|
| clients, projects, tasks | `/clients`, `/projects`, `/tasks` |
| sales | `/leads`, `/deals`, `/quotes`, `/proposals` |
| finance | `/invoices`, `/payments`, `/expenses`, … |
| reports / dashboard | `/reports`, `/dashboard` |
| settings / security / audit | `/settings`, `/security`, `/audit` |
| workflows / automation | `/workflows`, `/automation` |
| ai | `/ai/*` |

## Database ownership

Each Nest module owns its Prisma models. Cross-module reads go through repositories with explicit scope filters — no cross-tenant joins without `tenantId` + `workspaceId`.
