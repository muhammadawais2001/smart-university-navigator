import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, DataProvider, ThemeProvider, ToastProvider } from './contexts/AppContexts';
import Layout from './components/layout/Layout';
import { Loading } from './components/common/ui';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import LocationPage from './pages/LocationPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import LoginPage from './pages/LoginPage';
import ReportPage from './pages/ReportPage';
import PrivacyPage from './pages/PrivacyPage';

const MapPage = lazy(() => import('./pages/MapPage'));
const DirectionsPage = lazy(() => import('./pages/DirectionsPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminLocations = lazy(() => import('./pages/admin/AdminLocations'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminFeedback = lazy(() => import('./pages/admin/AdminFeedback'));
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'));

export default function App() {
  return (
    <ThemeProvider><ToastProvider><AuthProvider><DataProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="locations/:slug" element={<LocationPage />} />
              <Route path="directions" element={<DirectionsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="report" element={<ReportPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="locations" element={<AdminLocations />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="feedback" element={<AdminFeedback />} />
                <Route path="audit" element={<AdminAudit />} />
              </Route>
              <Route path="*" element={<div className="py-16 text-center"><h1 className="text-2xl font-bold">Page not found</h1></div>} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DataProvider></AuthProvider></ToastProvider></ThemeProvider>
  );
}
