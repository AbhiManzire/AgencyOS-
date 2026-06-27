# Contributing to AgencyOS

Thank you for contributing to AgencyOS. This document defines how we collaborate on the repository during product discovery and active development.

## Branch Strategy

We use a **trunk-based workflow** centered on `main`.

| Branch type   | Naming pattern              | Purpose                                      |
|---------------|-----------------------------|----------------------------------------------|
| Production    | `main`                      | Stable, deployable history                   |
| Feature       | `feature/<short-description>` | New capabilities or product work           |
| Fix           | `fix/<short-description>`   | Bug fixes                                    |
| Chore         | `chore/<short-description>` | Tooling, docs, refactors without user impact |
| Release       | `release/<version>`         | Release preparation (when applicable)        |

### Rules

- Branch from the latest `main`.
- Keep branches short-lived; merge or rebase frequently to reduce drift.
- Do not commit directly to `main` unless explicitly approved for hotfixes or repository maintenance.
- Delete feature branches after merge.

## Commit Naming

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Use for                                              |
|------------|------------------------------------------------------|
| `feat`     | New feature or user-facing capability                |
| `fix`      | Bug fix                                              |
| `docs`     | Documentation only                                   |
| `style`    | Formatting; no logic change                          |
| `refactor` | Code change that is neither feat nor fix             |
| `test`     | Adding or updating tests                             |
| `chore`    | Maintenance, dependencies, tooling                   |
| `ci`       | CI/CD configuration                                  |
| `perf`     | Performance improvement                              |

### Examples

```
feat(crm): add client contact import endpoint
fix(auth): reject expired refresh tokens
docs: add ADR for PostgreSQL selection
chore(deps): bump eslint to 9.x
```

### Guidelines

- Use imperative mood in the summary (`add`, not `added`).
- Keep the summary to 72 characters or fewer.
- Reference issue or ticket IDs in the footer when applicable (`Refs: #123`).

## Pull Request Checklist

Before requesting review, confirm the following:

- [ ] Branch is up to date with `main`
- [ ] Commits follow the naming convention above
- [ ] Scope is limited to a single concern
- [ ] Self-review completed; no debug code or commented-out blocks left behind
- [ ] Documentation updated (README, ADRs, `.ai/` guides, or blueprint docs as applicable)
- [ ] No secrets, credentials, or `.env` values committed
- [ ] `.gitignore` updated if new generated or local-only artifacts were introduced
- [ ] Breaking changes documented in the PR description
- [ ] Linked issue or ticket referenced in the PR description

## Code Review Checklist

Reviewers should verify:

- [ ] **Correctness** — Logic matches requirements; edge cases considered
- [ ] **Security** — Input validated; auth and authorization enforced; no sensitive data exposed
- [ ] **Architecture** — Aligns with `.ai/03_ARCHITECTURE.md` and relevant ADRs in `docs/decisions/`
- [ ] **Database** — Schema and query patterns follow `.ai/04_DATABASE_RULES.md`
- [ ] **API** — Contracts follow `.ai/07_API_STANDARDS.md`
- [ ] **UI** — Components follow `.ai/06_UI_SYSTEM.md` (frontend changes)
- [ ] **Testing** — Adequate coverage for the change; tests are meaningful, not trivial
- [ ] **Performance** — No obvious N+1 queries, unbounded loops, or unnecessary allocations
- [ ] **Maintainability** — Clear naming; minimal scope; no premature abstraction
- [ ] **Observability** — Errors logged appropriately; no silent failures

## Getting Help

- Read governance docs in `.ai/` before starting substantial work.
- Architecture decisions belong in `docs/decisions/` as ADRs.
- Raise questions in the PR or team channel before diverging from established standards.
