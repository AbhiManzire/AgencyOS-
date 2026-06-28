# Clients — Acceptance Criteria

**Module:** `clients`  
**Status:** Draft  
**Owner:** Product & QA  
**Version:** 1.0

---

## Purpose

This document defines **QA acceptance criteria** for the Clients module. Each criterion is testable, unambiguous, and traceable to module specifications in [`README.md`](README.md), [`database.md`](database.md), [`screens.md`](screens.md), and [`workflows.md`](workflows.md).

Priority levels:

| Priority | Meaning |
|----------|---------|
| **Must** | Release blocker — must pass before module is accepted |
| **Should** | Expected behavior — should pass; waiver requires product approval |
| **Could** | Desirable — pass if feasible within release scope |

---

## Functional Acceptance

### Client List

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-F01 | Given an authenticated user with client read permission, when they navigate to the Client List, then all non-archived clients in the active workspace are displayed in a paginated table | Must |
| AC-F02 | Given the Client List is loaded, when the user clicks a client row, then they are navigated to that client's Client Detail screen | Must |
| AC-F03 | Given clients exist in the workspace, when the user searches by display name, then only matching clients are returned | Must |
| AC-F04 | Given clients with varied statuses exist, when the user filters by status, then only clients with the selected status are displayed | Must |
| AC-F05 | Given clients with assigned owners exist, when the user filters by owner, then only clients owned by the selected user are displayed | Must |
| AC-F06 | Given clients with tags exist, when the user filters by one or more tags, then only clients with all selected tags are displayed | Must |
| AC-F07 | Given active filters are applied, when the user clicks Clear filters, then all filters are removed and the full list is restored | Must |
| AC-F08 | Given the workspace has no clients, when the user opens the Client List, then an empty state is displayed with a Create Client action | Must |
| AC-F09 | Given filters produce no matches, when results load, then a no-results empty state is displayed with a Clear filters action | Must |
| AC-F10 | Given the user selects one or more clients, when they initiate bulk archive, then the Archive Client Confirmation modal is displayed | Must |

### Create Client

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-F11 | Given a user with create permission, when they submit a valid Create Client form with a display name, then a new client record is created with default status Prospect | Must |
| AC-F12 | Given a client is created successfully, when the operation completes, then the user is redirected to Client Detail and a success notification is displayed | Must |
| AC-F13 | Given a client is created, when the record is persisted, then a Client Activity entry for creation is written to the activity timeline | Must |
| AC-F14 | Given optional fields are provided on Create Client, when the record is saved, then all provided profile fields are persisted and visible on Client Detail | Should |

### Edit Client

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-F15 | Given an active client exists, when a user with edit permission saves valid changes on Edit Client, then the client profile reflects updated values on Client Detail | Must |
| AC-F16 | Given a user changes client status on Edit Client, when the transition is valid per lifecycle rules, then the new status is persisted and recorded on the activity timeline | Must |
| AC-F17 | Given a user edits a client, when changes are saved, then `updated_at` and `updated_by_user_id` reflect the modifying user and timestamp | Must |

### Client Detail

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-F18 | Given a client exists, when the user opens Client Detail, then the profile summary displays display name, status chip, owner, and tags | Must |
| AC-F19 | Given a client has contacts, notes, activity, and documents, when the user switches tabs, then the corresponding content loads for each tab | Must |
| AC-F20 | Given a client has no contacts, when the Contacts tab is opened, then an empty state with Add Contact action is displayed | Must |
| AC-F21 | Given a client has no notes, when the Notes tab is opened, then an empty state with Add Note action is displayed | Must |
| AC-F22 | Given a client has no documents, when the Documents tab is opened, then an empty state with Upload Document action is displayed | Must |
| AC-F23 | Given activity has occurred on a client, when the Activity tab is opened, then events are displayed in reverse chronological order | Must |

### Archive and Restore

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-F24 | Given an active client with no blocking downstream records, when the user confirms archive, then the client is removed from Client List and appears on Archived Client List | Must |
| AC-F25 | Given a client is archived, when the user restores it within the retention window, then the client reappears on Client List with status Active or user-selected status | Must |
| AC-F26 | Given a client is archived, when associated contacts existed before archival, then those contacts are restored when the client is restored | Must |
| AC-F27 | Given a client is archived, when the user opens Client Detail from Archived Client List, then the profile is accessible in read-only mode | Should |

