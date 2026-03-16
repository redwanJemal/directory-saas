import { Routes, Route, Navigate } from 'react-router';
import { PublicLayout } from '@/components/layout/public-layout';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoginPage } from '@/features/auth/login-page';
import { RegisterPage } from '@/features/auth/register-page';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { LandingPage } from '@/features/landing/landing-page';
import { VendorSearchPage } from '@/features/search/vendor-search-page';
import { VendorProfilePage } from '@/features/search/vendor-profile-page';
import { CategoriesPage } from '@/features/categories/categories-page';
import { ClientDashboardPage } from '@/features/dashboard/client-dashboard-page';
import { WeddingPage } from '@/features/wedding/wedding-page';
import { GuestListPage } from '@/features/guests/guest-list-page';
import { BudgetPage } from '@/features/budget/budget-page';
import { ChecklistPage } from '@/features/checklist/checklist-page';
import { MyVendorsPage } from '@/features/vendors/my-vendors-page';
import { MessagesPage } from '@/features/messages/messages-page';
import { SettingsPage } from '@/features/settings/settings-page';

export default function App() {
  return (
    <Routes>
      {/* Public routes with PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<VendorSearchPage />} />
        <Route path="/vendors/:vendorId" element={<VendorProfilePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
      </Route>

      {/* Auth routes (no layout wrapper) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<ClientDashboardPage />} />
          <Route path="/dashboard/wedding" element={<WeddingPage />} />
          <Route path="/dashboard/guests" element={<GuestListPage />} />
          <Route path="/dashboard/budget" element={<BudgetPage />} />
          <Route path="/dashboard/checklist" element={<ChecklistPage />} />
          <Route path="/dashboard/vendors" element={<MyVendorsPage />} />
          <Route path="/dashboard/messages" element={<MessagesPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
