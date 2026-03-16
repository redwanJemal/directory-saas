import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { ProtectedRoute } from '../protected-route';
import { useAuthStore } from '@/stores/auth-store';
import { Routes, Route } from 'react-router';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

describe('ProtectedRoute', () => {
  it('should redirect to /login when unauthenticated', async () => {
    useAuthStore.setState({ isAuthenticated: false, token: null, isLoading: false });

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
      user: { id: '1', email: 'test@test.com', name: 'Test', type: 'client' },
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
