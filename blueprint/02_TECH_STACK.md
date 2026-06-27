# AgencyOS Technology Stack

**Document ID:** `blueprint/02_TECH_STACK.md`  
**Status:** Approved  
**Last Updated:** 2026-06-28  
**Owner:** Engineering Architecture

---

## 1. Purpose

This document is the **official technology standard** for AgencyOS. It defines which technologies the platform uses and the rationale behind each selection.

It does **not** define system architecture, data models, API contracts, UI patterns, or implementation guidance. Those belong in separate blueprint and `.ai/` documents.

All new features, integrations, and infrastructure must align with this standard unless an Architecture Decision Record (ADR) explicitly approves an exception.

---

## 2. Product Overview

AgencyOS is an **Enterprise Operating System for Digital Marketing Agencies**. It unifies client management, campaign operations, project delivery, billing, reporting, and team collaboration into a single multi-tenant platform.

The technology stack must support:

- **Multi-tenant SaaS** — isolated agency workspaces with shared platform services
- **High data volume** — campaigns, analytics, assets, and audit history at agency scale
- **Rich integrations** — advertising platforms, payment processors, communication tools, and AI services
- **Enterprise expectations** — security, observability, compliance readiness, and long-term maintainability

The stack is optimized for a **TypeScript-first, API-driven monorepo** with a modern web frontend and a modular backend.

---

## 3. Technology Selection Principles

AgencyOS adopts technologies based on the following principles:

| Principle | Application |
|-----------|-------------|
| **Proven at scale** | Prefer mature ecosystems with strong enterprise adoption and long-term vendor or community support |
| **Type safety end-to-end** | TypeScript across frontend and backend to reduce runtime defects and improve developer experience |
| **Separation of concerns** | Distinct frontend, backend, and data layers with clear ownership boundaries |
| **Cloud portability** | Container-based deployment on cloud-agnostic foundations; avoid proprietary lock-in where practical |
| **Security by default** | Standards-based authentication, encrypted transport, and secrets management from day one |
| **Operational visibility** | Built-in support for structured logging, metrics, and distributed tracing |
| **Integration readiness** | Technologies that expose well-documented APIs and integrate cleanly with third-party services |
| **Team velocity** | Favor widely adopted tools that reduce onboarding friction and hiring risk |

Technologies that violate these principles require ADR approval before adoption.

---

## 4. Frontend Stack

| Technology | Role | Rationale |
|------------|------|-----------|
| **Next.js** | Web application framework | Industry-standard React framework with server-side rendering, static generation, and strong performance characteristics for dashboard-heavy SaaS products |
| **React** | UI library | Largest component ecosystem, mature tooling, and deep talent pool; required foundation for Next.js |
| **TypeScript** | Primary language | Static typing reduces defects in complex UI state and shared type contracts with the backend |
| **Tailwind CSS** | Styling system | Utility-first approach enables consistent, maintainable styling at scale without heavy custom CSS overhead |

**Runtime:** Node.js (build and server-side rendering).  
**Package manager:** pnpm (workspace-compatible, disk-efficient monorepo support).

The frontend communicates exclusively with the AgencyOS backend over HTTPS. Direct database access from the client is prohibited.

---

## 5. Backend Stack

| Technology | Role | Rationale |
|------------|------|-----------|
| **NestJS** | Application framework | Opinionated, modular Node.js framework with built-in support for dependency injection, guards, interceptors, and enterprise-grade structure |
| **Node.js (LTS)** | Runtime | Aligns with frontend language ecosystem; strong async I/O performance for API-heavy workloads |
| **TypeScript** | Primary language | Shared language with frontend; enables type-safe DTOs and shared validation schemas |

The backend is the **single authority** for business logic, authorization, data access, and third-party integration orchestration.

Background job processing uses a dedicated **queue worker** runtime (same NestJS codebase, separate process) backed by Redis.

---

## 6. Database

| Technology | Role | Rationale |
|------------|------|-----------|
| **PostgreSQL** | Primary relational database | ACID compliance, JSON support, robust indexing, mature replication, and proven performance for multi-tenant SaaS workloads |
| **Redis** | Cache, session store, and job queue broker | In-memory speed for caching hot data, session management, rate limiting, and asynchronous task dispatch |

PostgreSQL is the **system of record** for all persistent business data. Redis holds ephemeral and performance-sensitive data only; it is not a substitute for relational storage.

Schema design, migration strategy, and data governance rules are defined in the Database blueprint — not in this document.

---

## 7. Infrastructure

