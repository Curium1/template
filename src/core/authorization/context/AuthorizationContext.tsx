import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useCompany } from '../../company/context/CompanyContext';
import { moduleRegistry } from '../../modules/moduleRegistry';
import { resolvePermissions } from '../services/permissionResolver';
import type { AuthorizationState, Permission } from '../types';

const AuthorizationContext = createContext<AuthorizationState | undefined>(undefined);

export function AuthorizationProvider({ children }: { children: ReactNode }) {
  const { activeRole, activeMembership } = useCompany();

  const authzState = useMemo<AuthorizationState>(() => {
    const isSuperAdmin = activeRole?.permissions?.includes('*') ?? false;
    const allModulePermissions = moduleRegistry.getAllPermissions();
    const customPerms = activeMembership?.custom_permissions ?? [];

    const effectivePermissions = resolvePermissions(activeRole, customPerms, allModulePermissions);

    const can = (permission: Permission) => {
      if (isSuperAdmin) return true;
      return effectivePermissions.has(permission);
    };

    const canAny = (permissions: Permission[]) => {
      if (isSuperAdmin) return true;
      return permissions.some(p => effectivePermissions.has(p));
    };

    const canAll = (permissions: Permission[]) => {
      if (isSuperAdmin) return true;
      return permissions.every(p => effectivePermissions.has(p));
    };

    const canAccessModule = (moduleKey: string) => {
      if (isSuperAdmin) return true;
      const modulePerms = moduleRegistry.getModulePermissions(moduleKey);
      return modulePerms.some(p => effectivePermissions.has(p));
    };

    return {
      effectivePermissions,
      roleSlug: activeRole?.slug ?? 'user',
      roleName: activeRole?.name ?? 'Användare',
      can,
      canAny,
      canAll,
      canAccessModule,
      isSuperAdmin,
    };
  }, [activeRole, activeMembership]);

  return (
    <AuthorizationContext.Provider value={authzState}>
      {children}
    </AuthorizationContext.Provider>
  );
}

export function useAuthorization(): AuthorizationState {
  const context = useContext(AuthorizationContext);
  if (!context) throw new Error('useAuthorization must be used within an AuthorizationProvider');
  return context;
}
