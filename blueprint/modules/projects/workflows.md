# Projects — Workflow Specification

**Module:** `projects`  
**Status:** Draft  
**Owner:** Product  
**Version:** 1.0

---

## Purpose

This document defines the **business workflows** for the Projects module — the triggers, preconditions, steps, outcomes, and exceptions for each significant process.

Lifecycle states and data constraints are defined in [`database.md`](database.md). Screen interactions are defined in [`screens.md`](screens.md). Module scope and actors are defined in [`README.md`](README.md).

---

## End-to-End Delivery Lifecycle

The Projects module sits at the center of the agency delivery chain. The canonical lifecycle spans multiple modules; Projects owns the project and milestone layers.

```
Client (clients module)
  → Project (projects module)
    → Milestones (projects module)
      → Tasks (tasks module)
        → Time Entries (tasks module)
          → Completion (projects module)
            → Invoice Ready (projects module → finance module handoff)
```

| Stage | Owning Module | Projects Module Role |
|-------|---------------|----------------------|
| **Client** | [`clients`](../clients/) | Project references an active client account |
| **Project** | `projects` | Creates and manages the delivery container |
| **Milestones** | `projects` | Defines checkpoints and due dates within the project |
| **Tasks** | [`tasks`](../tasks/) | Execution work items linked to project and optionally milestone |
| **Time Entries** | [`tasks`](../tasks/) | Logged effort against tasks; surfaced on project timeline |
| **Completion** | `projects` | Project or milestone marked complete; deliverables verified |
| **Invoice Ready** | `projects` → [`finance`](../finance/) | Billable signal emitted; finance module creates invoice |

