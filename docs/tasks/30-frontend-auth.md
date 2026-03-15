# Task 30: Frontend Auth — Zustand Store, Login Pages, Protected Routes

## Summary
Implement the complete authentication flow for all 3 frontend apps: Zustand auth stores with localStorage persistence, login/register pages with Zod validation, token refresh interceptors, and protected route wrappers.

## Current State
- All 3 apps have shadcn/ui components (Task 28) and i18n (Task 29)
- Each app has `src/lib/api.ts` with a basic axios client that reads `access_token` from raw localStorage
- No auth store, no login pages, no protected routes, no token refresh logic
- Backend auth endpoints exist: `POST /api/v1/auth/admin/login`, `POST /api/v1/auth/tenant/login`, `POST /api/v1/auth/client/login`, `POST /api/v1/auth/client/register`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- Backend returns JWT access token (15m TTL) + refresh token (7d TTL) with rotation

## Required Changes

### 30.1 Auth Types

Create `src/lib/auth-types.ts` in each app:

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  type: 'admin' | 'tenant' | 'client';
  tenantId?: string;
  tenantSlug?: string;
  role?: {
    id: string;
    name: string;
    permissions: string[];
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TenantLoginCredentials extends LoginCredentials {
  tenantSlug: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (credentials: LoginCredentials | TenantLoginCredentials) => Promise<void>;
  register?: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  setAuth: (data: AuthResponse) => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
  refreshAccessToken: () => Promise<string | null>;
}
```

### 30.2 Zustand Auth Store

Create `src/stores/auth-store.ts` in each app. The store must:
1. Persist `token`, `refreshToken`, and `user` to localStorage
2. Hydrate from localStorage on creation
3. Provide login/logout/refresh actions that call the API

**Admin store** (`apps/admin/src/stores/auth-store.ts`):

```typescript
import { create } from 'zustand';
import { api } from '@/lib/api';
import type { AuthState, AuthActions, AuthResponse, LoginCredentials, User } from '@/lib/auth-types';

const TOKEN_KEY = 'saas_admin_token';
const REFRESH_KEY = 'saas_admin_refresh_token';
const USER_KEY = 'saas_admin_user';

function loadFromStorage(): Partial<AuthState> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) as User : null;
    return {
      token,
      refreshToken,
      user,
      isAuthenticated: !!token && !!user,
    };
  } catch {
    return {};
  }
}

function saveToStorage(token: string | null, refreshToken: string | null, user: User | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  else localStorage.removeItem(REFRESH_KEY);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  ...loadFromStorage(),

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ data: AuthResponse }>('/auth/admin/login', credentials);
      const { accessToken, refreshToken, user } = response.data.data;
      saveToStorage(accessToken, refreshToken, user);
      set({
        user,
        token: accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Login failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: () => {
    const { token } = get();
    // Fire-and-forget logout to backend
    if (token) {
      api.post('/auth/logout').catch(() => {});
    }
    clearStorage();
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  setAuth: (data: AuthResponse) => {
    const { accessToken, refreshToken, user } = data;
    saveToStorage(accessToken, refreshToken, user);
    set({
      user,
      token: accessToken,
      refreshToken,
      isAuthenticated: true,
      error: null,
    });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<{ data: User }>('/auth/me');
      const user = response.data.data;
      set({ user, isLoading: false });
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Token is invalid — clear auth
      get().logout();
    }
  },

  clearError: () => set({ error: null }),

  refreshAccessToken: async () => {
    const { refreshToken: currentRefreshToken } = get();
    if (!currentRefreshToken) {
      get().logout();
      return null;
    }
    try {
      const response = await api.post<{ data: { accessToken: string; refreshToken: string } }>(
        '/auth/refresh',
        { refreshToken: currentRefreshToken },
      );
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      saveToStorage(accessToken, newRefreshToken, get().user);
      set({ token: accessToken, refreshToken: newRefreshToken });
      return accessToken;
    } catch {
      get().logout();
      return null;
    }
  },
}));
```

**Provider store**: Same pattern but:
- Storage keys: `saas_provider_token`, `saas_provider_refresh_token`, `saas_provider_user`
- Login endpoint: `/auth/tenant/login`
- Login credentials include `tenantSlug`

**Web store**: Same pattern but:
- Storage keys: `saas_web_token`, `saas_web_refresh_token`, `saas_web_user`
- Login endpoint: `/auth/client/login`
- Add `register` action calling `POST /auth/client/register`

### 30.3 Update API Client with Token Refresh

Replace `src/lib/api.ts` in each app:

```typescript
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// We import the store lazily to avoid circular dependencies
let getAuthStore: () => any;

export function initializeApiAuth(storeGetter: () => any) {
  getAuthStore = storeGetter;
}

