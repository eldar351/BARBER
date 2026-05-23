import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SkipLink } from './components/accessibility';
import { ToastProvider } from './components/toast';
import { AdminAuthProvider, AdminGuestRoute, ProtectedAdminRoute } from './features/admin/auth';
import { AppErrorBoundary, GlobalErrorMonitor } from './components/ErrorBoundary.jsx';
import { AppCard } from './components/ui';

const CustomerPortal = lazy(() => import('./pages/CustomerPortal'));
const CustomerCancellation = lazy(() => import('./pages/CustomerCancellation'));
const AccessibilityStatement = lazy(() => import('./pages/AccessibilityStatement'));
const AdminDashboard = lazy(() => import('./pages/AdminPortal/Dashboard'));
const AdminLogin = lazy(() => import('./pages/AdminPortal/Login'));
const ServicesManagement = lazy(() => import('./pages/AdminPortal/Services'));
const BarbersManagement = lazy(() => import('./pages/AdminPortal/Barbers'));
const SystemLogsPage = lazy(() => import('./pages/AdminPortal/Logs'));

export default function App() {
  return (
    <AppErrorBoundary>
      <ToastProvider>
        <GlobalErrorMonitor />
        <BrowserRouter>
          <SkipLink />
          <Routes>
            <Route path="/" element={<SuspendedPage><CustomerPortal /></SuspendedPage>} />
            <Route path="/book" element={<SuspendedPage><CustomerPortal /></SuspendedPage>} />
            <Route path="/cancel" element={<SuspendedPage><CustomerCancellation /></SuspendedPage>} />
            <Route path="/accessibility-statement" element={<SuspendedPage><AccessibilityStatement /></SuspendedPage>} />

            <Route element={<AdminAuthLayout />}>
              <Route element={<AdminGuestRoute />}>
                <Route path="/admin/login" element={<SuspendedPage><AdminLogin /></SuspendedPage>} />
              </Route>
              <Route element={<ProtectedAdminRoute />}>
                <Route path="/admin/dashboard" element={<SuspendedPage><AdminDashboard /></SuspendedPage>} />
                <Route path="/admin/services" element={<SuspendedPage><ServicesManagement /></SuspendedPage>} />
                <Route path="/admin/barbers" element={<SuspendedPage><BarbersManagement /></SuspendedPage>} />
                <Route path="/admin/logs" element={<SuspendedPage><SystemLogsPage /></SuspendedPage>} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppErrorBoundary>
  );
}

function AdminAuthLayout() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}

function SuspendedPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoader />}>{children}</Suspense>;
}

function RouteLoader() {
  return (
    <div className="min-h-ios-screen bg-background p-4 pt-safe text-[#eadfee]" dir="rtl">
      <div className="mx-auto flex min-h-ios-screen max-w-xl items-center justify-center" role="status" aria-live="polite">
        <AppCard className="w-full max-w-md p-6 text-center text-on-surface-variant">
          טוען את המסך...
        </AppCard>
      </div>
    </div>
  );
}
