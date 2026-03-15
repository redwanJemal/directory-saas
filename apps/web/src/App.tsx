import { Routes, Route, Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LoginPage } from '@/features/auth/login-page';
import { RegisterPage } from '@/features/auth/register-page';
import { ProtectedRoute } from '@/components/layout/protected-route';

function LandingPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">{t('common.appName')}</h1>
        <p className="mt-2 text-muted-foreground">{t('landing.heroSubtitle')}</p>
      </div>
    </div>
  );
}

function DashboardPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
    </div>
  );
}

export default function App() {
  return (
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
  );
}
