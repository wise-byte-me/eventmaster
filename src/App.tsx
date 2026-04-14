import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/dashboard/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EventsPage } from './pages/events/EventsPage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { PeoplePage } from './pages/people/PeoplePage';
import { CredentialsPage } from './pages/credentials/CredentialsPage';
import { CardsPage } from './pages/cards/CardsPage';
import { CheckInPage } from './pages/checkin/CheckInPage';
import { PlannerPage } from './pages/planner/PlannerPage';
import { SessionsPage } from './pages/sessions/SessionsPage';
import { PulsePage } from './pages/sessions/PulsePage';
import { ExpoPage } from './pages/settings/ExpoPage';
import { IntegrationsPage, BillingPage, TeamPage, SettingsPage } from './pages/settings/PlaceholderPages';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { session } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="credentials" element={<CredentialsPage />} />
        <Route path="cards" element={<CardsPage />} />
        <Route path="checkin" element={<CheckInPage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="pulse" element={<PulsePage />} />
        <Route path="expo" element={<ExpoPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
