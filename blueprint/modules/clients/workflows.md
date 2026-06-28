# Clients — Workflow Specification

**Module:** `clients`  
**Status:** Draft  
**Owner:** Product  
**Version:** 1.0

---

## Purpose

This document defines the **business workflows** for the Clients module — the triggers, preconditions, steps, outcomes, and exceptions for each significant process.

Lifecycle states and data constraints are defined in [`database.md`](database.md). Screen interactions are defined in [`screens.md`](screens.md). Module scope and actors are defined in [`README.md`](README.md).

---

## Workflow Index

| Workflow | Primary Actor |
|----------|---------------|
| [Create Client](#create-client) | Sales Representative, Account Manager |
| [Edit Client](#edit-client) | Account Manager |
| [Archive Client](#archive-client) | Account Manager, Agency Owner |
| [Restore Client](#restore-client) | Account Manager, Agency Owner |
| [Assign Owner](#assign-owner) | Agency Owner, Account Manager |
| [Add Contact](#add-contact) | Account Manager, Sales Representative |
| [Add Service](#add-service) | Account Manager, Agency Owner |
| [Client Onboarding](#client-onboarding) | Account Manager |

---

## Create Client

### Trigger

A user needs to register a new client organization in the workspace — before a contract is signed, at deal close, or during data migration.

Common trigger events:

- User selects **Create Client** from the Client List
- A closed deal in the [`sales`](../sales/) module initiates client record creation
- Bulk import via the Client Import screen

### Preconditions

- User is authenticated and has an active workspace selected
- User holds permission to create client records
- Workspace is in an active (non-suspended) state

### Steps

1. User opens the Create Client screen
2. User enters the client display name (required)
3. User optionally provides profile details — legal name, industry, website, contact information, address
4. User sets initial status (defaults to **Prospect** if not specified)
5. User optionally assigns an account owner and tags
6. User submits the form
7. System validates required fields and uniqueness of display name within the workspace
8. System creates the client record with audit attribution
9. System writes a Client Activity entry and emits a `ClientCreated` domain event

### Result

- A new client record exists in the workspace with status **Prospect** (or user-selected status)
- User is directed to the Client Detail screen
- Downstream modules may react to the `ClientCreated` event (notifications, automations)

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Display name already exists among active clients | Submission rejected; user prompted to review potential duplicate |
| Required fields missing or invalid | Submission rejected; inline validation errors displayed |
| User lacks create permission | Action blocked; access denied message shown |
| Workspace is suspended | Write operations blocked platform-wide |
| Sales conversion with incomplete deal data | Client created with available data; user prompted to complete profile on Client Detail |

---

## Edit Client

### Trigger

A user needs to update an existing client profile — corrected information, status change, tag assignment, or custom field update.

Common trigger events:

- User selects **Edit Client** from the Client Detail screen
- User changes status or owner inline on Client Detail

### Preconditions

- Client record exists and is not archived (soft-deleted)
- User is authenticated with an active workspace
- User holds permission to edit client records

### Steps

1. User opens the Edit Client screen or initiates an inline field change on Client Detail
2. System loads the current client profile including custom field values
3. User modifies one or more fields — profile details, status, owner, tags, custom attributes
4. User submits changes
5. System validates field formats and business rules defined in [`database.md`](database.md)
6. System persists changes with audit attribution
7. If status changed, system validates the transition is permitted and writes a status-change activity entry
8. System emits a `ClientUpdated` or `ClientStatusChanged` domain event as appropriate

### Result

- Client record reflects updated values
- Activity timeline records the change
- User returns to Client Detail with confirmation feedback

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Client is archived | Edit blocked; user directed to Restore Client workflow if recovery is intended |
| Invalid status transition | Change rejected; current status retained; user notified of valid transitions |
| Display name conflicts with another active client | Change rejected; duplicate warning displayed |
| Owner reference is not a workspace member | Change rejected; user prompted to select a valid owner |
| Concurrent edit by another user | Last write wins with audit trail; optional conflict notice if timestamps diverge significantly |
| User lacks edit permission | Action blocked; access denied |

---

## Archive Client

### Trigger

A user needs to remove a client from active use — relationship ended, duplicate record, or mistaken creation — while retaining historical data.

Common trigger events:

- User selects **Archive Client** from Client Detail
- User executes bulk archive from Client List

### Preconditions

- Client record exists and is not already archived
- User holds permission to archive client records
- User is authenticated with an active workspace

### Steps

1. User initiates archive action
2. System presents confirmation dialog summarizing downstream impact (active projects, open invoices, running campaigns)
3. User confirms archival intent
4. System checks for blocking conditions — active downstream records that prevent archival
5. If unblocked, system sets client status to **Archived** and applies soft-delete per [`database.md`](database.md)
6. System soft-deletes active contacts and document references linked to the client
7. System writes a Client Activity entry and emits a `ClientArchived` domain event
8. Downstream modules receive notification to pause or complete in-flight work as applicable

### Result

- Client no longer appears on the Client List
- Client appears on the Archived Client List with archive timestamp
- Activity history and audit log entries are retained
- Associated contacts and documents are soft-deleted

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Active projects exist on the client | Archival blocked; user notified to close or reassign projects first |
| Open unpaid invoices exist | Archival blocked; user notified to resolve billing in [`finance`](../finance/) |
| Running campaigns exist | Archival blocked; user notified to pause campaigns in [`operations`](../operations/) |
| User cancels confirmation | No changes made |
| User lacks archive permission | Action blocked; access denied |
| Bulk archive with mixed results | Clients without blockers are archived; blocked clients reported with reasons |

---

## Restore Client

### Trigger

A user needs to recover an archived client within the soft-delete retention window.

Common trigger events:

- User selects **Restore** from the Archived Client List
- User selects **Restore** from an archived Client Detail view

### Preconditions

- Client record is archived (soft-deleted) and within the retention window defined in [`database.md`](database.md)
- User holds permission to restore client records
- User is authenticated with an active workspace

### Steps

1. User initiates restore action from Archived Client List or Client Detail
2. System verifies the client is within the recoverable retention period
3. System clears soft-delete columns on the client record
4. System restores previously soft-deleted contacts and document references associated with the client
5. System sets client status to **Active** (or prompts user to select **Active** or **Inactive**)
6. System writes a Client Activity entry and emits a `ClientRestored` domain event

### Result

- Client reappears on the Client List with restored status
- Previously associated contacts and documents are accessible again
- Downstream modules may re-link to the restored client record

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Retention window expired | Restore blocked; record eligible for permanent purge only via platform administration |
| Display name now conflicts with another active client created after archival | Restore blocked; user prompted to rename before recovery |
| User lacks restore permission | Action blocked; access denied |
| Client was archived due to tenant deprovisioning | Restore unavailable; workspace no longer active |

---

## Assign Owner

### Trigger

A user needs to designate or reassign the internal team member responsible for a client relationship.

Common trigger events:

- User selects a new owner on Client Detail or Edit Client
- Agency Owner redistributes accounts during team restructuring
- Automated assignment via [`automation`](../automation/) on client creation

### Preconditions

- Client record exists and is not archived
- Proposed owner is an active member of the current workspace
- User holds permission to assign or reassign client ownership

### Steps

1. User opens owner assignment control on Client Detail or Edit Client
2. System presents a list of eligible workspace members
3. User selects the new owner
4. System validates the selected user is a workspace member
5. System updates the client owner reference with audit attribution
6. System writes a Client Activity entry recording the ownership change
7. System emits a `ClientOwnerChanged` domain event
8. Notification delivered to the new owner via the Notifications module

### Result

- Client record reflects the new owner
- Previous owner remains in activity history for audit purposes
- New owner receives notification of assignment

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Selected user is not a workspace member | Assignment rejected; user prompted to select a valid member |
| Client is archived | Assignment blocked until client is restored |
| User lacks assign permission | Action blocked; access denied |
| Same owner selected | No-op; no activity entry written |
| New owner lacks permission to view clients | Assignment rejected; user notified of permission conflict |

---

## Add Contact

### Trigger

A user needs to register a person associated with a client organization — stakeholder, decision-maker, or billing liaison.

Common trigger events:

- User selects **Add Contact** from the Contacts tab on Client Detail
- Client Onboarding workflow reaches the contact capture step

### Preconditions

- Parent client record exists and is not archived
- User holds permission to manage contacts on the client record

### Steps

1. User opens the Contact Form from Client Detail
2. User enters contact name (required) and optional details — job title, email, phone, notes
3. User optionally designates the contact as primary or billing contact
4. User submits the form
5. System validates required fields and email format if provided
6. If primary contact flag is set, system clears primary designation from any existing primary contact on the same client
7. System creates the contact record linked to the client with audit attribution
8. System writes a Client Activity entry on the parent client

### Result

- New contact appears on the Client Detail Contacts tab
- If designated primary, contact is marked as the client's primary point of contact
- Activity timeline records the addition

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Parent client is archived | Action blocked; user directed to restore client first |
| First name missing | Submission rejected; validation error displayed |
| Invalid email format | Submission rejected; inline error on email field |
| User lacks contact management permission | Action blocked; access denied |
| Duplicate contact detected (same name and email on same client) | Warning displayed; user may proceed or cancel |

---

## Add Service

### Trigger

A user needs to record which agency service offering a client has contracted — establishing the commercial relationship scope that drives delivery, operations, and billing setup.

Common trigger events:

- Account Manager records services after contract signing
- Client Onboarding workflow reaches the service assignment step
- Sales handoff from closed deal includes contracted service lines

### Preconditions

- Client record exists with status **Active** or **Prospect** (pre-contract service intent)
- Workspace service catalog is configured in [`settings`](../settings/)
- User holds permission to manage client service assignments

### Steps

1. User opens service assignment on Client Detail or during Client Onboarding
2. System presents the workspace service catalog — available service lines (e.g., SEO, paid media, social management, content production)
3. User selects one or more services to associate with the client
4. User optionally sets service-specific attributes — start date, contract tier, monthly retainer indicator
5. User confirms assignment
6. System validates selected services exist in the workspace catalog
7. System records the service association on the client record
8. System writes a Client Activity entry and emits a `ClientServiceAdded` domain event
9. Downstream modules react as applicable — [`projects`](../projects/) may initiate setup, [`finance`](../finance/) may create billing profile, [`operations`](../operations/) may prepare campaign templates

### Result

- Client profile reflects contracted services
- Service assignment visible on Client Detail and available for filtering on Client List
- Downstream teams notified of new service scope via domain events and notifications

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Client is archived | Action blocked |
| Selected service no longer exists in catalog | Assignment rejected; user prompted to refresh catalog |
| Service already assigned to client | Duplicate skipped or user prompted to update existing assignment |
| Client status is **Inactive** | Warning displayed; user must confirm intent to assign services to inactive account |
| User lacks service assignment permission | Action blocked; access denied |
| Workspace service catalog is empty | Action blocked; user directed to configure catalog in Settings |

---

## Client Onboarding

### Trigger

A new client transitions from signed contract to active delivery — requiring a structured intake process to prepare the account for work across the agency.

Common trigger events:

- Client status changed from **Prospect** to **Active**
- Account Manager initiates onboarding from Client Detail
- Automated trigger from [`automation`](../automation/) on deal close in [`sales`](../sales/)

### Preconditions

- Client record exists with status **Active** (or transitioning to Active during the workflow)
- User holds permission to manage client onboarding
- Account owner is assigned (recommended; warning if missing)

### Steps

1. User initiates Client Onboarding from Client Detail or accepts automated onboarding prompt after status activation
2. **Profile completion** — User verifies or enters organization profile — legal name, industry, address, website
3. **Owner confirmation** — User confirms or assigns the account owner
4. **Contact capture** — User adds at least one contact with a designated primary contact
5. **Service assignment** — User records contracted services from the workspace catalog (see [Add Service](#add-service))
6. **Document upload** — User attaches signed contract or statement of work to the client record
7. **Internal note** — User adds an onboarding summary note with kickoff context and special requirements
8. **Tag assignment** — User applies relevant segmentation tags (industry, tier, priority)
9. User marks onboarding as complete
10. System validates minimum onboarding criteria — primary contact, at least one service, contract document
11. System records onboarding completion timestamp on the client record
12. System writes Client Activity entry and emits a `ClientOnboardingCompleted` domain event
13. Downstream modules initiate setup — project creation prompt, billing profile setup, campaign planning

### Result

- Client record meets minimum completeness thresholds for delivery readiness
- Account is visible to project, finance, and operations teams with full context
- Onboarding completion recorded on activity timeline
- Success metric **time to onboard** clock stops at completion timestamp

### Exceptions

| Condition | Outcome |
|-----------|---------|
| Primary contact not added | Onboarding cannot be marked complete; user prompted to add contact |
| No service assigned | Onboarding cannot be marked complete; user prompted to assign services |
| Contract document not uploaded | Warning displayed; user may complete with acknowledgment or upload document |
| Owner not assigned | Warning displayed; user may complete with acknowledgment or assign owner |
| Onboarding abandoned mid-process | Partial progress saved; client remains Active with incomplete onboarding flag visible on Client Detail |
| User lacks onboarding permission | Action blocked; access denied |
| Duplicate client detected during onboarding | User prompted to merge or archive duplicate before completing |

---

## Cross-Workflow Dependencies

| Workflow | Depends On | Enables |
|----------|------------|---------|
| Create Client | — | Edit Client, Add Contact, Client Onboarding |
| Edit Client | Create Client | All other workflows |
| Assign Owner | Create Client | Client Onboarding |
| Add Contact | Create Client | Client Onboarding |
| Add Service | Create Client | Client Onboarding, downstream project and billing setup |
| Client Onboarding | Create Client, Assign Owner, Add Contact, Add Service | Projects, Finance, Operations module workflows |
| Archive Client | Create Client | Restore Client |
| Restore Client | Archive Client | Edit Client, all active workflows |

---

## Related Documents

| Document | Path |
|----------|------|
| Module overview | [`README.md`](README.md) |
| Data model & lifecycle | [`database.md`](database.md) |
| Screens | [`screens.md`](screens.md) |
| Permissions | [`permissions.md`](permissions.md) |
| Automations | [`automations.md`](automations.md) |
