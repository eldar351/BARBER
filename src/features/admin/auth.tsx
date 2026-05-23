import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppCard } from '../../components/ui';
import { api, ApiError, clearAdminToken, getAdminToken, setAdminToken } from '../../lib/api';
import { AdminUser } from '../../types';

type AdminAuthState = 'checking' | 'authenticated' | 'anonymous';

type LoginPayload = {
  token: string;
  admin?: AdminUser;
};

type AdminAuthContextValue = {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isChecking: boolean;
  login: (payload: LoginPayload) => void;
  logout: () => void;
  handleUnauthorized: (error: unknown) => boolean;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminAuthState>('checking');
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const logout = useCallback(() => {
    clearAdminToken();
    setAdmin(null);
    setState('anonymous');
  }, []);

  const login = useCallback((payload: LoginPayload) => {
    setAdminToken(payload.token);
    setAdmin(payload.admin || null);
    setState('authenticated');
  }, []);

  const handleUnauthorized = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      logout();
      return true;
    }
    return false;
  }, [logout]);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setState('anonymous');
      return;
    }

    let isCancelled = false;

    const verifySession = async () => {
      try {
        const data = await api<{ admin: AdminUser }>('/api/admin/me', { auth: true });
        if (isCancelled) return;
        setAdmin(data.admin);
        setState('authenticated');
      } catch (error) {
        if (isCancelled) return;
        if (!handleUnauthorized(error)) {
          setState('anonymous');
        }
      }
    };

    void verifySession();

    return () => {
      isCancelled = true;
    };
  }, [handleUnauthorized]);

  const value = useMemo<AdminAuthContextValue>(() => ({
    admin,
    isAuthenticated: state === 'authenticated',
    isChecking: state === 'checking',
    login,
    logout,
    handleUnauthorized,
  }), [admin, handleUnauthorized, login, logout, state]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return context;
}

export function ProtectedAdminRoute() {
  const location = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();

  if (isChecking) return <AdminAuthLoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace state={{ from: location }} />;

  return <Outlet />;
}

export function AdminGuestRoute() {
  const { isAuthenticated, isChecking } = useAdminAuth();

  if (isChecking) return <AdminAuthLoadingScreen />;
  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;

  return <Outlet />;
}

function AdminAuthLoadingScreen() {
  return (
    <div className="min-h-ios-screen bg-background p-4 pt-safe text-[var(--color-page-foreground)]" dir="rtl">
      <div className="mx-auto flex min-h-ios-screen max-w-xl items-center justify-center">
        <AppCard className="w-full max-w-md p-6 text-center text-on-surface-variant">
          בודק הרשאת מנהל...
        </AppCard>
      </div>
    </div>
  );
}
