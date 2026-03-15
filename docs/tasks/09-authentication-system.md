# Task 09: Authentication — JWT + Refresh + 3 User Types

## Summary
Implement the full authentication system supporting three user types (AdminUser, TenantUser, ClientUser) with JWT access tokens, refresh token rotation, and secure password handling.

## Current State
- Database models for AdminUser, TenantUser, ClientUser, RefreshToken (Task 02).
- Configuration with JWT secrets (Task 03).
- Tenant resolution middleware (Task 07).

## Required Changes

### 9.1 Auth Module

**File**: `backend/src/modules/auth/auth.module.ts`

Register:
- `PassportModule` (default strategy: 'jwt')
- `JwtModule` (from config)
- `AuthService`
- `JwtStrategy`
- `AuthController`

### 9.2 JWT Strategy

**File**: `backend/src/modules/auth/jwt.strategy.ts`

Passport JWT strategy:
- Extract token from `Authorization: Bearer <token>`
- Validate expiry, signature
- Payload: `{ sub: userId, userType: 'admin'|'tenant'|'client', tenantId?: string, email: string }`
- Attach decoded payload to `request.user`

### 9.3 Auth Service

**File**: `backend/src/modules/auth/auth.service.ts`

**Endpoints:**

1. **Admin Login** — `POST /api/v1/auth/admin/login`
   - Body: `{ email, password }`
   - Verify against `admin_users` table
   - Check `isActive`
   - Return: `{ accessToken, refreshToken, user: { id, email, role } }`

2. **Tenant User Login** — `POST /api/v1/auth/tenant/login`
   - Body: `{ email, password, tenantSlug }`
   - Resolve tenant by slug
   - Verify against `tenant_users` where `tenantId` + `email`
   - Check `isActive`, tenant `status`
   - Return: `{ accessToken, refreshToken, user: { id, email, role, tenantId } }`

3. **Client Login** — `POST /api/v1/auth/client/login`
   - Body: `{ email, password }`
   - Verify against `client_users`
   - Check `isActive`
   - Return: `{ accessToken, refreshToken, user: { id, email } }`

4. **Client Register** — `POST /api/v1/auth/client/register`
   - Body: `{ email, password, firstName, lastName, phone? }`
   - Check unique email
   - Hash password (bcrypt, 12 rounds)
   - Create `client_users` row
   - Return: `{ accessToken, refreshToken, user }`

5. **Refresh Token** — `POST /api/v1/auth/refresh`
   - Body: `{ refreshToken }`
   - Lookup by hash in `refresh_tokens`
   - Validate expiry
   - **Rotate**: Delete old token, create new one
   - Return: `{ accessToken, refreshToken }`

6. **Logout** — `POST /api/v1/auth/logout`
   - Delete refresh token from DB
   - Return: `{ success: true }`

7. **Me** — `GET /api/v1/auth/me`
   - Return current user profile based on `userType`
   - Include permissions for tenant users

### 9.4 Password Handling

- Hash with `bcrypt` (12 rounds)
- Never log or return password hashes
- Minimum 8 characters, validated in Zod schema

### 9.5 Refresh Token Security

- Store **hashed** (SHA-256) in DB — never store raw tokens
- Token: 64-byte random hex (`crypto.randomBytes(32).toString('hex')`)
- Expiry: 7 days (configurable)
- Single-use: rotated on each refresh
- Track `deviceInfo` and `ipAddress`
- Max 5 active refresh tokens per user (delete oldest on overflow)

### 9.6 JWT Auth Guard

**File**: `backend/src/common/guards/jwt-auth.guard.ts`

- Extends Passport `AuthGuard('jwt')`
- Checks `@Public()` decorator → skip auth
- Returns 401 with `UNAUTHORIZED` or `TOKEN_EXPIRED` error code

### 9.7 Current User Decorator

**File**: `backend/src/common/decorators/current-user.decorator.ts`

```typescript
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  },
);
```

### 9.8 DTOs (Zod)

- `LoginSchema` — `{ email: z.string().email(), password: z.string().min(8) }`
- `TenantLoginSchema` — extends with `tenantSlug`
- `RegisterSchema` — `{ email, password, firstName, lastName, phone? }`
- `RefreshTokenSchema` — `{ refreshToken: z.string() }`

### 9.9 Tests

- Test: Admin login with valid credentials returns tokens
- Test: Admin login with wrong password returns 401
- Test: Admin login with disabled account returns 403
- Test: Tenant login resolves correct tenant
- Test: Tenant login with wrong tenant returns 404
- Test: Client registration creates user and returns tokens
- Test: Client registration with duplicate email returns 409
- Test: Refresh token rotation works (old token invalidated)
- Test: Expired refresh token returns 401
- Test: Max 5 refresh tokens per user (oldest deleted)
- Test: Logout deletes refresh token
- Test: `GET /me` returns correct user for each type
- Test: Protected route returns 401 without token
- Test: Protected route returns 401 with expired token
- Test: `@Public()` routes accessible without token

## Acceptance Criteria

1. Three separate login flows for admin, tenant, client
2. Client self-registration with email uniqueness check
3. JWT access tokens (15m expiry) + refresh tokens (7d, rotated)
4. Refresh tokens stored hashed, single-use, max 5 per user
5. `@Public()` decorator skips auth
6. `@CurrentUser()` decorator extracts user from JWT
7. All tests pass
