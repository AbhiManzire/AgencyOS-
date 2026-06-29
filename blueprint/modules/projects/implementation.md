# Projects — Implementation Plan

**Module:** `projects`  
**Status:** Draft  
**Owner:** Engineering  
**Version:** 1.0

---

## Purpose

Defines the **development phases** for implementing the Projects module — ordered work streams for backend, API, frontend, and testing. This plan follows the layered architecture in [Architecture §5](../../03_ARCHITECTURE.md#5-module-architecture) and mirrors the delivery sequence used for the [`clients`](../clients/) module.

Reference documents: [`database.md`](database.md), [`workflows.md`](workflows.md), [`screens.md`](screens.md), [`acceptance.md`](acceptance.md).

---

## Implementation Overview

```
Phase 1 — Backend Foundation
Phase 2 — API Surface
Phase 3 — Frontend Core
Phase 4 — Testing & Hardening
```

Each phase produces a verifiable increment. Phases are sequential within a stream; backend and API phases must complete before frontend integration of write paths.

---

## Phase 1 — Backend

### Objective

Establish the data layer, domain logic, and application services for all Projects module entities.

### Deliverables

| # | Deliverable | Entities / Scope |
|---|-------------|------------------|
| 1.1 | Schema migration for core entities | Project, ProjectMember, Milestone, Status |
| 1.2 | Schema migration for classification entities | Label, Tag, ProjectLabel, ProjectTag |
| 1.3 | Schema migration for Template entity | Template with milestone_definitions |
| 1.4 | Workspace status seed on bootstrap | Default project and milestone statuses |
| 1.5 | Repository layer | CRUD + scoped queries per entity |
| 1.6 | Domain services | Status transition rules, membership invariants, template materialization |
| 1.7 | Application services | Orchestration — create, update, archive, complete, invoice-ready |
| 1.8 | DTOs and mappers | Request/response shapes; no internal entity leakage |
| 1.9 | Domain events | ProjectCreated, ProjectCompleted, MilestoneCompleted, ProjectInvoiceReady, ProjectArchived |
| 1.10 | Activity integration | Write timeline entries on material project events |
| 1.11 | Client module guard | Validate client exists and is not archived on project create |
| 1.12 | RBAC permission seeds | `projects.read`, `projects.create`, `projects.update`, `projects.archive`, `projects.members.manage`, `projects.milestones.manage`, `projects.complete`, `projects.invoice_ready`, `projects.files.upload`, `projects.files.delete` |

### Backend Layer Structure

```
modules/projects/
  repository/       — data access, scoped queries, soft-delete filters
  domain/           — status transitions, membership rules, template logic
  application/      — use-case orchestration, event emission
  dto/              — input validation shapes
  mapper/           — entity ↔ response mapping
  controller/       — HTTP handlers (Phase 2)
```

### Exit Criteria

- All entities persist and retrieve with workspace isolation
- Status transition validation rejects invalid moves
- Template creation materializes milestones atomically
- Unit tests cover domain rules and application service paths
- Permission seeds registered in RBAC bootstrap

---

## Phase 2 — API

### Objective

Expose a complete, documented HTTP API for project management operations consumed by the frontend and downstream modules.

### Endpoint Inventory

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/projects` | List projects — filter, search, paginate |
| POST | `/projects` | Create project |
| GET | `/projects/:id` | Get project detail |
| PATCH | `/projects/:id` | Update project metadata |
| DELETE | `/projects/:id` | Archive (soft-delete) project |
| POST | `/projects/:id/complete` | Mark project complete |
| POST | `/projects/:id/invoice-ready` | Mark invoice ready |
| GET | `/projects/:id/members` | List members |
| POST | `/projects/:id/members` | Add member |
| PATCH | `/projects/:id/members/:memberId` | Update member role |
| DELETE | `/projects/:id/members/:memberId` | Remove member |
| GET | `/projects/:id/milestones` | List milestones |
| POST | `/projects/:id/milestones` | Create milestone |
| PATCH | `/projects/:id/milestones/:milestoneId` | Update milestone |
| POST | `/projects/:id/milestones/:milestoneId/complete` | Complete milestone |
| DELETE | `/projects/:id/milestones/:milestoneId` | Archive milestone |
| PATCH | `/projects/:id/milestones/reorder` | Batch update sort order |
| GET | `/projects/labels` | List workspace labels |
| POST | `/projects/labels` | Create label |
| GET | `/projects/tags` | List workspace tags |
| POST | `/projects/tags` | Create tag |
| GET | `/projects/templates` | List templates |
| POST | `/projects/templates` | Create template |
| GET | `/projects/statuses` | List statuses by entity_scope |
| GET | `/clients/:clientId/projects` | Projects by client (nested under clients module route) |

File endpoints deferred to Phase 4 or parallel file-storage workstream.

### API Conventions

- Workspace context via `x-tenant-id`, `x-workspace-id`, `x-user-id` headers
- Permission decorators on all mutating routes
- 422 for validation and business rule violations
- 404 for cross-workspace or non-existent IDs
- Consistent pagination envelope on list endpoints

### Exit Criteria

- All endpoints return correct status codes per [`acceptance.md`](acceptance.md) API section
- OpenAPI or equivalent spec generated
- Postman or Bruno collection available for QA
- RBAC enforced on all routes when `RBAC_ENFORCED=true`

---

## Phase 3 — Frontend

### Objective

Deliver all screens defined in [`screens.md`](screens.md) wired to live API endpoints with RBAC-aware UI.

### Deliverables

| # | Deliverable | Screen / Feature |
|---|-------------|------------------|
| 3.1 | Route scaffolding | `/projects`, `/projects/:projectId` |
| 3.2 | Sidebar navigation entry | Projects nav item with permission gate |
| 3.3 | Project List page | Table, filters, search, pagination |
| 3.4 | Create / Edit drawer | Full form with client picker and template support |
| 3.5 | Project Detail shell | Header, metadata strip, tab navigation |
| 3.6 | Overview tab | Description, labels, tags, dates, client card |
| 3.7 | Members panel | List, add, role change, remove |
| 3.8 | Milestones panel | List, add, edit, complete, reorder |
| 3.9 | Timeline panel | ActivityTimeline integration with project entity |
| 3.10 | Files panel | Upload, list, download, delete (when file API ready) |
| 3.11 | Client Detail Projects tab | Filtered project list embedded in client module |
| 3.12 | Dashboard Recent Projects widget | Replace placeholder with live data |
| 3.13 | React Query hooks | `useProjects`, `useProject`, mutations with cache invalidation |
| 3.14 | RBAC wiring | `<Can />` gates on all actions per permission keys |
| 3.15 | Loading / empty / error states | All screens per acceptance AC-A11Y-03 |

### Frontend Feature Structure

```
features/projects/
  api/              — API client functions
  hooks/            — React Query hooks
  components/       — list, detail, drawer, panels
  types/            — TypeScript interfaces matching DTOs
```

### Cache Invalidation Rules

| Mutation | Invalidate |
|----------|------------|
| Create / update / archive project | `projects.list`, `projects.detail(id)`, `clients.detail(clientId)` |
| Member change | `projects.detail(id).members` |
| Milestone change | `projects.detail(id).milestones`, `projects.detail(id)` |
| Label / tag change on project | `projects.detail(id)` |

### Exit Criteria

- All screens functional against staging API
- Permission-gated actions hidden when unauthorized
- Typecheck, lint, and production build pass
- No mock data remaining in project feature paths

---

## Phase 4 — Testing

### Objective

Validate the module against enterprise acceptance criteria before production release.

### Test Layers

| Layer | Scope | Target |
|-------|-------|--------|
| **Unit tests** | Domain services — status transitions, membership rules, template materialization | ≥ 90% branch coverage on domain layer |
| **Integration tests** | Repository + database — workspace isolation, soft delete, indexes | All repository methods |
| **E2E API tests** | Full HTTP round-trips with RBAC on and off | All endpoints in Phase 2 inventory |
| **E2E UI tests** | Critical user journeys — create, edit, complete, archive | Playwright or equivalent |
| **Performance tests** | List and detail p95 latency | AC-PERF-01, AC-PERF-02 |
| **Security tests** | XSS sanitization, auth header requirement, signed file URLs | AC-SEC section |

### Critical E2E Scenarios

| Scenario | Acceptance IDs |
|----------|----------------|
| Create project for active client → appears on list and client tab | AC-LC-01, AC-LC-02, AC-XMOD-01 |
| Reject create for archived client | AC-LC-01 |
| Invalid status transition rejected | AC-LC-03 |
| Full lifecycle: create → milestones → complete → invoice ready | AC-LC-04 through AC-LC-07 |
| Archive cascades milestones and memberships | AC-LC-08, AC-LC-09 |
| Workspace isolation — cross-workspace ID returns 404 | AC-ISO-01, AC-ISO-03 |
| RBAC enforced — unauthorized mutation blocked | AC-RBAC-01, AC-RBAC-05 |
| Template creates project with milestones | AC-TLT-02 |
| Single Lead constraint enforced | AC-MEM-02, AC-MEM-03 |
| Activity timeline populated on material events | AC-AUD-01, AC-AUD-02 |

### Exit Criteria

- All Must-priority acceptance criteria pass
- Zero release-blocking defects open
- E2E test suite added to CI pipeline
- Performance benchmarks documented and within targets

---

## Dependency Map

| Dependency | Required Before | Notes |
|------------|-----------------|-------|
| Clients module (active) | Phase 1 | `client_id` foreign reference |
| RBAC module | Phase 2 | Permission guards on API |
| Activities module | Phase 1.10 | Timeline integration |
| Identity / Users | Phase 1 | Membership user references |
| File storage service | Phase 3.10 | Files panel |
| Tasks module | Phase 4 (integration) | Cross-module timeline events |
| Finance module | Post-MVP | Invoice ready event consumer |

---

## Milestone Schedule (Suggested)

| Week | Focus |
|------|-------|
| 1–2 | Phase 1 — schema, repositories, domain services |
| 3 | Phase 2 — API endpoints, RBAC, events |
| 4–5 | Phase 3 — frontend list, detail, drawer |
| 6 | Phase 3 — members, milestones, timeline panels |
| 7 | Phase 4 — E2E tests, performance, hardening |

Schedule is indicative — adjust based on team capacity and parallel work on file storage and tasks module.

---

## Related Documents

| Document | Path |
|----------|------|
| Database design | [`database.md`](database.md) |
| Workflows | [`workflows.md`](workflows.md) |
| Screens | [`screens.md`](screens.md) |
| Acceptance criteria | [`acceptance.md`](acceptance.md) |
| Clients implementation | [`../clients/IMPLEMENTATION.md`](../clients/IMPLEMENTATION.md) |
| Architecture | [`../../03_ARCHITECTURE.md`](../../03_ARCHITECTURE.md) |
