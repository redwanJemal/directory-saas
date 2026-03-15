# Task 40: Frontend Testing & Build Validation

## Summary
Set up frontend testing infrastructure (Vitest + Testing Library + MSW), write foundational tests, configure linting, and validate that all 3 apps build cleanly. This is the final frontend task that ensures code quality and correctness.

## Current State
- All 3 apps have complete UI: components, layouts, pages, auth, i18n (Tasks 28-39)
- No test framework installed in any frontend app
- No ESLint config in web or provider-portal apps (admin may have basic one)
- No Prettier config for frontend apps
- Each app has `"build": "tsc -b && vite build"` script
- Backend has 729 tests with Jest — frontend has zero tests

## Required Changes

### 40.1 Install Test Dependencies

Run in each app directory (`apps/web`, `apps/admin`, `apps/provider-portal`):

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw@latest @vitest/coverage-v8
```

### 40.2 Configure Vitest

Update `vite.config.ts` in each app to add Vitest configuration:

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000, // or 3001, 3002 depending on app
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx', 'src/vite-env.d.ts'],
    },
    css: false, // Skip CSS processing in tests
  },
});
```

### 40.3 Test Setup File

Create `src/test/setup.ts` in each app:

```typescript
import '@testing-library/jest-dom/vitest';

// Mock matchMedia for tests that need it (theme, media queries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Reset mocks between tests
afterEach(() => {
  vi.restoreAllMocks();
  localStorageMock.clear();
});
```

### 40.4 Test Utilities — Custom Render

Create `src/test/utils.tsx` in each app:

```typescript
import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  if (options?.route) {
    window.history.pushState({}, 'Test page', options.route);
  }
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
export { default as userEvent } from '@testing-library/user-event';
```

### 40.5 MSW Handlers

Create `src/test/mocks/handlers.ts` in each app:

```typescript
import { http, HttpResponse } from 'msw';

const BASE_URL = '/api/v1';

export const handlers = [
  // Auth endpoints
  http.post(`${BASE_URL}/auth/admin/login`, async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'admin@test.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user: {
            id: '1',
            email: 'admin@test.com',
            name: 'Test Admin',
            type: 'admin',
          },
        },
      });
    }
    return HttpResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } },
      { status: 401 },
    );
  }),

  http.post(`${BASE_URL}/auth/tenant/login`, async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'provider@test.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user: {
            id: '2',
            email: 'provider@test.com',
            name: 'Test Provider',
            type: 'tenant',
            tenantId: 'tenant-1',
            tenantSlug: 'test-tenant',
          },
        },
      });
    }
    return HttpResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } },
      { status: 401 },
    );
  }),

  http.post(`${BASE_URL}/auth/client/login`, async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'client@test.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user: {
            id: '3',
            email: 'client@test.com',
            name: 'Test Client',
            type: 'client',
          },
        },
      });
    }
    return HttpResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } },
      { status: 401 },
    );
  }),

  http.get(`${BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        email: 'admin@test.com',
        name: 'Test Admin',
        type: 'admin',
      },
    });
  }),

  http.post(`${BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });
  }),

  http.post(`${BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Tenants (admin)
  http.get(`${BASE_URL}/admin/tenants`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', name: 'Tenant One', slug: 'tenant-one', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
        { id: '2', name: 'Tenant Two', slug: 'tenant-two', status: 'suspended', createdAt: '2026-02-01T00:00:00Z' },
      ],
      pagination: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 },
    });
  }),

  // Health
  http.get(`${BASE_URL}/health/ready`, () => {
    return HttpResponse.json({
      status: 'ok',
      info: { database: { status: 'up' }, redis: { status: 'up' } },
    });
  }),
];
```

Create `src/test/mocks/server.ts` in each app:

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

Update `src/test/setup.ts` to start/stop MSW server:

```typescript
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 40.6 Write Tests

Create these test files in each appropriate app:

