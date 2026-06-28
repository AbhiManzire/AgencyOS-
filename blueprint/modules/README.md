# AgencyOS Module Documentation

**Document ID:** `blueprint/modules/README.md`  
**Status:** Draft  
**Owner:** Product & Engineering

---

## Purpose

This directory contains **module-level functional specifications** for AgencyOS. Each subdirectory represents a platform module — a bounded area of business capability aligned with the domain module architecture in [`blueprint/03_ARCHITECTURE.md`](../03_ARCHITECTURE.md).

Module documentation defines **what** each module does. Platform-wide standards define **how** it is built:

| Topic | Reference |
|-------|-----------|
| Technology | [`blueprint/02_TECH_STACK.md`](../02_TECH_STACK.md) |
| Architecture | [`blueprint/03_ARCHITECTURE.md`](../03_ARCHITECTURE.md) |
| Database conventions | [`blueprint/04_DATABASE_RULES.md`](../04_DATABASE_RULES.md) |
| Coding standards | [`blueprint/05_CODING_STANDARDS.md`](../05_CODING_STANDARDS.md) |
| UI system | [`blueprint/06_UI_SYSTEM.md`](../06_UI_SYSTEM.md) |

---

## Module Index

| Module | Directory | Description |
|--------|-----------|-------------|
| Clients | [`clients/`](clients/) | Client accounts, contacts, and relationship management |
| Sales | [`sales/`](sales/) | Pipeline, proposals, and revenue acquisition |
| Projects | [`projects/`](projects/) | Deliverables, milestones, and project delivery |
| Tasks | [`tasks/`](tasks/) | Task management, assignment, and tracking |
| Operations | [`operations/`](operations/) | Campaign and operational workflow execution |
| Finance | [`finance/`](finance/) | Invoicing, billing, and financial management |
| Reports | [`reports/`](reports/) | Dashboards, analytics, and reporting |
| HR | [`hr/`](hr/) | Team members, roles, and workforce management |
| Automation | [`automation/`](automation/) | Workflow automation and rule engine |
| Client Success | [`client-success/`](client-success/) | Retention, health scoring, and client satisfaction |
| Settings | [`settings/`](settings/) | Workspace configuration and administration |

---

## Documentation Convention

Every module directory contains the same eight files. Each file has a single responsibility — do not mix concerns across files.

| File | Contains | Does Not Contain |
|------|----------|------------------|
| **`README.md`** | Module purpose, scope boundaries, dependencies on other modules, document index | Implementation details, schemas, API paths |
| **`database.md`** | Entity definitions, relationships, and data constraints for this module | SQL scripts, migration files, platform-wide database rules |
| **`api.md`** | REST resource definitions, request/response contracts, and versioning notes | Controller code, OpenAPI YAML files, global API standards |
| **`screens.md`** | Page inventory, navigation placement, and UI component mapping | Wireframes, mockups, CSS, component source code |
| **`workflows.md`** | User journeys, state transitions, and business process flows | Screen designs, API contracts |
| **`permissions.md`** | Role-based access matrix, permission keys, and tenant scoping rules | Authentication configuration, Keycloak setup |
| **`automations.md`** | Trigger conditions, actions, and module-specific automation rules | Automation engine implementation, cross-module event definitions |
| **`acceptance.md`** | Testable acceptance criteria organized by feature area | Test code, QA scripts |

---

## Authoring Rules

1. **One module, one directory** — All documentation for a capability lives within its module folder.
2. **Fill documents in order** — Start with `README.md` (scope), then `workflows.md` (process), then `database.md`, `api.md`, and `screens.md` (design), then `permissions.md` and `automations.md` (rules), then `acceptance.md` (verification).
3. **Reference, do not repeat** — Link to platform blueprint documents for technology, architecture, database, coding, and UI standards.
4. **Tenant-scoped by default** — All module data and permissions assume workspace-level isolation unless explicitly platform-scoped.
5. **Status tracking** — Each file includes a `Status` field (`Draft`, `In Review`, `Approved`) updated as documentation matures.
6. **No implementation artifacts** — Module docs contain specifications only. Source code, migrations, and tests live in `frontend/`, `backend/`, and test directories.

---

## Relationship to Other Blueprint Directories

| Directory | Scope |
|-----------|-------|
| `blueprint/modules/` | Module-specific functional specifications (this directory) |
| `blueprint/functional-specifications/` | Cross-module and platform-level functional requirements |
| `blueprint/database/` | Shared database artifacts and ER diagrams |
| `blueprint/api/` | Aggregated OpenAPI specifications |
| `blueprint/ui/` | Shared UI patterns beyond the design system |
| `blueprint/user-flows/` | End-to-end user flows spanning multiple modules |
| `blueprint/wireframes/` | Visual design artifacts |

When a specification spans multiple modules, place it in the appropriate cross-module directory and link to it from each affected module's `README.md`.
