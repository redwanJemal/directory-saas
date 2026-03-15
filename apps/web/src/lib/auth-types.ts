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
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  setAuth: (data: AuthResponse) => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
  refreshAccessToken: () => Promise<string | null>;
}
