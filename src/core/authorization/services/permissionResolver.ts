import type { Permission } from '../types';
import type { CompanyRole } from '../../company/types';

/**
 * Resolves the effective permission set from the user's company role + custom overrides.
 *
 * @param role - The user's role in the active company
 * @param customPermissions - Additional per-user permissions from company_members
 * @param allModulePermissions - All permissions declared across all registered modules
 * @returns Set of effective permission strings
 */
export function resolvePermissions(
  role: CompanyRole | null,
  customPermissions: string[],
  allModulePermissions: string[]
): Set<Permission> {
  const permissions = new Set<Permission>();

  if (!role) return permissions;

  const rolePerms = role.permissions ?? [];

  // Wildcard: grant ALL permissions from all modules
  if (rolePerms.includes('*')) {
    for (const perm of allModulePermissions) {
      permissions.add(perm);
    }
    // Also add any custom permissions (they might be for future modules)
    for (const perm of customPermissions) {
      permissions.add(perm);
    }
    return permissions;
  }

  // Add role permissions
  for (const perm of rolePerms) {
    permissions.add(perm);
  }

  // Add custom per-user permissions
  for (const perm of customPermissions) {
    permissions.add(perm);
  }

  return permissions;
}
