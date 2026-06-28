# Clients — Database Specification

**Module:** `clients`  
**Status:** Draft  
**Owner:** Engineering  
**Version:** 1.0

---

## Purpose

This document defines the **data model** for the Clients module — the entities, relationships, fields, validation rules, and lifecycle states that constitute the system of record for agency client relationships.

Platform-wide storage conventions (tenant isolation, primary keys, audit columns, soft delete, timestamps) are defined in [`blueprint/04_DATABASE_RULES.md`](../../04_DATABASE_RULES.md). This document applies those conventions to Clients module entities without repeating them.

Module scope and business context are defined in [`README.md`](README.md).

---

## Platform Conventions Applied

Every mutable entity in this module includes the standard fields required by the database rules:

| Convention | Application in Clients Module |
|------------|------------------------------|
| Tenant scoping | All entities include `tenant_id` — see [Database Rules §3](../../04_DATABASE_RULES.md#3-multi-tenant-rules) |
| Primary key | UUID `id` on all entities — see [Database Rules §4](../../04_DATABASE_RULES.md#4-primary-key-strategy) |
| Audit fields | `created_at`, `updated_at`, `created_by_user_id`, `updated_by_user_id` — see [Database Rules §6](../../04_DATABASE_RULES.md#6-audit-fields) |
| Soft delete | `deleted_at`, `deleted_by_user_id` on deletable entities — see [Database Rules §7](../../04_DATABASE_RULES.md#7-soft-delete-rules) |
| Naming | snake_case table and column names — see [Database Rules §5](../../04_DATABASE_RULES.md#5-naming-conventions) |

Append-only entities (activity log entries) carry audit creation fields only and are never soft-deleted.

---

## Entities

### Client

The central entity representing an organization the agency serves or intends to serve. A client record is the anchor for contacts, notes, documents, tags, and cross-module references.

**Business role:** System of record for client organization identity and relationship metadata within the workspace.

---

### Contact

A person associated with a client account — decision-maker, billing contact, day-to-day liaison, or other stakeholder.

**Business role:** Structured representation of who to communicate with at a client organization.

---

### Client Note

An internal note or commentary attached to a client record. Notes capture meeting summaries, context, and relationship history visible to authorized workspace users.

**Business role:** Persistent relationship context that survives staff turnover.

---

### Client Activity

An append-only timeline entry recording a significant event related to a client — status change, note added, document uploaded, owner reassigned, or cross-module event surfaced from domain events defined in [Architecture §11](../../03_ARCHITECTURE.md#11-event-flow).

**Business role:** Chronological audit of what happened on an account and when.

---

### Tag

A workspace-defined label used to classify and segment client accounts (e.g., industry vertical, service tier, priority tier).

**Business role:** Flexible grouping mechanism for search, filtering, and reporting.

---

### Client Tag

An association linking a tag to a client account. A client may have many tags; a tag may apply to many clients.

**Business role:** Many-to-many relationship between clients and segmentation labels.

---

### Client Document

Metadata for a file attached to a client record. The binary file is stored in object storage per [Architecture §12](../../03_ARCHITECTURE.md#12-file-storage-architecture); this entity stores the reference, name, type, and upload context.

**Business role:** Links contracts, briefs, and reference materials to the client account.

---

### Client Custom Field Value

A workspace-configured custom attribute value assigned to a client account. Field definitions are owned by the [`settings`](../settings/) module; this entity stores the per-client value.

**Business role:** Extends the client profile with agency-specific attributes without schema changes.

---

## Relationships

| From | To | Cardinality | Description |
|------|----|-------------|-------------|
| Client | Contact | One-to-many | Every contact belongs to exactly one client; a client may have zero or many contacts |
| Client | Client Note | One-to-many | Notes are scoped to a single client |
| Client | Client Activity | One-to-many | Activity entries are scoped to a single client |
| Client | Client Document | One-to-many | Documents are attached to a single client |
| Client | Client Tag | One-to-many | Each association row links one client to one tag |
| Tag | Client Tag | One-to-many | Each tag may appear on many clients |
| Client | Client Custom Field Value | One-to-many | Each value row belongs to one client and one field definition |
| Client | User (owner) | Many-to-one | A client has one assigned internal owner; a user may own many clients |
| Contact | User | Many-to-one (optional) | A contact is not a platform user; no direct user link unless portal access is enabled in future |
| Client Note | User (author) | Many-to-one | Every note has an authoring user |
| Client Document | User (uploader) | Many-to-one | Every document records who uploaded it |
| Client | Sales Deal | One-to-many (external) | Deals in the [`sales`](../sales/) module reference a client — not stored in this module |
| Client | Project | One-to-many (external) | Projects in the [`projects`](../projects/) module reference a client — not stored in this module |
| Client | Invoice | One-to-many (external) | Invoices in the [`finance`](../finance/) module reference a client — not stored in this module |

Cross-module references use the client `id` as a foreign key in the owning module's data store. The Clients module does not query downstream module tables directly — per [Architecture §5](../../03_ARCHITECTURE.md#5-module-architecture).

---

## Required Fields

### Client

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Workspace scope |
| `display_name` | Name shown throughout the platform |
| `status` | Current lifecycle state — see Lifecycle section |
| `created_at` | Record creation timestamp |
| `updated_at` | Last modification timestamp |

### Contact

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Workspace scope |
| `client_id` | Parent client account |
| `first_name` | Contact given name |
| `last_name` | Contact family name |
| `created_at` | Record creation timestamp |
| `updated_at` | Last modification timestamp |

### Client Note

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Workspace scope |
| `client_id` | Parent client account |
| `body` | Note content |
| `created_at` | Record creation timestamp |
| `created_by_user_id` | Authoring user |

### Client Activity

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Workspace scope |
| `client_id` | Parent client account |
| `activity_type` | Category of event (status change, note, document, owner change, integration event) |
| `summary` | Human-readable description of the event |
| `occurred_at` | When the event took place |
| `created_at` | When the record was written |

### Tag

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Workspace scope |
| `name` | Tag label — unique within the workspace among active tags |
| `created_at` | Record creation timestamp |

### Client Tag

| Field | Description |
|-------|-------------|
| `tenant_id` | Workspace scope |
| `client_id` | Associated client |
| `tag_id` | Associated tag |

### Client Document

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Workspace scope |
| `client_id` | Parent client account |
| `file_name` | Original file name |
| `storage_key` | Object storage reference |
| `file_size_bytes` | File size for quota enforcement |
| `mime_type` | File content type |
| `uploaded_at` | Upload timestamp |
| `uploaded_by_user_id` | Uploading user |

### Client Custom Field Value

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `tenant_id` | Workspace scope |
| `client_id` | Parent client account |
| `field_definition_id` | Reference to field definition in Settings module |
| `value` | Stored attribute value |

---

## Optional Fields

### Client

| Field | Description |
|-------|-------------|
| `legal_name` | Registered legal entity name — may differ from display name |
| `industry` | Industry classification |
| `website` | Client organization website URL |
| `phone` | Primary organization phone number |
| `email` | Primary organization email address |
| `address_line_1` | Street address |
| `address_line_2` | Additional address detail |
| `city` | City |
| `state_region` | State, province, or region |
| `postal_code` | Postal or ZIP code |
| `country_code` | ISO country code |
| `owner_user_id` | Internally assigned account owner |
| `source` | How the client was acquired (referral, inbound, outbound, import, sales conversion) |
| `external_reference_id` | Identifier in an external CRM or integration system |
| `became_client_at` | Date the account transitioned to active client status |
| `created_by_user_id` | Creating user |
| `updated_by_user_id` | Last modifying user |
| `deleted_at` | Soft-delete timestamp |
| `deleted_by_user_id` | User who archived the client |

### Contact

| Field | Description |
|-------|-------------|
| `job_title` | Role or title at the client organization |
| `email` | Contact email address |
| `phone` | Contact phone number |
| `is_primary` | Whether this contact is the designated primary contact for the client |
| `is_billing_contact` | Whether this contact receives billing communications |
| `notes` | Brief contact-level notes |
| `created_by_user_id` | Creating user |
| `updated_by_user_id` | Last modifying user |
| `deleted_at` | Soft-delete timestamp |
| `deleted_by_user_id` | User who removed the contact |

### Client Note

| Field | Description |
|-------|-------------|
| `title` | Optional short subject line |
| `is_pinned` | Whether the note appears prominently on the client profile |
| `updated_at` | Last edit timestamp — set only if notes are editable after creation |
| `updated_by_user_id` | Last editing user |

### Client Activity

| Field | Description |
|-------|-------------|
| `actor_user_id` | User who performed the action — null for system-generated events |
| `entity_type` | Related entity type (contact, document, note) when applicable |
| `entity_id` | Related entity identifier when applicable |
| `metadata` | Structured supplementary context — JSON supplement per [Database Rules §2](../../04_DATABASE_RULES.md#2-database-philosophy) |

### Tag

| Field | Description |
|-------|-------------|
| `color_token` | Semantic color token for visual display — per [`blueprint/06_UI_SYSTEM.md`](../../06_UI_SYSTEM.md) |
| `description` | Internal description of tag purpose |
| `updated_at` | Last modification timestamp |
| `deleted_at` | Soft-delete timestamp |

### Client Document

| Field | Description |
|-------|-------------|
| `description` | User-provided file description |
| `document_type` | Classification (contract, brief, proposal, other) |
| `deleted_at` | Soft-delete timestamp |
| `deleted_by_user_id` | User who removed the document reference |

### Client Custom Field Value

| Field | Description |
|-------|-------------|
| `updated_at` | Last modification timestamp |
| `updated_by_user_id` | Last modifying user |

---

## Validation Rules

### Client

| Rule | Description |
|------|-------------|
| **Display name required** | Must not be empty or whitespace-only |
| **Display name uniqueness** | Unique among active (non-deleted) clients within the workspace |
| **Status validity** | Must be one of the defined lifecycle states |
| **Website format** | If provided, must be a valid URL |
| **Email format** | If provided, must be a valid email address |
| **Country code** | If provided, must be a valid ISO 3166-1 alpha-2 code |
| **Owner must be workspace member** | `owner_user_id` must reference a user with membership in the current workspace |
| **Cannot hard-delete with active downstream records** | A client with active projects, open invoices, or running campaigns cannot be permanently removed — soft-delete only |
| **External reference uniqueness** | If provided, `external_reference_id` is unique per integration source within the workspace |

### Contact

| Rule | Description |
|------|-------------|
| **Name required** | At least `first_name` must be populated |
| **Parent client required** | Must belong to an active (non-deleted) client |
| **Email format** | If provided, must be a valid email address |
| **Primary contact uniqueness** | At most one contact per client may have `is_primary = true` among active contacts |
| **Billing contact** | Multiple billing contacts permitted; finance module determines delivery behavior |

### Client Note

| Rule | Description |
|------|-------------|
| **Body required** | Must not be empty or whitespace-only |
| **Parent client required** | Must belong to an active client |
| **Maximum length** | Body content subject to platform-configured character limit |

### Tag

| Rule | Description |
|------|-------------|
| **Name required** | Must not be empty or whitespace-only |
| **Name uniqueness** | Unique among active tags within the workspace |
| **Name length** | Maximum 50 characters |

### Client Document

| Rule | Description |
|------|-------------|
| **File type allowlist** | MIME type must be on the workspace-permitted upload list |
| **File size limit** | Must not exceed workspace storage quota per file |
| **Storage key required on save** | Record is not persisted until object storage upload is confirmed |
| **Parent client required** | Must belong to an active client |

### Client Custom Field Value

| Rule | Description |
|------|-------------|
| **Field definition must exist** | Referenced field must be active in the Settings module |
| **Value type match** | Value must conform to the field definition type (text, number, date, boolean, select) |
| **One value per field per client** | At most one active value row per client per field definition |
| **Select option validity** | For select-type fields, value must be one of the defined options |

### Cross-Entity Rules

| Rule | Description |
|------|-------------|
| **Tenant consistency** | All child records must share the same `tenant_id` as their parent client |
| **Soft-delete cascade** | When a client is soft-deleted, active contacts and document references are soft-deleted; activity log entries are retained |
| **Tag association idempotency** | Assigning a tag already on a client is a no-op — no duplicate association rows |

---

## Lifecycle

### Client Status States

| Status | Description | Entry Condition |
|--------|-------------|-----------------|
| **Prospect** | Potential client under evaluation or pre-contract discussion | Default on manual creation or import before sales conversion |
| **Active** | Current client receiving agency services | Sales deal closed, manual promotion, or import with active flag |
| **Inactive** | Former client or paused relationship — not currently receiving services | Manual deactivation or contract end |
| **Archived** | Removed from active views; retained for historical reference | Manual archive or soft-delete action |

Status values align with the application status system defined in [`blueprint/06_UI_SYSTEM.md`](../../06_UI_SYSTEM.md).

### Valid Transitions

| From | To | Trigger |
|------|----|---------|
| Prospect | Active | Sales conversion, manual activation, or import |
| Prospect | Archived | Discarded lead or duplicate cleanup |
| Active | Inactive | Contract ended or relationship paused |
| Active | Archived | Account closure with historical retention |
| Inactive | Active | Relationship reinstated |
| Inactive | Archived | Permanent removal from active and inactive views |
| Archived | Active | Recovery within the soft-delete retention window — per [Database Rules §7](../../04_DATABASE_RULES.md#7-soft-delete-rules) |

Invalid transitions are rejected at the application layer.

### Lifecycle Side Effects

| Event | Data Effect |
|-------|-------------|
| **Client created** | Client Activity entry written; domain event `ClientCreated` emitted |
| **Status changed** | Client Activity entry written; domain event `ClientStatusChanged` emitted |
| **Owner reassigned** | Client Activity entry written; domain event `ClientOwnerChanged` emitted |
| **Client archived** | Soft-delete columns set on client, contacts, and document references; downstream modules notified via domain event |
| **Client recovered** | Soft-delete columns cleared within retention window; Client Activity entry written |

Activity log entries and platform audit log records are append-only and are never modified or soft-deleted.

### Contact Lifecycle

Contacts do not have an independent status enum. A contact is **active** when its parent client is active and the contact itself is not soft-deleted. Contacts on archived clients are implicitly inactive.

### Tag Lifecycle

Tags are workspace-scoped and persist independently of individual clients. A tag may be soft-deleted when no longer needed; existing Client Tag associations on archived clients are retained for historical accuracy.

---

## Related Modules

| Module | Data Relationship |
|--------|-------------------|
| [`settings`](../settings/) | Supplies workspace configuration, custom field definitions, and upload allowlists consumed by Clients entities |
| [`sales`](../sales/) | Creates or promotes client records on deal conversion; stores `client_id` on deal entities |
| [`projects`](../projects/) | Stores `client_id` on project entities — validates client exists and is not archived before project creation |
| [`tasks`](../tasks/) | Inherits client context indirectly via project or direct `client_id` reference |
| [`operations`](../operations/) | Stores `client_id` on campaign and operational entities |
| [`finance`](../finance/) | Stores `client_id` on invoice and billing profile entities |
| [`client-success`](../client-success/) | Reads client and activity data; stores health scores referencing `client_id` |
| [`reports`](../reports/) | Aggregates client entity counts and completeness metrics — read-only consumer |
| [`automation`](../automation/) | Reacts to client domain events; does not own client data |
| **Identity & Access** (platform) | Supplies user identities for owner, author, and audit field references |
| **Integrations** (platform) | Syncs client data with external CRM systems via `external_reference_id`; Clients module remains authoritative within AgencyOS |

---

## Related Documents

| Document | Path |
|----------|------|
| Module overview | [`README.md`](README.md) |
| Database rules | [`../../04_DATABASE_RULES.md`](../../04_DATABASE_RULES.md) |
| Architecture | [`../../03_ARCHITECTURE.md`](../../03_ARCHITECTURE.md) |
| Workflows | [`workflows.md`](workflows.md) |
| Permissions | [`permissions.md`](permissions.md) |
