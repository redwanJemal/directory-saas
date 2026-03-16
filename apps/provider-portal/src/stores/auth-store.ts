import { create } from 'zustand';
import { api } from '@/lib/api';
import type { AuthState, AuthActions, AuthResponse, TenantLoginCredentials, User } from '@/lib/auth-types';
import { useTenantStore } from '@/stores/tenant-store';

const TOKEN_KEY = 'saas_provider_token';
const REFRESH_KEY = 'saas_provider_refresh_token';
const USER_KEY = 'saas_provider_user';

function loadFromStorage(): Partial<AuthState> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? (JSON.parse(userStr) as User) : null;
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

  login: async (credentials: TenantLoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ data: AuthResponse }>('/auth/tenant/login', credentials);
      const { accessToken, refreshToken, user } = response.data.data;
      saveToStorage(accessToken, refreshToken, user);
      // Set tenant context from user info
      if (user.tenantId && user.tenantSlug) {
        useTenantStore.getState().setTenant({
          id: user.tenantId,
          slug: user.tenantSlug,
          name: user.tenantSlug, // Use slug as fallback name
        });
      }
      set({
        user,
        token: accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      const message = axiosError.response?.data?.error?.message || 'Login failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: () => {
    const { token } = get();
    if (token) {
      api.post('/auth/logout').catch(() => {});
    }
    clearStorage();
    useTenantStore.getState().clearTenant();
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
      const axios = (await import('axios')).default;
      const baseURL = api.defaults.baseURL;
      const response = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
        `${baseURL}/auth/refresh`,
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
