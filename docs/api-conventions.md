# API Conventions

Complete reference for the Directory SaaS API design patterns.

## Base URL

```
http://localhost:3333/api/v1
```

All endpoints are prefixed with `/api/v1`.

## Authentication

### Headers

```
Authorization: Bearer <access_token>
```

Access tokens are JWTs with a 15-minute TTL. Refresh tokens (7-day TTL) are used to obtain new access tokens.

### Auth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/admin/login` | POST | Admin login |
| `/api/v1/auth/tenant/login` | POST | Tenant user login |
| `/api/v1/auth/client/login` | POST | Client login |
| `/api/v1/auth/client/register` | POST | Client registration |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/logout` | POST | Revoke refresh token |
| `/api/v1/me` | GET | Current user profile |

### JWT Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "userType": "tenant_user",
  "tenantId": "tenant-uuid",
  "roles": ["ADMIN"],
  "permissions": ["providers:read", "providers:write"]
}
```

### User Types

| Type | Description | Auth Endpoint |
|------|-------------|---------------|
| `admin_user` | Platform super admin | `/auth/admin/login` |
| `tenant_user` | Tenant staff (owner, manager, etc.) | `/auth/tenant/login` |
| `client_user` | End client/customer | `/auth/client/login` |

## Tenant Resolution

Tenants are resolved in priority order:

1. **Subdomain**: `acme.directory-saas.com` → tenant slug `acme`
2. **X-Tenant-ID header**: `X-Tenant-ID: <uuid>`
3. **X-Tenant-Slug header**: `X-Tenant-Slug: acme`
4. **JWT tenantId**: Extracted from authenticated user's token

```
X-Tenant-ID: 550e8400-e29b-41d4-a716-446655440000
# or
X-Tenant-Slug: acme-events
```

## Response Envelope

All responses are wrapped in a standard envelope by the TransformInterceptor.

### Success (Single Resource)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Events",
    "slug": "acme-events",
    "status": "active",
    "createdAt": "2026-03-15T12:00:00.000Z",
    "updatedAt": "2026-03-15T12:00:00.000Z"
  },
  "timestamp": "2026-03-15T12:00:00.000Z",
  "traceId": "abc-123-def-456"
}
```

### Success (Paginated List)

```json
{
  "success": true,
  "data": [
    { "id": "...", "name": "Provider A" },
    { "id": "...", "name": "Provider B" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8
  },
  "timestamp": "2026-03-15T12:00:00.000Z",
  "traceId": "abc-123-def-456"
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "name", "message": "String must contain at least 2 character(s)" }
    ]
  },
  "timestamp": "2026-03-15T12:00:00.000Z",
  "traceId": "abc-123-def-456"
}
```

## URL Structure

```
/api/v1/{resource}                     # Collection
/api/v1/{resource}/:id                 # Single resource
/api/v1/tenants/:tenantId/{resource}   # Tenant-scoped resource
/api/v1/admin/{resource}               # Platform admin endpoints
/api/v1/me                             # Current user
```

- **Plural nouns** for resources (never verbs)
- **kebab-case** for multi-word resources: `/api/v1/subscription-plans`

## HTTP Methods & Status Codes

| Method | Purpose | Success Code | Example |
|--------|---------|-------------|---------|
| GET | Read single or list | 200 | `GET /api/v1/providers/uuid` |
| POST | Create resource | 201 | `POST /api/v1/providers` |
| PATCH | Partial update | 200 | `PATCH /api/v1/providers/uuid` |
| DELETE | Soft delete | 200 | `DELETE /api/v1/providers/uuid` |
| PUT | Full replace (rare) | 200 | `PUT /api/v1/providers/uuid` |

## Query Parameters

### Filtering (Bracket Notation)

Filters use bracket notation with optional operators:

```
# Equality (default operator)
GET /api/v1/providers?filter[status]=active

# Multiple values (comma = OR within field)
GET /api/v1/providers?filter[category]=photography,catering,venue
GET /api/v1/providers?filter[status]=active,verified

# Comparison operators
GET /api/v1/providers?filter[rating][gte]=4.0
GET /api/v1/providers?filter[price][gte]=100&filter[price][lte]=5000

# String operators
GET /api/v1/providers?filter[name][contains]=photo
GET /api/v1/providers?filter[name][startsWith]=A

# Date filtering
GET /api/v1/providers?filter[createdAt][gte]=2026-01-01
GET /api/v1/providers?filter[createdAt][lte]=2026-12-31