| Technology | Role | Rationale |
|------------|------|-----------|
| **Docker** | Containerization | Consistent environments across development, staging, and production |
| **Kubernetes** | Production orchestration | Industry-standard container orchestration for scaling, rolling deployments, and service discovery |
| **Terraform** | Infrastructure as Code | Declarative, version-controlled provisioning of cloud resources with auditability and repeatability |
| **Helm** | Kubernetes package management | Standardized, templated deployment of services and configuration |

**Target cloud:** Cloud-agnostic with primary deployment on **AWS**. Alternative cloud providers are supported through IaC abstraction where feasible.

Local development uses Docker Compose to mirror production service dependencies without requiring a full cluster.

---

## 8. Authentication

| Technology / Standard | Role | Rationale |
|-----------------------|------|-----------|
| **OAuth 2.0 / OpenID Connect (OIDC)** | Authentication protocol | Industry-standard, interoperable identity flows for web and API clients |
| **Keycloak** | Identity provider (IdP) | Open-source, self-hosted OIDC provider with multi-tenant realm support, SSO, and fine-grained role management — suitable for enterprise agency deployments |
| **JWT (access tokens)** | Stateless API authorization | Short-lived tokens validated by the backend on every request; standard OIDC token format |

AgencyOS does **not** implement custom password hashing or session cryptography. All identity lifecycle management (registration, MFA, password reset, SSO federation) is delegated to the IdP.

Social and enterprise SSO (Google Workspace, Microsoft Entra ID) are supported through OIDC federation in Keycloak.

---

## 9. Storage

| Technology | Role | Rationale |
|------------|------|-----------|
| **Amazon S3** (or S3-compatible store) | Object storage | Durable, scalable storage for client assets, campaign creatives, exports, and document uploads |
| **CloudFront** (or equivalent CDN) | Content delivery | Low-latency global delivery of static assets and cached media |

All uploaded files are stored in object storage — never on application server filesystems. Pre-signed URLs are used for controlled direct upload and download access.

Storage lifecycle policies govern retention, archival, and deletion of agency data in compliance with contractual obligations.

---

## 10. API Technology

| Technology / Standard | Role | Rationale |
|-----------------------|------|-----------|
| **REST** | Primary API style | Universal client compatibility, straightforward caching, and well-understood semantics for CRUD and resource-oriented operations |
| **OpenAPI 3.x** | API contract specification | Machine-readable, version-controlled API definitions that enable documentation generation, client SDK creation, and contract testing |
| **JSON** | Payload format | Standard, lightweight serialization format with broad tooling support |
| **WebSockets** | Real-time channel (selective) | Used only where push-based updates are required (e.g., live notifications, collaborative editing); not the default transport |

GraphQL and gRPC are **not** adopted at this time. REST with OpenAPI provides sufficient flexibility with lower operational complexity for the initial platform scope.

API design standards, versioning policy, and error conventions are defined in the API blueprint.

---

## 11. AI Provider Strategy

AgencyOS integrates AI capabilities for content generation, campaign insights, and workflow automation. The platform follows a **provider-agnostic, multi-vendor strategy** to avoid single-vendor dependency and enable cost optimization.

| Provider | Primary Use Cases | Rationale |
|----------|-------------------|-----------|
| **OpenAI** | General-purpose text generation, summarization, structured output | Leading model quality and API maturity for production workloads |
| **Anthropic** | Long-context analysis, safety-sensitive content review | Strong reasoning capabilities and alternative model family for redundancy |
| **Azure OpenAI Service** (optional) | Enterprise deployments requiring data residency and Microsoft ecosystem compliance | Meets enterprise contractual requirements for data processing location |

**Strategy principles:**

- All AI calls route through a **centralized abstraction layer** in the backend — frontend clients never call AI providers directly
- Provider selection is **configurable per agency** based on plan tier, data residency requirements, and cost controls
- Prompt templates, model selection, and token budgets are managed as platform configuration — not hardcoded per feature
- AI outputs are logged for auditability; sensitive client data is excluded from provider training per vendor zero-retention agreements

Embedding and vector search technologies will be evaluated and documented via ADR when semantic search features enter scope.

---

## 12. External Integrations

AgencyOS connects to third-party services across advertising, payments, communication, and productivity categories. Integrations are implemented as backend-managed connectors; credentials are stored in a secrets manager.

| Category | Technology / Service | Purpose |
|----------|---------------------|---------|
| **Advertising** | Google Ads API, Meta Marketing API, LinkedIn Marketing API | Campaign data sync, performance reporting, audience management |
| **Payments** | Stripe | Subscription billing, invoicing, payment method management |
| **Email** | Amazon SES (or SendGrid) | Transactional email — notifications, reports, onboarding |
| **Messaging** | Slack API | Team notifications and workflow alerts |
| **Calendar** | Google Calendar API, Microsoft Graph | Scheduling and deadline synchronization |
| **Document signing** | DocuSign API (future) | Client contract and SOW execution |

