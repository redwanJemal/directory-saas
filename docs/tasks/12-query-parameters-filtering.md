# Task 12: Query Parameters — Filters, Sorting, Pagination, Includes

## Summary
Implement a powerful, reusable query parameter system with bracket-notation filters, multi-value support, type-safe sorting, cursor/offset pagination, and relation includes. This is the core of every list endpoint.

## Current State
- NestJS app with response envelope and pagination utilities (Task 05).
- PaginatedResult<T> exists.

## Required Changes

### 12.1 Query Parameters DTO

**File**: `backend/src/common/dto/query-parameters.dto.ts`

Parse query strings like:
```
?filter[status]=active,verified
&filter[category]=photography,catering,venue
&filter[rating][gte]=4.0
&filter[price][gte]=100&filter[price][lte]=5000
&filter[city]=addis-ababa
&filter[createdAt][gte]=2026-01-01
&search=wedding photographer
&sort=-rating,name
&page=2&pageSize=25
&include=reviews,services
```

**Parsed structure:**
```typescript
interface QueryParameters {
  filters: FilterGroup[];     // Parsed from filter[...]
  search?: string;            // Full-text search
  sort: SortField[];          // Parsed from sort=
  page: number;               // Default 1
  pageSize: number;           // Default 20, max 100
  include: string[];          // Relations to eager load
}

interface FilterGroup {
  field: string;              // 'status', 'category', 'rating', etc.
  operator: FilterOperator;   // 'eq', 'in', 'gte', 'lte', etc.
  value: string | string[] | number | boolean | null;
}

type FilterOperator = 'eq' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' |
  'contains' | 'startsWith' | 'endsWith' | 'isNull';

interface SortField {
  field: string;
  direction: 'asc' | 'desc';
}
```

### 12.2 Query Parser Pipe

**File**: `backend/src/common/pipes/query-parameters.pipe.ts`

**Parsing rules:**
1. `filter[field]=value` → `{ field, operator: 'eq', value }`
2. `filter[field]=a,b,c` → `{ field, operator: 'in', value: ['a','b','c'] }`
3. `filter[field][gte]=100` → `{ field, operator: 'gte', value: 100 }`
4. `filter[field][isNull]=true` → `{ field, operator: 'isNull', value: true }`
5. `sort=-rating,name` → `[{ field: 'rating', direction: 'desc' }, { field: 'name', direction: 'asc' }]`
6. `page=2&pageSize=25` → `{ page: 2, pageSize: 25 }` (clamped: page ≥ 1, 1 ≤ pageSize ≤ 100)
7. `include=reviews,services` → `['reviews', 'services']`
8. `search=text` → `{ search: 'text' }`

**Security:**
- Validate field names against an allowlist (per-endpoint)
- Reject unknown operators
- Sanitize values (no SQL injection via filter values)
- Limit filter count (max 20 filters)
- Limit include depth (max 3 relations)

### 12.3 Prisma Query Builder

**File**: `backend/src/common/services/prisma-query-builder.ts`

Convert `QueryParameters` into Prisma `findMany` args:

```typescript
export function buildPrismaQuery(
  params: QueryParameters,
  allowedFilters: AllowedFilter[],
  allowedSorts: string[],
  allowedIncludes: string[],
): {
  where: Record<string, any>;
  orderBy: Record<string, any>[];
  skip: number;
  take: number;
  include?: Record<string, boolean>;
}
```

**Filter mapping to Prisma:**
```typescript
// eq:       { field: value }
// in:       { field: { in: [values] } }
// gt:       { field: { gt: value } }
// gte:      { field: { gte: value } }
// lt:       { field: { lt: value } }
// lte:      { field: { lte: value } }
// contains: { field: { contains: value, mode: 'insensitive' } }
// startsWith: { field: { startsWith: value, mode: 'insensitive' } }
// endsWith: { field: { endsWith: value, mode: 'insensitive' } }
// isNull:   { field: value === 'true' ? null : { not: null } }
```

**Soft delete filter**: Always add `{ deletedAt: null }` unless explicitly filtering by `deletedAt`.

### 12.4 Allowed Filter Configuration

Each module defines its allowed filters:
```typescript
// tenants.controller.ts
const ALLOWED_FILTERS: AllowedFilter[] = [
  { field: 'status', operators: ['eq', 'in'], type: 'enum', values: ['ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED'] },
  { field: 'name', operators: ['eq', 'contains', 'startsWith'], type: 'string' },
  { field: 'createdAt', operators: ['gte', 'lte'], type: 'date' },
];

const ALLOWED_SORTS = ['name', 'createdAt', 'status'];
const ALLOWED_INCLUDES = ['users', 'subscription'];
```

This prevents arbitrary field access and ensures type safety.

### 12.5 Usage in Controller

```typescript
@Get()
async findAll(@Query(new QueryParametersPipe(ALLOWED_FILTERS, ALLOWED_SORTS, ALLOWED_INCLUDES)) query: QueryParameters) {
  const result = await this.service.findAll(tenantId, query);
  return result; // TransformInterceptor wraps with pagination
}
```

### 12.6 Tests

- Test: Parse `filter[status]=active,verified` → `{ operator: 'in', value: ['active', 'verified'] }`
- Test: Parse `filter[rating][gte]=4.0` → `{ operator: 'gte', value: 4.0 }`
- Test: Parse `filter[name][contains]=photo` → `{ operator: 'contains', value: 'photo' }`
- Test: Parse `sort=-rating,name` → correct sort array
- Test: Pagination defaults (page=1, pageSize=20)
- Test: Pagination clamping (pageSize > 100 → 100)
- Test: Include parsing with multiple relations
- Test: Reject unknown filter fields
- Test: Reject unknown operators
- Test: Reject too many filters (> 20)
- Test: Prisma query builder generates correct `where` for each operator
- Test: Prisma query builder adds `deletedAt: null` automatically
- Test: Prisma query builder generates correct `orderBy`
- Test: Prisma query builder generates correct `skip`/`take`
- Test: End-to-end: HTTP request with filters → correct filtered results

## Acceptance Criteria

1. Bracket notation filters with operator support
2. Multi-value filters (comma-separated = IN query)
3. All operators: eq, in, gt, gte, lt, lte, contains, startsWith, endsWith, isNull
4. Sorting with `-` prefix for descending, multiple fields
5. Pagination with page/pageSize, clamped to max 100
6. Include for eager loading relations
7. Per-endpoint allowlists for fields, operators, includes
8. Soft delete filter applied automatically
9. Security: no arbitrary field access, no SQL injection
10. All tests pass
