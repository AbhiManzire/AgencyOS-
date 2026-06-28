# Clients — Screen Specification

**Module:** `clients`  
**Status:** Draft  
**Owner:** Product Design  
**Version:** 1.0

---

## Purpose

This document defines **every screen** in the Clients module — page-level views and significant overlay surfaces (modals and drawers) that constitute distinct user interactions.

Visual and component standards are defined in [`blueprint/06_UI_SYSTEM.md`](../../06_UI_SYSTEM.md). This document maps each screen to design system components from [UI System §10](../../06_UI_SYSTEM.md#10-component-standards). Module scope and features are defined in [`README.md`](README.md).

All routes are workspace-scoped under the active workspace context.

---

## Screen Index

| # | Screen | Type | Route Pattern |
|---|--------|------|---------------|
| 1 | [Client List](#1-client-list) | Page | `/{workspace}/clients` |
| 2 | [Archived Client List](#2-archived-client-list) | Page | `/{workspace}/clients/archived` |
| 3 | [Client Detail](#3-client-detail) | Page | `/{workspace}/clients/{clientId}` |
| 4 | [Create Client](#4-create-client) | Page | `/{workspace}/clients/new` |
| 5 | [Edit Client](#5-edit-client) | Page | `/{workspace}/clients/{clientId}/edit` |
| 6 | [Client Import](#6-client-import) | Page | `/{workspace}/clients/import` |
| 7 | [Contact Form](#7-contact-form) | Drawer | Overlay on Client Detail |
| 8 | [Note Form](#8-note-form) | Drawer | Overlay on Client Detail |
| 9 | [Document Upload](#9-document-upload) | Drawer | Overlay on Client Detail |
| 10 | [Archive Client Confirmation](#10-archive-client-confirmation) | Modal | Overlay on Client Detail or List |
| 11 | [Remove Contact Confirmation](#11-remove-contact-confirmation) | Modal | Overlay on Client Detail |

---

## 1. Client List

### Screen Name

Client List

### Purpose

Primary entry point for the Clients module. Displays all active and prospect client accounts in the workspace and enables search, filtering, and bulk management.

### Main Components

| Component | Usage | UI System Reference |
|-----------|-------|---------------------|
| **Table** | Client data grid with sortable columns | [§10 Table](../../06_UI_SYSTEM.md#table) |
| **Search** | Filter clients by name, owner, or tag | [§10 Search](../../06_UI_SYSTEM.md#search) |
| **Select** | Status and owner filter dropdowns | [§10 Select](../../06_UI_SYSTEM.md#select) |
| **Status Chip** | Client lifecycle status per row | [§10 Status Chip](../../06_UI_SYSTEM.md#status-chip) |
| **Avatar** | Account owner display | [§10 Avatar](../../06_UI_SYSTEM.md#avatar) |
| **Badge** | Tag count indicator per row | [§10 Badge](../../06_UI_SYSTEM.md#badge) |
| **Pagination** | Server-side page navigation | [§10 Pagination](../../06_UI_SYSTEM.md#pagination) |
| **Skeleton** | Initial load placeholder | [§10 Skeleton](../../06_UI_SYSTEM.md#skeleton) |
| **Breadcrumb** | Module location context | [§10 Breadcrumb](../../06_UI_SYSTEM.md#breadcrumb) |

### Actions

| Action | Type | Description |
|--------|------|-------------|
| Create Client | Primary Button | Navigate to Create Client screen |
| Import Clients | Secondary Button | Navigate to Client Import screen |
| Export CSV | Ghost Button | Export filtered dataset asynchronously |
| View Client | Row click | Navigate to Client Detail |
| Filter by status | Select | Narrow list by lifecycle status |
| Filter by owner | Select | Narrow list by assigned owner |
| Filter by tag | Multi Select | Narrow list by one or more tags |
| Clear filters | Ghost Button | Reset all active filters |
| Archive selected | Bulk action | Open Archive Client Confirmation for selected rows |

### Navigation

| From | To |
|------|----|
| Sidebar → Clients | Client List |
| Global header search result | Client Detail |
| Create Client success | Client Detail |
| Client Import success | Client List |
| Archived Client List link | Archived Client List |

Breadcrumb: `Clients`

### Empty State

| Condition | Message | Action |
|-----------|---------|--------|
| No clients in workspace | "No clients yet" | Primary Button → Create Client |
| No filter results | "No clients match your filters" | Ghost Button → Clear filters |

Uses [Empty State](../../06_UI_SYSTEM.md#empty-state) component with `icon.lg` and `font.heading.sm`.

### Success State

| Condition | Feedback |
|-----------|----------|
| List loaded | Table populated; filter chips reflect active state |
| Export initiated | Info Toast — export processing notification |
| Export complete | Success Toast with download action |
| Bulk archive complete | Success Toast; archived rows removed from list |
| Filter applied | Results update; active filter chips visible below search bar |

---

## 2. Archived Client List

### Screen Name

Archived Client List

### Purpose

Displays client accounts that have been archived or soft-deleted, enabling review and recovery within the retention window defined in [`database.md`](database.md).

### Main Components

| Component | Usage | UI System Reference |
|-----------|-------|---------------------|
| **Table** | Archived client grid | [§10 Table](../../06_UI_SYSTEM.md#table) |
| **Search** | Filter by name | [§10 Search](../../06_UI_SYSTEM.md#search) |
| **Status Chip** | Archived status indicator | [§10 Status Chip](../../06_UI_SYSTEM.md#status-chip) |
| **Pagination** | Server-side page navigation | [§10 Pagination](../../06_UI_SYSTEM.md#pagination) |
| **Alert** | Retention window information | [§10 Alert](../../06_UI_SYSTEM.md#alert) |
| **Breadcrumb** | Navigation context | [§10 Breadcrumb](../../06_UI_SYSTEM.md#breadcrumb) |

### Actions

| Action | Type | Description |
|--------|------|-------------|
| Restore client | Secondary Button (row) | Recover client within retention window |
| View client | Row click | Navigate to Client Detail (read-only for archived) |
| Back to active clients | Ghost Button | Navigate to Client List |

### Navigation

| From | To |
|------|----|
| Client List → View archived | Archived Client List |
| Breadcrumb → Clients | Client List |

Breadcrumb: `Clients / Archived`

### Empty State

| Condition | Message | Action |
|-----------|---------|--------|
| No archived clients | "No archived clients" | Ghost Button → Back to Client List |

### Success State

| Condition | Feedback |
|-----------|----------|
| List loaded | Table populated with archived records and archive dates |
| Client restored | Success Toast; row removed; client available on Client List |

---

## 3. Client Detail

### Screen Name

Client Detail

### Purpose

Single-client command center. Presents profile summary, contacts, notes, activity timeline, and documents in a tabbed layout. Primary workspace for day-to-day account management.

### Main Components

| Component | Usage | UI System Reference |
|-----------|-------|---------------------|
| **Tabs** | Overview, Contacts, Notes, Activity, Documents | [§10 Tabs](../../06_UI_SYSTEM.md#tabs) |
| **Card** | Profile summary and section containers | [§10 Card](../../06_UI_SYSTEM.md#card) |
| **Status Chip** | Client lifecycle status | [§10 Status Chip](../../06_UI_SYSTEM.md#status-chip) |
| **Avatar** | Owner and contact avatars | [§10 Avatar](../../06_UI_SYSTEM.md#avatar) |
| **Badge** | Tag labels | [§10 Badge](../../06_UI_SYSTEM.md#badge) |
| **Table** | Contacts and documents lists | [§10 Table](../../06_UI_SYSTEM.md#table) |
| **Accordion** | Activity timeline grouped by date | [§10 Accordion](../../06_UI_SYSTEM.md#accordion) |
| **Breadcrumb** | Client name in path | [§10 Breadcrumb](../../06_UI_SYSTEM.md#breadcrumb) |
| **Skeleton** | Tab content loading | [§10 Skeleton](../../06_UI_SYSTEM.md#skeleton) |

### Actions

| Action | Type | Description |
|--------|------|-------------|
| Edit Client | Secondary Button | Navigate to Edit Client |
| Archive Client | Danger Button | Open Archive Client Confirmation |
| Change status | Select | Update lifecycle status |
| Reassign owner | Select | Change account owner |
| Add Contact | Primary Button (Contacts tab) | Open Contact Form drawer |
| Add Note | Primary Button (Notes tab) | Open Note Form drawer |
| Upload Document | Primary Button (Documents tab) | Open Document Upload drawer |
| Edit contact | Row action | Open Contact Form drawer (edit mode) |
| Remove contact | Row action | Open Remove Contact Confirmation |
| Pin note | Row action | Toggle note pin state |
| Download document | Row action | Download via pre-signed URL |
| Remove document | Row action | Soft-delete document reference |

### Navigation

| From | To |
|------|----|
| Client List row click | Client Detail |
| Create Client success | Client Detail |
| Edit Client success | Client Detail |
| Global search result | Client Detail |
| Downstream module client link | Client Detail |
| Breadcrumb → Clients | Client List |

Breadcrumb: `Clients / {display_name}`

### Empty State

| Tab | Condition | Message | Action |
|-----|-----------|---------|--------|
| Contacts | No contacts | "No contacts added" | Primary Button → Add Contact |
| Notes | No notes | "No notes yet" | Primary Button → Add Note |
| Activity | No events | "No activity recorded" | — |
| Documents | No files | "No documents uploaded" | Primary Button → Upload Document |

### Success State

| Condition | Feedback |
|-----------|----------|
| Profile loaded | Header shows display name, status chip, owner avatar, and tags |
| Tab switched | Content loads; Skeleton shown during fetch |
| Status changed | Status Chip updates; Activity tab records event; Success Toast |
| Owner reassigned | Avatar updates; Success Toast |
| Contact added/edited | Contacts tab refreshes; Success Toast |
| Note added | Notes tab refreshes; Success Toast |
| Document uploaded | Documents tab refreshes; Success Toast |

---

## 4. Create Client

### Screen Name

Create Client

### Purpose

Capture a new client account in the workspace. Supports manual entry of organization profile, initial status, owner assignment, and tags.

### Main Components

| Component | Usage | UI System Reference |
|-----------|-------|---------------------|
| **Input** | Display name, legal name, website, phone, email | [§10 Inputs](../../06_UI_SYSTEM.md#inputs) |
| **Textarea** | Address fields | [§10 Textarea](../../06_UI_SYSTEM.md#textarea) |
| **Select** | Industry, country, status, owner | [§10 Select](../../06_UI_SYSTEM.md#select) |
| **Multi Select** | Tag assignment | [§10 Multi Select](../../06_UI_SYSTEM.md#multi-select) |
| **Card** | Form section grouping | [§10 Card](../../06_UI_SYSTEM.md#card) |
| **Breadcrumb** | Navigation context | [§10 Breadcrumb](../../06_UI_SYSTEM.md#breadcrumb) |

Form standards per [UI System §11](../../06_UI_SYSTEM.md#11-form-standards).

### Actions

| Action | Type | Description |
|--------|------|-------------|
| Save Client | Primary Button | Validate and create client record |
| Cancel | Ghost Button | Return to Client List without saving |

### Navigation

| From | To |
|------|----|
| Client List → Create Client | Create Client |
| Client List empty state | Create Client |
| Cancel | Client List |
| Save success | Client Detail |

Breadcrumb: `Clients / New Client`

Container: `container.md` per [Layout System §9](../../06_UI_SYSTEM.md#9-layout-system).

### Empty State

Not applicable — form renders immediately with default values (status: Prospect).

### Success State

| Condition | Feedback |
|-----------|----------|
| Client created | Redirect to Client Detail; Success Toast — "Client created" |
| Validation failure | Inline field errors; focus on first error per [Form Standards §11](../../06_UI_SYSTEM.md#11-form-standards) |

---

## 5. Edit Client

### Screen Name

Edit Client

### Purpose

Update an existing client account profile — organization details, status, owner, tags, and custom field values.

### Main Components

Same component set as [Create Client](#4-create-client), pre-populated with existing client data.

Additional: custom field inputs rendered dynamically from workspace field definitions in the [`settings`](../settings/) module.

### Actions

| Action | Type | Description |
|--------|------|-------------|
| Save Changes | Primary Button | Validate and update client record |
| Cancel | Ghost Button | Return to Client Detail without saving |

### Navigation

| From | To |
|------|----|
| Client Detail → Edit Client | Edit Client |
| Cancel | Client Detail |
| Save success | Client Detail |

Breadcrumb: `Clients / {display_name} / Edit`

Container: `container.md`

### Empty State

Not applicable — form pre-populated from existing record. Loader shown while fetching client data.

### Success State

| Condition | Feedback |
|-----------|----------|
| Client updated | Redirect to Client Detail; Success Toast — "Client updated" |
| Validation failure | Inline field errors; form-level Alert for server errors |

---

## 6. Client Import

### Screen Name

Client Import

### Purpose

Bulk import client accounts from a CSV file. Guides the user through file upload, column mapping, validation preview, and import execution.

### Main Components

| Component | Usage | UI System Reference |
|-----------|-------|---------------------|
| **File Upload** | CSV file selection and drag-and-drop | [§10 File Upload](../../06_UI_SYSTEM.md#file-upload) |
| **Table** | Preview of mapped rows with validation status | [§10 Table](../../06_UI_SYSTEM.md#table) |
| **Select** | Column-to-field mapping dropdowns | [§10 Select](../../06_UI_SYSTEM.md#select) |
| **Alert** | Validation summary and error details | [§10 Alert](../../06_UI_SYSTEM.md#alert) |
| **Status Chip** | Row validation result (valid, warning, error) | [§10 Status Chip](../../06_UI_SYSTEM.md#status-chip) |
| **Loader** | Import processing indicator | [§10 Loader](../../06_UI_SYSTEM.md#loader) |
| **Breadcrumb** | Navigation context | [§10 Breadcrumb](../../06_UI_SYSTEM.md#breadcrumb) |

### Actions

| Action | Type | Description |
|--------|------|-------------|
| Upload file | File Upload | Select or drag CSV file |
| Map columns | Select | Match CSV columns to client fields |
| Preview import | Secondary Button | Validate rows and display preview table |
| Confirm import | Primary Button | Execute bulk import |
| Cancel | Ghost Button | Return to Client List |
| Download error report | Ghost Button | Export failed rows after import |

### Navigation

| From | To |
|------|----|
| Client List → Import Clients | Client Import |
| Cancel | Client List |
| Import success | Client List |

Breadcrumb: `Clients / Import`

Container: `container.lg`

### Empty State

| Step | Message | Action |
|------|---------|--------|
| Before upload | "Upload a CSV file to import clients" | File Upload drop zone active |

### Success State

| Condition | Feedback |
|-----------|----------|
| Preview ready | Table shows mapped rows with validation status chips |
| Import complete | Success Toast with import summary (created, skipped, failed); navigate to Client List |
| Partial failure | Warning Toast with count; Ghost Button to download error report |

---

## 7. Contact Form

### Screen Name

Contact Form

### Purpose

Create or edit a contact person linked to a client account. Presented as a drawer overlay on the Client Detail screen.

### Main Components

| Component | Usage | UI System Reference |
|-----------|-------|---------------------|
| **Drawer** | Overlay panel | [§10 Drawer](../../06_UI_SYSTEM.md#drawer) |
| **Input** | First name, last name, job title, email, phone | [§10 Inputs](../../06_UI_SYSTEM.md#inputs) |
| **Textarea** | Contact notes | [§10 Textarea](../../06_UI_SYSTEM.md#textarea) |
| **Checkbox** | Primary contact, billing contact flags | [§10 Checkbox](../../06_UI_SYSTEM.md#checkbox) |

Drawer width: `md` (400px) per [UI System §10](../../06_UI_SYSTEM.md#drawer).

### Actions

| Action | Type | Description |
|--------|------|-------------|
| Save Contact | Primary Button | Validate and create or update contact |
| Cancel | Ghost Button | Close drawer without saving |

### Navigation

| From | To |
|------|----|
| Client Detail → Add Contact | Contact Form (create) |
| Client Detail → Edit contact | Contact Form (edit) |
| Save or Cancel | Client Detail (Contacts tab) |

### Empty State

Not applicable — form renders empty (create) or pre-populated (edit).

### Success State

| Condition | Feedback |
|-----------|----------|
| Contact saved | Drawer closes; Contacts tab refreshes; Success Toast |
| Validation failure | Inline field errors within drawer |

---

## 8. Note Form

### Screen Name

Note Form

### Purpose

Create or edit an internal note on a client record. Presented as a drawer overlay on the Client Detail screen.

### Main Components

| Component | Usage | UI System Reference |
|-----------|-------|---------------------|
| **Drawer** | Overlay panel | [§10 Drawer](../../06_UI_SYSTEM.md#drawer) |
| **Input** | Optional note title | [§10 Inputs](../../06_UI_SYSTEM.md#inputs) |
| **Textarea** | Note body content | [§10 Textarea](../../06_UI_SYSTEM.md#textarea) |
| **Switch** | Pin note toggle | [§10 Switch](../../06_UI_SYSTEM.md#switch) |

Drawer width: `md` (400px).

### Actions

| Action | Type | Description |
|--------|------|-------------|
| Save Note | Primary Button | Validate and create or update note |
| Cancel | Ghost Button | Close drawer without saving |

### Navigation

| From | To |
|------|----|
| Client Detail → Add Note | Note Form (create) |
| Client Detail → Edit note | Note Form (edit) |
| Save or Cancel | Client Detail (Notes tab) |

### Empty State

Not applicable — textarea empty (create) or pre-populated (edit).

### Success State

| Condition | Feedback |
|-----------|----------|
| Note saved | Drawer closes; Notes tab refreshes; Success Toast |
| Validation failure | Inline error on body field |

---

## 9. Document Upload

### Screen Name

Document Upload

### Purpose

Attach a file to a client record. Presented as a drawer overlay on the Client Detail screen. Binary upload follows the pre-signed URL flow defined in [Architecture §12](../../03_ARCHITECTURE.md#12-file-storage-architecture).

### Main Components

| Component | Usage | UI System Reference |
|-----------|-------|---------------------|
| **Drawer** | Overlay panel | [§10 Drawer](../../06_UI_SYSTEM.md#drawer) |
| **File Upload** | Drag-and-drop upload zone with progress | [§10 File Upload](../../06_UI_SYSTEM.md#file-upload) |
| **Input** | File description | [§10 Inputs](../../06_UI_SYSTEM.md#inputs) |
| **Select** | Document type classification | [§10 Select](../../06_UI_SYSTEM.md#select) |
| **Loader** | Upload progress indicator | [§10 Loader](../../06_UI_SYSTEM.md#loader) |

Drawer width: `md` (400px).

### Actions

| Action | Type | Description |
|--------|------|-------------|
| Upload | Primary Button | Initiate file upload after file selected |
| Cancel | Ghost Button | Close drawer; discard in-progress upload |

### Navigation

| From | To |
|------|----|
| Client Detail → Upload Document | Document Upload |
| Upload success or Cancel | Client Detail (Documents tab) |

### Empty State

| Condition | Message | Action |
|-----------|---------|--------|
| No file selected | "Drag a file here or click to browse" | File Upload drop zone active |

### Success State

| Condition | Feedback |
|-----------|----------|
| Upload complete | Drawer closes; Documents tab refreshes; Success Toast |
| Upload failed | Error Toast with retry guidance; file remains in upload zone |
| Invalid file type or size | Inline Alert within drawer per [File Upload standards](../../06_UI_SYSTEM.md#file-upload) |

---

## 10. Archive Client Confirmation

### Screen Name

Archive Client Confirmation

### Purpose

Confirm archival of a client account. Warns the user about downstream impact and requires explicit confirmation for irreversible-seeming action (recoverable within retention window).

### Main Components

| Component | Usage | UI System Reference |
|-----------|-------|---------------------|
| **Modal** | Confirmation dialog | [§10 Modal](../../06_UI_SYSTEM.md#modal) |
| **Alert** | Warning about downstream linked records | [§10 Alert](../../06_UI_SYSTEM.md#alert) |

Modal size: `sm` per [UI System §10](../../06_UI_SYSTEM.md#modal).

### Actions

| Action | Type | Description |
|--------|------|-------------|
| Archive Client | Danger Button | Execute soft-delete on client and dependents |
| Cancel | Secondary Button | Close modal without action |

### Navigation

| From | To |
|------|----|
| Client Detail → Archive Client | Archive Client Confirmation |
| Client List bulk archive | Archive Client Confirmation |
| Archive success | Client List or Archived Client List |
| Cancel | Previous screen |

### Empty State

Not applicable — modal renders with client name and impact summary.

### Success State

| Condition | Feedback |
|-----------|----------|
| Client archived | Modal closes; Success Toast — "Client archived"; redirect to Client List |
| Archive blocked | Error Toast — linked active records prevent archival |

---

## 11. Remove Contact Confirmation

### Screen Name

Remove Contact Confirmation

### Purpose

Confirm removal of a contact from a client account. Prevents accidental deletion of stakeholder records.

### Main Components

| Component | Usage | UI System Reference |
|-----------|-------|---------------------|
| **Modal** | Confirmation dialog | [§10 Modal](../../06_UI_SYSTEM.md#modal) |

Modal size: `sm`.

### Actions

| Action | Type | Description |
|--------|------|-------------|
| Remove Contact | Danger Button | Soft-delete contact record |
| Cancel | Secondary Button | Close modal without action |

### Navigation

| From | To |
|------|----|
| Client Detail → Remove contact | Remove Contact Confirmation |
| Remove success | Client Detail (Contacts tab) |
| Cancel | Client Detail (Contacts tab) |

### Empty State

Not applicable — modal renders with contact name.

### Success State

| Condition | Feedback |
|-----------|----------|
| Contact removed | Modal closes; Contacts tab refreshes; Success Toast |
| Removal blocked | Error Toast — contact is primary and replacement required |

---

## Navigation Summary

| Location | Placement | UI System Reference |
|----------|-----------|---------------------|
| Sidebar primary nav | "Clients" entry with icon | [§9 Layout — Sidebar](../../06_UI_SYSTEM.md#sidebar-behavior) |
| Module default route | Client List | — |
| Archived clients | Secondary link below Client List or filter tab | — |
| Cross-module links | Client name links from Projects, Finance, Sales → Client Detail | — |
| Breadcrumb root | "Clients" on all module screens | [§10 Breadcrumb](../../06_UI_SYSTEM.md#breadcrumb) |

---

## Responsive Behavior

All screens follow module-agnostic responsive rules in [UI System §19](../../06_UI_SYSTEM.md#19-responsive-rules).

| Screen | Mobile Adaptation |
|--------|-------------------|
| Client List | Table transforms to card list; filters in Drawer |
| Client Detail | Tabs become scrollable; profile summary stacks vertically |
| Create / Edit Client | Single-column form; sticky bottom Save action bar |
| Client Import | Preview table becomes card list |
| Contact / Note / Document drawers | Full-screen sheet on mobile per [§19 Mobile](../../06_UI_SYSTEM.md#mobile--768px) |

---

## Related Documents

| Document | Path |
|----------|------|
| Module overview | [`README.md`](README.md) |
| Data model | [`database.md`](database.md) |
| UI system | [`../../06_UI_SYSTEM.md`](../../06_UI_SYSTEM.md) |
| Workflows | [`workflows.md`](workflows.md) |
| Permissions | [`permissions.md`](permissions.md) |
