import { create } from 'zustand';
import { api, tokenStorage } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  type: 'client';
  tenantId?: string;
  tenantSlug?: string;
  role?: {
    id: string;
    name: string;
    permissions: string[];
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await api.get('/auth/me');
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ error: null });
      const response = await api.post('/auth/client/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;
      await tokenStorage.setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string }; message?: string } } };
      const message =
        axiosError.response?.data?.error?.message ||
        axiosError.response?.data?.message ||
        'Login failed';
      set({ error: message });
      throw error;
    }
  },

  register: async (data) => {
    try {
      set({ error: null });
      const response = await api.post('/auth/client/register', data);
      const { accessToken, refreshToken, user } = response.data;
      await tokenStorage.setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string }; message?: string } } };
      const message =
        axiosError.response?.data?.error?.message ||
        axiosError.response?.data?.message ||
        'Registration failed';
      set({ error: message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    }
    await tokenStorage.clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data });
    } catch {
      // Silently fail
    }
  },

  clearError: () => set({ error: null }),
}));