### Contacts

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-F28 | Given an active client, when the user adds a contact with a first name via Contact Form, then the contact appears on the Contacts tab | Must |
| AC-F29 | Given a contact is designated as primary, when saved, then only one contact on the client is marked as primary | Must |
| AC-F30 | Given a contact exists, when the user edits it via Contact Form, then updated values are reflected on the Contacts tab | Must |
| AC-F31 | Given a contact exists, when the user confirms removal, then the contact is soft-deleted and no longer appears on the Contacts tab | Must |

### Notes and Documents

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-F32 | Given an active client, when the user adds a note with body content, then the note appears on the Notes tab | Must |
| AC-F33 | Given an active client, when the user uploads a permitted file type, then the document appears on the Documents tab with correct file name and upload metadata | Must |
| AC-F34 | Given a document exists, when the user downloads it, then the correct file content is retrieved | Must |
| AC-F35 | Given a user pins a note, when the Notes tab is loaded, then pinned notes appear prominently | Should |

### Owner and Service Assignment

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-F36 | Given an active client, when a user with assign permission selects a workspace member as owner, then the owner is updated and an activity entry is written | Must |
| AC-F37 | Given an owner is assigned, when the assignment completes, then the new owner receives a notification | Should |
| AC-F38 | Given an active client and a configured service catalog, when the user assigns a service, then the service appears on Client Detail and is available as a list filter | Must |

### Client Onboarding

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-F39 | Given an active client, when the user completes all required onboarding steps (primary contact, at least one service), then onboarding is marked complete with a recorded timestamp | Must |
| AC-F40 | Given required onboarding criteria are not met, when the user attempts to mark onboarding complete, then completion is blocked with guidance on missing steps | Must |
| AC-F41 | Given onboarding is completed, when Client Detail is viewed, then an onboarding-complete indicator is visible | Should |

### Import and Export

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-F42 | Given a valid CSV file, when the user completes column mapping and confirms import, then valid rows are created as client records | Must |
| AC-F43 | Given a CSV contains invalid rows, when import completes, then valid rows are created and invalid rows are reported in an error summary | Must |
| AC-F44 | Given filtered clients exist on Client List, when the user exports CSV, then the export reflects the current filter and sort state | Must |
| AC-F45 | Given a large export is requested, when processing begins, then the user receives a progress notification and download when complete | Should |

---

## Validation Rules

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-V01 | When a client is submitted without a display name, then submission is rejected with a field-level error | Must |
| AC-V02 | When a client display name duplicates an active client in the same workspace, then submission is rejected with a duplicate warning | Must |
| AC-V03 | When an invalid email format is entered on client or contact profile, then submission is rejected with a format error | Must |
| AC-V04 | When an invalid URL is entered for website, then submission is rejected with a format error | Must |
| AC-V05 | When an invalid status transition is attempted, then the change is rejected and valid transitions are communicated to the user | Must |
| AC-V06 | When a contact is submitted without a first name, then submission is rejected with a field-level error | Must |
| AC-V07 | When a note is submitted with an empty body, then submission is rejected with a field-level error | Must |
| AC-V08 | When a file exceeding the workspace size limit is uploaded, then upload is rejected before persistence | Must |
| AC-V09 | When a file with a disallowed MIME type is uploaded, then upload is rejected with a type error | Must |
| AC-V10 | When an owner is assigned who is not a member of the workspace, then assignment is rejected | Must |
| AC-V11 | When a custom field value does not match its field definition type, then submission is rejected with a field-level error | Must |
| AC-V12 | When a tag name exceeds 50 characters, then tag creation is rejected | Should |
| AC-V13 | When a country code is provided, then only valid ISO 3166-1 alpha-2 codes are accepted | Should |

---

## Permission Checks

