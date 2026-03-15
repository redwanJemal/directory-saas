# Task 04: Exception Handling & Error Response Format

## Summary
Implement a global exception filter that catches all errors and returns structured, consistent error responses. Define error codes, handle validation errors specially, and ensure no stack traces leak in production.

## Current State
- NestJS app running with default exception handling (Task 01).
- `ServiceResult<T>` class exists.

## Required Changes

### 4.1 Error Codes

**File**: `backend/src/common/constants/error-codes.ts`

Define all error codes as a const object (see coding standards). Every error code maps to a default HTTP status:

```typescript
export const ErrorCodeHttpStatus: Record<string, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TOKEN_EXPIRED: 401,
  INVALID_CREDENTIALS: 401,
  ACCOUNT_DISABLED: 403,
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  CONFLICT: 409,
  TENANT_NOT_FOUND: 404,
  TENANT_SUSPENDED: 403,
  TENANT_REQUIRED: 400,
  PLAN_LIMIT_REACHED: 403,
  FEATURE_NOT_AVAILABLE: 403,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
```

### 4.2 Custom Exceptions

**File**: `backend/src/common/exceptions/app.exception.ts`

```typescript
export class AppException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly details?: any,
    statusCode?: number,
  ) {
    super({ errorCode, message, details }, statusCode ?? ErrorCodeHttpStatus[errorCode] ?? 500);
  }
}
```

### 4.3 Global Exception Filter

**File**: `backend/src/common/filters/global-exception.filter.ts`

Catches:
1. `AppException` → structured error with code + details
2. `ZodError` → `VALIDATION_ERROR` with field-level details
3. `HttpException` (NestJS built-in) → map to nearest error code
4. `PrismaClientKnownRequestError` → map P2002 to `ALREADY_EXISTS`, P2025 to `NOT_FOUND`, etc.
5. Unknown errors → `INTERNAL_ERROR` (log full stack, return generic message)

**Response format** (always):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "timestamp": "2026-03-15T12:00:00Z",
  "traceId": "correlation-id-from-header"
}
```

**Production safety:**
- Never include stack traces
- Never include internal error messages for 500s
- Log full error details server-side

### 4.4 Zod Validation Pipe

**File**: `backend/src/common/pipes/zod-validation.pipe.ts`

```typescript
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppException('VALIDATION_ERROR', 'Validation failed',
        result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      );
    }
    return result.data;
  }
}
```

### 4.5 Update ServiceResult

Update `ServiceResult<T>.toHttpException()` to return `AppException`:
```typescript
toHttpException(): AppException {
  return new AppException(this.error.code, this.error.message, this.error.details);
}
```

### 4.6 Tests

- Test: `AppException` returns correct HTTP status for each error code
- Test: Global filter catches `ZodError` and formats field errors
- Test: Global filter catches Prisma unique constraint violation → 409
- Test: Global filter catches unknown error → 500 without stack trace
- Test: `ZodValidationPipe` validates and transforms input
- Test: `ZodValidationPipe` rejects invalid input with field-level errors

## Acceptance Criteria

1. All error responses follow the standard envelope format
2. Zod validation errors include per-field messages
3. Prisma errors are mapped to user-friendly codes
4. No stack traces in production responses
5. `traceId` included in every error response (from correlation ID)
6. All tests pass
