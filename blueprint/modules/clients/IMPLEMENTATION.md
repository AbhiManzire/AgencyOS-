# Clients — Implementation Guide

**Module:** `clients`  
**Status:** Draft  
**Owner:** Engineering  
**Version:** 1.0

---

## Purpose

This document is the **implementation guide** for the Clients module. It defines the build sequence, file inventory, task breakdown, and completion criteria for engineering execution.

It does **not** replace module specifications. Consult these documents during implementation:

| Topic | Document |
|-------|----------|
| Business scope | [`README.md`](README.md) |
| Data model | [`database.md`](database.md) |
| API contracts | [`api.md`](api.md) |
| Screens | [`screens.md`](screens.md) |
| Workflows | [`workflows.md`](workflows.md) |
| Permissions | [`permissions.md`](permissions.md) |
| QA criteria | [`acceptance.md`](acceptance.md) |
| Tech stack | [`../../02_TECH_STACK.md`](../../02_TECH_STACK.md) |
| Architecture | [`../../03_ARCHITECTURE.md`](../../03_ARCHITECTURE.md) |
| Database conventions | [`../../04_DATABASE_RULES.md`](../../04_DATABASE_RULES.md) |
| Coding standards | [`../../05_CODING_STANDARDS.md`](../../05_CODING_STANDARDS.md) |
| UI system | [`../../06_UI_SYSTEM.md`](../../06_UI_SYSTEM.md) |

---

## 1. Development Order

Implement in phases. Do not start a phase until its prerequisites are complete.