Roles referenced below align with primary users defined in [`README.md`](README.md). Detailed permission keys are defined in [`permissions.md`](permissions.md).

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-P01 | Given a user without client read permission, when they navigate to Client List, then access is denied | Must |
| AC-P02 | Given a user without create permission, when they attempt to open Create Client, then access is denied and the Create Client action is not visible | Must |
| AC-P03 | Given a user without edit permission, when they attempt to open Edit Client, then access is denied | Must |
| AC-P04 | Given a user without archive permission, when they attempt to archive a client, then the action is blocked | Must |
| AC-P05 | Given a user without restore permission, when they attempt to restore an archived client, then the action is blocked | Must |
| AC-P06 | Given a user without contact management permission, when they attempt to add or edit a contact, then the action is blocked | Must |
| AC-P07 | Given a user without assign permission, when they attempt to change client owner, then the action is blocked | Must |
| AC-P08 | Given a user without import permission, when they attempt to open Client Import, then access is denied | Must |
| AC-P09 | Given a user without export permission, when they attempt to export CSV, then the action is blocked | Must |
| AC-P10 | Given a user belongs to Workspace A, when they attempt to access a client from Workspace B via direct URL, then access is denied | Must |
| AC-P11 | Given a user with read-only client permission, when they view Client Detail, then all mutation actions are hidden or disabled | Must |
| AC-P12 | Given a platform administrator uses elevated cross-tenant access, when the action occurs, then it is recorded in the platform audit log | Must |

---

## Error Handling

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-E01 | When a server error occurs during client creation, then the user sees a safe error message and no partial client record is created | Must |
| AC-E02 | When a network failure occurs during form submission, then the user is notified and may retry without data loss on the form | Must |
| AC-E03 | When archive is blocked due to active downstream records, then the user sees a specific message identifying the blocking condition | Must |
| AC-E04 | When import fails entirely, then no partial records are created and the user receives an error summary | Must |
| AC-E05 | When document upload fails after file selection, then the user sees an error toast with retry guidance and the drawer remains open | Must |
| AC-E06 | When restore is attempted outside the retention window, then the user sees a clear message that recovery is no longer available | Must |
| AC-E07 | When a validation error occurs on form submit, then focus moves to the first invalid field | Must |
| AC-E08 | When multiple validation errors exist, then all field errors are displayed simultaneously and a form-level error summary is shown | Should |
| AC-E09 | When an unauthorized action is attempted, then the user sees an access denied message — not a generic server error | Must |
| AC-E10 | When an export fails, then the user receives an error notification — not a silent failure | Should |
| AC-E11 | No error message displayed to the user contains stack traces, SQL details, or internal identifiers | Must |

---

## Edge Cases

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-X01 | Given a client display name matches a soft-deleted client, when a new client is created with that name, then creation succeeds | Must |
| AC-X02 | Given a user sets a new primary contact, when saved, then the previous primary contact is automatically demoted | Must |
| AC-X03 | Given bulk archive selects clients with mixed blocking conditions, when confirmed, then non-blocked clients are archived and blocked clients are reported individually | Must |
| AC-X04 | Given a client is archived and restored, when the display name now conflicts with an active client, then restore is blocked with a rename prompt | Must |
| AC-X05 | Given onboarding is started but not completed, when the user navigates away, then partial progress is preserved on return to Client Detail | Should |
| AC-X06 | Given a duplicate contact (same name and email) is added, when the user submits, then a duplicate warning is displayed and the user may proceed or cancel | Should |
| AC-X07 | Given a service is already assigned to a client, when the same service is assigned again, then no duplicate assignment is created | Must |
| AC-X08 | Given a tag already applied to a client is applied again, then the operation is a no-op | Must |
| AC-X09 | Given Client Import CSV contains duplicate display names within the file, then duplicates are flagged in preview and rejected on import | Must |
| AC-X10 | Given a workspace is suspended, when a user attempts any write operation in the Clients module, then the operation is blocked | Must |
| AC-X11 | Given a client with status Inactive, when the user assigns a service, then a confirmation warning is displayed before proceeding | Should |
| AC-X12 | Given the service catalog is empty, when the user attempts to assign a service, then the action is blocked with guidance to configure the catalog in Settings | Must |
| AC-X13 | Given a user switches workspace while on Client Detail, when the new workspace loads, then the client from the previous workspace is not accessible | Must |
| AC-X14 | Given an archived client is viewed, when the user attempts to add a contact or note, then the action is blocked | Must |

---

## Performance Expectations