**Auth store tests** (`src/stores/__tests__/auth-store.test.ts`):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../auth-store';

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should start unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should set auth data', () => {
    useAuthStore.getState().setAuth({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { id: '1', email: 'test@test.com', name: 'Test', type: 'admin' },
    });
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('token');
    expect(state.user?.email).toBe('test@test.com');
  });

  it('should persist to localStorage on setAuth', () => {
    useAuthStore.getState().setAuth({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { id: '1', email: 'test@test.com', name: 'Test', type: 'admin' },
    });
    // Check localStorage was called
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should clear state on logout', () => {
    useAuthStore.getState().setAuth({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { id: '1', email: 'test@test.com', name: 'Test', type: 'admin' },
    });
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should clear localStorage on logout', () => {
    useAuthStore.getState().setAuth({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { id: '1', email: 'test@test.com', name: 'Test', type: 'admin' },
    });
    useAuthStore.getState().logout();
    expect(localStorage.removeItem).toHaveBeenCalled();
  });

  it('should set error on clearError', () => {
    useAuthStore.setState({ error: 'some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
```

**ProtectedRoute tests** (`src/components/layout/__tests__/protected-route.test.tsx`):

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { ProtectedRoute } from '../protected-route';
import { useAuthStore } from '@/stores/auth-store';
import { Routes, Route } from 'react-router';

describe('ProtectedRoute', () => {
  it('should redirect to /login when unauthenticated', async () => {
    useAuthStore.setState({ isAuthenticated: false, token: null });

    render(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { route: '/' },
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('should render children when authenticated', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'test-token',
      user: { id: '1', email: 'test@test.com', name: 'Test', type: 'admin' },
    });

    render(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { route: '/' },
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
```

**UI component tests** (`src/components/ui/__tests__/button.test.tsx`):

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { Button } from '../button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button.className).toContain('bg-destructive');
  });

  it('renders as child element when asChild', () => {
    render(<Button asChild><a href="/test">Link</a></Button>);
    expect(screen.getByRole('link', { name: 'Link' })).toBeInTheDocument();
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Login page tests** (`src/features/auth/__tests__/login-page.test.tsx`):

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import { LoginPage } from '../login-page';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.login' })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'auth.login' }));

    // Should show validation errors
    expect(screen.getByText(/email/i)).toBeInTheDocument();
  });

  it('shows validation error for empty password', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('auth.email'), 'test@test.com');
    await user.click(screen.getByRole('button', { name: 'auth.login' }));

    // Should show password validation error
    expect(screen.getByText(/password/i)).toBeInTheDocument();
  });
});
```

**Theme hook tests** (`src/hooks/__tests__/use-theme.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../use-theme';

describe('useTheme', () => {
  it('defaults to system theme', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('system');
  });

  it('sets and persists theme', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
    expect(localStorage.setItem).toHaveBeenCalledWith('saas_theme', 'dark');
  });
});
```

**Shared hook tests** (`src/hooks/__tests__/use-debounce.test.ts`):

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } },
    );

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('updated');

    vi.useRealTimers();
  });
});
```

**Data table tests** (`src/components/data-table/__tests__/data-table.test.tsx`):

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { DataTable } from '../data-table';
import { type ColumnDef } from '@tanstack/react-table';

interface TestData {
  id: string;
  name: string;
}

const columns: ColumnDef<TestData, any>[] = [
  { accessorKey: 'name', header: 'Name' },
];

