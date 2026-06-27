# AgencyOS Database Rules

**Document ID:** `blueprint/04_DATABASE_RULES.md`  
**Status:** Approved  
**Last Updated:** 2026-06-28  
**Owner:** Engineering Architecture  
**Depends on:** [`blueprint/02_TECH_STACK.md`](02_TECH_STACK.md), [`blueprint/03_ARCHITECTURE.md`](03_ARCHITECTURE.md)

---

## 1. Purpose

This document defines the **database standards and conventions** that every AgencyOS module must follow when designing, querying, and evolving persistent data.

It governs **how data is stored and managed** — not what business entities exist. Module-specific schemas, entity definitions, and relationship models belong in the Database blueprint under `blueprint/database/`.

All backend modules access PostgreSQL exclusively through the repository layer defined in [Architecture §8](03_ARCHITECTURE.md#8-layered-architecture). Direct database access from the frontend, worker scripts outside the application framework, or ad-hoc queries bypassing tenant scoping is prohibited.

Any deviation from these rules requires ADR approval and an update to this document.

---

## 2. Database Philosophy

AgencyOS treats PostgreSQL as the **single system of record** for all durable business state, as defined in [Tech Stack §6](02_TECH_STACK.md#6-database).

### Core Beliefs

| Belief | Application |
|--------|-------------|
| **Relational first** | Structured business entities are modeled relationally with explicit constraints. JSON columns supplement — they do not replace — normalized design. |
| **Tenant isolation is non-negotiable** | Every tenant-scoped operation includes tenant context at the data layer. Isolation is enforced in application code and reinforced by database constraints where feasible. |
| **Schema is a contract** | The database schema is version-controlled, reviewed, and migrated deliberately. Undocumented or manual schema changes are forbidden in all environments. |
| **Simplicity over optimization** | Normalize first; denormalize only with measured justification documented in an ADR or module design note. |
| **Auditability by default** | Business-critical mutations are traceable to an actor, a timestamp, and the prior state. |
| **Soft delete before hard delete** | User-facing deletion preserves recoverability within a defined retention window. |
| **Redis is not durable storage** | Cache, session, and queue data in Redis is ephemeral. Recovery rebuilds Redis state from PostgreSQL — never the reverse. |

### Data Ownership

Each domain module **owns** the tables within its bounded context. Cross-module data access occurs through module service interfaces or domain events — not through direct queries against another module's tables, as defined in [Architecture §5](03_ARCHITECTURE.md#5-module-architecture).

Platform-level tables (tenant registry, audit log, job tracking) are owned by the Admin and shared infrastructure modules.

---

## 3. Multi-Tenant Rules

AgencyOS implements **shared database, shared schema** multi-tenancy with **row-level isolation**, as defined in [Architecture §3](03_ARCHITECTURE.md#3-multi-tenant-architecture).

### Mandatory Tenant Column

Every table that stores tenant-scoped business data **must** include a non-nullable tenant identifier column. The column name is `tenant_id`.

| Rule | Requirement |
|------|-------------|
| **Presence** | All tenant-scoped tables include `tenant_id` |
| **Nullability** | `tenant_id` is `NOT NULL` on all tenant-scoped tables |
| **Type** | Same type as the tenant registry primary key (UUID) |
| **Indexing** | `tenant_id` is the leading column in all composite indexes on tenant-scoped tables |
| **Query scoping** | Every SELECT, UPDATE, and DELETE on tenant-scoped tables includes a `tenant_id` filter |

### Platform-Scoped Tables

Tables that are not tenant-scoped (tenant registry, platform configuration, global reference data) are explicitly designated as **platform-scoped**. They do not include `tenant_id`. Platform-scoped tables require ADR or architecture review before creation — the default assumption is tenant-scoped.

### Cross-Tenant Access

Cross-tenant reads or writes are permitted only for platform administrators operating under an elevated context with mandatory audit logging, as defined in [Architecture §3](03_ARCHITECTURE.md#3-multi-tenant-architecture). Application code must never expose cross-tenant query paths to standard agency users.

### Tenant Lifecycle and Data

| Lifecycle Phase | Data Behavior |
|-----------------|---------------|
| **Provisioning** | Tenant record created in platform-scoped registry; no tenant-scoped data until first module write |
| **Active** | Full read/write within plan limits |
| **Suspended** | Tenant-scoped writes blocked at application layer; data retained |
| **Deprovisioned** | All tenant-scoped rows and associated object storage purged after export window and retention period |

Tenant deprovisioning is a platform-level operation executed as a controlled, auditable batch process — not a cascading delete triggered by a single user action.

### Repository Enforcement

The repository layer is responsible for injecting `tenant_id` into all queries and writes. Service-layer handlers receive tenant context from the request lifecycle — repositories must not accept queries without an explicit tenant context parameter.

---

## 4. Primary Key Strategy

All tables use **UUID** primary keys unless an ADR documents an exception.

### Standard

| Attribute | Rule |
|-----------|------|
| **Type** | `UUID` (PostgreSQL native `uuid` type) |
| **Column name** | `id` |
| **Generation** | Application-generated UUID v7 (time-ordered) preferred; UUID v4 acceptable where ordering is irrelevant |
| **Default** | No database-level random default (`gen_random_uuid()`) for application-owned entities — the application generates IDs to maintain consistency across layers |
| **Uniqueness** | Globally unique within the table; no composite primary keys for entity identity |

### Rationale

UUID primary keys support distributed ID generation without collision, safe exposure in APIs and URLs, and tenant-agnostic uniqueness across the shared schema. Time-ordered UUID v7 preserves insert performance on B-tree indexes compared to random UUID v4.

### Exceptions

| Exception | Condition |
|-----------|-----------|
| **Join / pivot tables** | Composite primary key of `(tenant_id, foreign_key_a, foreign_key_b)` permitted when the row represents a pure association with no independent identity |
| **Append-only log tables** | Bigserial surrogate permitted for high-volume sequential writes when UUID overhead is measured and documented |
| **Platform reference data** | Small, static lookup tables may use natural keys (e.g., ISO country codes) with ADR approval |

Exceptions require documentation in the owning module's schema design note.

---

## 5. Naming Conventions

All database objects use **snake_case** with lowercase characters only.

### Tables

| Rule | Example |
|------|---------|
| Plural nouns | `clients`, `campaigns`, `invoice_line_items` |
| Module prefix for platform tables | `platform_tenants`, `platform_audit_events` |
| No abbreviations unless industry-standard | `oauth_credentials` not `oauth_creds` |
| Join tables | `{entity_a}_{entity_b}` alphabetically or `{parent}_{child}` for hierarchical joins |
| Max length | 63 characters (PostgreSQL identifier limit) |

### Columns

| Rule | Example |
|------|---------|
| snake_case | `created_at`, `tenant_id`, `external_reference_id` |
| Boolean columns prefixed with `is_` or `has_` | `is_active`, `has_been_synced` |
| Foreign keys suffixed with `_id` | `client_id`, `created_by_user_id` |
| Count/amount columns include unit context | `amount_cents`, `duration_seconds` |
| Enum-like values stored as text with check constraint or PostgreSQL enum type | `status`, `billing_interval` |

### Indexes

| Rule | Example |
|------|---------|
| Prefix with `idx_` | `idx_clients_tenant_id_name` |
| Include table name and key columns | `idx_campaigns_tenant_id_status` |
| Unique indexes prefix with `uq_` | `uq_workspace_members_tenant_id_user_id` |

### Constraints

| Rule | Example |
|------|---------|
| Primary key | `{table}_pkey` (PostgreSQL default) |
| Foreign key | `fk_{table}_{referenced_table}` |
| Check constraint | `chk_{table}_{column}` |
| Unique constraint | `uq_{table}_{columns}` |

### Schema Organization

All application tables reside in the **`public` schema** for the initial platform scope. Additional PostgreSQL schemas (e.g., `audit`, `reporting`) require ADR approval and must not break the shared-schema tenant isolation model.

---

## 6. Audit Fields

Every mutable, tenant-scoped business entity table includes a standard set of audit columns. Append-only and log tables include a reduced subset as noted.

### Standard Audit Columns

| Column | Type | Rule |
|--------|------|------|
| `created_at` | `TIMESTAMPTZ` | Set on insert; never updated |
| `updated_at` | `TIMESTAMPTZ` | Set on insert; updated on every mutation |
| `created_by_user_id` | `UUID` | User who created the record; nullable only for system-generated records |
| `updated_by_user_id` | `UUID` | User who last modified the record; nullable only for system-generated updates |

### Rules

1. Audit column values are set by the **repository layer** — never by caller-supplied input.
2. `created_at` and `created_by_user_id` are immutable after insert.
3. System-initiated writes (worker jobs, scheduled tasks) set user audit columns to `NULL` and record the system actor in the immutable audit log instead.
4. Audit columns on a row record the **last known state** — they are not a full change history.

### Immutable Audit Log

Business-critical mutations are additionally recorded in a dedicated, **append-only audit log** owned by the Admin module, as defined in [Architecture §11](03_ARCHITECTURE.md#11-event-flow). The audit log captures:

- Tenant identifier
- Acting user or system actor
- Entity type and entity identifier
- Action performed
- Timestamp
- Prior state snapshot or change diff (JSON)

Audit log records are never updated or deleted within the retention period.

---

## 7. Soft Delete Rules

User-initiated deletion of business entities uses **soft delete** by default, aligned with [Architecture §12](03_ARCHITECTURE.md#12-file-storage-architecture) and [Architecture §16](03_ARCHITECTURE.md#16-disaster-recovery-overview).

### Standard Soft Delete Columns

| Column | Type | Rule |
|--------|------|------|
| `deleted_at` | `TIMESTAMPTZ` | `NULL` when active; set to deletion timestamp when soft-deleted |
| `deleted_by_user_id` | `UUID` | User who performed the deletion; `NULL` when active |

### Rules

1. Soft-deleted rows **remain in the database** until the retention window expires or tenant deprovisioning executes.
2. All standard queries **exclude soft-deleted rows by default** — repositories apply `deleted_at IS NULL` unless explicitly querying deleted records (e.g., admin recovery view).
3. Soft delete is a mutation — `updated_at` and `updated_by_user_id` are updated alongside `deleted_at`.
4. **Hard delete** (physical row removal) occurs only through:
   - Scheduled purge after the retention window
   - Tenant deprovisioning batch process
   - GDPR or contractual erasure requests with audit approval
5. Unique constraints must account for soft-deleted rows — use partial unique indexes (`WHERE deleted_at IS NULL`) to allow name reuse after deletion where business rules permit.
6. Foreign key references to soft-deleted parent records must be handled at the application layer — either block deletion when active children exist, or cascade soft delete to children per module design rules.

### Exceptions

Append-only logs, audit events, and immutable financial records are **never soft-deleted**. Corrections to financial data use reversing entries, not deletion.

---

## 8. Timestamp Standards

All temporal data uses **UTC** with timezone-aware storage.

### Standard

| Rule | Requirement |
|------|-------------|
| **Column type** | `TIMESTAMPTZ` (timestamp with time zone) for all datetime columns |
| **Storage timezone** | UTC — PostgreSQL stores internally as UTC regardless of session timezone |
| **Application layer** | All timestamps generated in UTC; conversion to user timezone occurs at presentation only |
| **Date-only values** | `DATE` type for calendar dates without time component (e.g., contract start date, fiscal period) |
| **Duration values** | Store as integer seconds or milliseconds with column name indicating unit — not as interval strings |

### Prohibited

- `TIMESTAMP WITHOUT TIME ZONE` for any application-owned column
- Storing local timezone offsets in string columns
- Using floating-point types for datetime values
- Implicit `NOW()` defaults on audit columns — the application sets timestamps explicitly for consistency with business logic clocks

### Naming

| Pattern | Usage |
|---------|-------|
| `*_at` | Point-in-time events (`created_at`, `deleted_at`, `published_at`) |
| `*_on` | Date-only values (`due_on`, `billing_on`) |
| `*_seconds` / `*_ms` | Duration integers |

---

## 9. Foreign Key Standards

Foreign keys enforce referential integrity within and across module boundaries.

### Rules

| Rule | Requirement |
|------|-------------|
| **Explicit constraints** | All relationships declared with named foreign key constraints — implicit references without constraints are forbidden |
| **Tenant consistency** | Foreign keys between tenant-scoped tables must not cross tenant boundaries; application layer validates `tenant_id` match on both sides |
| **ON DELETE behavior** | Default: `RESTRICT` — deletion of a referenced row is blocked if dependents exist. Alternative behaviors require module design documentation |
| **ON UPDATE behavior** | Default: `NO ACTION` — primary keys are immutable UUIDs and must not change |
| **Cross-module references** | Permitted via foreign key when the relationship is stable and long-lived. Prefer module service calls over foreign keys for loosely coupled or frequently changing relationships |
| **Platform references** | Tenant-scoped tables may reference platform-scoped tables (e.g., `tenant_id` → tenant registry) with standard foreign key constraints |
| **Nullable foreign keys** | Permitted when the relationship is optional; non-nullable when the relationship is required for row validity |

### Circular Dependencies

Circular foreign key dependencies between tables are avoided at design time. When unavoidable, use nullable deferred foreign keys or resolve via a junction table.

### Orphan Prevention

Worker jobs and batch processes that delete or archive parent records must verify zero active (non-soft-deleted) dependents before proceeding, even when `RESTRICT` constraints are in place.

---

## 10. Indexing Rules

Indexes support query performance without compromising write throughput or tenant isolation.

### Mandatory Indexes

| Index | Applies To |
|-------|-----------|
| Primary key | All tables (automatic) |
| `tenant_id` as leading column | All tenant-scoped tables — standalone or composite |
| Partial index on `deleted_at IS NULL` | All soft-deletable tables with unique business-key constraints |
| Foreign key columns | All foreign key columns used in JOIN or filter predicates |

### Index Design Principles

1. **Lead with `tenant_id`** — Every composite index on tenant-scoped tables starts with `tenant_id` to align with query patterns and partition-friendly access.
2. **Index for known query patterns** — Create indexes based on documented repository query methods, not speculative access paths.
3. **Avoid over-indexing** — Each index adds write overhead. Review index count during schema review; remove unused indexes identified through query monitoring.
4. **Covering indexes sparingly** — Use `INCLUDE` columns only when a measured query benefit justifies the storage cost.
5. **Full-text search** — Use PostgreSQL `GIN` indexes on `tsvector` columns for text search; do not use `LIKE '%term%'` on unindexed columns at scale.
6. **JSON indexing** — Index specific JSON paths with expression indexes when JSON columns are queried predictably; avoid indexing entire JSON blobs.

### Prohibited

- Sequential scans on tenant-scoped tables in production query paths without documented justification
- Indexing low-cardinality boolean columns alone (combine with `tenant_id` and a higher-cardinality column)
- Duplicate indexes covering the same column prefix

### Review

New indexes are reviewed as part of the migration pull request. Index additions on tables exceeding one million rows require performance testing evidence in staging.

---

## 11. Transaction Guidelines

Transactions enforce atomicity for business operations that span one or more writes within a single module.

### Scope Rules

| Rule | Requirement |
|------|-------------|
| **Single module per transaction** | A database transaction must not span writes across two domain modules. Cross-module consistency uses domain events |
| **Service layer ownership** | Transactions begin and commit at the service layer — not in controllers or repositories |
| **Short-lived transactions** | Keep transactions open for the minimum duration required. External API calls, AI requests, and file uploads occur outside transaction boundaries |
| **Read-only transactions** | Reporting and analytics queries use read-only transactions routed to read replicas where available |
| **Isolation level** | Default: `READ COMMITTED`. `REPEATABLE READ` or `SERIALIZABLE` requires documented justification for the specific use case |

### Idempotency

Mutation operations that may be retried (API requests, worker jobs, webhook handlers) use **idempotency keys** stored in a dedicated platform table. Duplicate requests with the same idempotency key return the prior result without re-executing the mutation.

Idempotency records include `tenant_id`, key, response snapshot, and expiry timestamp.

### Error Handling

- Failed transactions roll back completely — partial commits are never acceptable.
- Deadlock victims are retried with exponential backoff at the service layer (maximum three attempts).
- Transaction failures are logged with correlation ID, tenant context, and the operation being attempted.

### Prohibited

- Long-running transactions holding row locks during external service calls
- User-facing request threads waiting on transactions exceeding 5 seconds
- Nested transactions without savepoint justification

---

## 12. Migration Standards

Schema changes are applied through **version-controlled, sequential migrations** executed as a pre-deployment step, as defined in [Tech Stack §15](02_TECH_STACK.md#15-deployment-stack).

### Migration Principles

| Principle | Requirement |
|-----------|-------------|
| **Forward-only in production** | Migrations apply forward. Rollback in production uses a new forward migration — never `DOWN` scripts |
| **Backward-compatible deploys** | Application code must remain functional with both the pre-migration and post-migration schema during rolling deployments (expand-contract pattern) |
| **One concern per migration** | Each migration file addresses a single logical change — not a batch of unrelated alterations |
| **Reviewed and tested** | All migrations run successfully in staging before production deployment |
| **No manual changes** | Schema modifications in any shared environment must go through the migration pipeline |

### Naming

Migration files follow the pattern:

```
{timestamp}_{short_description}
```

Example: `20260628120000_add_soft_delete_to_clients`

Timestamps are UTC. Descriptions use snake_case and describe the change, not the module.

### Safe Migration Patterns

| Operation | Safe Approach |
|-----------|--------------|
| **Add column** | Add as nullable or with default; backfill in separate migration if needed; then add NOT NULL constraint |
| **Remove column** | Stop reading in application first (deploy); remove column in subsequent migration |
| **Rename column** | Add new column, dual-write, migrate data, remove old column — three migrations minimum |
| **Add index** | Use `CREATE INDEX CONCURRENTLY` in production to avoid table locks |
| **Add foreign key** | Validate existing data in a prior migration; add constraint with `NOT VALID` then `VALIDATE CONSTRAINT` for large tables |
| **Data backfill** | Execute as a separate worker job for large datasets — not inline in a DDL migration |

### Prohibited in Migrations

- Destructive operations (`DROP TABLE`, `TRUNCATE`) without ADR approval and confirmed backup
- Data mutations without tenant scoping awareness
- Locking operations on high-traffic tables during peak hours without `CONCURRENTLY` options
- Seeding production data in migration files

Seed data for development and test environments belongs in dedicated seed scripts outside the migration pipeline.

---

## 13. Data Retention

Data retention balances operational needs, contractual obligations, and regulatory requirements.

### Retention Tiers

| Tier | Data Category | Active Retention | Archive | Purge |
|------|--------------|------------------|---------|-------|
| **Tier 1 — Operational** | Business entities (clients, campaigns, projects) | Indefinite while tenant is active | — | On tenant deprovisioning |
| **Tier 2 — Financial** | Invoices, payments, billing records | Minimum 7 years or per jurisdiction | Cold storage after 2 years | Per legal hold release |
| **Tier 3 — Audit** | Immutable audit log | 3 years minimum | Compressed archive | After retention period with compliance sign-off |
| **Tier 4 — Integration** | Sync logs, webhook payloads, error traces | 90 days | — | Automated purge |
| **Tier 5 — AI** | AI request/response audit records | 1 year | — | Automated purge |
| **Tier 6 — Soft-deleted** | Soft-deleted business entities | 30 days post-deletion | — | Hard delete via scheduled job |
| **Tier 7 — Ephemeral** | Job status, idempotency keys, session cache (Redis) | Hours to days per configuration | — | TTL-based expiry |

### Tenant Deprovisioning

When a tenant is deprovisioned:

1. Export window (30 days) — tenant administrator may request full data export
2. Soft-delete all tenant-scoped records
3. Hard purge after export window expires
4. Object storage namespace deleted per [Architecture §12](03_ARCHITECTURE.md#12-file-storage-architecture)
5. Integration credentials revoked and removed from secrets manager
6. Deprovisioning event recorded in platform audit log

Retention periods are configurable per plan tier and contractual addendum. Overrides require compliance review.

---

## 14. Backup Strategy

Database backup and recovery align with the disaster recovery objectives defined in [Architecture §16](03_ARCHITECTURE.md#16-disaster-recovery-overview).

### Backup Requirements

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| **Full snapshot** | Managed PostgreSQL automated snapshot | Daily | 30 days rolling |
| **Continuous archiving** | WAL (Write-Ahead Log) archiving | Continuous | 30 days |
| **Point-in-time recovery** | WAL replay to any second within retention window | On demand | Within 30-day window |
| **Cross-region replica** | Asynchronous read replica in DR region | Continuous | Life of deployment |

### Recovery Objectives

| Tier | RPO | RTO |
|------|-----|-----|
| Platform (Tier 1) | ≤ 5 minutes | ≤ 1 hour |
| Integrations (Tier 2) | ≤ 1 hour | ≤ 4 hours |
| Analytics (Tier 3) | ≤ 4 hours | ≤ 24 hours |

### Operational Rules

1. Backup integrity is verified through automated restore tests monthly in the staging environment.
2. Backup access is restricted to platform operations — not available to tenant users or standard developers.
3. Tenant data export (self-service) is a separate application feature — not a substitute for platform backups.
4. Redis is not backed up. Recovery rebuilds cache and queue state from PostgreSQL and re-executes pending jobs.
5. Migration rollback in production uses point-in-time recovery only as a last resort — prefer forward-fix migrations.

---

## 15. Security Rules

Database security enforces confidentiality, integrity, and access control at the infrastructure and application layers.

### Access Control

| Rule | Requirement |
|------|-------------|
| **No direct database access for developers in production** | Production database access is via audited break-glass procedures only |
| **Least-privilege credentials** | Application services use dedicated database roles with minimum required permissions — no superuser in application connection strings |
| **Separate roles per service** | API service and worker service use distinct database roles scoped to their operations |
| **Connection pooling** | All connections routed through a pooler (e.g., PgBouncer) with connection limits per service |
| **SSL/TLS required** | All database connections encrypted in transit — unencrypted connections rejected |
| **Credential storage** | Database credentials stored in secrets manager per [Tech Stack §15](02_TECH_STACK.md#15-deployment-stack) — never in source code or environment files committed to the repository |

### Data Protection

| Rule | Requirement |
|------|-------------|
| **Encryption at rest** | Managed PostgreSQL encryption at rest enabled (platform default) |
| **Sensitive field encryption** | PII and secrets (OAuth tokens, API keys) encrypted at the application layer before storage where column-level exposure risk exists |
| **No secrets in plain text columns** | Integration credentials, payment tokens, and API keys are never stored unencrypted in standard text columns |
| **PII minimization** | Store only necessary personal data; reference external identity provider for authentication credentials |
| **Row-level security (RLS)** | Evaluated for defense-in-depth on high-sensitivity tables; application-layer scoping remains the primary enforcement mechanism |

### Query Safety

| Rule | Requirement |
|------|-------------|
| **Parameterized queries only** | All queries use parameter binding — string concatenation of user input is prohibited |
| **No dynamic SQL without review** | Dynamically constructed queries require security review and tenant scoping verification |
| **Query logging** | Slow queries and failed queries logged with correlation ID; query text must not include parameter values containing PII |
| **Read replica routing** | Analytics and reporting queries routed to read replicas to isolate heavy reads from write path |

### Compliance Readiness

Audit log immutability, data retention policies, tenant data export, and erasure procedures support GDPR and SOC 2 readiness. Detailed compliance mappings are defined in the Security blueprint.

---

## 16. Performance Rules

Performance standards ensure the database remains responsive as tenant count and data volume grow, aligned with [Architecture §15](03_ARCHITECTURE.md#15-scalability-strategy).

### Query Standards

| Rule | Requirement |
|------|-------------|
| **Tenant-scoped predicates** | Every query on tenant-scoped tables filters by `tenant_id` as the first predicate |
| **Pagination required** | List queries return paginated results — unbounded `SELECT *` on entity tables is prohibited in application code |
| **Projection discipline** | Select only required columns — avoid `SELECT *` in repository methods |
| **N+1 prevention** | Related entity loading uses explicit join or batch-fetch patterns — not per-row lazy loading in loops |
| **Query timeout** | Application-level query timeout of 30 seconds for API path; 120 seconds for worker/reporting path |
| **Explain analyze** | Queries exceeding 500ms in staging are analyzed with `EXPLAIN ANALYZE` before production deployment |

### Connection Management

| Rule | Requirement |
|------|-------------|
| **Pool sizing** | Connection pool sized per service based on pod count and PostgreSQL `max_connections` — documented in infrastructure runbook |
| **Idle timeout** | Idle connections reclaimed after configured timeout |
| **No connection per request thread unbounded** | Connection pool enforces upper bound; requests wait or fail when pool is exhausted |

### Scaling Patterns

| Pattern | When to Apply |
|---------|--------------|
| **Read replicas** | Reporting module queries and analytics dashboards |
| **Table partitioning** | Tables exceeding 10 million rows with clear partition key (typically `tenant_id` + time range) |
| **Materialized views** | Pre-aggregated reporting metrics refreshed on schedule |
| **Archival** | Tier 2–4 data moved to archive tables or cold storage per retention policy |

### Prohibited Patterns

- Loading entire tenant datasets into application memory
- Synchronous full-table scans in API request path
- Using PostgreSQL as a message queue (use Redis per [Tech Stack §6](02_TECH_STACK.md#6-database))
- Storing large binary content in PostgreSQL (use object storage per [Tech Stack §9](02_TECH_STACK.md#9-storage))

### Monitoring

Database performance metrics — connection count, query latency p95/p99, cache hit ratio, replication lag, disk utilization — are collected via [Tech Stack §14](02_TECH_STACK.md#14-monitoring--logging) observability stack. Alerts fire on threshold breaches defined in the infrastructure runbook.

---

## 17. Future Database Evolution

This section defines how the database architecture may evolve without violating current standards.

### Planned Evolution Paths

| Evolution | Trigger | Approach |
|-----------|---------|----------|
| **Organization hierarchy** | Multi-brand agency groups require parent-child tenant relationships | Add `organization_id` layer above `tenant_id`; document via ADR |
| **Read replica scaling** | Reporting query load impacts primary write performance | Route read modules to dedicated replicas; no schema change |
| **Table partitioning** | Individual tables exceed 10M rows | Partition by `tenant_id` range or time; migration via expand-contract |
| **Row-level security** | Defense-in-depth requirement from security audit | Enable PostgreSQL RLS as supplement to application scoping — not replacement |
| **Dedicated analytics store** | Complex reporting exceeds PostgreSQL analytical capacity | Evaluate read replica with materialized views first; columnar warehouse (e.g., dedicated OLAP) via ADR if insufficient |
| **Module service extraction** | Individual module requires independent database | Extract module tables to dedicated PostgreSQL instance; maintain UUID references across boundary |
| **Global multi-region** | Data residency requirements mandate in-region storage | Region-specific PostgreSQL instances with tenant affinity routing; document via ADR |

### Evolution Rules

1. **No breaking changes to tenant isolation model** without ADR and migration plan approved by Engineering Architecture.
2. **Backward compatibility** — Existing modules continue operating under current standards during any infrastructure evolution.
3. **Expand-contract migrations** — All schema evolution follows the migration standards in §12.
4. **Evaluate before adopting** — New PostgreSQL features (e.g., logical replication improvements, new index types) require staging validation before production adoption.
5. **Redis remains ephemeral** — No evolution path promotes Redis to durable storage regardless of feature additions.

### Review Cadence

Database standards are reviewed quarterly by Engineering Architecture and updated when ADRs introduce new patterns. Module teams propose amendments through pull requests to this document.

---

*This document defines database conventions. For technology choices, refer to [`blueprint/02_TECH_STACK.md`](02_TECH_STACK.md). For system architecture, refer to [`blueprint/03_ARCHITECTURE.md`](03_ARCHITECTURE.md). For module-specific entity designs, refer to `blueprint/database/`.*