# Null check
GET /api/v1/providers?filter[deletedAt][isNull]=true
```

#### Supported Operators

| Operator | Prisma Mapping | Example |
|----------|---------------|---------|
| `eq` (default) | `equals` | `filter[status]=active` |
| `gt` | `gt` | `filter[price][gt]=100` |
| `gte` | `gte` | `filter[rating][gte]=4.0` |
| `lt` | `lt` | `filter[price][lt]=5000` |
| `lte` | `lte` | `filter[price][lte]=5000` |
| `contains` | `contains` | `filter[name][contains]=photo` |
| `startsWith` | `startsWith` | `filter[name][startsWith]=A` |
| `endsWith` | `endsWith` | `filter[email][endsWith]=@gmail.com` |
| `in` | `in` | `filter[status]=active,verified` |
| `isNull` | `equals: null` | `filter[deletedAt][isNull]=true` |

### Sorting

```
# Single field, ascending
GET /api/v1/providers?sort=name

# Single field, descending (prefix with -)
GET /api/v1/providers?sort=-createdAt

# Multiple fields
GET /api/v1/providers?sort=-rating,name
```

Descending order is indicated by a `-` prefix. Multiple sort fields are comma-separated.

### Pagination

```
GET /api/v1/providers?page=1&pageSize=20
```

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | — | Page number (1-based) |
| `pageSize` | 20 | 100 | Items per page |

### Includes (Eager Loading)

```
GET /api/v1/providers?include=reviews,services
```

Allowed includes are defined per-endpoint. Invalid includes are silently ignored.

### Search (Full-Text)

```
GET /api/v1/providers?search=wedding photographer addis
```

Searches across configured fields using Meilisearch or database `LIKE` queries.

### Combined Example

```
GET /api/v1/providers?filter[category]=photography,catering&filter[rating][gte]=4.0&filter[city]=addis-ababa&sort=-rating,name&page=1&pageSize=10&include=reviews&search=wedding
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `TOKEN_EXPIRED` | 401 | JWT access token expired |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `ACCOUNT_DISABLED` | 403 | User account is disabled |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `INVALID_INPUT` | 400 | Invalid input data |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource already exists (unique constraint) |
| `CONFLICT` | 409 | Conflicting state |
| `TENANT_NOT_FOUND` | 404 | Tenant not found |
| `TENANT_SUSPENDED` | 403 | Tenant account suspended |
| `TENANT_REQUIRED` | 400 | Tenant context required but not provided |
| `PLAN_LIMIT_REACHED` | 403 | Subscription plan limit exceeded |
| `FEATURE_NOT_AVAILABLE` | 403 | Feature not included in current plan |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Dependency unavailable |

## Rate Limiting

Sliding window rate limiting using Redis sorted sets.

### Rate Limit Tiers

| Tier | Limit | Window | Applies To |
|------|-------|--------|------------|
| Per-IP | 100 requests | 60 seconds | All endpoints |
| Auth endpoints | 10 requests | 60 seconds | `/auth/*` |
| Upload endpoints | 20 requests | 60 seconds | `/uploads/*` |
| Per-tenant | 1000 requests | 60 seconds | All tenant-scoped requests |
| Per-user | 300 requests | 60 seconds | All authenticated requests |

### Rate Limit Headers

Every response includes:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1710518460
```

When rate limited (429):

```
Retry-After: 30
```

### Behavior

- Rate limiting fails open on Redis errors (requests are allowed)
- `X-Forwarded-For` is respected for proxy/load balancer setups
- Admin users bypass tenant-level rate limits

## Correlation & Tracing

Every request is assigned a correlation ID:

```
# Client can send their own
X-Correlation-ID: my-request-123

# Or one is auto-generated
X-Correlation-ID: abc-123-def-456
```

The correlation ID appears in:
- Response headers (`X-Correlation-ID`)
- Response body (`traceId` field)
- Structured logs (for request tracing)

## File Uploads

### Direct Upload

```
POST /api/v1/uploads
Content-Type: multipart/form-data
Authorization: Bearer <token>
X-Tenant-ID: <uuid>

file: <binary>
folder: images
```

Response:
```json
{
  "success": true,
  "data": {
    "key": "tenant-uuid/images/file-uuid-original-name.jpg",
    "url": "https://presigned-url...",
    "size": 245760,
    "mimeType": "image/jpeg"
  }
}
```

### Presigned Upload URL

```
POST /api/v1/uploads/presigned
{
  "filename": "photo.jpg",
  "mimeType": "image/jpeg",
  "folder": "images"
}
```

### Constraints

- Max file size: 10 MB
- Allowed MIME types: images (JPEG, PNG, GIF, WebP, SVG), documents (PDF), videos (MP4, WebM)
- Extension must match MIME type
- Files are stored with tenant-scoped keys: `{tenantId}/{folder}/{uuid}-{filename}`

## Health Checks

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `GET /api/v1/health` | Liveness probe (always 200) | Public |
| `GET /api/v1/health/ready` | Readiness probe (checks all deps) | Public |

Readiness checks: PostgreSQL, Redis, MinIO, Meilisearch, disk space, memory heap.

## Swagger Documentation

Available in non-production environments at:

```
http://localhost:3333/api/docs
```