// Request interceptor — attach auth token
api.interceptors.request.use((config) => {
  if (getAuthStore) {
    const { token } = getAuthStore();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle 401 with token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

function processQueue(error: any, token: string | null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh on 401 and if we have the store
    if (error.response?.status === 401 && !originalRequest._retry && getAuthStore) {
      const store = getAuthStore();

      // Check for TOKEN_EXPIRED error code specifically
      const errorCode = (error.response?.data as any)?.error?.code;
      if (errorCode === 'TOKEN_EXPIRED' || error.response?.status === 401) {
        if (isRefreshing) {
          // Queue this request until refresh completes
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await store.refreshAccessToken();
          if (newToken) {
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } else {
            processQueue(new Error('Refresh failed'), null);
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  },
);
```

In each app's `main.tsx`, initialize the API auth after store creation:

```typescript
import { useAuthStore } from '@/stores/auth-store';
import { initializeApiAuth } from '@/lib/api';

// Initialize API auth integration
initializeApiAuth(() => useAuthStore.getState());
```

### 30.4 Zod Validation Schemas for Auth Forms

Create `src/lib/auth-schemas.ts` in each app:

**Admin**:
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

**Provider** (adds tenantSlug):
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
  tenantSlug: z.string().min(1, 'Business ID is required').regex(/^[a-z0-9-]+$/, 'Invalid Business ID format'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

**Web** (adds register schema):
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
```

### 30.5 Login Pages

Create `src/features/auth/login-page.tsx` in each app.

**Admin Login Page** (`apps/admin/src/features/auth/login-page.tsx`):

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { loginSchema, type LoginFormData } from '@/lib/auth-schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { brand } from '@/lib/branding';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await login(result.data);
      navigate('/', { replace: true });
    } catch {
      // Error is set in the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            {brand.shortName}
          </div>
          <CardTitle className="text-2xl">{t('auth.loginTitle')}</CardTitle>
          <CardDescription>{t('auth.loginSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                disabled={isLoading}
              />
              {fieldErrors.email && (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                disabled={isLoading}
              />
              {fieldErrors.password && (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.loggingIn') : t('auth.login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Provider Login**: Same structure but adds `tenantSlug` field (labeled as "Business ID").

**Web Login**: Same structure, plus a link to `/register`. Also create `register-page.tsx` with name, email, password, confirmPassword fields.

### 30.6 ProtectedRoute Component

Create `src/components/layout/protected-route.tsx` in each app:

```typescript
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';

export function ProtectedRoute() {
  const { isAuthenticated, token, fetchMe } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (token) {
        await fetchMe();
      }
      setIsVerifying(false);
    };
    verify();
  }, []); // Only run once on mount

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

### 30.7 Update App Routing

Update `src/App.tsx` in each app to use the auth components:

**Admin** (`apps/admin/src/App.tsx`):
```typescript
import { Routes, Route, Navigate } from 'react-router';
import { LoginPage } from '@/features/auth/login-page';
import { ProtectedRoute } from '@/components/layout/protected-route';

// Placeholder dashboard until Task 31
function DashboardPlaceholder() {
  return <div className="p-8"><h1 className="text-2xl font-bold">Admin Dashboard</h1></div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPlaceholder />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

**Provider**: Same pattern with `/login` → TenantLoginPage, protected routes inside.

**Web**: Public routes (landing, search, vendor profile) are NOT wrapped in ProtectedRoute. Only dashboard routes are protected:
```typescript
<Routes>
  {/* Public routes */}
  <Route path="/" element={<LandingPlaceholder />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  {/* Protected routes */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<DashboardPlaceholder />} />
  </Route>
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

## Acceptance Criteria
- [ ] Zustand auth store exists in all 3 apps with login, logout, setAuth, fetchMe, clearError, refreshAccessToken actions
- [ ] Token, refreshToken, and user persist to localStorage with app-specific keys
- [ ] Auth state hydrates from localStorage on app load (survives page refresh)
- [ ] API client attaches Bearer token to all requests via interceptor
- [ ] 401 responses trigger automatic token refresh → retry original request → logout if refresh fails
- [ ] Concurrent 401s queue and retry after single refresh (no thundering herd)
- [ ] Admin login page: email + password, Zod validation, error display, loading state
- [ ] Provider login page: email + password + tenantSlug, Zod validation
- [ ] Web login page: email + password, with link to register
- [ ] Web register page: name + email + password + confirmPassword, with password match validation
- [ ] ProtectedRoute: redirects to /login when unauthenticated, calls /auth/me to verify token on initial load
- [ ] ProtectedRoute: shows loading spinner while verifying session
- [ ] Logout clears localStorage and Zustand state
- [ ] All forms use i18n translations for labels and error messages
- [ ] All 3 apps build with 0 errors

## Files to Create/Modify
- `apps/admin/src/lib/auth-types.ts` (create)
- `apps/admin/src/lib/auth-schemas.ts` (create)
- `apps/admin/src/stores/auth-store.ts` (create)
- `apps/admin/src/lib/api.ts` (replace)
- `apps/admin/src/features/auth/login-page.tsx` (create)
- `apps/admin/src/components/layout/protected-route.tsx` (create)
- `apps/admin/src/App.tsx` (replace)
- `apps/admin/src/main.tsx` (modify — add initializeApiAuth)
- Same files for `apps/provider-portal/` (with tenant login variant)
- Same files for `apps/web/` (with register page added)
- `apps/web/src/features/auth/register-page.tsx` (create)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components (Button, Input, Label, Card)
- Task 29 (Frontend i18n) — translation strings for auth
