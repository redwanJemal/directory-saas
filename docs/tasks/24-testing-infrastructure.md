# Task 24: Testing Infrastructure — Jest Unit + E2E + Factories

## Summary
Set up comprehensive testing infrastructure: Jest configuration, test database, data factories, E2E test harness, and coverage reporting.

## Current State
- Jest installed (Task 01).
- Basic test files exist.

## Required Changes

### 24.1 Jest Configuration

**File**: `backend/jest.config.ts`

```typescript
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: { '@/(.*)': '<rootDir>/$1' },
};
```

**E2E config**: `backend/test/jest-e2e.json` — separate config for E2E tests with longer timeout.

### 24.2 Test Database

**File**: `backend/test/setup.ts`

- Use separate database: `directory_saas_test`
- Run migrations before test suite
- Truncate all tables between tests (transaction rollback or TRUNCATE CASCADE)
- Seed minimal required data

```typescript
export async function setupTestDb() {
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });
  await prisma.$executeRaw`TRUNCATE TABLE ... CASCADE`;
  return prisma;
}
```

### 24.3 Test Factories

**File**: `backend/test/factories/`

```typescript
// factories/tenant.factory.ts
export function createTenantFactory(overrides?: Partial<Tenant>): CreateTenantDto {
  return {
    name: `Test Tenant ${randomId()}`,
    slug: `test-${randomId()}`,
    status: 'ACTIVE',
    ...overrides,
  };
}

// factories/user.factory.ts
export function createTenantUserFactory(tenantId: string, overrides?: Partial<TenantUser>): CreateTenantUserDto {
  return {
    tenantId,
    email: `user-${randomId()}@test.com`,
    firstName: 'Test',
    lastName: 'User',
    password: 'TestPassword123!',
    ...overrides,
  };
}
```

Factories for: Tenant, TenantUser, ClientUser, AdminUser, Role, Permission, SubscriptionPlan.

### 24.4 E2E Test Harness

**File**: `backend/test/app.e2e-spec.ts`

```typescript
describe('App E2E', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let tenantToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .compile();
    app = module.createNestApplication();
    // Apply same middleware as main.ts
    await app.init();
    prisma = app.get(PrismaService);

    // Create test admin + tenant + get tokens
    adminToken = await getAdminToken(app);
    tenantToken = await getTenantToken(app);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### 24.5 Test Helpers

**File**: `backend/test/helpers/`

- `auth.helper.ts` — `getAdminToken()`, `getTenantToken()`, `getClientToken()`
- `request.helper.ts` — Pre-configured supertest with auth headers
- `assertion.helper.ts` — Custom matchers for API response envelope

### 24.6 Coverage Configuration

Minimum coverage thresholds:
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 75,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### 24.7 NPM Scripts

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config test/jest-e2e.json",
  "test:e2e:watch": "jest --config test/jest-e2e.json --watch"
}
```

## Acceptance Criteria

1. Jest configured for unit and E2E tests
2. Test database with auto-migration and cleanup
3. Factories for all core entities
4. E2E harness with auth helpers
5. Coverage reporting with thresholds
6. `npm test` and `npm run test:e2e` both pass
