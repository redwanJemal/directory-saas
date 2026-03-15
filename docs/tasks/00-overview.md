# Directory SaaS Boilerplate — Task Overview

> A production-grade, reusable SaaS starter built on NestJS + Prisma + React + TypeScript.
> Multi-tenant, AI-ready, with enterprise patterns for auth, search, jobs, and observability.

## Phase 1: Foundation (Tasks 01–06)

| # | Task | Description |
|---|------|-------------|
| 01 | Project Scaffolding | NestJS monorepo, Prisma, Docker, folder structure |
| 02 | Database Schema & Prisma | Base entities, tenant model, migrations, seed |
| 03 | Configuration Management | Typed config, env validation, per-environment overrides |
| 04 | Exception Handling | Global filter, error codes, structured error responses |
| 05 | Request/Response Envelope | Standard wrapper, pagination, API conventions doc |
| 06 | Logging Infrastructure | Structured JSON logging, request tracing, correlation IDs |

## Phase 2: Auth & Multi-Tenancy (Tasks 07–11)

| # | Task | Description |
|---|------|-------------|
| 07 | Multi-Tenancy Middleware | Subdomain + header + JWT tenant resolution |
| 08 | PostgreSQL RLS Policies | Database-level tenant isolation |
| 09 | Authentication System | JWT + refresh, 3 user types (admin/tenant/client) |
| 10 | RBAC & Permissions | Dynamic roles, permission guards, resource:action format |
| 11 | Subscription & Plan Limits | Plan tiers, feature gates, usage enforcement |

## Phase 3: Core Infrastructure (Tasks 12–18)

| # | Task | Description |
|---|------|-------------|
| 12 | Query Parameters & Filtering | Bracket filters, array values, sorting, pagination, includes |
| 13 | Rate Limiting | Redis-based, per-tenant, per-endpoint, sliding window |
| 14 | Caching Layer | Redis, tenant-aware keys, cache invalidation patterns |
| 15 | File Storage | MinIO/S3, tenant-scoped buckets, presigned URLs |
| 16 | Background Jobs | BullMQ, Redis-backed, retries, dead-letter, dashboard |
| 17 | Event System | Domain events, async handlers, event bus |
| 18 | Email & Notifications | Templated email, in-app notifications, push (optional) |

## Phase 4: Security & Observability (Tasks 19–21)

| # | Task | Description |
|---|------|-------------|
| 19 | Security Hardening | Helmet, CORS, CSRF, input sanitization, SQL injection prevention |
| 20 | Health Checks & Probes | Liveness, readiness, dependency checks |
| 21 | Audit Logging | Immutable audit trail, entity change tracking |

## Phase 5: Search & AI (Tasks 22–23)

| # | Task | Description |
|---|------|-------------|
| 22 | Full-Text & Vector Search | Meilisearch + pgvector, provider/service search |
| 23 | AI Module | Vercel AI SDK, tool system, streaming, planning engine |

## Phase 6: Testing, Quality & Deployment (Tasks 24–27)

| # | Task | Description |
|---|------|-------------|
| 24 | Testing Infrastructure | Jest unit + e2e, test DB, factories, coverage |
| 25 | Coding Standards Validator | Automated checks for naming, patterns, structure |
| 26 | Docker Compose | Dev + Coolify production, health checks, networks |
| 27 | Documentation & CLAUDE.md | API docs, architecture guide, onboarding |

## Phase 7: Frontend Foundation (Tasks 28–30)

| # | Task | Description |
|---|------|-------------|
| 28 | Frontend Shared Foundation | shadcn/ui, OKLch theming, CSS variables, utilities (all 3 apps) |
| 29 | Frontend i18n | i18next setup, en/am translations, language switcher (all 3 apps) |
| 30 | Frontend Auth | Zustand auth store, login/register pages, protected routes, token refresh |

## Phase 8: Admin App (Tasks 31–33)

| # | Task | Description |
|---|------|-------------|
| 31 | Admin Layout & Dashboard | Collapsible sidebar, header, routing, dashboard page |
| 32 | Admin Tenants | Data table component, tenants CRUD with dialogs, TanStack Query hooks |
| 33 | Admin Pages | Users, Roles (permissions grid), Subscriptions, Audit Logs, Jobs, Settings |

## Phase 9: Provider Portal (Tasks 34–36)

| # | Task | Description |
|---|------|-------------|
| 34 | Provider Layout & Dashboard | Sidebar, tenant context, dashboard, placeholder pages |
| 35 | Provider Profile & Portfolio | Profile tabs, packages, FAQs, availability calendar, portfolio upload |
| 36 | Provider Pages | Bookings workflow, Reviews, Team, Messages, Calendar, Analytics |

## Phase 10: Web Client App (Tasks 37–38)

| # | Task | Description |
|---|------|-------------|
| 37 | Web Public Pages | Public layout, landing page, vendor search, vendor profile page |
| 38 | Web Client Dashboard | Wedding planner, guest list, budget tracker, checklist |

## Phase 11: Frontend Polish & Testing (Tasks 39–40)

| # | Task | Description |
|---|------|-------------|
| 39 | Shared Components | Consolidated data table, form components, hooks, error boundary, 404 |
| 40 | Frontend Testing | Vitest + Testing Library + MSW, ESLint, Prettier, build validation |

---

## Task Dependencies

```
01 → 02 → 03 → 04 → 05 → 06       (Foundation — sequential)
06 → 07 → 08                        (Multi-tenancy)
06 → 09 → 10 → 11                   (Auth chain)
06 → 12                             (Filtering)
06 → 13, 14                         (Redis infra)
06 → 15, 16, 17, 18                 (Services — parallel after foundation)
19, 20, 21                          (After Phase 2+3)
14 → 22, 23                         (Search & AI need caching)
24                                  (Can start after Phase 2)
25, 26, 27                          (Final backend)

28                                  (Frontend foundation — all 3 apps)
28 → 29                             (i18n needs UI components)
29 → 30                             (Auth needs i18n + UI)
30 → 31, 34, 37                     (Layouts need auth — parallel across apps)
31 → 32 → 33                        (Admin pages — sequential)
34 → 35 → 36                        (Provider pages — sequential)
37 → 38                             (Web pages — sequential)
33, 36, 38 → 39                     (Shared components after app-specific)
39 → 40                             (Testing after all components)
```

## Running Tasks

```bash
# Show progress
./scripts/task-runner.sh --status

# Run next pending task
./scripts/task-runner.sh

# Run specific task
./scripts/task-runner.sh --task 05

# Run all pending sequentially
./scripts/task-runner.sh --all

# Reset a task
./scripts/task-runner.sh --reset 05

# Skip a task
./scripts/task-runner.sh --skip 03
```
