# Projects — Acceptance Criteria

**Module:** `projects`  
**Status:** Draft  
**Owner:** QA / Product  
**Version:** 1.0

---

## Purpose

Enterprise-grade acceptance criteria for the Projects module. Each criterion is **testable**, **unambiguous**, and maps to a workflow in [`workflows.md`](workflows.md) or a screen in [`screens.md`](screens.md).

Criteria are grouped by capability area. "Must" indicates release-blocking; "Should" indicates expected behavior that may defer without blocking MVP.

---

## Multi-Tenancy & Data Isolation

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-ISO-01 | A user in Workspace A must not retrieve, list, or mutate project records belonging to Workspace B via any API endpoint or UI route | Must |
| AC-ISO-02 | All project queries must enforce `tenant_id` and `workspace_id` scope at the data access layer — not only at the controller | Must |
| AC-ISO-03 | Cross-workspace project IDs submitted in requests must return 404 (not 403) to prevent ID enumeration | Must |
| AC-ISO-04 | Soft-deleted projects must not appear in default list views or search results for standard users | Must |
| AC-ISO-05 | Platform admin cross-tenant access must be explicitly audited when viewing project data outside their assigned workspace | Must |

---

## Authorization & RBAC

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-RBAC-01 | Every mutating project endpoint must enforce permission checks before business logic executes | Must |
| AC-RBAC-02 | Users without `projects.create` must not see the New Project action in UI or receive 403 from the create endpoint | Must |
| AC-RBAC-03 | Users with `projects.read` only must access Detail and all read panels but must not see Edit, Archive, or member management actions | Must |
| AC-RBAC-04 | Mark Invoice Ready must require `projects.invoice_ready` — distinct from general update permission | Must |
| AC-RBAC-05 | RBAC enforcement mode (`RBAC_ENFORCED=true`) must block all unauthorized project operations in integration tests | Must |
| AC-RBAC-06 | Project Viewer role members must not mutate project metadata regardless of global role when project-scoped rules apply | Should |

---

## Project Lifecycle

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-LC-01 | Creating a project against an archived client must fail with a descriptive error — no orphan project record created | Must |
| AC-LC-02 | Project creation must write an audit-attributed record with `created_by_user_id` and emit a `ProjectCreated` domain event | Must |
| AC-LC-03 | Invalid status transitions (e.g., Completed → Planning) must be rejected at the API layer with 422 and a clear message | Must |
| AC-LC-04 | Mark Complete must set `completed_at` and transition status to Completed category | Must |
| AC-LC-05 | Mark Complete with incomplete milestones must be blocked unless user holds override permission and supplies a reason | Must |
| AC-LC-06 | Mark Invoice Ready must require Completed status, billable flag, and set `invoice_ready_at` | Must |
| AC-LC-07 | Non-billable projects must not expose Mark Invoice Ready in UI or API | Must |
| AC-LC-08 | Archive must soft-delete the project and cascade soft-delete to active milestones and memberships | Must |
| AC-LC-09 | Archived projects must be read-only — all mutation endpoints return 422 | Must |

---

## Milestones

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-MS-01 | Milestones must be ordered by `sort_order` and support drag-and-drop reorder persistence | Must |
| AC-MS-02 | Completing a milestone must set `completed_at` and transition to a terminal milestone status | Must |
| AC-MS-03 | Milestone creation on Completed or Archived projects must be rejected | Must |
| AC-MS-04 | Milestone completion must emit `MilestoneCompleted` domain event | Must |
| AC-MS-05 | Project completion percentage must reflect ratio of completed to total active milestones | Should |

---

## Membership

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-MEM-01 | A user may not be added twice as an active member on the same project | Must |
| AC-MEM-02 | Only one active ProjectMember with Lead role may exist per project | Must |
| AC-MEM-03 | Removing the sole Lead without assigning a replacement must be rejected | Must |
| AC-MEM-04 | Member add and remove actions must write Project Activity entries | Must |
| AC-MEM-05 | Assigning a user not in the workspace must be rejected | Must |

---

## Tags, Labels & Templates

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-TLT-01 | Tag and label names must be unique among active records within a workspace | Must |
| AC-TLT-02 | Creating a project from a template must materialize all template-defined milestones with correct sort order | Must |
| AC-TLT-03 | System templates (`is_system=true`) must not be deletable via standard workspace UI or API | Must |
| AC-TLT-04 | Applying a tag or label to a project must be idempotent — duplicate associations rejected | Must |
| AC-TLT-05 | Archiving a label or tag must remove it from active project associations without deleting the project | Must |

