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
      user: { id: '1', email: 'test@test.com', name: 'Test', type: 'client' },
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
      user: { id: '1', email: 'test@test.com', name: 'Test', type: 'client' },
    });
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should clear state on logout', () => {
    useAuthStore.getState().setAuth({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { id: '1', email: 'test@test.com', name: 'Test', type: 'client' },
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
      user: { id: '1', email: 'test@test.com', name: 'Test', type: 'client' },
    });
    useAuthStore.getState().logout();
    expect(localStorage.removeItem).toHaveBeenCalled();
  });

  it('should clear error on clearError', () => {
    useAuthStore.setState({ error: 'some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
