# Projects Module Specification

**Module:** `projects`  
**Status:** Draft  
**Owner:** Product  
**Version:** 1.0

---

## Module Purpose

The Projects module is the **delivery foundation** of AgencyOS. It is the system of record for how an agency plans, executes, and completes client work — from project initiation through milestone delivery, task execution, time capture, and invoice readiness.

Digital marketing agencies run dozens of concurrent engagements across retainers, campaigns, and one-off deliverables. Without a centralized project layer, delivery context fragments across task tools, spreadsheets, and chat — causing missed deadlines, untracked scope, and billing leakage.

The Projects module provides a workspace-scoped view of every client engagement: who is involved, what must be delivered, when milestones are due, and when work is ready to bill. All delivery artifacts — milestones, member assignments, files, and status history — anchor on a project record linked to a client account in the [`clients`](../clients/) module.

This module aligns with the Projects domain responsibility defined in [Architecture §5](../../03_ARCHITECTURE.md#5-module-architecture). All project data is tenant-scoped within the active workspace, per [Architecture §3](../../03_ARCHITECTURE.md#3-multi-tenant-architecture).

---

## Scope

### In Scope

The Projects module **owns**:

- Project records linked to client accounts
- Project lifecycle status and configurable status definitions
- Project team membership and delivery roles
- Milestones as delivery checkpoints within a project
- Project-scoped tags and labels for classification and visual organization
- Project templates for repeatable delivery patterns
- Project file metadata (binary storage per [Architecture §12](../../03_ARCHITECTURE.md#12-file-storage-architecture))
- Project activity timeline entries
- Invoice-ready signaling on completed, billable work
- Domain events emitted on project creation, status change, completion, and invoice readiness

### Out of Scope

The Projects module **does not own**:

| Capability | Owning Module |
|------------|---------------|
| Client organization profiles and contacts | [`clients`](../clients/) |
| Task assignment, boards, and task-level execution | [`tasks`](../tasks/) |
| Time entry capture and timesheet approval | [`tasks`](../tasks/) or dedicated time-tracking boundary |
| Invoice generation, payment collection, and revenue recognition | [`finance`](../finance/) |
| Campaign execution and channel operations | [`operations`](../operations/) |
| Cross-module analytics and executive dashboards | [`reports`](../reports/) |
| Workflow automation rule engine | [`automation`](../automation/) |
| Workspace and user administration | [`settings`](../settings/) |
| User authentication and role definitions | Identity & Access (platform) |

The Projects module **references** tasks and time entries via links and timeline events — it does not store or manage task-level execution data directly.

---

## Primary Users

| Role | Role in This Module |
|------|---------------------|
| **Agency Owner / Director** | Portfolio visibility — active projects, delivery health, resource utilization overview |
| **Project Manager** | Creates and owns projects; manages milestones, members, timelines, and completion |
| **Account Manager** | References project status in client conversations; initiates projects from client accounts |
| **Delivery Lead / Team Lead** | Oversees milestone progress and team allocation across projects |
| **Individual Contributor** | Views assigned projects, milestones, and files relevant to their work |
| **Finance Manager** | Identifies invoice-ready projects and validates billable completion signals |
| **Operations Lead** | Links operational campaigns to parent client projects where applicable |

Platform administrators operate outside standard workspace scope with elevated, audited access — not as primary users of day-to-day project management.

---

## Core Features

| Feature | Description | Detail Document |
|---------|-------------|-----------------|
| **Project Accounts** | Create, view, update, and archive client-linked delivery engagements | [`database.md`](database.md), [`workflows.md`](workflows.md) |
| **Project Lifecycle & Status** | Track project state from planning through active delivery, completion, and invoice readiness | [`workflows.md`](workflows.md) |
| **Milestones** | Define delivery checkpoints with due dates and completion tracking | [`database.md`](database.md) |
| **Team Membership** | Assign internal users to projects with delivery roles | [`database.md`](database.md), [`screens.md`](screens.md) |
| **Tags & Labels** | Classify and visually organize projects for filtering and reporting | [`database.md`](database.md) |
| **Project Templates** | Bootstrap new projects from repeatable delivery patterns | [`database.md`](database.md), [`workflows.md`](workflows.md) |
| **Activity Timeline** | Chronological view of significant project events | [`screens.md`](screens.md) |
| **Project Files** | Attach briefs, deliverables, and reference documents to a project | [`screens.md`](screens.md) |
| **Invoice Readiness** | Signal when a project or milestone set is ready for billing handoff | [`workflows.md`](workflows.md) |
| **Search & Discovery** | Find projects by client, status, member, tag, or date range | [`screens.md`](screens.md) |

Feature specifications for permissions, automations, and acceptance criteria are maintained in their respective module documents — not in this README.

---

## Module Boundaries

### Upstream — Modules Projects Depends On

| Module | Relationship |
|--------|-------------|
| [`clients`](../clients/) | Every project belongs to exactly one client account |
| [`settings`](../settings/) | Workspace configuration — timezone, currency, custom fields |
| Identity & Access (platform) | User profiles for membership and permission evaluation |

### Downstream — Modules That Depend on Projects

| Module | Relationship |
|--------|-------------|
| [`tasks`](../tasks/) | Tasks belong to a project; inherit client context |
| [`finance`](../finance/) | Invoices reference completed or invoice-ready projects |
| [`reports`](../reports/) | Delivery metrics aggregate from project and milestone data |
| [`automation`](../automation/) | Triggers fire on project lifecycle events |
| [`operations`](../operations/) | Campaigns may reference a parent project for delivery context |

---

## Document Index

| File | Description |
|------|-------------|
| [`database.md`](database.md) | Entity definitions and data constraints |
| [`screens.md`](screens.md) | Page inventory and navigation placement |
| [`workflows.md`](workflows.md) | User journeys and business process flows |
| [`acceptance.md`](acceptance.md) | Testable acceptance criteria |
| [`implementation.md`](implementation.md) | Build sequence and engineering task breakdown |

---

## Related Documents

| Document | Path |
|----------|------|
| Module template | [`../_TEMPLATE.md`](../_TEMPLATE.md) |
| Module documentation convention | [`../README.md`](../README.md) |
| Architecture | [`../../03_ARCHITECTURE.md`](../../03_ARCHITECTURE.md) |
| Database rules | [`../../04_DATABASE_RULES.md`](../../04_DATABASE_RULES.md) |
| UI system | [`../../06_UI_SYSTEM.md`](../../06_UI_SYSTEM.md) |
| Clients module | [`../clients/README.md`](../clients/README.md) |
