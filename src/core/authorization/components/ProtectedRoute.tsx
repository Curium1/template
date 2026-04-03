import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useAuthorization } from '../context/AuthorizationContext';
import { useCompany } from '../../company/context/CompanyContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Permission required to access this route */
  permission?: string;
  /** Redirect path when unauthorized (defaults to /login) */
  redirectTo?: string;
  /** Show a "forbidden" message instead of redirecting */
  showForbidden?: boolean;
}

/**
 * Route guard component.
 * Wraps a route to enforce authentication and optional permission checks.
 */
export function ProtectedRoute({
  children,
  permission,
  redirectTo = '/login',
  showForbidden = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: companyLoading } = useCompany();
  const { can } = useAuthorization();

  // Wait for both auth AND company (role) data to be ready
  if (authLoading || (isAuthenticated && companyLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (permission && !can(permission)) {
    if (showForbidden) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">403 — Åtkomst nekad</h2>
          <p className="text-muted-foreground">
            Du har inte behörighet att se den här sidan.
          </p>
        </div>
      );
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

interface ProtectedActionProps {
  children: ReactNode;
  /** Permission required to show/enable this action */
  permission: string;
  /** If true, renders children disabled instead of hiding them */
  disable?: boolean;
  /** Fallback content when hidden (defaults to null) */
  fallback?: ReactNode;
}

/**
 * Action guard component.
 * Hides or disables UI elements based on permissions.
 */
export function ProtectedAction({
  children,
  permission,
  disable = false,
  fallback = null,
}: ProtectedActionProps) {
  const { can } = useAuthorization();

  if (!can(permission)) {
    if (disable) {
      return (
        <div className="opacity-50 pointer-events-none cursor-not-allowed">
          {children}
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