Thresholds align with platform performance standards in [`blueprint/05_CODING_STANDARDS.md`](../../05_CODING_STANDARDS.md) and [`blueprint/04_DATABASE_RULES.md`](../../04_DATABASE_RULES.md).

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-Perf01 | When Client List loads with up to 10,000 clients in the workspace, then the first page renders within 2 seconds at p95 under normal load | Must |
| AC-Perf02 | When the user searches or filters Client List, then results update within 1 second at p95 | Must |
| AC-Perf03 | When Client Detail profile tab loads, then content is visible within 1.5 seconds at p95 | Must |
| AC-Perf04 | When a secondary tab (Contacts, Notes, Activity, Documents) is opened, then content loads within 1.5 seconds at p95 | Must |
| AC-Perf05 | When Create Client or Edit Client is submitted, then the user receives a response within 2 seconds at p95 | Must |
| AC-Perf06 | When Client List paginates, then page transitions complete within 1 second at p95 | Must |
| AC-Perf07 | When a CSV import of up to 1,000 rows is executed, then processing completes within 60 seconds | Should |
| AC-Perf08 | When a document upload of up to 10 MB is initiated, then progress feedback is visible within 500 milliseconds | Must |
| AC-Perf09 | When Client List is loading, then skeleton placeholders are displayed — not a blank screen | Must |
| AC-Perf10 | Client List queries are paginated server-side — the full dataset is never loaded into the browser at once | Must |

---

## Accessibility Checks

Criteria align with WCAG 2.1 AA requirements in [`blueprint/06_UI_SYSTEM.md`](../../06_UI_SYSTEM.md).

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-A01 | All interactive elements on Clients module screens are reachable and operable via keyboard alone | Must |
| AC-A02 | A skip-to-main-content link is available as the first focusable element on all Clients module pages | Must |
| AC-A03 | All form fields on Create Client, Edit Client, Contact Form, and Note Form have associated labels readable by screen readers | Must |
| AC-A04 | Required form fields are indicated by text and `aria-required` — not color alone | Must |
| AC-A05 | Validation errors are announced to screen readers via `aria-live` regions when they appear | Must |
| AC-A06 | Status chips on Client List and Client Detail include text labels — status is not communicated by color alone | Must |
| AC-A07 | All icon-only buttons (row actions, toolbar actions) have accessible names via `aria-label` or visible tooltip on focus | Must |
| AC-A08 | Modal and drawer overlays trap focus while open and return focus to the triggering element on close | Must |
| AC-A09 | Archive Client Confirmation and Remove Contact Confirmation modals are closable via Escape key | Must |
| AC-A10 | Toast notifications use `aria-live="polite"` for success and info; `aria-live="assertive"` for errors | Must |
| AC-A11 | Client List table column headers are associated with their data cells for screen reader navigation | Must |
| AC-A12 | On mobile, all interactive elements meet the 44×44px minimum touch target | Must |
| AC-A13 | Text and interactive element contrast meets WCAG 2.1 AA minimum ratios in both light and dark themes | Must |
| AC-A14 | When `prefers-reduced-motion` is active, skeleton shimmer and transition animations are disabled | Must |
| AC-A15 | Client Import preview table provides a tabular data alternative readable by screen readers when displayed as card list on mobile | Should |

---

## Out of Scope

The following are explicitly **not** covered by this acceptance document:

| Item | Reason |
|------|--------|
| Sales deal conversion automation | Covered by [`sales`](../sales/) module acceptance |
| Project and invoice creation from client | Covered by downstream module acceptance |
| External CRM sync | Future enhancement per [`README.md`](README.md) |
| Client portal access | Future enhancement |
| AI relationship summaries | Future enhancement |
| Client hierarchy (parent–child accounts) | Future enhancement |
| Automated test scripts and CI test suites | Covered by engineering test strategy — not QA acceptance criteria |
| Load testing and stress testing procedures | Covered by infrastructure runbooks |

---

## Traceability

| Acceptance Section | Source Documents |
|--------------------|------------------|
| Functional Acceptance | [`screens.md`](screens.md), [`workflows.md`](workflows.md) |
| Validation Rules | [`database.md`](database.md) |
| Permission Checks | [`README.md`](README.md), [`permissions.md`](permissions.md) |
| Error Handling | [`workflows.md`](workflows.md) — Exceptions sections |
| Edge Cases | [`workflows.md`](workflows.md), [`database.md`](database.md) |
| Performance Expectations | [`04_DATABASE_RULES.md`](../../04_DATABASE_RULES.md), [`05_CODING_STANDARDS.md`](../../05_CODING_STANDARDS.md) |
| Accessibility Checks | [`06_UI_SYSTEM.md`](../../06_UI_SYSTEM.md) |

---

## Related Documents

| Document | Path |
|----------|------|
| Module overview | [`README.md`](README.md) |
| Data model | [`database.md`](database.md) |
| Screens | [`screens.md`](screens.md) |
| Workflows | [`workflows.md`](workflows.md) |
| Permissions | [`permissions.md`](permissions.md) |
