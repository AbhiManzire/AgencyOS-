# Projects — Database Specification

**Module:** `projects`  
**Status:** Draft  
**Owner:** Engineering  
**Version:** 1.0

---

## Purpose

Defines the data entities, relationships, constraints, indexes, audit fields, and soft-delete behavior owned by the Projects module.

Platform-wide database conventions are defined in [`blueprint/04_DATABASE_RULES.md`](../../04_DATABASE_RULES.md). This document applies those conventions to module-specific entities.

This document is a **design specification only** — no schema language, migration scripts, or OR terminals.

---

## Entity Overview

| Entity | Description |
|--------|-------------|
| **Project** | Core delivery engagement linked to a client account |
| **ProjectMember** | Internal user assignment to a project with a delivery role |
| **Milestone** | Delivery checkpoint within a project |
| **Label** | Color-coded visual label for project organization |
| **Tag** | Workspace-scoped classification tag for filtering and reporting |
| **Template** | Reusable project blueprint with default milestones and metadata |
| **Status** | Configurable lifecycle status definition for projects and milestones |

### Association Entities

| Entity | Description |
|--------|-------------|
| **ProjectLabel** | Many-to-many link between Project and Label |
| **ProjectTag** | Many-to-many link between Project and Tag |

---

## Relationships

```
Client (clients module)
  └── Project (1:N)
        ├── ProjectMember (1:N) ──► User (identity)
        ├── Milestone (1:N)
        ├── ProjectLabel (N:M) ──► Label
        ├── ProjectTag (N:M) ──► Tag
        ├── Status (N:1) — project status
        └── Template (N:1, optional) — source template

Milestone
  └── Status (N:1) — milestone status

Template
  └── Status (N:1, optional) — default project status on creation

Label, Tag, Status, Template
  └── scoped to tenant + workspace
```

### Cardinality Rules

| Relationship data | Rule |
|-------------|------|
| Project → Client | Every project belongs to exactly one client; client deletion blocked while active projects exist |
| Project → Status | Every project references exactly one project-scoped Status record |
| ProjectMember → Project | A user may appear at most once per project among active memberships |
| Milestone → Project | Milestones belong to exactly one project; cascade soft-delete with parent project |
| ProjectLabel / ProjectTag | A project may have zero or many labels and tags; duplicates rejected |
| Template → Project | Template reference is optional and informational after project creation |

