# Task 05: Request/Response Envelope & API Conventions

## Summary
Implement the `TransformInterceptor` that wraps all successful responses in the standard envelope format with pagination support. Create shared response types for frontend consumption.

## Current State
- NestJS app with global exception filter (Task 04) handling errors.
- Success responses are raw (not wrapped).

## Required Changes

### 5.1 Transform Interceptor

**File**: `backend/src/common/interceptors/transform.interceptor.ts`

Wraps all controller returns in:
```json
{
  "success": true,
  "data": <controller return value>,
  "timestamp": "ISO-8601",
  "traceId": "correlation-id"
}
```

**Pagination detection**: If the controller returns an object with `{ items, total, page, pageSize }` (a `PaginatedResult<T>`), wrap as:
```json
{
  "success": true,
  "data": [items...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8
  },
  "timestamp": "...",
  "traceId": "..."
}
```

### 5.2 Pagination Utilities

**File**: `backend/src/common/dto/pagination.dto.ts`

```typescript
export class PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }
}

export function paginate<T>(items: T[], total: number, query: { page: number; pageSize: number }): PaginatedResult<T> {
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
}
```

### 5.3 Response Types (Shared)

**File**: `backend/src/common/types/api-response.types.ts`

```typescript
export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  traceId: string;
}

export interface ApiPagedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  timestamp: string;
  traceId: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  timestamp: string;
  traceId: string;
}
```

### 5.4 Frontend API Types (copy to all apps)

**File**: `apps/web/src/lib/types.ts` (and provider-portal, admin)

Same types as backend — shared contract. These should be identical.

### 5.5 Tests

- Test: Interceptor wraps plain object in success envelope
- Test: Interceptor wraps `PaginatedResult` with pagination metadata
- Test: Interceptor adds timestamp and traceId
- Test: Interceptor does NOT wrap null/undefined (204 No Content)
- Test: `paginate()` utility calculates totalPages correctly
- Test: `paginate()` handles edge cases (0 items, 1 item, exact page boundary)

## Acceptance Criteria

1. Every successful response is wrapped in `{ success, data, timestamp, traceId }`
2. Paginated responses include `pagination` object
3. Frontend types match backend response format exactly
4. Interceptor is registered globally
5. 204 responses (void returns) are not wrapped
6. All tests pass
