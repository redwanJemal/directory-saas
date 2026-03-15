# Directory SaaS Boilerplate

## Overview
Reusable, production-grade SaaS starter. NestJS + Prisma + React + TypeScript.
Multi-tenant, AI-ready, with enterprise patterns for auth, search, jobs, and observability.

## Tech Stack
- **Backend**: NestJS 11, Prisma 6, PostgreSQL 16, Redis 7
- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS 4, shadcn/ui
- **Auth**: JWT + refresh tokens, 3 user types (Admin, Tenant, Client)
- **Multi-tenancy**: Subdomain + header resolution, PostgreSQL RLS
- **Validation**: Zod end-to-end (NO class-validator)
- **State**: TanStack Query (server) + Zustand (client)
- **Jobs**: BullMQ + Redis
- **Search**: Meilisearch + pgvector
- **AI**: Vercel AI SDK (Anthropic/OpenAI)
- **Deploy**: Docker + Coolify

## Project Structure
```
backend/src/
├── common/         # Guards, interceptors, middleware, pipes, decorators, services
├── modules/        # Domain modules (auth, tenants, users, roles, subscriptions, etc.)
├── prisma/         # Prisma module + service
├── config/         # Configuration schemas + loader
apps/
├── web/            # End client SPA (:3000)
├── provider-portal/# Provider dashboard (:3001)
├── admin/          # Platform admin (:3002)
docker/             # Docker Compose + Dockerfiles
scripts/            # Task runner, coding standards, validators
docs/tasks/         # Task definitions + progress.json
```

## Key Patterns
- **ServiceResult<T>**: Services return result objects, never throw
- **Zod schemas**: Define validation schema, infer DTO types
- **Query parameters**: Bracket-notation filters (`filter[status]=active,verified`), sorting (`sort=-rating`), pagination (`page=1&pageSize=20`)
- **Tenant scoping**: All tenant-scoped queries include `tenantId` in WHERE
- **Cache keys**: `saas:{tenantId}:{namespace}:{key}`
- **Error codes**: Defined in `common/constants/error-codes.ts`

## Common Commands
```bash
# Backend
cd backend && npm run start:dev    # Start with hot reload
cd backend && npm run build        # Build
cd backend && npm test             # Unit tests
cd backend && npm run test:e2e     # E2E tests

# Database
cd backend && npx prisma migrate dev --name description   # Create migration
cd backend && npx prisma db seed                           # Seed data
cd backend && npx prisma generate                          # Generate client

# Docker
cd docker && docker compose up -d                          # Start infra
cd docker && docker compose -f docker-compose.coolify.yml up -d  # Production

# Tasks
./scripts/task-runner.sh --status   # Show progress
./scripts/task-runner.sh --task 03  # Run specific task
./scripts/task-runner.sh            # Run next task
```

## Coding Standards
See `scripts/coding-standards.md` for full details.

## Task System
27 tasks in 6 phases. See `docs/tasks/00-overview.md` for full list.
Progress tracked in `docs/tasks/progress.json`.