Cross-module references use foreign keys by identifier only. The Projects module does not query client tables directly — per [Architecture §5](../../03_ARCHITECTURE.md#5-module-architecture).

---

## Required Fields

### Project

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Tenant scope |
| `workspace_id` | Workspace scope |
| `client_id` | Parent client account reference |
| `name` | Project display name |
| `status_id` | Current lifecycle status |
| `created_at` | Record creation timestamp |
| `updated_at` | Last modification timestamp |

### ProjectMember

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Tenant scope |
| `workspace_id` | Workspace scope |
| `project_id` | Parent project |
| `user_id` | Assigned workspace user |
| `role` | Delivery role — Lead, Member, or Viewer |
| `created_at` | Record creation timestamp |
| `updated_at` | Last modification timestamp |

### Milestone

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Tenant scope |
| `workspace_id` | Workspace scope |
| `project_id` | Parent project |
| `name` | Milestone display name |
| `status_id` | Current milestone status |
| `sort_order` | Display sequence within the project |
| `created_at` | Record creation timestamp |
| `updated_at` | Last modification timestamp |

### Label

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Tenant scope |
| `workspace_id` | Workspace scope |
| `name` | Label text — unique among active labels in workspace |
| `color_token` | Design-system color reference for UI rendering |
| `created_at` | Record creation timestamp |

### Tag

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Tenant scope |
| `workspace_id` | Workspace scope |
| `name` | Tag text — unique among active tags in workspace |
| `created_at` | Record creation timestamp |

### Template

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Tenant scope |
| `workspace_id` | Workspace scope |
| `name` | Template display name |
| `created_at` | Record creation timestamp |
| `updated_at` | Last modification timestamp |

### Status

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Tenant scope |
| `workspace_id` | Workspace scope |
| `entity_scope` | Applies to `project` or `milestone` |
| `name` | Status display name |
| `slug` | Stable machine identifier — unique per entity_scope within workspace |
| `category` | Semantic grouping — planning, active, on_hold, completed, invoice_ready, cancelled |
| `sort_order` | Display and transition ordering |
| `is_terminal` | Whether records in this status cannot transition further without override |
| `created_at` | Record creation timestamp |
| `updated_at` | Last modification timestamp |

### ProjectLabel

| Field | Description |
|-------|-------------|
| `tenant_id` | Tenant scope |
| `workspace_id` | Workspace scope |
| `project_id` | Associated project |
| `label_id` | Associated label |

### ProjectTag

| Field | Description |
|-------|-------------|
| `tenant_id` | Tenant scope |
| `workspace_id` | Workspace scope |
| `project_id` | Associated project |
| `tag_id` | Associated tag |

---

## Optional Fields

### Project

| Field | Description |
|-------|-------------|
| `description` | Long-form project summary |
| `code` | Short human-readable project code — unique per workspace among active projects |
| `template_id` | Source template used at creation |
| `project_manager_user_id` | Primary delivery owner |
| `priority` | Delivery priority — low, normal, high, urgent |
| `start_date` | Planned start date |
| `target_end_date` | Planned completion date |
| `completed_at` | Actual completion timestamp |
| `invoice_ready_at` | Timestamp when marked ready for billing |
| `is_billable` | Whether project generates billable work — default true |
| `budget_hours` | Planned effort ceiling in hours |
| `budget_amount` | Planned revenue or cost ceiling in workspace currency |
| `created_by_user_id` | Creating user |
| `updated_by_user_id` | Last modifying user |
| `deleted_at` | Soft-delete timestamp |
| `deleted_by_user_id` | User who archived the project |

### ProjectMember

| Field | Description |
|-------|-------------|
| `allocation_percent` | Planned capacity allocation (0–100) |
| `added_by_user_id` | User who created the membership |
| `deleted_at` | Soft-delete timestamp |
| `deleted_by_user_id` | User who removed the membership |

### Milestone

| Field | Description |
|-------|-------------|
| `description` | Milestone detail |
| `owner_user_id` | Responsible team member |
| `due_date` | Target completion date |
| `completed_at` | Actual completion timestamp |
| `created_by_user_id` | Creating user |
| `updated_by_user_id` | Last modifying user |
| `deleted_at` | Soft-delete timestamp |
| `deleted_by_user_id` | User who removed the milestone |

### Label

| Field | Description |
|-------|-------------|
| `description` | Optional label description |
| `created_by_user_id` | Creating user |
| `deleted_at` | Soft-delete timestamp |
| `deleted_by_user_id` | User who archived the label |

### Tag

| Field | Description |
|-------|-------------|
| `color_token` | Optional color for tag chips in list views |
| `created_by_user_id` | Creating user |
| `deleted_at` | Soft-delete timestamp |
| `deleted_by_user_id` | User who archived the tag |

### Template

| Field | Description |
|-------|-------------|
| `description` | Template purpose and usage guidance |
| `default_status_id` | Status applied to projects created from this template |
| `milestone_definitions` | Structured default milestone list (name, sort_order, relative due offset) |
| `default_label_ids` | Labels applied on project creation |
| `default_tag_ids` | Tags applied on project creation |
| `is_system` | Whether template is platform-provided and non-deletable |
| `created_by_user_id` | Creating user |
| `updated_by_user_id` | Last modifying user |
| `deleted_at` | Soft-delete timestamp |
| `deleted_by_user_id` | User who archived the template |

### Status

| Field | Description |
|-------|-------------|
| `color_token` | Design-system color for status badges |
| `description` | Admin-facing status description |
| `allowed_transition_ids` | Explicit allow-list of target status IDs; empty means follow category rules |
| `is_default` | Whether this status is assigned on new project or milestone creation |
| `created_by_user_id` | Creating user |
| `updated_by_user_id` | Last modifying user |
| `deleted_at` | Soft-delete timestamp |
| `deleted_by_user_id` | User who archived the status |

---

## Lifecycle — Project Status Categories

Default workspace seed statuses (customizable via Status entity):

| Category | Default Name | Terminal | Description |
|----------|--------------|----------|-------------|
| `planning` | Planning | No | Project scoped but not yet in active delivery |
| `active` | Active | No | Work in progress |
| `on_hold` | On Hold | No | Delivery paused; milestones frozen |
| `completed` | Completed | Yes | All deliverables finished |
| `invoice_ready` | Invoice Ready | Yes | Completed and cleared for billing handoff |
| `cancelled` | Cancelled | Yes | Engagement abandoned before completion |

Valid transitions follow category rules unless overridden by `allowed_transition_ids`. Terminal statuses require explicit override permission to reverse.

---

## Audit Fields

All primary entities include standard audit attribution per [`04_DATABASE_RULES.md`](../../04_DATABASE_RULES.md):

| Field | Applies To |
|-------|------------|
| `created_at` | All entities |
| `updated_at` | All mutable entities |
| `created_by_user_id` | Project, Milestone, Label, Tag, Template, Status, ProjectMember |
| `updated_by_user_id` | Project, Milestone, Template, Status |

Material field changes on Project and Milestone additionally produce entries in the shared Activity module (`entity_type: project`, `entity_id: project.id`) — not stored as duplicate columns on the project record.

---

## Soft Delete

| Entity | Soft Delete | Cascade Behavior |
|--------|-------------|------------------|
| **Project** | Yes — `deleted_at`, `deleted_by_user_id` | Soft-deletes ProjectMembers, Milestones, ProjectLabel, ProjectTag associations |
| **ProjectMember** | Yes | Removed from active member list; historical activity retained |
| **Milestone** | Yes | Removed from active milestone list; linked task references preserved in tasks module |
| **Label** | Yes | Removes ProjectLabel associations; label name reserved until purge |
| **Tag** | Yes | Removes ProjectTag associations |
| **Template** | Yes | Existing projects retain `template_id` reference for audit |
| **Status** | Yes | In-use statuses cannot be deleted until records are reassigned |

Soft-deleted records are excluded from default queries. Restore is supported for Project and Milestone within a configurable retention window (default 90 days).

Hard purge is a platform-admin operation outside standard workspace UI scope.

---

## Constraints

| Rule | Enforcement |
|------|-------------|
| Workspace isolation | All queries scoped by `tenant_id` + `workspace_id` |
| Client eligibility | Project creation rejected when parent client is archived |
| Unique project code | `code` unique among non-deleted projects per workspace |
| Unique label name | `name` unique among active labels per workspace |
| Unique tag name | `name` unique among active tags per workspace |
| Unique status slug | `slug` unique per `entity_scope` among active statuses per workspace |
| Single project lead | At most one ProjectMember with role Lead per active project |
| Milestone sort order | `sort_order` unique per project among active milestones |
| Invoice ready precondition | `invoice_ready_at` set only when status category is `invoice_ready` and `completed_at` is set |
| Billable default | `is_billable` defaults to true; non-billable projects cannot transition to invoice_ready |
| Template immutability | `is_system` templates cannot be deleted or have milestone_definitions cleared |

---

## Indexes

Indexes support the query patterns defined in [`screens.md`](screens.md) and platform list conventions.

### Project

| Index | Purpose |
|-------|---------|
| `(tenant_id, workspace_id, deleted_at, updated_at DESC)` | Default project list — recent first |
| `(tenant_id, workspace_id, client_id, deleted_at)` | Projects by client on Client Detail |
| `(tenant_id, workspace_id, status_id, deleted_at)` | Filter by status |
| `(tenant_id, workspace_id, project_manager_user_id, deleted_at)` | Filter by project manager |
| `(tenant_id, workspace_id, code)` — unique partial | Project code lookup |
| `(tenant_id, workspace_id, target_end_date)` — partial active | Upcoming deadline queries |
| `(tenant_id, workspace_id, invoice_ready_at)` — partial | Finance handoff queue |

### ProjectMember

| Index | Purpose |
|-------|---------|
| `(tenant_id, workspace_id, project_id, deleted_at)` | Members by project |
| `(tenant_id, workspace_id, user_id, deleted_at)` | Projects by assigned user |
| `(project_id, user_id)` — unique partial active | Prevent duplicate active membership |

### Milestone

| Index | Purpose |
|-------|---------|
| `(tenant_id, workspace_id, project_id, sort_order)` | Ordered milestone list |
| `(tenant_id, workspace_id, project_id, status_id, deleted_at)` | Filter milestones by status |
| `(tenant_id, workspace_id, due_date)` — partial active | Upcoming milestone dashboard |

### Label / Tag

| Index | Purpose |
|-------|---------|
| `(tenant_id, workspace_id, name)` — unique partial active | Name uniqueness |
| `(tenant_id, workspace_id, deleted_at)` | Admin catalog list |

### Template

| Index | Purpose |
|-------|---------|
| `(tenant_id, workspace_id, deleted_at, name)` | Template picker list |

### Status

| Index | Purpose |
|-------|---------|
| `(tenant_id, workspace_id, entity_scope, sort_order)` | Status picker ordered list |
| `(tenant_id, workspace_id, entity_scope, slug)` — unique partial active | Slug lookup |

### ProjectLabel / ProjectTag

| Index | Purpose |
|-------|---------|
| `(project_id, label_id)` / `(project_id, tag_id)` — unique | Prevent duplicate associations |
| `(label_id)` / `(tag_id)` | Reverse lookup for label/tag usage counts |

---

## Related Documents

| Document | Path |
|----------|------|
| Database rules | [`../../04_DATABASE_RULES.md`](../../04_DATABASE_RULES.md) |
| Workflows | [`workflows.md`](workflows.md) |
| Clients database | [`../clients/database.md`](../clients/database.md) |
| Architecture | [`../../03_ARCHITECTURE.md`](../../03_ARCHITECTURE.md) |
