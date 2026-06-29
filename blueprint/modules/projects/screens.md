# Projects — Screen Specification

**Module:** `projects`  
**Status:** Draft  
**Owner:** Product / Design  
**Version:** 1.0

---

## Purpose

Defines the **screen inventory** for the Projects module — pages, panels, drawers, and navigation placement. Visual design tokens and component usage follow [`../../06_UI_SYSTEM.md`](../../06_UI_SYSTEM.md).

This document describes **what** each screen contains and **how** users navigate between views. Workflow logic is defined in [`workflows.md`](workflows.md).

---

## Navigation Placement

| Location | Entry Point |
|----------|-------------|
| **Primary sidebar** | **Projects** — top-level nav item below Clients |
| **Client Detail** | Projects tab — filtered list of projects for the client |
| **Executive Dashboard** | Recent Projects widget; Quick Action: New Project |
| **Global search** | Project name, code, client name |

Route convention: `/projects` (list), `/projects/:projectId` (detail).

---

## Screen Index

| Screen | Type | Primary Actor |
|--------|------|---------------|
| [Project List](#project-list) | Page | All delivery roles |
| [Project Detail](#project-detail) | Page | Project Manager, Delivery Lead |
| [Create / Edit Drawer](#create--edit-drawer) | Drawer | Project Manager, Account Manager |
| [Members Panel](#members-panel) | Tab / Panel | Project Manager |
| [Timeline Panel](#timeline-panel) | Tab / Panel | All project members |
| [Files Panel](#files-panel) | Tab / Panel | All project members |
| [Milestones Panel](#milestones-panel) | Tab / Panel | Project Manager, Delivery Lead |

---

## Project List

### Purpose

Workspace-wide directory of delivery engagements. Primary entry point for discovery, filtering, and bulk awareness.

### Layout

| Region | Content |
|--------|---------|
| **Page header** | Title "Projects"; primary action **New Project** (permission-gated) |
| **Filter bar** | Status, client, project manager, tag, date range, billable toggle, archived toggle |
| **Search** | Full-text search on name, code, client display name |
| **View toggle** | Table (default) and optional board grouped by status |
| **Data table** | Sortable columns — see below |
| **Pagination** | Cursor or offset pagination per platform list standard |

### Table Columns

| Column | Source |
|--------|--------|
| Project name | `Project.name` — links to Detail |
| Client | Client display name via `client_id` |
| Status | Status badge from `Status` |
| Project manager | Assigned user display name |
| Target end date | `Project.target_end_date` |
| Priority | Priority indicator |
| Tags | Tag chips |
| Updated | Relative `updated_at` |

### Row Actions

| Action | Permission Required |
|--------|---------------------|
| View | `projects.read` |
| Edit | `projects.update` |
| Archive | `projects.archive` |

### Empty State

"No projects yet. Create a project to start tracking client delivery." with **New Project** CTA when permitted.

### States

| State | Behavior |
|-------|----------|
| Loading | Skeleton rows |
| Error | Inline error with retry |
| No results | Filter-specific empty message with clear-filters action |
| Archived filter on | Muted row styling; restore action available |

---

## Project Detail

### Purpose

Single-project command center — metadata, delivery progress, and tabbed access to members, milestones, timeline, and files.

### Layout

| Region | Content |
|--------|---------|
| **Breadcrumb** | Projects → {Project name} |
| **Header** | Project name, status badge, priority, client link, project code |
| **Metadata strip** | Project manager, dates, billable flag, template source |
| **Progress summary** | Milestone completion ratio; days to target end date |
| **Action bar** | Edit, Mark Complete, Mark Invoice Ready, Archive — permission and status gated |
| **Tab navigation** | Overview · Members · Milestones · Timeline · Files |
| **Tab content** | Active tab panel |

### Overview Tab (Default)

| Section | Content |
|---------|---------|
| Description | `Project.description` |
| Labels | Color-coded label chips |
| Tags | Tag chips with add/remove |
| Key dates | Start, target end, completed, invoice ready |
| Budget | Budget hours and amount (if set) |
| Linked client | Client summary card with link to Client Detail |

### Header Actions by Status

| Status Category | Available Actions |
|-----------------|-------------------|
| Planning / Active / On Hold | Edit, Archive, Mark Complete (Active/On Hold) |
| Completed | Edit (limited), Mark Invoice Ready (if billable) |
| Invoice Ready | View only; link to finance module when available |
| Cancelled / Archived | Read-only |

---

## Create / Edit Drawer

### Purpose

Side drawer for creating a new project or editing an existing project's core metadata without leaving the list or detail context.

### Create Mode Fields

| Field | Required | Notes |
|-------|----------|-------|
| Client | Yes | Searchable client picker — active clients only |
| Project name | Yes | Max length per platform standard |
| Description | No | Multi-line |
| Template | No | Optional template picker — triggers milestone seeding |
| Status | No | Defaults to workspace default Planning status |
| Project manager | No | Workspace user picker |
| Start date | No | Date picker |
| Target end date | No | Must be on or after start date |
| Priority | No | Defaults to Normal |
| Tags | No | Multi-select from workspace tag catalog |
| Labels | No | Multi-select from workspace label catalog |
| Billable | No | Toggle — default on |

### Edit Mode Fields

Same as create except client is read-only after creation.

### Footer Actions

| Action | Behavior |
|--------|----------|
| Cancel | Close drawer without saving |
| Save | Validate, persist, invalidate list/detail cache, close drawer |
| Save & View | Create only — navigate to Project Detail on success |

### Validation Feedback

Inline field errors; client archived and permission failures as drawer-level alert banner.

---

## Members Panel

### Purpose

Manage internal team assignments on the project — who is involved and in what delivery role.

### Layout

| Region | Content |
|--------|---------|
| **Panel header** | Member count; **Add Member** action |
| **Member list** | Avatar, name, role badge, allocation %, added date |
| **Row actions** | Change role, Remove member |

### Add Member Flow

1. User clicks **Add Member**
2. Inline row or modal: user search picker, role select (Lead / Member / Viewer), optional allocation %
3. Save adds ProjectMember record

### Role Display

| Role | Capability Hint |
|------|-----------------|
| Lead | Full project management within permission scope |
| Member | Contribute; view and update assigned work |
| Viewer | Read-only project access |

### Empty State

"No team members assigned. Add members to collaborate on this project."

### Constraints

- At most one Lead per project — changing Lead prompts confirmation
- Cannot remove self if sole Lead without reassignment

---

## Timeline Panel

### Purpose

Chronological activity feed of significant project events — status changes, member changes, milestone updates, file uploads, and cross-module events (tasks, time entries).

### Layout

| Region | Content |
|--------|---------|
| **Panel header** | "Activity" title; optional filter by event type |
| **Timeline** | Reuses platform `ActivityTimeline` component |
| **Load more** | Cursor pagination for older entries |

### Event Types Displayed

| Event Type | Example Summary |
|------------|-----------------|
| `project.created` | "Project created by {user}" |
| `project.status_changed` | "Status changed from Active to On Hold" |
| `project.member_added` | "{user} added as Member" |
| `milestone.created` | "Milestone '{name}' added" |
| `milestone.completed` | "Milestone '{name}' completed" |
| `project.completed` | "Project marked complete" |
| `project.invoice_ready` | "Project marked invoice ready" |
| `file.uploaded` | "File '{name}' uploaded" |
| `task.completed` | Cross-module — "{task} completed" (read-only reference) |
| `time.logged` | Cross-module — "{hours}h logged on {task}" (read-only reference) |

Activity records are owned by the Activities module; Projects supplies entity context (`entity_type: project`).

---

## Files Panel

### Purpose

Attach and manage project-related documents — briefs, contracts, deliverables, and reference assets.

### Layout

| Region | Content |
|--------|---------|
| **Panel header** | File count; **Upload File** action |
| **File list** | Name, size, uploaded by, uploaded at |
| **Row actions** | Download, Delete (permission-gated) |

### Upload Flow

1. User selects **Upload File** or drag-drops onto panel
2. File uploads to object storage per [Architecture §12](../../03_ARCHITECTURE.md#12-file-storage-architecture)
3. Metadata record created with project reference
4. Timeline entry written

### Empty State

"No files attached. Upload briefs, deliverables, or reference documents."

### Constraints

- File size and count limits per workspace plan
- Deleted files soft-removed from list; storage purge per retention policy

---

## Milestones Panel

### Purpose

Define, track, and complete delivery checkpoints within the project.

### Layout

| Region | Content |
|--------|---------|
| **Panel header** | Milestone count; completion progress bar; **Add Milestone** |
| **Milestone list** | Ordered by `sort_order` — draggable reorder |
| **Milestone row** | Name, status badge, owner, due date, task count (from tasks module) |
| **Row actions** | Edit, Complete, Delete |
| **Expand row** | Description, linked tasks summary |

### Add / Edit Milestone

| Field | Required |
|-------|----------|
| Name | Yes |
| Description | No |
| Due date | No |
| Owner | No |
| Status | No — defaults to workspace default milestone status |

### Complete Milestone

- **Complete** action transitions status to terminal complete category
- Open tasks warning displayed when tasks module reports incomplete linked tasks

### Empty State

"No milestones defined. Add milestones to track delivery checkpoints."

### Reorder

Drag-and-drop updates `sort_order`; persisted on drop with optimistic UI update.

---

## Permission Gates

All screens respect RBAC permissions. Actions hidden or disabled when user lacks required permission — never fail silently on submit.

| Permission Key | Gates |
|----------------|-------|
| `projects.read` | List, Detail, all read-only panels |
| `projects.create` | New Project drawer, template create |
| `projects.update` | Edit drawer, tags, labels, milestone edit |
| `projects.archive` | Archive action |
| `projects.members.manage` | Members panel write actions |
| `projects.milestones.manage` | Milestone CRUD |
| `projects.complete` | Mark Complete |
| `projects.invoice_ready` | Mark Invoice Ready |
| `projects.files.upload` | File upload |
| `projects.files.delete` | File delete |

---

## Responsive Behavior

| Breakpoint | Adaptation |
|------------|------------|
| Desktop | Full table, side drawer, tabbed detail |
| Tablet | Table scrolls horizontally; drawer full-width overlay |
| Mobile | List cards replace table; detail tabs become accordion sections |

---

## Related Documents

| Document | Path |
|----------|------|
| UI system | [`../../06_UI_SYSTEM.md`](../../06_UI_SYSTEM.md) |
| Workflows | [`workflows.md`](workflows.md) |
| Database | [`database.md`](database.md) |
| Clients screens | [`../clients/screens.md`](../clients/screens.md) |
