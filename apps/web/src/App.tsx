import { Routes, Route } from 'react-router';
import { PublicLayout } from '@/components/layout/public-layout';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoginPage } from '@/features/auth/login-page';
import { RegisterPage } from '@/features/auth/register-page';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { LandingPage } from '@/features/landing/landing-page';
import { VendorSearchPage } from '@/features/search/vendor-search-page';
import { VendorProfilePage } from '@/features/search/vendor-profile-page';
import { CategoriesPage } from '@/features/categories/categories-page';
import { DealsPage } from '@/features/deals/deals-page';
import { EventsPage } from '@/features/events/events-page';
import { JobsPage } from '@/features/jobs/jobs-page';
import { CityPage } from '@/features/browse/city-page';
import { CitiesPage } from '@/features/browse/cities-page';
import { RecentlyAddedPage } from '@/features/browse/recently-added-page';
import { ClientDashboardPage } from '@/features/dashboard/client-dashboard-page';
import { MyVendorsPage } from '@/features/vendors/my-vendors-page';
import { MessagesPage } from '@/features/messages/messages-page';
import { SettingsPage } from '@/features/settings/settings-page';
import { NotFoundPage } from '@/features/not-found/not-found-page';
import { ErrorBoundary } from '@/components/error-boundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes with PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<VendorSearchPage />} />
          <Route path="/vendors/:vendorId" element={<VendorProfilePage />} />
          <Route path="/business/:vendorId" element={<VendorProfilePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:slug" element={<CategoriesPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/city/:country/:city" element={<CityPage />} />
          <Route path="/cities" element={<CitiesPage />} />
          <Route path="/new" element={<RecentlyAddedPage />} />
        </Route>

        {/* Auth routes (no layout wrapper) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<ClientDashboardPage />} />
            <Route path="/dashboard/vendors" element={<MyVendorsPage />} />
            <Route path="/dashboard/messages" element={<MessagesPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
