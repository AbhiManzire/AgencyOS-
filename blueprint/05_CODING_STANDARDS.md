# AgencyOS Coding Standards

**Document ID:** `blueprint/05_CODING_STANDARDS.md`  
**Version:** v1.0  
**Status:** Approved  
**Last Updated:** 2026-06-28  
**Owner:** Engineering Architecture  
**Depends on:** [`blueprint/02_TECH_STACK.md`](02_TECH_STACK.md), [`blueprint/03_ARCHITECTURE.md`](03_ARCHITECTURE.md), [`blueprint/04_DATABASE_RULES.md`](04_DATABASE_RULES.md)

---

## 1. Purpose

This document is the **single source of truth** for writing production-quality code in AgencyOS. It defines **how code must be written** across the frontend and backend.

It does **not** define system architecture, database design, or API contracts. Those belong in their respective blueprint documents:

| Topic | Reference |
|-------|-----------|
| Technology choices | [`blueprint/02_TECH_STACK.md`](02_TECH_STACK.md) |
| System architecture and layers | [`blueprint/03_ARCHITECTURE.md`](03_ARCHITECTURE.md) |
| Database conventions | [`blueprint/04_DATABASE_RULES.md`](04_DATABASE_RULES.md) |
| Branch strategy and commit naming | [`CONTRIBUTING.md`](../CONTRIBUTING.md) |

All contributors — human and AI — must comply with these standards. Deviations require ADR approval and an update to this document.

---

## 2. General Engineering Principles

These principles apply to every line of code written in AgencyOS.

