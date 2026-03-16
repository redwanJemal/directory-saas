import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Lazy import to avoid circular dependencies
let getAuthStore: (() => { token: string | null; refreshAccessToken: () => Promise<string | null>; logout: () => void }) | null = null;
let getTenantStore: (() => { tenantId: string | null }) | null = null;

export function initializeApiAuth(storeGetter: typeof getAuthStore) {
  getAuthStore = storeGetter;
}

export function initializeApiTenant(storeGetter: typeof getTenantStore) {
  getTenantStore = storeGetter;
}

// Request interceptor — attach auth token
api.interceptors.request.use((config) => {
  if (getAuthStore) {
    const { token } = getAuthStore();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  if (getTenantStore) {
    const { tenantId } = getTenantStore();
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
  }
  return config;
});

// Response interceptor — handle 401 with token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
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

    if (error.response?.status === 401 && !originalRequest._retry && getAuthStore) {
      const store = getAuthStore();

      // Don't attempt refresh if user has no token (unauthenticated)
      if (!store.token) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
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

    return Promise.reject(error);
  },
);
