# Task 03: Configuration & Environment Management

## Summary
Implement strongly-typed configuration with Zod validation, environment-specific overrides, and fail-fast behavior for missing required variables.

## Current State
- NestJS app with `@nestjs/config` installed (Task 01).
- `.env.example` exists with placeholder values.

## Required Changes

### 3.1 Configuration Schemas

**File**: `backend/src/config/config.schema.ts`

Define Zod schemas for all config sections:

```typescript
export const configSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_PORT: z.coerce.number().default(3000),
  APP_NAME: z.string().default('Directory SaaS'),
  API_PREFIX: z.string().default('api/v1'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001,http://localhost:3002'),

  // MinIO / S3
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('directory-saas'),
  S3_REGION: z.string().default('us-east-1'),

  // Meilisearch
  MEILISEARCH_URL: z.string().default('http://localhost:7700'),
  MEILISEARCH_API_KEY: z.string().default(''),

  // Email (SMTP)
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@directory-saas.local'),

  // Rate Limiting
  THROTTLE_TTL: z.coerce.number().default(60),    // seconds
  THROTTLE_LIMIT: z.coerce.number().default(100),  // requests per TTL

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'log', 'debug', 'verbose']).default('log'),
});
```

### 3.2 Configuration Loader

**File**: `backend/src/config/config.loader.ts`

- Parse `.env` with `@nestjs/config`
- Validate with Zod schema on startup
- **Fail fast**: If validation fails, log detailed errors and exit process
- Export typed config getter

### 3.3 Typed Config Service

**File**: `backend/src/config/app-config.service.ts`

```typescript
@Injectable()
export class AppConfigService {
  get database(): { url: string };
  get redis(): { host: string; port: number; password?: string };
  get jwt(): { secret: string; expiration: string; refreshSecret: string; refreshExpiration: string };
  get cors(): { origins: string[] };
  get s3(): { endpoint: string; accessKey: string; secretKey: string; bucket: string; region: string };
  get smtp(): { host: string; port: number; user: string; pass: string; from: string };
  get throttle(): { ttl: number; limit: number };
  get isProduction(): boolean;
  get isDevelopment(): boolean;
}
```

### 3.4 Environment Files

- `.env.example` — All variables with descriptions, safe defaults
- `.env.test` — Test-specific overrides (test DB, lower limits)
- `backend/.env` added to `.gitignore`

### 3.5 Tests

- Unit test: Config validation rejects missing required vars
- Unit test: Config validation applies defaults correctly
- Unit test: Config validation rejects invalid types

## Acceptance Criteria

1. App fails fast on startup if `DATABASE_URL` or `JWT_SECRET` is missing
2. All config accessed via typed `AppConfigService` — no raw `process.env`
3. Zod validation runs on startup with clear error messages
4. `.env.example` documents every variable
5. Tests cover validation success and failure paths