| Principle | Expectation |
|-----------|-------------|
| **Correctness first** | Code must behave correctly under expected and documented edge cases before optimization |
| **Readability over cleverness** | Code is read far more often than written; favor clarity |
| **Minimal scope** | Change only what the task requires; unrelated refactors belong in separate pull requests |
| **Consistency** | Match existing patterns in the module being modified; do not introduce alternate styles |
| **Tenant awareness** | All tenant-scoped code assumes tenant context is present and validated — see [Architecture §3](03_ARCHITECTURE.md#3-multi-tenant-architecture) |
| **Layer discipline** | Respect layer boundaries defined in [Architecture §8](03_ARCHITECTURE.md#8-layered-architecture); do not bypass layers |
| **No dead code** | Remove unused imports, variables, functions, and commented-out blocks before merge |
| **No secrets in code** | Credentials, tokens, and keys belong in secrets management — never in source files |
| **Fail closed** | Errors reject operations; code must not silently degrade security or data isolation on failure |

---

## 3. SOLID Principles

AgencyOS applies SOLID as a design compass, not a rigid checklist.

| Principle | AgencyOS Application |
|-----------|---------------------|
| **Single Responsibility** | Each class, function, and module has one reason to change. Controllers handle HTTP; services orchestrate use cases; repositories handle persistence |
| **Open/Closed** | Extend behavior through new modules, services, or strategy implementations — not by modifying shared core logic |
| **Liskov Substitution** | Subtypes and interface implementations must be interchangeable without breaking callers |
| **Interface Segregation** | Define narrow, purpose-specific interfaces. Modules expose only what consumers need via their public interface |
| **Dependency Inversion** | Depend on abstractions (interfaces, tokens) — not concrete implementations. NestJS dependency injection enforces this on the backend |

SOLID violations are acceptable only when simplicity clearly outweighs abstraction cost, and the trade-off is noted in the pull request description.

---

## 4. DRY Guidelines

Don't Repeat Yourself — but do not over-abstract.

### Apply DRY When

- Identical business logic appears in two or more places
- Validation rules are shared between frontend and backend (use shared type contracts)
- Error mapping or response formatting follows the same pattern across modules
- Constants, enums, and configuration values are referenced in multiple locations

### Do Not Apply DRY When

- Two code blocks merely look similar but serve different domains or change for different reasons
- Abstraction would require more than three levels of indirection to understand
- The duplicated code is fewer than five lines and has no shared change trajectory
- Premature extraction would couple unrelated modules

### Shared Code Placement

- Cross-module backend utilities belong in the shared/common package — not inside a domain module
- Cross-feature frontend utilities belong in shared library directories — not inside a feature module
- Shared types generated from API contracts belong in the shared contracts layer

Extract shared code when the **second** duplication appears, not preemptively at the first.

---

## 5. KISS Principle

Keep It Simple, Stupid.

| Rule | Guidance |
|------|----------|
| **Prefer built-in language features** | Use TypeScript and framework primitives before third-party utilities |
| **Avoid premature optimization** | Write clear code first; optimize only with measured evidence |
| **Avoid premature abstraction** | Three similar lines are better than a premature generic helper |
| **Flat over nested** | Prefer early returns and guard clauses over deep nesting beyond three levels |
| **Explicit over implicit** | Named functions, typed parameters, and clear variable names over magic behavior |
| **Standard patterns first** | Use established NestJS and Next.js patterns before custom frameworks |

Complexity requires justification in the pull request. If a simpler approach exists and was rejected, document why.

---

## 6. Folder Organization Standards

Code organization follows the **feature-based (vertical slice)** strategy defined in [Architecture §9](03_ARCHITECTURE.md#9-feature-based-folder-strategy). These rules govern how files are placed within that strategy.

### General Rules

| Rule | Requirement |
|------|-------------|
| **Feature colocation** | All files for a capability live within the same feature or module directory |
| **Public interface** | Each module exposes a single entry point (`index.ts`); internal files are not imported across module boundaries |
| **Shared vs. feature** | Code used by one feature stays in that feature; code used by two or more features moves to shared |
| **Test colocation** | Test files live adjacent to the code they test, using the `.spec.ts` or `.test.ts` suffix |
| **No orphan files** | Every file belongs to a feature module or shared directory — no loose files at application root |
| **Depth limit** | Nesting beyond four levels within a feature requires simplification or flattening |

### Frontend vs. Backend

Frontend features align one-to-one with backend modules by name, as defined in [Architecture §9](03_ARCHITECTURE.md#9-feature-based-folder-strategy). A developer tracing a capability from UI to persistence should follow a consistent naming path.

### Prohibited

- Importing internal files from sibling modules (bypassing public interfaces)
- Placing business logic in shared directories
- Mixing frontend and backend source in the same directory

---

## 7. Naming Conventions

Consistent naming across the codebase reduces cognitive load and enables safe refactoring.

### Files

| Context | Convention | Example |
|---------|------------|---------|
| React components | PascalCase | `ClientList.tsx` |
| Hooks | camelCase with `use` prefix | `useClientList.ts` |
| Services | kebab-case with suffix | `client.service.ts` |
| Controllers | kebab-case with suffix | `client.controller.ts` |
| DTOs | kebab-case with suffix | `create-client.dto.ts` |
| Repositories | kebab-case with suffix | `client.repository.ts` |
| Tests | match source name + suffix | `client.service.spec.ts` |
| Types (standalone) | kebab-case with suffix | `client.types.ts` |
| Utilities | kebab-case | `format-currency.ts` |
| Constants | kebab-case with suffix | `client.constants.ts` |

### Folders

| Context | Convention |
|---------|------------|
| Feature/module directories | kebab-case, singular or plural matching domain |
| Shared directories | kebab-case, descriptive purpose |
| No abbreviations | Unless industry-standard (`api`, `ui`, `auth`) |

### Components

| Rule | Convention |
|------|------------|
| React components | PascalCase |
| One component per file | File name matches component name |
| Suffix by role when ambiguous | `ClientListPage`, `ClientFormDialog`, `ClientStatusBadge` |
| No generic names | Avoid `Wrapper`, `Container`, `Helper` without domain context |

### Variables

| Context | Convention | Example |
|---------|------------|---------|
| Local variables | camelCase | `clientCount` |
| Function parameters | camelCase | `tenantId` |
| Boolean variables | `is`, `has`, `can`, `should` prefix | `isActive`, `hasPermission` |
| Collections | plural nouns | `clients`, `campaignIds` |
| Callbacks/handlers | `handle` or `on` prefix | `handleSubmit`, `onClientSelect` |

### Constants

| Rule | Convention |
|------|------------|
| Module-level constants | `SCREAMING_SNAKE_CASE` |
| Grouped constants | Exported as a `const` object with `as const` |
| Magic numbers | Prohibited — extract to named constants with unit context |

### Enums

| Rule | Convention |
|------|------------|
| Enum name | PascalCase, singular |
| Enum members | PascalCase |
| Prefer string enums | Over numeric enums for serializable values |
| See §8 | Prefer string union types over TypeScript enums where appropriate |

### Interfaces

| Rule | Convention |
|------|------------|
| Name | PascalCase, descriptive noun |
| Prefix | No `I` prefix |
| Props suffix | React component props suffixed with `Props` |
| DTO suffix | Data transfer objects suffixed with `Dto` |
| Response/Request suffix | API shapes suffixed with `Response` or `Request` |

### Types

| Rule | Convention |
|------|------------|
| Type aliases | PascalCase |
| Union types | PascalCase name describing the union |
| Generic parameters | Single uppercase letter or descriptive PascalCase |
| Exported types | Explicitly exported; no implicit `any` inference |

### Hooks

| Rule | Convention |
|------|------------|
| Name | `use` prefix + PascalCase domain | `useClients`, `useWorkspaceContext` |
| Return type | Explicitly typed or inferrable without `any` |
| Single responsibility | One hook per data concern or UI behavior |
| No hooks in non-React code | Hooks are frontend-only |

### Services

| Rule | Convention |
|------|------------|
| Class name | PascalCase + `Service` suffix | `ClientService` |
| File name | kebab-case + `.service.ts` |
| Method names | camelCase, verb-first | `createClient`, `findByTenant` |
| One service per domain module | Do not create god-services spanning modules |

Database column naming follows [`blueprint/04_DATABASE_RULES.md` §5](04_DATABASE_RULES.md#5-naming-conventions) — snake_case in persistence, camelCase in application code. Mapping occurs exclusively in the repository layer.

---

## 8. TypeScript Rules

TypeScript is the primary language for all application code, as defined in [Tech Stack §4–§5](02_TECH_STACK.md).

### Strict Mode

| Rule | Requirement |
|------|-------------|
| **`strict: true`** | Enabled in all TypeScript configurations — no exceptions |
| **`noImplicitAny`** | All variables, parameters, and return types must be explicitly or inferrably typed |
| **`strictNullChecks`** | Null and undefined are handled explicitly — no assumptions of presence |
| **`noUncheckedIndexedAccess`** | Indexed access returns `T \| undefined` — handle accordingly |
| **`noImplicitReturns`** | All code paths in functions with return types must return a value |
| **`forceConsistentCasingInFileNames`** | Enabled |

### No `any`

| Rule | Requirement |
|------|-------------|
| **`any` is prohibited** | In application code, tests, and shared libraries |
| **`unknown` over `any`** | When type is genuinely unknown, use `unknown` and narrow before use |
| **Type assertions** | Avoid `as` casts; use type guards or validation instead. Assertions require inline justification comment when unavoidable |
| **Third-party gaps** | Missing types are resolved with `.d.ts` declarations — not `any` |
| **ESLint enforcement** | `@typescript-eslint/no-explicit-any` set to error |

### Utility Types

Use built-in utility types before creating custom equivalents:

| Use Case | Utility Type |
|----------|-------------|
| All properties optional | `Partial<T>` |
| All properties required | `Required<T>` |
| Select subset of properties | `Pick<T, K>` |
| Exclude properties | `Omit<T, K>` |
| Read-only variant | `Readonly<T>` |
| Record/map type | `Record<K, V>` |
| Async function return | `Awaited<T>` |
| Discriminated union extraction | `Extract<T, U>` / `Exclude<T, U>` |

Custom utility types live in the shared types package and require documentation of their purpose.

### Generics

| Rule | Requirement |
|------|-------------|
| **Use when type relationship exists** | Generics express reusable type-safe patterns — not as a default for all functions |
| **Constrain bounds** | Generic parameters use `extends` constraints where applicable |
| **Avoid excessive parameters** | More than two generic parameters requires simplification |
| **Default type parameters** | Provide defaults when a sensible fallback exists |

### Readonly

| Rule | Requirement |
|------|-------------|
| **Immutable data structures** | Prefer `readonly` arrays and properties for data that must not mutate |
| **DTO input objects** | Service method parameters that must not be mutated use `Readonly<T>` |
| **`as const`** | Use for literal objects and arrays that serve as lookup maps or constant collections |
| **Repository returns** | Return plain objects; immutability enforced by convention and `readonly` typing |

### Enums vs Unions

| Preference | When |
|------------|------|
| **String union types** | Default choice for finite sets of string values (`type Status = 'active' \| 'suspended'`) |
| **Const assertion objects** | When runtime iteration over values is needed (`const STATUS = { ... } as const`) |
| **TypeScript enums** | Only when required by a framework or code generation tool; prefer `const enum` for tree-shaking |
| **Never numeric enums** | Numeric enums are prohibited in application code |

---

## 9. React Standards

Frontend code follows the stack defined in [Tech Stack §4](02_TECH_STACK.md#4-frontend-stack) and the frontend architecture in [Architecture §6](03_ARCHITECTURE.md#6-frontend-architecture).

### Server Components

| Rule | Requirement |
|------|-------------|
| **Default choice** | Components are Server Components unless client interactivity is required |
| **Data fetching** | Server Components fetch data directly; no client-side fetch on initial load for server-renderable data |
| **No browser APIs** | Server Components must not use hooks, event handlers, or browser-only APIs |
| **No secrets** | Server Components may access server-side configuration; secrets never pass to client bundles |
| **Composition** | Pass Server Components as children to Client Components for optimal rendering |

### Client Components

| Rule | Requirement |
|------|-------------|
| **Opt-in only** | Mark with `'use client'` directive at file top — only when interactivity, hooks, or browser APIs are needed |
| **Minimal scope** | Push `'use client'` boundary as deep as possible — leaf components, not entire page trees |
| **No direct data authority** | Client Components display data from hooks and cache — they do not own business state |
| **Workspace context** | All data-fetching hooks implicitly scope to the active workspace |

### Custom Hooks

| Rule | Requirement |
|------|-------------|
| **Extract reusable logic** | State, effects, and data fetching shared across components become hooks |
| **Return stable shapes** | Hook return types are consistent objects — not positional tuples unless mimicking built-in hooks |
| **Error and loading states** | Data-fetching hooks expose `isLoading`, `isError`, and `error` alongside data |
| **No hooks calling hooks conditionally** | All hook calls are unconditional and top-level |

### Component Composition

| Rule | Requirement |
|------|-------------|
| **Small, focused components** | Each component has a single visual or behavioral responsibility |
| **Props over configuration** | Prefer composable children and props over monolithic configuration objects |
| **Presentational vs. container** | Shared UI components are presentational (props in, JSX out); feature components orchestrate data |
| **No business logic in shared UI** | Design system components contain no API calls or domain rules |

### State Management

State management follows the categories defined in [Architecture §10](03_ARCHITECTURE.md#10-state-management).

| State Type | Rule |
|------------|------|
| **Server state** | Managed via request-cache library; never copied into global client store |
| **UI state** | Component-local state or feature-scoped context |
| **Form state** | Managed by form library within the form component scope |
| **Global client store** | Prohibited for server data; permitted only for true cross-cutting UI state (theme, sidebar) |
| **Workspace context** | React context provider — not a general-purpose state container |

### Memoization

| Rule | Requirement |
|------|-------------|
| **Default: no memoization** | Do not use `memo`, `useMemo`, or `useCallback` preemptively |
| **Apply with evidence** | Memoize only when a measured render performance issue exists or referential equality is required by a child dependency |
| **Stable references** | Callbacks passed to memoized children must be stable |
| **No memoization of cheap computations** | Primitive operations do not warrant `useMemo` |

---

## 10. NestJS Standards

Backend code follows the stack defined in [Tech Stack §5](02_TECH_STACK.md#5-backend-stack) and the layered architecture in [Architecture §8](03_ARCHITECTURE.md#8-layered-architecture).

### Controllers

| Rule | Requirement |
|------|-------------|
| **Thin controllers** | Parse request, call service, return response — no business logic |
| **One controller per resource group** | Aligned with the module's domain |
| **Guard and decorator usage** | Authentication and authorization applied via guards — not inline checks |
| **Tenant context** | Controllers do not resolve tenant context; it is injected via middleware/pipes into the request lifecycle |
| **Response typing** | All endpoints return typed DTOs — not raw entities or untyped objects |
| **HTTP semantics** | Correct status codes; no `200` for creation, no `500` for validation failures |

### Services

| Rule | Requirement |
|------|-------------|
| **Use case orchestration** | One public method per use case; method name reflects the business action |
| **Transaction ownership** | Transactions begin and commit in the service layer — see [Database Rules §11](04_DATABASE_RULES.md#11-transaction-guidelines) |
| **Authorization checks** | Services verify permissions before executing mutations |
| **No HTTP concerns** | Services have no knowledge of request/response objects, status codes, or headers |
| **Cross-module calls** | Services call other modules only through their public interface — never repositories of another module |
| **Tenant scoping** | Every service method that accesses tenant data receives and passes tenant context |

### Modules

| Rule | Requirement |
|------|-------------|
| **One module per domain** | Aligned with [Architecture §5](03_ARCHITECTURE.md#5-module-architecture) |
| **Explicit imports/exports** | Modules declare imports and export only their public service interfaces |
| **No circular module imports** | Circular dependencies between modules are resolved via events or shared kernel |
| **Provider registration** | All injectable classes registered in the module's `providers` array |

### DTOs

| Rule | Requirement |
|------|-------------|
| **Separate input and output** | Request DTOs and response DTOs are distinct classes |
| **Validation decorators** | Input DTOs use class-validator decorators for all fields |
| **No entity exposure** | Domain entities are never returned directly from controllers — map to response DTOs |
| **Immutability** | DTOs use `readonly` properties where supported |

### Validation

| Rule | Requirement |
|------|-------------|
| **Validate at the boundary** | All external input validated at the controller boundary via ValidationPipe |
| **Whitelist mode** | `whitelist: true` strips undeclared properties; `forbidNonWhitelisted: true` rejects them |
| **Transform mode** | `transform: true` for automatic type coercion of query and body parameters |
| **Custom validators** | Complex rules use custom class-validator decorators — not inline controller checks |

### Dependency Injection

| Rule | Requirement |
|------|-------------|
| **Constructor injection** | All dependencies injected via constructor — no property injection |
| **Interface tokens** | Depend on abstractions using injection tokens for swappable implementations |
| **No service locator pattern** | Do not use `ModuleRef.get()` except in factory providers |
| **Scope awareness** | Default singleton scope; request-scoped providers only when request-specific state is required |
| **No `new` for services** | Application services and repositories are never instantiated with `new` outside the DI container |

---

## 11. Error Handling Standards

Consistent error handling ensures predictable behavior and safe failure modes aligned with [Architecture §17](03_ARCHITECTURE.md#17-architecture-principles) (fail closed).

### General Rules

| Rule | Requirement |
|------|-------------|
| **Never swallow errors** | Empty catch blocks are prohibited; every catch must handle, rethrow, or log |
| **Typed errors** | Application errors extend a base `AppError` class with code, message, and HTTP status mapping |
| **Domain errors vs. system errors** | Business rule violations (not found, conflict, forbidden) are distinct from infrastructure failures |
| **No error message leakage** | Internal error details (stack traces, SQL errors, provider responses) are never returned to clients |
| **Correlation ID** | Every error log includes the request correlation ID |
| **Fail closed** | On authorization or validation failure, reject the operation — never proceed with degraded access |

### Backend

| Rule | Requirement |
|------|-------------|
| **Exception filters** | Global exception filter maps application errors to consistent JSON error responses |
| **Service layer throws** | Services throw typed domain errors; controllers do not catch them |
| **Repository layer** | Repositories throw data-access errors; services translate to domain errors |
| **External service failures** | Integration and AI errors are caught, logged, and wrapped — never propagated raw to clients |
| **Retryable vs. fatal** | Worker jobs distinguish retryable errors (network timeout) from fatal errors (validation failure) |

### Frontend

| Rule | Requirement |
|------|-------------|
| **Error boundaries** | Route-level error boundaries catch unhandled render errors |
| **API error normalization** | Data access layer maps API error responses to typed error objects |
| **User-facing messages** | Display safe, actionable messages — not raw error codes or stack traces |
| **Toast vs. inline** | Form validation errors are inline; operation failures use toast or alert patterns |

---

## 12. Logging Standards

Logging follows the observability stack defined in [Tech Stack §14](02_TECH_STACK.md#14-monitoring--logging).

### Format

| Rule | Requirement |
|------|-------------|
| **Structured JSON** | All logs emitted as structured JSON — no unstructured string concatenation |
| **Required fields** | Every log entry includes: timestamp, level, message, correlation ID, service name |
| **Contextual fields** | Include tenant ID and user ID when available — never log them at `debug` in production |
| **Log levels** | `error` (failures), `warn` (degraded), `info` (business events), `debug` (development diagnostics) |

### Rules

| Rule | Requirement |
|------|-------------|
| **No PII in logs** | Personal data, credentials, tokens, and full request bodies are never logged |
| **No secrets** | API keys, passwords, and OAuth tokens must not appear in log output |
| **Error logging** | Errors logged with context (operation, entity type, entity ID) — not full stack in production info logs |
| **Audit events** | Business-critical mutations logged at `info` with actor, action, and entity reference |
| **Debug gating** | `debug`-level logs disabled in production unless temporarily enabled for investigation |
| **Frontend logging** | Client-side errors sent to error tracking service — not console-only in production |

---

## 13. Validation Standards

Validation enforces data integrity at system boundaries.

### Backend Input Validation

| Rule | Requirement |
|------|-------------|
| **All external input validated** | HTTP body, query parameters, path parameters, and webhook payloads |
| **DTO-based validation** | class-validator decorators on all input DTO fields |
| **Custom business rules** | Complex validation in service layer — not in decorators alone |
| **Tenant-scoped uniqueness** | Uniqueness checks scoped to tenant — see [Database Rules §3](04_DATABASE_RULES.md#3-multi-tenant-rules) |

### Frontend Input Validation

| Rule | Requirement |
|------|-------------|
| **Form validation before submit** | Client-side validation provides immediate feedback — not a substitute for backend validation |
| **Schema-driven forms** | Validation schemas shared or mirrored from backend DTO rules where feasible |
| **Optimistic UI guard** | Disable submit during in-flight requests; prevent double submission |

### Shared Principles

| Rule | Requirement |
|------|-------------|
| **Validate early** | Reject invalid input at the earliest boundary |
| **Actionable messages** | Validation errors state what is wrong and what is expected |
| **No silent coercion** | Invalid types are rejected — not silently converted without user awareness |
| **Sanitize display** | User-generated content escaped on render — validation does not replace output encoding |

---

## 14. Testing Standards

Testing follows the tooling defined in [Tech Stack §13](02_TECH_STACK.md#13-development-tooling).

### Test Pyramid

| Layer | Scope | Tool |
|-------|-------|------|
| **Unit** | Pure functions, domain logic, service methods (mocked dependencies) | Vitest |
| **Integration** | Repository queries, module service chains, API endpoints | Vitest |
| **End-to-end** | Critical user journeys across frontend and backend | Playwright |

### General Rules

| Rule | Requirement |
|------|-------------|
| **Test behavior, not implementation** | Assert outcomes and side effects — not internal method call order |
| **One assertion concept per test** | Each test verifies one logical behavior |
| **Descriptive test names** | Name describes the scenario and expected outcome |
| **No test interdependence** | Tests run in any order; no shared mutable state between tests |
| **Tenant context in tests** | All tenant-scoped tests include explicit tenant setup |
| **No production data** | Tests use factories and fixtures — never production or staging data |

### Coverage Expectations

| Area | Minimum Coverage |
|------|-----------------|
| **Domain logic and services** | 80% line coverage |
| **Repository layer** | Integration tests for all query methods |
| **Controllers** | Integration tests for happy path and primary error cases |
| **Frontend hooks** | Unit tests for data-fetching and state logic |
| **Critical user journeys** | At least one E2E test per journey |

Coverage thresholds are enforced in CI. Coverage alone does not satisfy quality — meaningless assertions are rejected in review.

### Prohibited

- Tests that mock the unit under test
- Snapshot tests for dynamic content without justification
- Skipped or disabled tests without a linked issue and expiry date
- Tests that depend on external service availability without contract mocks

---

## 15. Performance Standards

Performance conventions align with [Architecture §15](03_ARCHITECTURE.md#15-scalability-strategy) and [Database Rules §16](04_DATABASE_RULES.md#16-performance-rules).

### Backend

| Rule | Requirement |
|------|-------------|
| **Async for slow operations** | Operations expected to exceed 500ms run via worker queue — not in request thread |
| **Pagination mandatory** | All list operations return paginated results |
| **No N+1 queries** | Batch-load related entities; verify with query logging in staging |
| **Connection pool discipline** | No unbounded concurrent database connections |
| **Cache with invalidation** | Cached data has explicit TTL and invalidation on mutation |

### Frontend

| Rule | Requirement |
|------|-------------|
| **Code splitting** | Route-level lazy loading for feature modules |
| **Image optimization** | Use framework image optimization for all user-facing media |
| **Bundle awareness** | Monitor bundle size; justify additions over 10KB gzipped |
| **Avoid layout shift** | Reserve space for async-loaded content |
| **Debounce user input** | Search and filter inputs debounced before API calls |

### General

| Rule | Requirement |
|------|-------------|
| **Measure before optimizing** | Performance changes require before/after evidence |
| **No premature caching** | Cache only with measured read frequency and clear invalidation path |
| **Lazy load by default** | Load data and code when needed — not upfront |

---

## 16. Security Coding Rules

Security coding extends the platform security defined in [Tech Stack §8](02_TECH_STACK.md#8-authentication) and [Database Rules §15](04_DATABASE_RULES.md#15-security-rules).

| Rule | Requirement |
|------|-------------|
| **Tenant isolation in code** | Every data access path includes tenant context — no unscoped queries |
| **Parameterized queries only** | Never concatenate user input into query strings |
| **No secrets in source** | API keys, passwords, and tokens in secrets manager only |
| **Output encoding** | User-generated content encoded on render; no unescaped HTML injection |
| **CSRF protection** | State-changing requests protected against cross-site request forgery |
| **Rate limiting awareness** | Write code that respects platform and per-tenant rate limits |
| **Least privilege** | Code requests minimum permissions — for database roles, API scopes, and storage access |
| **Dependency hygiene** | No known-critical vulnerabilities in dependencies; automated scanning in CI |
| **Secure defaults** | Features disabled by default; explicit opt-in for elevated permissions |
| **AI data handling** | Client PII classified before inclusion in AI context — see [Architecture §14](03_ARCHITECTURE.md#14-ai-architecture) |
| **File upload validation** | Validate file type, size, and content before accepting uploads |
| **No security through obscurity** | Security enforced by architecture and code — not by hiding endpoints |

---

## 17. Documentation Standards

Code documentation supplements blueprint documents — it does not replace them.

### When to Document

| Document | When Required |
|----------|--------------|
| **JSDoc on public APIs** | All exported functions, classes, and hooks in shared and module public interfaces |
| **Inline comments** | Non-obvious business logic, regulatory requirements, or workarounds only |
| **README per module** | Complex modules with non-obvious setup or usage patterns |
| **ADR** | Any deviation from these standards or blueprint documents |

### When Not to Document

- Self-explanatory code that reads as prose
- Restating what the type system already expresses
- Describing architecture already covered in blueprint documents
- Commented-out code (delete it instead)

### JSDoc Format

| Element | Required Fields |
|---------|----------------|
| **Functions** | Description, `@param` for each parameter, `@returns`, `@throws` for domain errors |
| **Classes** | Class-level description of responsibility |
| **Deprecated APIs** | `@deprecated` with replacement reference and removal timeline |

Documentation is written in English, present tense, and complete sentences.

---

## 18. Code Review Checklist

Reviewers verify compliance with this document and the referenced blueprints.

### Correctness and Logic

- [ ] Code behaves correctly for happy path and documented edge cases
- [ ] Error paths handled — no swallowed exceptions
- [ ] Idempotent where retries are possible

### Architecture and Layers

- [ ] Respects layer boundaries per [Architecture §8](03_ARCHITECTURE.md#8-layered-architecture)
- [ ] Module boundaries preserved — no cross-module internal imports
- [ ] Tenant context propagated and validated on all tenant-scoped operations

### TypeScript and Code Quality

- [ ] No `any`; strict typing throughout
- [ ] Naming conventions followed (§7)
- [ ] No dead code, debug statements, or commented-out blocks
- [ ] DRY applied appropriately — no unnecessary duplication or over-abstraction

### Backend (when applicable)

- [ ] Controllers thin; business logic in services
- [ ] DTOs validated at boundary; entities not exposed
- [ ] Repository queries tenant-scoped and paginated
- [ ] Transactions scoped to single module

### Frontend (when applicable)

- [ ] Server Components default; `'use client'` boundary minimal
- [ ] Server state managed via cache library — not global store
- [ ] No secrets or server-only imports in client bundles

### Security

- [ ] No secrets, credentials, or PII in code or logs
- [ ] Input validated; output encoded
- [ ] Authorization checked before mutations

### Testing

- [ ] Tests cover new behavior and primary error cases
- [ ] Tests are independent and deterministic
- [ ] Coverage meets minimum thresholds

### Documentation

- [ ] Public interfaces documented
- [ ] Blueprint or ADR updated if conventions changed

---

## 19. Pull Request Checklist

Authors confirm before requesting review. Branch strategy and commit naming follow [`CONTRIBUTING.md`](../CONTRIBUTING.md).

### Scope and Quality

- [ ] Single concern per pull request — no unrelated changes
- [ ] Self-review completed against this document
- [ ] All CI checks pass (lint, type check, tests)
- [ ] No `any`, dead code, or debug artifacts

### Standards Compliance

- [ ] Coding standards (this document) followed
- [ ] Architecture principles respected — [Architecture §17](03_ARCHITECTURE.md#17-architecture-principles)
- [ ] Database rules respected for any persistence changes — [Database Rules](04_DATABASE_RULES.md)
- [ ] Naming conventions applied consistently

### Security and Data

- [ ] No secrets, credentials, or `.env` values committed
- [ ] Tenant isolation verified for all data access changes
- [ ] Migrations backward-compatible per [Database Rules §12](04_DATABASE_RULES.md#12-migration-standards)

### Process

- [ ] Commits follow Conventional Commits format
- [ ] Branch up to date with `main`
- [ ] Linked issue or ticket referenced
- [ ] Breaking changes documented in PR description
- [ ] Documentation and blueprint updates included where applicable

---

## 20. Definition of Done

A work item is **done** when all criteria below are met.

| Criterion | Requirement |
|-----------|-------------|
| **Functionality** | Acceptance criteria satisfied and verified by the author |
| **Code quality** | Complies with this document; no linter or type errors |
| **Tests** | Unit and integration tests written; E2E updated for user-facing journeys |
| **CI green** | All pipeline checks pass |
| **Review** | At least one approved code review from a team member |
| **Documentation** | Public interfaces documented; blueprint updated if behavior or conventions changed |
| **Security** | No new security findings; tenant isolation preserved |
| **Observability** | Errors logged with correlation ID; metrics emitted for new operations where applicable |
| **No regressions** | Existing tests pass; no degradation in related functionality |
| **Deployed to staging** | Verified in staging environment before production promotion |

A pull request merge alone does not satisfy Done — staging verification is required for all user-facing and data-mutating changes.

---

*This document defines coding conventions. For technology choices, refer to [`blueprint/02_TECH_STACK.md`](02_TECH_STACK.md). For system architecture, refer to [`blueprint/03_ARCHITECTURE.md`](03_ARCHITECTURE.md). For database conventions, refer to [`blueprint/04_DATABASE_RULES.md`](04_DATABASE_RULES.md).*
