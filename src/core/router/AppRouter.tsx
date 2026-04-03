import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/context/AuthContext';
import { useCompany } from '../company/context/CompanyContext';
import { moduleRegistry } from '../modules/moduleRegistry';
import { ProtectedRoute } from '../authorization/components/ProtectedRoute';
import { AppShell } from '../layout/AppShell';
import { LoginPage } from '../auth/components/LoginPage';
import { ResetPasswordPage } from '../auth/components/ResetPasswordPage';
import { DashboardPage } from '../landing/DashboardPage';
import { SettingsPage } from '../settings/SettingsPage';

export function AppRouter() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: companyLoading } = useCompany();

  if (authLoading || (isAuthenticated && companyLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Get all module routes from registry
  const moduleRoutes = moduleRegistry.getAllRoutes();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes — wrapped in AppShell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<DashboardPage />} />

        {/* Settings — core page, no module needed */}
        <Route path="settings" element={<SettingsPage />} />

        {/* Module routes — dynamically assembled from registry */}
        {moduleRoutes.map(route => (
          <Route
            key={route.path}
            path={route.path}
            element={
              route.requiredPermission ? (
                <ProtectedRoute permission={route.requiredPermission} showForbidden>
                  {route.element}
                </ProtectedRoute>
              ) : (
                route.element
              )
            }
          />
        ))}

        {/* Catch-all → dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Non-authenticated catch-all */}
      {!isAuthenticated && (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
