# Task 01: Project Scaffolding — NestJS Monorepo + Prisma + Docker

## Summary
Initialize the full project structure: NestJS backend, three React frontends (web, provider-portal, admin), Expo mobile placeholder, Docker infrastructure, and all tooling (ESLint, Prettier, TypeScript, Husky).

## Current State
- Empty `/home/redman/directory-saas/` directory with only `scripts/` and `docs/` folders.

## Required Changes

### 1.1 Backend — NestJS

Create NestJS application at `backend/`:

```
backend/
├── src/
│   ├── common/
│   │   ├── decorators/       # Empty, placeholder
│   │   ├── dto/              # Empty, placeholder
│   │   ├── filters/          # Empty, placeholder
│   │   ├── guards/           # Empty, placeholder
│   │   ├── interceptors/     # Empty, placeholder
│   │   ├── middleware/        # Empty, placeholder
│   │   ├── pipes/            # Empty, placeholder
│   │   ├── services/         # Empty, placeholder
│   │   ├── types/            # index.ts with ServiceResult<T>
│   │   └── constants/        # Empty, placeholder
│   ├── modules/              # Empty, placeholder
│   ├── config/               # Empty, placeholder
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── jest-e2e.json
│   └── app.e2e-spec.ts
├── prisma/
│   └── schema.prisma          # Minimal schema (just datasource + generator)
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .eslintrc.js
├── .prettierrc
└── jest.config.ts
```

**Dependencies to install:**
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`
- `@nestjs/config`
- `@prisma/client`, `prisma` (dev)
- `zod`
- `@nestjs/swagger`, `swagger-ui-express`
- `helmet`, `compression`
- `class-transformer` (only for Swagger — Zod for actual validation)
- `rxjs`, `reflect-metadata`
- `jest`, `@nestjs/testing`, `supertest`, `ts-jest` (dev)
- `eslint`, `prettier`, `@typescript-eslint/*` (dev)
- `husky`, `lint-staged` (dev)

**main.ts** should:
- Set global prefix `/api/v1`
- Enable CORS (configurable origins)
- Use `helmet()`
- Use `compression()`
- Setup Swagger at `/api/docs`
- Listen on `APP_PORT` (default 3000)

**PrismaService** should:
- Extend `PrismaClient`
- Implement `OnModuleInit` (connect on init)
- Implement `OnModuleDestroy` (disconnect on destroy)
- Enable query logging in development

**ServiceResult<T>** utility class:
```typescript
export class ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: any };

  static ok<T>(data: T): ServiceResult<T>;
  static fail<T>(code: string, message: string, details?: any): ServiceResult<T>;
  toHttpException(): HttpException;
}
```

### 1.2 Frontend — Web (End Client)

Create React SPA at `apps/web/`:
- Vite 7 + React 19 + TypeScript
- Tailwind CSS 4
- React Router v7
- TanStack Query 5
- Zustand
- Zod
- Minimal setup: `App.tsx` with router, `main.tsx`, `index.html`
- `src/lib/api.ts` — Axios instance with interceptor placeholder
- `src/lib/types.ts` — `ApiResponse<T>`, `ApiPagedResponse<T>` types

### 1.3 Frontend — Provider Portal

Create React SPA at `apps/provider-portal/`:
- Same stack as web app
- Separate Vite config, separate entry point
- Placeholder `Dashboard.tsx`

### 1.4 Frontend — Admin

Create React SPA at `apps/admin/`:
- Same stack as web app
- Placeholder `Dashboard.tsx`

### 1.5 Docker

Create `docker/`:
```
docker/
├── docker-compose.yml         # Dev: postgres, redis, minio, meilisearch, mailpit
├── postgres/
│   └── init.sql               # Create extensions (uuid-ossp, pgvector)
└── .env.example               # Template for all env vars
```

### 1.6 Root Files

- `package.json` — Workspace root with scripts: `dev:backend`, `dev:web`, `dev:admin`, `dev:provider`, `docker:up`, `docker:down`
- `.gitignore` — Node, Prisma, Docker, env, IDE
- `.nvmrc` — Node 22
- `.env.example` — All env vars with descriptions
- `CLAUDE.md` — Minimal project context (expanded in task 27)

## Acceptance Criteria

1. `cd backend && npm install && npm run build` succeeds
2. `cd backend && npm run start:dev` starts and responds on `/api/v1` with 404 (no routes yet)
3. `GET /api/docs` shows Swagger UI
4. `cd apps/web && npm install && npm run dev` starts Vite on :3000
5. `cd apps/provider-portal && npm install && npm run dev` starts Vite on :3001
6. `cd apps/admin && npm install && npm run dev` starts Vite on :3002
7. `cd docker && docker compose up -d` starts postgres, redis, minio, meilisearch, mailpit
8. `npx prisma generate` succeeds in backend/
9. ESLint + Prettier configured and working
10. All placeholder directories created
11. `.gitignore` covers all generated files
12. `ServiceResult<T>` class implemented with tests
