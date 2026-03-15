import { Routes, Route, Navigate } from 'react-router';
import { LoginPage } from '@/features/auth/login-page';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { TenantsPage } from '@/features/tenants/tenants-page';
import { UsersPage } from '@/features/users/users-page';
import { RolesPage } from '@/features/roles/roles-page';
import { SubscriptionsPage } from '@/features/subscriptions/subscriptions-page';
import { AuditLogsPage } from '@/features/audit-logs/audit-logs-page';
import { JobsPage } from '@/features/jobs/jobs-page';
import { SettingsPage } from '@/features/settings/settings-page';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
