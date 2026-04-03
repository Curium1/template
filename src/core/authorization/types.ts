/**
 * Role is now a string — companies can define custom roles.
 * System roles: 'super_admin', 'admin', 'manager', 'user'
 * Custom roles: any string slug defined in company_roles table.
 */
export type Role = string;

/**
 * A resolved permission string (e.g. 'dummy.view', 'crm.edit').
 * Convention: `module_key.action`
 */
export type Permission = string;

/**
 * The authorization state available via context.
 */
export interface AuthorizationState {
  /** All permissions the current user has been granted */
  effectivePermissions: Set<Permission>;

  /** The current user's role slug in the active company */
  roleSlug: string;

  /** The current user's role name in the active company */
  roleName: string;

  /** Check if user has a specific permission */
  can: (permission: Permission) => boolean;

  /** Check if user has ANY of the given permissions */
  canAny: (permissions: Permission[]) => boolean;

  /** Check if user has ALL of the given permissions */
  canAll: (permissions: Permission[]) => boolean;

  /** Check if user can access a specific module (has at least one permission for it) */
  canAccessModule: (moduleKey: string) => boolean;

  /** Whether the user has wildcard (*) permissions */
  isSuperAdmin: boolean;
}
