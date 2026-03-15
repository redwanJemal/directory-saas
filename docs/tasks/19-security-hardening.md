# Task 19: Security Hardening — Helmet, CORS, Sanitization

## Summary
Apply security best practices: HTTP headers (Helmet), CORS policy, input sanitization, CSRF protection for cookie-based auth, and content security policy.

## Current State
- Helmet and CORS initialized minimally in `main.ts` (Task 01).
- Rate limiting in place (Task 13).

## Required Changes

### 19.1 Helmet Configuration

**File**: Update `backend/src/main.ts`

```typescript
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,  // Disable in dev for Swagger
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

### 19.2 CORS Configuration

```typescript
app.enableCors({
  origin: config.cors.origins,  // From env, array
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Tenant-Slug', 'X-Correlation-ID'],
  exposedHeaders: ['X-Correlation-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400,
});
```

### 19.3 Input Sanitization

**File**: `backend/src/common/pipes/sanitize.pipe.ts`

- Strip HTML from string inputs (prevent XSS)
- Trim whitespace
- Apply to all incoming DTOs
- Use `sanitize-html` or `DOMPurify` (server-side)

### 19.4 SQL Injection Prevention

- Already handled by Prisma parameterized queries
- Add ESLint rule: ban `$queryRawUnsafe` and `$executeRawUnsafe`
- All raw queries MUST use tagged template: `$queryRaw\`SELECT...\``

### 19.5 Security Headers

Additional headers via middleware:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  (deprecated, CSP is better)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 19.6 Request Size Limits

```typescript
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
```

### 19.7 Tests

- Test: Security headers present on responses
- Test: CORS rejects requests from disallowed origins
- Test: CORS allows requests from configured origins
- Test: HTML stripped from string inputs
- Test: Request body > 1MB rejected
- Test: SQL injection attempt in filter values is harmless

## Acceptance Criteria

1. Helmet configured with production-appropriate settings
2. CORS with explicit origin allowlist
3. Input sanitization strips HTML/XSS
4. Request size limits enforced
5. Security headers on all responses
6. All tests pass
