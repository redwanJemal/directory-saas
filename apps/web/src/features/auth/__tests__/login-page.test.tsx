import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import { LoginPage } from '../login-page';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/lib/branding', () => ({
  brand: { name: 'Test App', shortName: 'TA', tagline: 'Test' },
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

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('shows validation error for empty password', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('auth.email'), 'test@test.com');
    await user.click(screen.getByRole('button', { name: 'auth.login' }));

    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });
});
