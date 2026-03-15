import { Routes, Route, Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LoginPage } from '@/features/auth/login-page';
import { ProtectedRoute } from '@/components/layout/protected-route';

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
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPlaceholder />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
