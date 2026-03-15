# Task 06: Logging Infrastructure — Structured JSON, Tracing

## Summary
Implement structured JSON logging with correlation IDs for request tracing, request/response logging middleware, and log levels per environment.

## Current State
- NestJS app with default console logger.
- No request tracing or structured output.

## Required Changes

### 6.1 Logger Service

**File**: `backend/src/common/services/logger.service.ts`

Custom NestJS logger that outputs structured JSON:
```json
{
  "level": "info",
  "message": "User created",
  "timestamp": "2026-03-15T12:00:00Z",
  "traceId": "abc-123",
  "tenantId": "uuid",
  "userId": "uuid",
  "context": "TenantsService",
  "data": { "tenantSlug": "acme" }
}
```

- In **development**: pretty-print with colors (human readable)
- In **production**: single-line JSON (machine parseable, for log aggregators)
- Configurable log level via `LOG_LEVEL` env var

Use `pino` or `winston` as the underlying transport. Prefer `pino` for performance.

### 6.2 Correlation ID Middleware

**File**: `backend/src/common/middleware/correlation-id.middleware.ts`

- Check for `X-Correlation-ID` header → use it
- If missing → generate UUID v4
- Store in `AsyncLocalStorage` (Node.js native) for access anywhere in the request lifecycle
- Set `X-Correlation-ID` response header

### 6.3 Request Logging Middleware

**File**: `backend/src/common/middleware/request-logging.middleware.ts`

Log every request:
```json
{
  "level": "info",
  "message": "HTTP GET /api/v1/tenants 200 45ms",
  "traceId": "abc-123",
  "method": "GET",
  "url": "/api/v1/tenants",
  "statusCode": 200,
  "duration": 45,
  "userAgent": "...",
  "ip": "..."
}
```

- Log on response finish (to capture status code + duration)
- Skip health check endpoints (`/health`, `/api/v1/health`)
- Redact sensitive headers (Authorization, Cookie)
- Log 4xx as `warn`, 5xx as `error`

### 6.4 Request Context (AsyncLocalStorage)

**File**: `backend/src/common/services/request-context.ts`

```typescript
export class RequestContext {
  static cls = new AsyncLocalStorage<Map<string, any>>();

  static get traceId(): string | undefined;
  static get tenantId(): string | undefined;
  static get userId(): string | undefined;
  static set(key: string, value: any): void;
}
```

- Initialized in correlation ID middleware
- Available in services, guards, interceptors without injecting `Request`
- Logger automatically includes `traceId` from context

### 6.5 Tests

- Test: Logger outputs JSON in production mode
- Test: Logger outputs pretty format in development
- Test: Correlation ID middleware generates UUID if not provided
- Test: Correlation ID middleware uses existing header if provided
- Test: Request logging captures method, URL, status, duration
- Test: Request logging redacts Authorization header
- Test: RequestContext stores and retrieves values across async boundaries

## Acceptance Criteria

1. All logs are structured JSON in production
2. Every request has a correlation ID (generated or passed through)
3. Request/response logs include method, URL, status code, duration
4. Sensitive headers are redacted in logs
5. Log level configurable via `LOG_LEVEL`
6. `RequestContext` accessible from any service without injecting HTTP context
7. All tests pass
