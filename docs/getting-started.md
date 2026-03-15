# Getting Started

Get the Directory SaaS boilerplate running locally in under 15 minutes.

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 22+ | `node --version` |
| npm | 10+ | `npm --version` |
| Docker | 24+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |
| Git | 2.40+ | `git --version` |

## 1. Clone & Install

```bash
# Clone the repository
git clone <repository-url> directory-saas
cd directory-saas

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../apps/web && npm install
cd ../provider-portal && npm install
cd ../admin && npm install
cd ../..
```

## 2. Environment Setup

```bash
# Copy the example env file
cp .env.example backend/.env

# The defaults work with the Docker services below.
# Review and adjust if needed:
cat backend/.env
```

Key variables (defaults work out of the box with Docker):

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PORT` | 3333 | Backend API port |
| `DATABASE_URL` | `postgresql://postgres:postgres_secret@localhost:5432/directory_saas` | PostgreSQL connection |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `REDIS_PASSWORD` | redis_secret | Redis password |
| `JWT_SECRET` | (set in .env.example) | JWT signing key |
| `JWT_REFRESH_SECRET` | (set in .env.example) | Refresh token key |
| `S3_ENDPOINT` | `http://localhost:9000` | MinIO endpoint |
| `MEILISEARCH_URL` | `http://localhost:7700` | Meilisearch endpoint |

## 3. Start Docker Services

```bash
cd docker && docker compose up -d
```

This starts:
- **PostgreSQL** (pgvector) on port 5432
- **Redis** on port 6379
- **MinIO** (S3-compatible storage) on ports 9000 (API) / 9001 (Console)
- **Meilisearch** (search engine) on port 7700
- **Mailpit** (email testing) on ports 1025 (SMTP) / 8025 (UI)

Verify all services are healthy:

```bash
docker compose ps
```

All services should show `healthy` status.

## 4. Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed
```

The seed creates:
- **Admin user**: `admin@directory-saas.local` / `admin123456`
- **3 subscription plans**: Starter (free), Professional ($49/mo), Enterprise ($199/mo)
- **CRUD permissions** for 5 resources (tenants, users, roles, providers, subscriptions)
- **Demo tenant** with owner user, default roles (OWNER, ADMIN, MANAGER, MEMBER)

## 5. Start the Backend

```bash
cd backend && npm run start:dev
```

The API starts on http://localhost:3333 with hot reload.

Verify it's running:

```bash
curl http://localhost:3333/api/v1/health
# → {"success":true,"data":{"status":"ok"},...}
```

## 6. Start Frontend App(s)

Open separate terminals for each app you want to run:

```bash
# Terminal 2 — End client app
cd apps/web && npm run dev
# → http://localhost:3000

# Terminal 3 — Provider portal
cd apps/provider-portal && npm run dev
# → http://localhost:3001

# Terminal 4 — Admin dashboard
cd apps/admin && npm run dev
# → http://localhost:3002
```

## 7. Explore the Tools

### Swagger API Documentation

Open http://localhost:3333/api/docs in your browser.

Interactive API documentation with all endpoints, request/response schemas, and a "Try it out" feature.

### Mailpit (Email Testing)

Open http://localhost:8025 in your browser.

All emails sent by the application (welcome, password reset, invites) appear here instead of being delivered to real inboxes.

### MinIO Console (File Storage)

Open http://localhost:9001 in your browser.

- **Username**: `minio_admin`
- **Password**: `minio_secret`

Browse uploaded files, manage buckets, and view storage metrics.

### Meilisearch Dashboard

Open http://localhost:7700 in your browser.

View search indexes, test queries, and monitor indexing status.

### Bull Board (Job Dashboard)

Open http://localhost:3333/api/v1/admin/queues in your browser (requires admin auth).

Monitor background job queues, view completed/failed jobs, and retry failed jobs.

### Prisma Studio (Database Browser)

```bash
cd backend && npx prisma studio
# → http://localhost:5555
```

Visual database browser for inspecting and editing data.

## Quick Verification Checklist

After completing all steps, verify everything works:

```bash
# 1. Health check
curl http://localhost:3333/api/v1/health
# ✓ Returns { "success": true, "data": { "status": "ok" } }

# 2. Readiness check (all dependencies)
curl http://localhost:3333/api/v1/health/ready
# ✓ Returns status for postgres, redis, minio, meilisearch

# 3. Admin login
curl -X POST http://localhost:3333/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@directory-saas.local","password":"admin123456"}'
# ✓ Returns { "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }

# 4. Run unit tests
cd backend && npm test
# ✓ 729 tests pass

# 5. Run E2E tests
cd backend && npm run test:e2e
# ✓ E2E tests pass (requires Docker services running)
```

## Common Development Tasks

### Add a new database model

```bash
# 1. Edit the Prisma schema
#    backend/prisma/schema.prisma

# 2. Create a migration
cd backend && npx prisma migrate dev --name add_your_table

# 3. Regenerate the client
npx prisma generate
```

### Add a new API module

See the "How to Add a New Module" section in [CLAUDE.md](../CLAUDE.md).

### Run code quality checks

```bash
# Linting
cd backend && npm run lint

# Coding standards validation
./scripts/validate-standards.sh

# Test coverage
cd backend && npm run test:cov
```

### Reset the database

```bash
cd backend && npx prisma migrate reset
# This drops all data and re-runs migrations + seed
```

### View structured logs

In development, logs are pretty-printed. In production, they're JSON:

```bash
# Follow backend logs
cd backend && npm run start:dev 2>&1 | head -50
```

## Troubleshooting

### Docker services won't start

```bash
# Check Docker is running
docker info

# Check for port conflicts
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# Reset Docker volumes (destroys data)
cd docker && docker compose down -v && docker compose up -d
```

### Prisma migration errors

```bash
# Reset database (development only)
cd backend && npx prisma migrate reset

# Check migration status
cd backend && npx prisma migrate status
```

### Backend won't start

```bash
# Ensure Prisma client is generated
cd backend && npx prisma generate

# Check env file exists
ls -la backend/.env

# Verify database is reachable
docker exec directory-saas-postgres pg_isready
```

### Tests fail with connection errors

```bash
# Ensure Docker services are running
cd docker && docker compose ps

# Ensure .env.test has correct DATABASE_URL
cat backend/.env.test
```

## Project Documentation

- [CLAUDE.md](../CLAUDE.md) — Project context for Claude Code sessions
- [API Conventions](./api-conventions.md) — API design patterns and examples
- [Architecture](./architecture.md) — System architecture and data flow
- [Coding Standards](../scripts/coding-standards.md) — Code style and patterns
- [Task Overview](./tasks/00-overview.md) — Implementation task list