---

## Status Configuration

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-STS-01 | New workspaces must seed default project and milestone statuses on bootstrap | Must |
| AC-STS-02 | Status records in use must not be hard-deleted until all referencing projects or milestones are reassigned | Must |
| AC-STS-03 | Terminal statuses must reject forward transitions unless override permission is present | Must |
| AC-STS-04 | Status slug must remain stable for automation rule references after display name changes | Must |

---

## Activity & Audit

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-AUD-01 | All project create, update, status change, archive, and invoice-ready actions must produce Activity timeline entries | Must |
| AC-AUD-02 | Activity entries must include actor user ID, timestamp, and human-readable summary | Must |
| AC-AUD-03 | Material field changes on update must be distinguishable in the activity feed (field name and old/new values where applicable) | Should |
| AC-AUD-04 | Audit fields (`created_by_user_id`, `updated_by_user_id`) must never be client-writable | Must |

---

## Files

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-FIL-01 | File upload must store binary in object storage and persist metadata linked to the project | Must |
| AC-FIL-02 | File download must enforce project read permission and workspace scope | Must |
| AC-FIL-03 | File delete must soft-remove metadata and write a timeline entry | Must |
| AC-FIL-04 | Upload exceeding workspace file size limit must fail before storage write with clear error | Must |

---

## API Contract

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-API-01 | All list endpoints must support cursor or offset pagination with stable sort order | Must |
| AC-API-02 | List endpoints must support filtering by status, client, manager, tag, and archived state | Must |
| AC-API-03 | Validation errors must return 422 with field-level error detail | Must |
| AC-API-04 | Successful create must return 201 with full resource representation | Must |
| AC-API-05 | Idempotent archive on already-archived project must return 422, not 500 | Must |
| AC-API-06 | API responses must not leak soft-deleted related entity details beyond ID where necessary | Must |

---

## Performance & Scalability

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-PERF-01 | Project list with 1,000 active records must return first page within 500ms at p95 under normal load | Must |
| AC-PERF-02 | Project Detail with 50 milestones and 20 members must render within 800ms at p95 | Should |
| AC-PERF-03 | List queries must use indexed columns defined in [`database.md`](database.md) — verified by query plan review | Must |
| AC-PERF-04 | Bulk tag filter on project list must not cause N+1 query patterns | Must |

---

## Reliability & Error Handling

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-REL-01 | Concurrent status updates on the same project must not produce invalid state — last-write-wins with optimistic locking or version check | Must |
| AC-REL-02 | Partial template materialization failure must roll back project creation entirely | Must |
| AC-REL-03 | Domain event emission failure must not roll back the primary transaction — events retried via outbox | Should |
| AC-REL-04 | All unhandled errors must return structured error response without stack traces in production | Must |

---

## Accessibility & UX

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-A11Y-01 | All interactive elements on project screens must be keyboard navigable | Must |
| AC-A11Y-02 | Status badges and label colors must meet WCAG 2.1 AA contrast requirements | Must |
| AC-A11Y-03 | Loading, empty, and error states must be present on every screen defined in [`screens.md`](screens.md) | Must |
| AC-A11Y-04 | Form validation errors must be announced to screen readers on submit | Must |

---

## Cross-Module Integration

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-XMOD-01 | Client Detail Projects tab must list only projects for that client in the active workspace | Must |
| AC-XMOD-02 | `ProjectInvoiceReady` event must be consumable by the finance module without direct database access | Must |
| AC-XMOD-03 | Task and time-entry events from the tasks module must appear on the project Timeline panel | Should |
| AC-XMOD-04 | Dashboard Recent Projects widget must reflect the same data as the project list API | Must |

---

## Security

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-SEC-01 | Project description and milestone text fields must be sanitized against stored XSS before persistence | Must |
| AC-SEC-02 | File download URLs must be time-limited signed URLs — not permanent public links | Must |
| AC-SEC-03 | All project endpoints must require authenticated session with valid workspace context headers | Must |
| AC-SEC-04 | Rate limiting must apply to project create and file upload endpoints per platform standard | Should |

---

## Related Documents

| Document | Path |
|----------|------|
| Workflows | [`workflows.md`](workflows.md) |
| Screens | [`screens.md`](screens.md) |
| Database | [`database.md`](database.md) |
| Implementation plan | [`implementation.md`](implementation.md) |
