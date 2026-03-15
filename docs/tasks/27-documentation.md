# Task 27: Documentation & CLAUDE.md

## Summary
Create comprehensive CLAUDE.md for Claude Code context, API conventions documentation, architecture guide, and onboarding instructions.

## Required Changes

### 27.1 CLAUDE.md

**File**: `/home/redman/directory-saas/CLAUDE.md`

Complete project context for Claude Code sessions:
- Project overview and purpose
- Tech stack summary
- Directory structure
- Key patterns (ServiceResult, QueryParameters, tenant scoping)
- Database conventions
- API conventions (envelope, filters, pagination)
- How to add a new module (step-by-step)
- Common commands (dev, test, migrate, seed, docker)
- Links to coding standards and task system

### 27.2 API Conventions Doc

**File**: `docs/api-conventions.md`

Detailed documentation of:
- Response envelope format (success, error, paginated)
- Query parameter syntax (filters, sort, pagination, includes)
- Error codes and HTTP status mapping
- Authentication headers
- Rate limit headers
- Examples for every pattern

### 27.3 Architecture Guide

**File**: `docs/architecture.md`

- System architecture diagram (text-based)
- Multi-tenancy strategy (middleware + RLS)
- Auth flow diagram
- Module communication (events, direct import)
- Data flow (request → middleware → guard → controller → service → DB)
- Deployment architecture

### 27.4 Onboarding Guide

**File**: `docs/getting-started.md`

Step-by-step:
1. Prerequisites (Node 22, Docker)
2. Clone and install
3. Start Docker services
4. Run migrations and seed
5. Start backend
6. Start frontend(s)
7. Access Swagger, Mailpit, MinIO console

## Acceptance Criteria

1. CLAUDE.md provides full context for Claude Code sessions
2. API conventions fully documented with examples
3. Architecture guide covers all patterns
4. New developer can get running in < 15 minutes
