# Task 20: Health Checks & Readiness Probes

## Summary
Implement health check endpoints for container orchestration (Docker, Kubernetes). Separate liveness (app running) from readiness (dependencies available).

## Current State
- NestJS app with all core infrastructure.

## Required Changes

### 20.1 Health Module

Use `@nestjs/terminus`:

- `GET /health` — Liveness: always 200 if app is running
- `GET /health/ready` — Readiness: checks all dependencies

### 20.2 Dependency Checks

```typescript
@Get('ready')
async readiness() {
  return this.health.check([
    () => this.db.pingCheck('database'),          // PostgreSQL
    () => this.redis.pingCheck('redis'),           // Redis
    () => this.storage.pingCheck('storage'),       // MinIO
    () => this.search.pingCheck('search'),         // Meilisearch
    () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 90 }),
    () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),  // 300MB
  ]);
}
```

### 20.3 Response Format

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "storage": { "status": "up" }
  },
  "details": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "storage": { "status": "up" }
  }
}
```

### 20.4 Tests

- Test: `/health` returns 200
- Test: `/health/ready` returns 200 when all dependencies up
- Test: `/health/ready` returns 503 when database down
- Test: Health endpoints skip auth and tenant resolution

## Acceptance Criteria

1. `/health` liveness endpoint (always 200)
2. `/health/ready` readiness with dependency checks
3. Database, Redis, MinIO, Meilisearch checks
4. Memory and disk checks
5. No auth required for health endpoints
6. All tests pass
