import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';

export function ProtectedRoute() {
  const { t } = useTranslation();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
