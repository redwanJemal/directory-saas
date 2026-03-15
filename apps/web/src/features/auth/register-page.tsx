import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { registerSchema, type RegisterFormData } from '@/lib/auth-schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { brand } from '@/lib/branding';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldErrors({});

    const result = registerSchema.safeParse(formData);
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
      await register({ name: result.data.name, email: result.data.email, password: result.data.password });
      navigate('/dashboard', { replace: true });
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
          <CardTitle className="text-2xl">{t('auth.registerTitle')}</CardTitle>
          <CardDescription>{t('auth.registerSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{t('auth.name')}</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                disabled={isLoading}
              />
              {fieldErrors.name && (
                <p className="text-sm text-destructive">{fieldErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={isLoading}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.registering') : t('auth.register')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              {t('auth.login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