describe('DataTable', () => {
  it('renders data rows', () => {
    const data = [
      { id: '1', name: 'Item One' },
      { id: '2', name: 'Item Two' },
    ];
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Item One')).toBeInTheDocument();
    expect(screen.getByText('Item Two')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('No results.')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading', () => {
    render(<DataTable columns={columns} data={[]} isLoading />);
    // Should show skeleton elements
    expect(screen.queryByText('No results.')).not.toBeInTheDocument();
  });
});
```

### 40.7 Add Test Scripts to package.json

Update each app's `package.json`:

```json
{
  "scripts": {
    "dev": "vite --port 3000",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage"
  }
}
```

### 40.8 ESLint Configuration

Create or update `.eslintrc.cjs` (or `eslint.config.js` for flat config) in each app:

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

Install ESLint dependencies if needed:
```bash
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks eslint-plugin-react-refresh
```

### 40.9 Prettier Configuration

Create `.prettierrc` in each app (or use root config if exists):

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### 40.10 Build Validation

Run the following to verify all apps build cleanly:

```bash
cd apps/admin && npm run build
cd apps/provider-portal && npm run build
cd apps/web && npm run build
```

All three must complete with 0 errors. Fix any TypeScript errors found.

### 40.11 Run All Tests

```bash
cd apps/admin && npm test
cd apps/provider-portal && npm test
cd apps/web && npm test
```

All tests must pass.

### 40.12 Run Lint

```bash
cd apps/admin && npm run lint
cd apps/provider-portal && npm run lint
cd apps/web && npm run lint
```

Fix any lint errors (warnings are acceptable).

### 40.13 Update CLAUDE.md

Update the root `CLAUDE.md` file to add frontend testing commands and patterns:

Add to the **Common Commands** section:
```bash
# Frontend Testing
cd apps/admin && npm test              # Admin unit tests
cd apps/provider-portal && npm test    # Provider unit tests
cd apps/web && npm test                # Web unit tests
cd apps/admin && npm run test:cov      # Coverage report
cd apps/web && npm run test:watch      # Watch mode
```

Add to the **Key Patterns** section information about:
- Frontend file structure (features/, components/ui/, components/layout/, hooks/, stores/, i18n/, lib/, test/)
- Component pattern (shadcn/ui based, using cn(), CSS variable themes)
- Auth store pattern (Zustand + localStorage)
- Data fetching pattern (TanStack Query hooks in features/*/hooks/)
- Form validation pattern (Zod schemas + manual error display)
- i18n pattern (useTranslation hook, translation keys)

## Acceptance Criteria
- [ ] Vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, msw installed in all 3 apps
- [ ] Vitest configured in vite.config.ts with jsdom environment and setup file
- [ ] Test setup file (`src/test/setup.ts`) mocks matchMedia, localStorage, and integrates MSW server
- [ ] Custom render utility (`src/test/utils.tsx`) wraps components with QueryClient, Router providers
- [ ] MSW handlers mock auth endpoints (login, me, refresh, logout) and sample data endpoints
- [ ] Auth store tests: login, logout, setAuth, clearError, localStorage persistence
- [ ] ProtectedRoute tests: redirect when unauthenticated, render when authenticated
- [ ] Button component tests: renders, variants, disabled state
- [ ] Login page tests: renders form, validation errors on empty submit
- [ ] Theme hook tests: default to system, set/persist theme
- [ ] useDebounce hook tests: returns initial value, debounces updates
- [ ] Data table tests: renders data, empty state, loading state
- [ ] `npm test` passes in all 3 apps
- [ ] `npm run build` succeeds with 0 errors in all 3 apps
- [ ] `npm run lint` has 0 errors in all 3 apps
- [ ] CLAUDE.md updated with frontend testing commands and patterns
- [ ] All test scripts (`test`, `test:watch`, `test:cov`) added to package.json

## Files to Create/Modify
For each app (`apps/admin`, `apps/provider-portal`, `apps/web`):
- `vite.config.ts` (modify — add Vitest config)
- `src/test/setup.ts` (create)
- `src/test/utils.tsx` (create)
- `src/test/mocks/handlers.ts` (create)
- `src/test/mocks/server.ts` (create)
- `src/stores/__tests__/auth-store.test.ts` (create)
- `src/components/layout/__tests__/protected-route.test.tsx` (create)
- `src/components/ui/__tests__/button.test.tsx` (create)
- `src/features/auth/__tests__/login-page.test.tsx` (create)
- `src/hooks/__tests__/use-theme.test.ts` (create)
- `src/hooks/__tests__/use-debounce.test.ts` (create)
- `src/components/data-table/__tests__/data-table.test.tsx` (create)
- `.eslintrc.cjs` (create or update)
- `.prettierrc` (create)
- `package.json` (modify — add test scripts)
- `/home/redman/directory-saas/CLAUDE.md` (modify — add frontend docs)

## Dependencies
- Tasks 28-39 — all frontend code must be complete before final testing/validation
