# Clients Module Specification

**Module:** `clients`  
**Status:** Draft  
**Owner:** Product  
**Version:** 1.0

---

## Module Purpose

The Clients module is the **relationship foundation** of AgencyOS. It is the system of record for every organization an agency serves — who they are, how to reach them, and the history of the agency–client relationship.

Digital marketing agencies manage dozens to hundreds of client accounts across sales, delivery, billing, and reporting. Without a centralized client layer, account data fragments across spreadsheets, inboxes, and disconnected tools — causing duplicate records, lost context, and inconsistent service.

The Clients module provides a single, workspace-scoped view of client identity, contacts, and relationship metadata. All other modules — sales, projects, finance, operations — reference client records from this module rather than maintaining parallel account data.

This module aligns with the CRM domain responsibility defined in [Architecture §5](../../03_ARCHITECTURE.md#5-module-architecture). All client data is tenant-scoped within the active workspace, per [Architecture §3](../../03_ARCHITECTURE.md#3-multi-tenant-architecture).

---

## Business Problems Solved

| Problem | How the Clients Module Addresses It |
|---------|-------------------------------------|
| **Fragmented client records** | One authoritative client profile per account within the workspace |
| **Unknown points of contact** | Structured contact management linked to client accounts |
| **Lost relationship context** | Activity history and notes attached to the client record |
| **Duplicate and stale data** | Deduplication awareness and lifecycle status on every client |
| **No visibility across teams** | Shared client view accessible to sales, delivery, finance, and leadership |
| **Onboarding friction** | Standardized client intake before work begins in downstream modules |
| **Compliance and audit gaps** | Traceable record of who created, modified, and accessed client data |

---

## Primary Users

| User | Role in This Module |
|------|---------------------|
| **Agency Owner / Director** | Portfolio visibility — active clients, account health overview, strategic account review |
| **Account Manager** | Day-to-day ownership of client relationships, contact maintenance, and account notes |
| **Sales Representative** | Converts prospects into client records; maintains pre-contract account data |
| **Project Manager** | References client context when initiating and delivering projects |
| **Finance Manager** | Links billing and invoicing to the correct client entity |
| **Operations Lead** | Associates campaigns and operational work with the correct client account |
| **Client Success Manager** | Monitors retention signals and relationship health from the client record |

Platform administrators operate outside standard workspace scope with elevated, audited access — not as primary users of day-to-day client management.

---

## Core Features

| Feature | Description | Detail Document |
|---------|-------------|-----------------|
| **Client Accounts** | Create, view, update, and archive client organizations within the workspace | [`database.md`](database.md), [`workflows.md`](workflows.md) |
| **Contacts** | Manage people associated with a client — roles, communication details, primary contact designation | [`database.md`](database.md) |
| **Client Status & Lifecycle** | Track account state from prospect through active, inactive, and archived | [`workflows.md`](workflows.md) |
| **Relationship Notes** | Capture meeting notes, context, and internal commentary on the client record | [`workflows.md`](workflows.md) |
| **Activity Timeline** | Surface a chronological view of significant events related to the client | [`workflows.md`](workflows.md) |
| **Client Search & Discovery** | Find clients by name, status, owner, tag, or custom attribute | [`screens.md`](screens.md) |
| **Account Ownership** | Assign an internal owner responsible for the client relationship | [`permissions.md`](permissions.md) |
| **Tags & Segmentation** | Group clients for filtering, reporting, and targeted communication | [`database.md`](database.md) |
| **Import & Export** | Bulk bring client data into the workspace and export for migration or reporting | [`workflows.md`](workflows.md) |
| **Client Documents** | Attach contracts, briefs, and reference files to the client record | [`workflows.md`](workflows.md) |

Feature specifications for permissions, automations, and acceptance criteria are maintained in their respective module documents — not in this README.

---

## Module Boundaries

### In Scope

The Clients module **owns**:

- Client organization profiles (legal name, display name, industry, website, address)
- Contact persons linked to client accounts
- Client lifecycle status and ownership assignment
- Internal notes and relationship history on the client record
- Tags, segments, and custom attributes for client classification
- Document attachments metadata associated with the client (files stored per [Architecture §12](../../03_ARCHITECTURE.md#12-file-storage-architecture))
- Domain events emitted on client creation, update, and status change

### Out of Scope

The Clients module **does not own**:

| Capability | Owning Module |
|------------|---------------|
| Sales pipeline, proposals, and deal stages | [`sales`](../sales/) |
| Project delivery, milestones, and deliverables | [`projects`](../projects/) |
| Task assignment and execution | [`tasks`](../tasks/) |
| Campaign execution and channel operations | [`operations`](../operations/) |
| Invoicing, payments, and revenue recognition | [`finance`](../finance/) |
| Dashboards and cross-module analytics | [`reports`](../reports/) |
| Retention scoring and health monitoring | [`client-success`](../client-success/) |
| Workflow automation rule engine | [`automation`](../automation/) |
| Workspace and user administration | [`settings`](../settings/) |
| User authentication and role definitions | Identity & Access (platform) |

The Clients module **references** downstream records (projects, invoices, campaigns) via links and timeline events — it does not store or manage that data.

---

## Related Modules

### Downstream — Modules That Depend on Clients

| Module | Relationship |
|--------|-------------|
| [`sales`](../sales/) | Prospects convert to client records; deals reference client accounts |
| [`projects`](../projects/) | Every project belongs to a client account |
| [`tasks`](../tasks/) | Tasks inherit client context from their parent project or account |
| [`operations`](../operations/) | Campaigns and operational work are scoped to a client |
| [`finance`](../finance/) | Invoices and billing profiles link to client accounts |
| [`reports`](../reports/) | Client-level metrics aggregate from this module and downstream modules |
| [`client-success`](../client-success/) | Health scores and retention workflows anchor on client records |
| [`automation`](../automation/) | Triggers fire on client lifecycle events defined here |

### Upstream — Modules Clients Depends On

| Module | Relationship |
|--------|-------------|
| [`settings`](../settings/) | Workspace configuration — timezone, currency, custom fields |
| Identity & Access (platform) | User profiles for account ownership and permission evaluation |

### External Integrations

Client data may sync with external CRM or marketing platforms through the platform Integrations layer defined in [Architecture §13](../../03_ARCHITECTURE.md#13-integration-architecture). The Clients module defines what data is authoritative within AgencyOS — external systems are downstream projections, not sources of truth.

---

## Success Metrics

Metrics below measure whether the Clients module delivers business value. Measurement definitions and reporting live in the [`reports`](../reports/) module.

| Metric | Description | Target Direction |
|--------|-------------|-----------------|
| **Client record completeness** | Percentage of active clients with owner, primary contact, and status populated | Increase |
| **Duplicate rate** | Percentage of client records flagged as potential duplicates | Decrease |
| **Time to onboard** | Elapsed time from client creation to first linked project or invoice | Decrease |
| **Contact coverage** | Average number of contacts per active client account | Increase |
| **Data freshness** | Percentage of client records updated within the last 90 days | Increase |
| **Cross-module linkage** | Percentage of active clients with at least one linked project or invoice | Increase |
| **Search success rate** | Percentage of client searches returning a relevant result on first attempt | Increase |
| **User adoption** | Percentage of workspace users who accessed the Clients module in the last 30 days | Increase |

---

## Future Expansion

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| **Client hierarchy** | Medium | Parent–child relationships for agency groups, sub-brands, and regional offices — aligned with the organization layer in [Architecture §4](../../03_ARCHITECTURE.md#4-workspace-model) |
| **Custom fields builder** | High | Workspace-configurable attributes without schema changes |
| **External CRM sync** | High | Bidirectional sync with HubSpot, Salesforce, and similar platforms |
| **Client portal access** | Medium | Limited client-facing view of their own account data and documents |
| **AI relationship summaries** | Low | AI-generated account briefs from notes, activity, and linked module data — per [Architecture §14](../../03_ARCHITECTURE.md#14-ai-architecture) |
| **Lead-to-client automation** | Medium | Automatic client record creation when a sales deal closes |
| **Account scoring** | Low | Predictive scoring for upsell and churn risk — delegated to [`client-success`](../client-success/) |
| **Compliance profiles** | Low | GDPR consent tracking and data processing agreements per client |

---

## Document Index

| File | Description |
|------|-------------|
| [`database.md`](database.md) | Entity definitions and data constraints |
| [`api.md`](api.md) | REST resource and contract specifications |
| [`screens.md`](screens.md) | Page inventory and navigation placement |
| [`workflows.md`](workflows.md) | User journeys and business process flows |
| [`permissions.md`](permissions.md) | Role-based access matrix |
| [`automations.md`](automations.md) | Trigger and action rules |
| [`acceptance.md`](acceptance.md) | Testable acceptance criteria |

---

## Related Documents

| Document | Path |
|----------|------|
| Module template | [`../_TEMPLATE.md`](../_TEMPLATE.md) |
| Module documentation convention | [`../README.md`](../README.md) |
| Product overview | [`../../02_TECH_STACK.md`](../../02_TECH_STACK.md) |
| Architecture | [`../../03_ARCHITECTURE.md`](../../03_ARCHITECTURE.md) |
| Database rules | [`../../04_DATABASE_RULES.md`](../../04_DATABASE_RULES.md) |
| UI system | [`../../06_UI_SYSTEM.md`](../../06_UI_SYSTEM.md) |
