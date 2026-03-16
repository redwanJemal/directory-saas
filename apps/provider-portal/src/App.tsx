import { Routes, Route } from 'react-router';
import { LoginPage } from '@/features/auth/login-page';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { ProfilePage } from '@/features/profile/profile-page';
import { PortfolioPage } from '@/features/portfolio/portfolio-page';
import { BookingsPage } from '@/features/bookings/bookings-page';
import { ReviewsPage } from '@/features/reviews/reviews-page';
import { CalendarPage } from '@/features/calendar/calendar-page';
import { MessagesPage } from '@/features/messages/messages-page';
import { TeamPage } from '@/features/team/team-page';
import { AnalyticsPage } from '@/features/analytics/analytics-page';
import { SettingsPage } from '@/features/settings/settings-page';
import { NotFoundPage } from '@/features/not-found/not-found-page';
import { ErrorBoundary } from '@/components/error-boundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