Cross-module handoffs occur via domain events and API references — not direct table access per [Architecture §5](../../03_ARCHITECTURE.md#5-module-architecture).

---

## Workflow Index

| Workflow | Primary Actor |
|----------|---------------|
| [Create Project](#create-project) | Project Manager, Account Manager |
| [Create Project from Template](#create-project-from-template) | Project Manager |
| [Edit Project](#edit-project) | Project Manager |
| [Manage Project Members](#manage-project-members) | Project Manager, Delivery Lead |
| [Add Milestone](#add-milestone) | Project Manager |
| [Complete Milestone](#complete-milestone) | Project Manager, Delivery Lead |
| [Mark Project Complete](#mark-project-complete) | Project Manager |
| [Mark Invoice Ready](#mark-invoice-ready) | Project Manager, Finance Manager |
| [Archive Project](#archive-project) | Project Manager, Agency Owner |

---

## Create Project

### Trigger

A user needs to initiate a new delivery engagement for an existing client — after contract signing, during onboarding, or when scope is approved.

Common trigger events:

- User selects **New Project** from the Project List or Client Detail
- Account Manager converts a signed deal into a delivery engagement
- User creates a project from a Quick Action on the executive dashboard

### Preconditions

- User is authenticated with an active workspace selected
- User holds permission to create project records
- Parent client exists and is not archived
- Workspace is in an active (non-suspended) state

### Steps

1. User opens the Create Project drawer
2. User selects the parent client (required)
3. User enters project name (required) and optional description, dates, and priority
4. User optionally assigns a project manager and initial status (defaults to **Planning**)
5. User optionally applies tags, labels, or a template
6. User submits the form
7. System validates required fields and client eligibility
8. System creates the project record with audit attribution
9. System writes a Project Activity entry and emits a `ProjectCreated` domain event

### Result

- A new project record exists linked to the client
- User is directed to Project Detail
- Downstream modules may react to the `ProjectCreated` event

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Client is archived | Submission rejected; user prompted to restore client or select another |
| Required fields missing or invalid | Submission rejected; inline validation errors displayed |
| User lacks create permission | Action blocked; access denied |
| Workspace is suspended | Write operations blocked platform-wide |

---

## Create Project from Template

### Trigger

A user needs to bootstrap a repeatable delivery pattern — retainer onboarding, website launch, or monthly SEO engagement.

### Preconditions

- A project template exists in the workspace (system or custom)
- User holds permission to create projects
- Parent client is active

### Steps

1. User opens Create Project drawer and selects **Use Template**
2. User selects a template from the workspace catalog
3. User selects parent client and adjusts name, dates, and manager
4. System creates the project record
5. System materializes default milestones and labels defined in the template
6. System writes activity entries and emits `ProjectCreated` with template reference

### Result

- Project exists with pre-configured milestones and metadata from the template
- User lands on Project Detail with Milestones tab populated

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Template is archived | Template not available for selection |
| Template milestone definitions invalid | Project created; user notified to review milestones manually |

---

## Edit Project

### Trigger

A user needs to update project metadata — dates, description, status, manager, or classification.

### Preconditions

- Project exists and is not archived
- User holds permission to update the project
- Status transition (if changed) is valid per lifecycle rules in [`database.md`](database.md)

### Steps

1. User opens Edit Project drawer from Project Detail
2. User modifies fields
3. System validates changes and status transition rules
4. System persists updates with audit attribution
5. System writes a Project Activity entry for material changes

### Result

- Project Detail reflects updated values
- Activity timeline records the change

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Project is archived | Edit blocked; read-only access only |
| Invalid status transition | Submission rejected with explanation |
| User lacks update permission | Action blocked |

---

## Manage Project Members

### Trigger

A user needs to add, update, or remove team members on a project.

### Preconditions

- Project exists and is active
- User holds permission to manage project membership
- Target users are active workspace members

### Steps

1. User opens the Members panel on Project Detail
2. User adds a member with a delivery role (Lead, Member, Viewer)
3. System validates membership uniqueness and role rules
4. System persists the ProjectMember record
5. System writes a Project Activity entry and notifies the added member

### Result

- Member appears on the Members panel
- Added user gains project-scoped visibility per their role and permissions

### Exceptions

| Condition | Outcome |
|-----------|---------|
| User already a member | Duplicate add rejected |
| Target user not in workspace | Assignment rejected |
| Removing the sole project lead | Rejected unless a replacement lead is designated |

---

## Add Milestone

### Trigger

A user defines a delivery checkpoint within an active project.

### Preconditions

- Project is in a status that allows milestone management (Planning, Active, On Hold)
- User holds permission to manage milestones

### Steps

1. User opens Milestones tab and selects **Add Milestone**
2. User enters name, optional description, and due date
3. User optionally assigns an owner and status
4. System creates the milestone with sort order
5. System writes a Project Activity entry

### Result

- Milestone appears on the Milestones tab and project timeline
- Tasks module may link tasks to this milestone in a subsequent step

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Project is Completed or Archived | Milestone creation blocked |
| Due date before project start date | Warning displayed; user may proceed or adjust |

---

## Complete Milestone

### Trigger

A delivery checkpoint is finished and ready to be marked complete.

### Preconditions

- Milestone exists and is not already in a terminal state
- User holds permission to complete milestones
- Optional: all linked tasks are complete (configurable workspace rule)

### Steps

1. User selects **Complete Milestone** on the Milestones tab
2. System validates preconditions (open tasks, if enforced)
3. System sets milestone status to Complete and records `completed_at`
4. System writes a Project Activity entry and emits `MilestoneCompleted`

### Result

- Milestone displayed as complete on Project Detail
- Project completion percentage recalculated

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Open tasks exist and enforcement enabled | Completion blocked; list of open tasks shown |
| User lacks permission | Action blocked |

---

## Mark Project Complete

### Trigger

All deliverables are finished and the project engagement is closed from a delivery perspective.

### Preconditions

- Project is Active or On Hold
- User holds permission to complete projects
- All milestones are complete or user confirms override (with reason)

### Steps

1. User selects **Mark Complete** on Project Detail
2. System validates milestone completion state
3. User confirms completion (and override reason if applicable)
4. System transitions project status to **Completed** and records `completed_at`
5. System writes a Project Activity entry and emits `ProjectCompleted`

### Result

- Project removed from active delivery lists
- Project available for invoice readiness workflow if billable

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Incomplete milestones without override | Completion blocked |
| Open tasks on project | Warning displayed; configurable block or allow with acknowledgment |

---

## Mark Invoice Ready

### Trigger

A completed billable project is ready for the finance team to invoice the client.

### Preconditions

- Project status is **Completed**
- Project is flagged as billable
- User holds permission to mark invoice ready
- Optional: time entries approved (validated via tasks module reference)

### Steps

1. User selects **Mark Invoice Ready** on Project Detail
2. System validates completion and billable preconditions
3. System sets `invoice_ready_at` and transitions status to **Invoice Ready**
4. System writes a Project Activity entry and emits `ProjectInvoiceReady`
5. Finance module receives event and surfaces project in invoice creation queue

### Result

- Project appears in finance module invoice-ready queue
- Project Detail shows invoice-ready badge and timestamp

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Project not billable | Action not available |
| Project not completed | Action blocked |
| User lacks finance handoff permission | Action blocked |

---

## Archive Project

### Trigger

A project is cancelled, fully invoiced, or no longer active and should be removed from default views.

### Preconditions

- Project is not already archived
- User holds permission to archive projects
- No blocking downstream records (open invoices in draft — validated via finance module event query)

### Steps

1. User selects **Archive Project**
2. System validates archive preconditions
3. User confirms archival
4. System soft-deletes the project and cascades soft-delete to milestones and memberships
5. System writes a Project Activity entry and emits `ProjectArchived`

### Result

- Project removed from Project List default view
- Associated milestones and memberships soft-deleted
- Activity log entries retained

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Open draft invoice exists | Archive blocked; user directed to finance module |
| User lacks archive permission | Action blocked |

---

## Related Documents

| Document | Path |
|----------|------|
| Data model | [`database.md`](database.md) |
| Screens | [`screens.md`](screens.md) |
| Acceptance criteria | [`acceptance.md`](acceptance.md) |
| Clients module workflows | [`../clients/workflows.md`](../clients/workflows.md) |