| Phase | Scope | Prerequisite |
|-------|-------|--------------|
| **0 — Spec completion** | Finalize [`api.md`](api.md) and [`permissions.md`](permissions.md) | Module README and database spec approved |
| **1 — Foundation** | Database migrations, domain entities, repositories | Phase 0; platform auth and tenant context middleware exist |
| **2 — Core API** | Client CRUD, list, search, filter, pagination | Phase 1 |
| **3 — Core UI** | Client List, Create Client, Edit Client, Client Detail (Overview tab) | Phase 2; shared UI shell and design system components exist |
| **4 — Contacts & Notes** | Contact and note API + UI drawers | Phase 3 |
| **5 — Lifecycle** | Archive, restore, status transitions, owner assignment | Phase 3 |
| **6 — Documents** | Pre-signed upload flow, document metadata API + UI | Phase 3; object storage integration exists per [Architecture §12](../../03_ARCHITECTURE.md#12-file-storage-architecture) |
| **7 — Tags & Custom Fields** | Tag management, client tagging, custom field values | Phase 3; Settings module field definitions available |
| **8 — Activity & Events** | Activity timeline, domain event emission | Phase 2 onward (incremental) |
| **9 — Services & Onboarding** | Service assignment, onboarding completion workflow | Phase 7; Settings service catalog available |
| **10 — Import & Export** | CSV import worker, async export job | Phase 2; worker service running |
| **11 — Hardening** | Permissions enforcement, error handling, performance, accessibility | Phases 2–10 |
| **12 — QA & release** | Acceptance testing against [`acceptance.md`](acceptance.md) | Phase 11 |

Within each phase: **database → backend → API contract update → frontend → phase validation**.

---

## 2. Files to Create

File layout follows the feature-based strategy in [Architecture §9](../../03_ARCHITECTURE.md#9-feature-based-folder-strategy). Paths are relative to the monorepo root.

### Backend — `backend/src/modules/clients/`

| File | Phase | Responsibility |
|------|-------|----------------|
| `clients.module.ts` | 1 | NestJS module registration |
| `index.ts` | 1 | Public module interface — only cross-module export surface |
| `domain/client.entity.ts` | 1 | Client domain entity and invariants |
| `domain/contact.entity.ts` | 1 | Contact domain entity |
| `domain/client-note.entity.ts` | 1 | Note domain entity |
| `domain/client-activity.entity.ts` | 1 | Activity domain entity |
| `domain/tag.entity.ts` | 1 | Tag domain entity |
| `domain/client-document.entity.ts` | 1 | Document metadata entity |
| `domain/client-custom-field-value.entity.ts` | 7 | Custom field value entity |
| `domain/client-service.entity.ts` | 9 | Service assignment entity |
| `repositories/client.repository.ts` | 1 | Client persistence — tenant-scoped |
| `repositories/contact.repository.ts` | 1 | Contact persistence |
| `repositories/client-note.repository.ts` | 1 | Note persistence |
| `repositories/client-activity.repository.ts` | 1 | Activity persistence — append-only |
| `repositories/tag.repository.ts` | 7 | Tag and client-tag persistence |
| `repositories/client-document.repository.ts` | 6 | Document metadata persistence |
| `repositories/client-custom-field-value.repository.ts` | 7 | Custom field persistence |
| `repositories/client-service.repository.ts` | 9 | Service assignment persistence |
| `dto/create-client.dto.ts` | 2 | Create client input validation |
| `dto/update-client.dto.ts` | 2 | Update client input validation |
| `dto/client-response.dto.ts` | 2 | Client output shape |
| `dto/client-list-query.dto.ts` | 2 | List filter, sort, pagination input |
| `dto/create-contact.dto.ts` | 4 | Contact input validation |
| `dto/update-contact.dto.ts` | 4 | Contact update validation |
| `dto/create-note.dto.ts` | 4 | Note input validation |
| `dto/document-upload.dto.ts` | 6 | Upload authorization request |
| `dto/import-clients.dto.ts` | 10 | Import mapping input |
| `services/client.service.ts` | 2 | Client use case orchestration |
| `services/contact.service.ts` | 4 | Contact use cases |
| `services/client-note.service.ts` | 4 | Note use cases |
| `services/client-document.service.ts` | 6 | Document upload orchestration |
| `services/client-activity.service.ts` | 8 | Activity write and query |
| `services/tag.service.ts` | 7 | Tag CRUD and assignment |
| `services/client-onboarding.service.ts` | 9 | Onboarding completion logic |
| `services/client-import.service.ts` | 10 | Import validation and execution |
| `services/client-export.service.ts` | 10 | Export job dispatch |
| `controllers/clients.controller.ts` | 2 | Client HTTP handlers |
| `controllers/contacts.controller.ts` | 4 | Contact HTTP handlers |
| `controllers/client-notes.controller.ts` | 4 | Note HTTP handlers |
| `controllers/client-documents.controller.ts` | 6 | Document HTTP handlers |
| `controllers/client-tags.controller.ts` | 7 | Tag HTTP handlers |
| `controllers/client-import.controller.ts` | 10 | Import HTTP handlers |
| `events/client-created.event.ts` | 8 | Domain event definitions |
| `events/client-status-changed.event.ts` | 8 | Status change event |
| `events/client-owner-changed.event.ts` | 8 | Owner change event |
| `events/client-archived.event.ts` | 5 | Archive event |
| `events/client-onboarding-completed.event.ts` | 9 | Onboarding event |
| `events/client-event.handlers.ts` | 8 | In-process event consumers |
| `guards/client-permission.guard.ts` | 11 | Module permission enforcement |
| `clients.module.spec.ts` | 11 | Module integration test entry |

### Backend — Migrations

| File | Phase |
|------|-------|
| `backend/src/database/migrations/{timestamp}_create_clients_tables.ts` | 1 |
| `backend/src/database/migrations/{timestamp}_create_client_contacts_tables.ts` | 1 |
| `backend/src/database/migrations/{timestamp}_create_client_notes_activity_tables.ts` | 1 |
| `backend/src/database/migrations/{timestamp}_create_client_tags_tables.ts` | 7 |
| `backend/src/database/migrations/{timestamp}_create_client_documents_table.ts` | 6 |
| `backend/src/database/migrations/{timestamp}_create_client_services_table.ts` | 9 |

Migrations follow [Database Rules §12](../../04_DATABASE_RULES.md#12-migration-standards).

### Backend — Worker jobs

| File | Phase |
|------|-------|
| `backend/src/modules/clients/jobs/client-import.job.ts` | 10 |
| `backend/src/modules/clients/jobs/client-export.job.ts` | 10 |

### Frontend — `frontend/src/features/clients/`

| File | Phase | Responsibility |
|------|-------|----------------|
| `index.ts` | 3 | Public feature exports |
| `types/client.types.ts` | 3 | Feature-specific type extensions |
| `hooks/use-clients.ts` | 3 | Client list query hook |
| `hooks/use-client.ts` | 3 | Single client query hook |
| `hooks/use-create-client.ts` | 3 | Create mutation hook |
| `hooks/use-update-client.ts` | 3 | Update mutation hook |
| `hooks/use-archive-client.ts` | 5 | Archive mutation hook |
| `hooks/use-restore-client.ts` | 5 | Restore mutation hook |
| `hooks/use-contacts.ts` | 4 | Contacts list hook |
| `hooks/use-contact-mutations.ts` | 4 | Contact create/update/delete hooks |
| `hooks/use-client-notes.ts` | 4 | Notes list and mutation hooks |
| `hooks/use-client-documents.ts` | 6 | Document list and upload hooks |
| `hooks/use-client-import.ts` | 10 | Import flow hook |
| `hooks/use-client-export.ts` | 10 | Export mutation hook |
| `pages/client-list-page.tsx` | 3 | Client List screen |
| `pages/archived-client-list-page.tsx` | 5 | Archived Client List screen |
| `pages/client-detail-page.tsx` | 3 | Client Detail screen |
| `pages/create-client-page.tsx` | 3 | Create Client screen |
| `pages/edit-client-page.tsx` | 3 | Edit Client screen |
| `pages/client-import-page.tsx` | 10 | Client Import screen |
| `components/client-table.tsx` | 3 | List table component |
| `components/client-profile-summary.tsx` | 3 | Detail header card |
| `components/client-form.tsx` | 3 | Shared create/edit form |
| `components/client-status-select.tsx` | 5 | Status change control |
| `components/client-owner-select.tsx` | 5 | Owner assignment control |
| `components/contact-form-drawer.tsx` | 4 | Contact Form drawer |
| `components/note-form-drawer.tsx` | 4 | Note Form drawer |
| `components/document-upload-drawer.tsx` | 6 | Document Upload drawer |
| `components/archive-client-modal.tsx` | 5 | Archive confirmation modal |
| `components/remove-contact-modal.tsx` | 4 | Remove contact modal |
| `components/client-activity-timeline.tsx` | 8 | Activity tab content |
| `components/client-onboarding-checklist.tsx` | 9 | Onboarding progress UI |
| `components/client-tag-list.tsx` | 7 | Tag display and filter chips |

### Frontend — Routes

| File | Phase |
|------|-------|
| `frontend/src/app/[workspace]/clients/page.tsx` | 3 |
| `frontend/src/app/[workspace]/clients/archived/page.tsx` | 5 |
| `frontend/src/app/[workspace]/clients/new/page.tsx` | 3 |
| `frontend/src/app/[workspace]/clients/import/page.tsx` | 10 |
| `frontend/src/app/[workspace]/clients/[clientId]/page.tsx` | 3 |
| `frontend/src/app/[workspace]/clients/[clientId]/edit/page.tsx` | 3 |

Route patterns match [`screens.md`](screens.md).

### Shared / Generated

| File | Phase |
|------|-------|
| OpenAPI spec addition in `blueprint/api/clients.yaml` | 2 |
| Generated API client types (from OpenAPI) | 2 |

---

## 3. Backend Tasks

| # | Task | Phase | Reference |
|---|------|-------|-----------|
| B1 | Register `ClientsModule` in root application module | 1 | [Architecture §5](../../03_ARCHITECTURE.md#5-module-architecture) |
| B2 | Implement domain entities with lifecycle invariants | 1 | [`database.md`](database.md) — Lifecycle |
| B3 | Implement repositories with mandatory `tenant_id` scoping | 1 | [Database Rules §3](../../04_DATABASE_RULES.md#3-multi-tenant-rules) |
| B4 | Implement `ClientService` — create, read, update, list, search, filter | 2 | [`workflows.md`](workflows.md) — Create Client, Edit Client |
| B5 | Implement pagination and sort on client list queries | 2 | [Database Rules §16](../../04_DATABASE_RULES.md#16-performance-rules) |
| B6 | Implement status transition validation in service layer | 5 | [`database.md`](database.md) — Valid Transitions |
| B7 | Implement soft-delete (archive) with cascade to contacts and documents | 5 | [`workflows.md`](workflows.md) — Archive Client |
| B8 | Implement restore within retention window | 5 | [`workflows.md`](workflows.md) — Restore Client |
| B9 | Implement owner assignment with workspace membership validation | 5 | [`workflows.md`](workflows.md) — Assign Owner |
| B10 | Implement `ContactService` with primary contact exclusivity rule | 4 | [`database.md`](database.md) — Validation Rules |
| B11 | Implement `ClientNoteService` | 4 | [`workflows.md`](workflows.md) |
| B12 | Implement `ClientDocumentService` — pre-signed URL generation and metadata registration | 6 | [Architecture §12](../../03_ARCHITECTURE.md#12-file-storage-architecture) |
| B13 | Implement `ClientActivityService` — append-only writes on all mutations | 8 | [`database.md`](database.md) — Client Activity |
| B14 | Implement domain event emission on create, update, status change, archive, restore, owner change | 8 | [Architecture §11](../../03_ARCHITECTURE.md#11-event-flow) |
| B15 | Implement `TagService` and client-tag association | 7 | [`database.md`](database.md) — Tag entities |
| B16 | Implement custom field value read/write against Settings field definitions | 7 | [`database.md`](database.md) — Client Custom Field Value |
| B17 | Implement service assignment and onboarding completion | 9 | [`workflows.md`](workflows.md) — Add Service, Client Onboarding |
| B18 | Implement archive blocking checks for active downstream records | 5 | [`workflows.md`](workflows.md) — Archive Client exceptions |
| B19 | Implement `ClientImportService` and worker job | 10 | [`screens.md`](screens.md) — Client Import |
| B20 | Implement `ClientExportService` and async worker job | 10 | [`screens.md`](screens.md) — Client List export |
| B21 | Apply permission guards on all controllers | 11 | [`permissions.md`](permissions.md) |
| B22 | Apply global exception filter mapping for client domain errors | 11 | [Coding Standards §11](../../05_CODING_STANDARDS.md#11-error-handling-standards) |
| B23 | Emit structured logs with correlation ID and tenant context | 11 | [Coding Standards §12](../../05_CODING_STANDARDS.md#12-logging-standards) |
| B24 | Write unit tests for services — 80% coverage minimum | 11 | [Coding Standards §14](../../05_CODING_STANDARDS.md#14-testing-standards) |
| B25 | Write integration tests for controllers — happy path and primary errors | 11 | [`acceptance.md`](acceptance.md) |

---

## 4. Frontend Tasks

| # | Task | Phase | Reference |
|---|------|-------|-----------|
| F1 | Register Clients routes under workspace layout with auth and permission guards | 3 | [`screens.md`](screens.md), [Architecture §6](../../03_ARCHITECTURE.md#6-frontend-architecture) |
| F2 | Implement Client List page with Table, Search, filters, Pagination | 3 | [`screens.md`](screens.md) — Client List |
| F3 | Implement empty states for list — no clients, no filter results | 3 | [UI System §10 Empty State](../../06_UI_SYSTEM.md#empty-state) |
| F4 | Implement Create Client page with form validation | 3 | [`screens.md`](screens.md) — Create Client |
| F5 | Implement Edit Client page — pre-populated form | 3 | [`screens.md`](screens.md) — Edit Client |
| F6 | Implement Client Detail page with Tabs — Overview, Contacts, Notes, Activity, Documents | 3 | [`screens.md`](screens.md) — Client Detail |
| F7 | Implement Contact Form drawer — create and edit modes | 4 | [`screens.md`](screens.md) — Contact Form |
| F8 | Implement Note Form drawer | 4 | [`screens.md`](screens.md) — Note Form |
| F9 | Implement Archive Client Confirmation modal | 5 | [`screens.md`](screens.md) — Archive Client Confirmation |
| F10 | Implement Remove Contact Confirmation modal | 4 | [`screens.md`](screens.md) — Remove Contact Confirmation |
| F11 | Implement Archived Client List page with restore action | 5 | [`screens.md`](screens.md) — Archived Client List |
| F12 | Implement inline status and owner controls on Client Detail | 5 | [`workflows.md`](workflows.md) |
| F13 | Implement Document Upload drawer with progress feedback | 6 | [`screens.md`](screens.md) — Document Upload |
| F14 | Implement Activity timeline tab | 8 | [`screens.md`](screens.md) — Client Detail |
| F15 | Implement tag display, assignment, and list filter integration | 7 | [`database.md`](database.md) — Tag |
| F16 | Implement custom field rendering on create/edit/detail from Settings definitions | 7 | [`database.md`](database.md) — Client Custom Field Value |
| F17 | Implement onboarding checklist component and completion flow | 9 | [`workflows.md`](workflows.md) — Client Onboarding |
| F18 | Implement Client Import page — upload, mapping, preview, confirm | 10 | [`screens.md`](screens.md) — Client Import |
| F19 | Implement CSV export trigger with Toast progress feedback | 10 | [`screens.md`](screens.md) — Client List |
| F20 | Implement Skeleton loading on all data-fetching views | 3 | [UI System §10 Skeleton](../../06_UI_SYSTEM.md#skeleton) |
| F21 | Implement Toast feedback for all mutation success and error paths | 3 | [UI System §10 Toast](../../06_UI_SYSTEM.md#toast) |
| F22 | Apply responsive rules — card list on mobile, drawer full-screen sheets | 3 | [UI System §19](../../06_UI_SYSTEM.md#19-responsive-rules) |
| F23 | Hide or disable actions based on user permissions | 11 | [`permissions.md`](permissions.md) |
| F24 | Write unit tests for data-fetching hooks | 11 | [Coding Standards §14](../../05_CODING_STANDARDS.md#14-testing-standards) |
| F25 | Write E2E tests for critical journeys — create, edit, archive, restore, add contact | 11 | [`acceptance.md`](acceptance.md) — Functional Acceptance |

---

## 5. Database Tasks

| # | Task | Phase | Reference |
|---|------|-------|-----------|
| D1 | Author migration — `clients` table with tenant, audit, soft-delete columns | 1 | [Database Rules §6–§7](../../04_DATABASE_RULES.md) |
| D2 | Author migration — `client_contacts` table | 1 | [`database.md`](database.md) — Contact |
| D3 | Author migration — `client_notes` table | 1 | [`database.md`](database.md) — Client Note |
| D4 | Author migration — `client_activities` table (append-only) | 1 | [`database.md`](database.md) — Client Activity |
| D5 | Add indexes — `tenant_id` leading on all tenant-scoped tables | 1 | [Database Rules §10](../../04_DATABASE_RULES.md#10-indexing-rules) |
| D6 | Add partial unique index on `clients(tenant_id, display_name) WHERE deleted_at IS NULL` | 1 | [Database Rules §7](../../04_DATABASE_RULES.md#7-soft-delete-rules) |
| D7 | Author migration — `tags` and `client_tags` tables | 7 | [`database.md`](database.md) — Tag |
| D8 | Author migration — `client_documents` table | 6 | [`database.md`](database.md) — Client Document |
| D9 | Author migration — `client_custom_field_values` table | 7 | [`database.md`](database.md) — Client Custom Field Value |
| D10 | Author migration — `client_services` table | 9 | [`workflows.md`](workflows.md) — Add Service |
| D11 | Add foreign key constraints with `RESTRICT` on delete | 1 | [Database Rules §9](../../04_DATABASE_RULES.md#9-foreign-key-standards) |
| D12 | Verify all migrations run forward in staging with zero downtime pattern | 1 | [Database Rules §12](../../04_DATABASE_RULES.md#12-migration-standards) |
| D13 | Seed development fixtures — sample clients, contacts, tags | 3 | Development only — not production migration |

---

## 6. API Implementation Order

Implement REST resources in dependency order. Finalize contracts in [`api.md`](api.md) and `blueprint/api/clients.yaml` before each phase.

| Order | Resource | Operations | Phase | Depends On |
|-------|----------|------------|-------|------------|
| 1 | **Client** | List, Get, Create, Update | 2 | Migrations D1 |
| 2 | **Client** | Archive, Restore | 5 | Client CRUD |
| 3 | **Client** | Assign owner, Change status | 5 | Client CRUD |
| 4 | **Contact** | List, Create, Update, Delete | 4 | Client CRUD |
| 5 | **Client Note** | List, Create, Update, Delete | 4 | Client CRUD |
| 6 | **Client Activity** | List (read-only) | 8 | Mutation events writing activities |
| 7 | **Client Document** | List, Request upload URL, Confirm upload, Delete | 6 | Client CRUD; S3 integration |
| 8 | **Tag** | List, Create, Delete | 7 | Migrations D7 |
| 9 | **Client Tag** | Assign, Remove | 7 | Tag CRUD |
| 10 | **Client Custom Field Value** | List, Upsert | 7 | Settings field definitions |
| 11 | **Client Service** | List, Assign, Remove | 9 | Settings service catalog |
| 12 | **Client Onboarding** | Get status, Complete | 9 | Contacts, Services, Documents |
| 13 | **Client Import** | Upload preview, Execute | 10 | Client CRUD |
| 14 | **Client Export** | Request export, Get export status | 10 | Client list query |

All endpoints follow REST conventions per [Tech Stack §10](../../02_TECH_STACK.md#10-api-technology). Request and response shapes are validated via DTOs per [Coding Standards §10](../../05_CODING_STANDARDS.md#10-nestjs-standards).

---

## 7. Validation Checklist

Complete before marking any phase done. Detailed pass/fail criteria are in [`acceptance.md`](acceptance.md).

### Phase Gate — All Phases

- [ ] Code follows [Coding Standards](../../05_CODING_STANDARDS.md)
- [ ] All queries tenant-scoped — no unscoped data access
- [ ] Audit fields populated by repository layer — not caller input
- [ ] No `any` in TypeScript
- [ ] Structured logging on errors with correlation ID
- [ ] Permission guard applied on new endpoints

### Phase 2 — Core API

- [ ] AC-F11, AC-F15, AC-V01, AC-V02, AC-P10 pass

### Phase 3 — Core UI

- [ ] AC-F01–F09, AC-F18, AC-Perf01, AC-Perf09, AC-Perf10 pass
- [ ] UI components match [UI System §10](../../06_UI_SYSTEM.md#10-component-standards)

### Phase 4 — Contacts & Notes

- [ ] AC-F28–F31, AC-V06, AC-V07 pass

### Phase 5 — Lifecycle

- [ ] AC-F24–F27, AC-F36, AC-V05, AC-E03 pass

### Phase 6 — Documents

- [ ] AC-F33–F34, AC-V08, AC-V09, AC-E05 pass

### Phase 7 — Tags & Custom Fields

- [ ] AC-F06, AC-V11, AC-V12, AC-X08 pass

### Phase 9 — Onboarding

- [ ] AC-F38–F41, AC-X12 pass

### Phase 10 — Import & Export

- [ ] AC-F42–F45, AC-E04 pass

### Phase 11 — Hardening

- [ ] All **Must** criteria in [`acceptance.md`](acceptance.md) pass
- [ ] AC-P01–P12 permission checks pass
- [ ] AC-A01–A14 accessibility checks pass

---

## 8. Definition of Done

A phase or the full module is **done** when all criteria below are met. Extends the platform Definition of Done in [Coding Standards §20](../../05_CODING_STANDARDS.md#20-definition-of-done).

| Criterion | Requirement |
|-----------|-------------|
| **Spec alignment** | Implementation matches [`README.md`](README.md), [`database.md`](database.md), [`screens.md`](screens.md), and [`workflows.md`](workflows.md) |
| **API contract** | [`api.md`](api.md) and OpenAPI spec updated and synchronized with implementation |
| **Permissions** | [`permissions.md`](permissions.md) finalized; all keys enforced in guards |
| **Acceptance** | All **Must**-priority criteria in [`acceptance.md`](acceptance.md) pass in staging |
| **Tests** | Backend service unit tests ≥ 80% coverage; controller integration tests for all resources; E2E for critical journeys |
| **CI green** | Lint, type check, and test pipeline pass |
| **Code review** | At least one approved review per phase PR |
| **Observability** | Errors logged with tenant context; mutation operations emit activity records |
| **No regressions** | Existing platform tests pass |
| **Staging verified** | Manual QA walkthrough of all screens in [`screens.md`](screens.md) completed |
| **Documentation** | [`automations.md`](automations.md) updated if automation triggers were implemented |

---

## 9. Dependencies

### Platform Prerequisites (must exist before Phase 1)

| Dependency | Provides | Reference |
|------------|----------|-----------|
| Authentication / IdP | User identity, JWT validation | [Tech Stack §8](../../02_TECH_STACK.md#8-authentication) |
| Tenant context middleware | Workspace scoping on every request | [Architecture §3](../../03_ARCHITECTURE.md#3-multi-tenant-architecture) |
| PostgreSQL instance | Persistent storage | [Tech Stack §6](../../02_TECH_STACK.md#6-database) |
| Migration pipeline | Forward-only schema deployment | [Database Rules §12](../../04_DATABASE_RULES.md#12-migration-standards) |
| Application shell | Sidebar, header, breadcrumb, workspace routing | [UI System §9](../../06_UI_SYSTEM.md#9-layout-system) |
| Design system components | Table, Form, Modal, Drawer, Toast, etc. | [UI System §10](../../06_UI_SYSTEM.md#10-component-standards) |
| Generated API client infrastructure | OpenAPI → TypeScript client | [Tech Stack §10](../../02_TECH_STACK.md#10-api-technology) |

### Module Prerequisites (must exist before dependent phases)

| Dependency | Required Before | Provides |
|------------|---------------|----------|
| [`settings`](../settings/) module — workspace config | Phase 7 | Custom field definitions, upload allowlists |
| [`settings`](../settings/) module — service catalog | Phase 9 | Service assignment options |
| Object storage integration (S3 + pre-signed URLs) | Phase 6 | Document upload |
| Worker service + Redis queue | Phase 10 | Async import and export |
| Notifications module | Phase 5 | Owner assignment alerts |
| Identity & Access — user profiles | Phase 1 | Owner and audit user references |

### Downstream Consumers (not blockers — contract must be stable by Phase 2)

| Module | Consumes |
|--------|----------|
| [`sales`](../sales/) | Client records on deal conversion |
| [`projects`](../projects/) | `client_id` reference |
| [`finance`](../finance/) | `client_id` reference |
| [`operations`](../operations/) | `client_id` reference |
| [`client-success`](../client-success/) | Client profile and activity data |
| [`automation`](../automation/) | Client domain events |
| [`reports`](../reports/) | Client metrics aggregation |

Public module interface exported via `backend/src/modules/clients/index.ts` per [Architecture §9](../../03_ARCHITECTURE.md#9-feature-based-folder-strategy).

---

## 10. Out of Scope

The following are **not** part of this implementation guide or the initial Clients module release:

| Item | Reason | Reference |
|------|--------|-----------|
| Sales deal conversion automation | Owned by [`sales`](../sales/) module | [`README.md`](README.md) — Module Boundaries |
| Project, invoice, and campaign creation from client UI | Owned by downstream modules | [`README.md`](README.md) |
| External CRM sync (HubSpot, Salesforce) | Future enhancement | [`README.md`](README.md) — Future Expansion |
| Client portal (client-facing access) | Future enhancement | [`README.md`](README.md) |
| AI relationship summaries | Future enhancement | [`README.md`](README.md) |
| Client hierarchy (parent–child accounts) | Future enhancement | [`README.md`](README.md) |
| GDPR consent and compliance profiles | Future enhancement | [`README.md`](README.md) |
| Account scoring and health monitoring | Owned by [`client-success`](../client-success/) | [`README.md`](README.md) |
| Automation rule engine implementation | Owned by [`automation`](../automation/) | [`automations.md`](automations.md) |
| Wireframes and visual design artifacts | Owned by `blueprint/wireframes/` | — |
| Load testing and penetration testing | Infrastructure / security runbooks | — |

---

## Related Documents

| Document | Path |
|----------|------|
| Module overview | [`README.md`](README.md) |
| Data model | [`database.md`](database.md) |
| API specification | [`api.md`](api.md) |
| Screens | [`screens.md`](screens.md) |
| Workflows | [`workflows.md`](workflows.md) |
| Acceptance criteria | [`acceptance.md`](acceptance.md) |
| Permissions | [`permissions.md`](permissions.md) |
| Automations | [`automations.md`](automations.md) |