New integrations require security review and must conform to the platform's OAuth credential storage and rate-limiting standards.

---

## 13. Development Tooling

| Tool | Role | Rationale |
|------|------|-----------|
| **Git / GitHub** | Version control and collaboration | Industry standard; supports branch protection, code review, and CI integration |
| **pnpm** | Package management | Efficient monorepo workspace support with strict dependency resolution |
| **ESLint** | Static analysis (linting) | Enforces code quality and consistency across TypeScript codebases |
| **Prettier** | Code formatting | Eliminates formatting debates; automated, consistent style |
| **Husky + lint-staged** | Pre-commit hooks | Prevents lint and formatting violations from entering the repository |
| **Vitest** | Unit and integration testing | Fast, native ESM test runner with TypeScript support |
| **Playwright** | End-to-end testing | Cross-browser automation for critical user journey validation |
| **Docker Compose** | Local service orchestration | Mirrors production dependencies (PostgreSQL, Redis, Keycloak) locally |

Commit conventions, branch strategy, and review requirements are defined in `CONTRIBUTING.md`.

---

## 14. Monitoring & Logging

| Technology | Role | Rationale |
|------------|------|-----------|
| **OpenTelemetry** | Instrumentation standard | Vendor-neutral traces, metrics, and logs across frontend, backend, and infrastructure |
| **Prometheus** | Metrics collection and alerting | De facto standard for time-series metrics in Kubernetes environments |
| **Grafana** | Dashboards and visualization | Unified observability views for engineering and operations teams |
| **Loki** (or CloudWatch Logs) | Log aggregation | Centralized, queryable log storage correlated with traces and metrics |
| **Sentry** | Error tracking | Real-time exception capture with stack traces, release tracking, and user impact analysis |

All services emit **structured JSON logs**. Log levels, retention periods, and PII redaction rules are defined in the Security and Development Process documents.

Health check endpoints and readiness probes are mandatory for all deployable services.

---

## 15. Deployment Stack

| Technology | Role | Rationale |
|------------|------|-----------|
| **GitHub Actions** | CI/CD pipeline | Native integration with the repository; supports build, test, lint, and deploy workflows |
| **Amazon ECR** | Container registry | Secure, private storage for Docker images within the AWS ecosystem |
| **Kubernetes (EKS)** | Production runtime | Managed Kubernetes on AWS with auto-scaling, load balancing, and rolling deployments |
| **Argo CD** (or Flux) | GitOps deployment | Declarative, auditable continuous delivery aligned with IaC practices |
| **AWS Secrets Manager** | Secrets storage | Centralized, rotatable storage for API keys, database credentials, and integration tokens |

**Environments:** `development` → `staging` → `production`. Each environment is isolated at the network, credential, and data layer.

Deployments follow a **rolling update** strategy with automated rollback on health check failure. Database migrations run as a pre-deployment step with backward-compatible change requirements.

---

## 16. Technology Decision Summary

| Layer | Selected Technology | ADR Reference |
|-------|---------------------|---------------|
| Frontend framework | Next.js | [ADR-0001](../docs/decisions/0001-use-nextjs.md) |
| Backend framework | NestJS | [ADR-0002](../docs/decisions/0002-use-nestjs.md) |
| Primary database | PostgreSQL | [ADR-0003](../docs/decisions/0003-use-postgresql.md) |
| Cache & queues | Redis | — |
| Language | TypeScript (frontend + backend) | — |
| Containerization | Docker | — |
| Orchestration | Kubernetes (EKS) | — |
| IaC | Terraform + Helm | — |
| Authentication | OAuth 2.0 / OIDC via Keycloak | — |
| Object storage | Amazon S3 + CDN | — |
| API style | REST + OpenAPI 3.x | — |
| AI providers | OpenAI, Anthropic (multi-vendor) | — |
| Payments | Stripe | — |
| CI/CD | GitHub Actions + GitOps | — |
| Observability | OpenTelemetry, Prometheus, Grafana, Sentry | — |

### Change Management

Any deviation from this standard requires:

1. A new or updated ADR in `docs/decisions/`
2. Review and approval by the Engineering Architecture owner
3. Update to this document upon ADR acceptance

---

*This document defines technology choices only. For architectural patterns, refer to the Architecture blueprint. For data modeling rules, refer to the Database blueprint.*
